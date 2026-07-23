"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import {
  Target, FileText, Search, Shield, AlertCircle, FileCheck, CheckCircle, XCircle, LogOut, ArrowRight, Briefcase, Sparkles
} from "lucide-react"
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { DEFAULT_STAGES, mapStatusToStageId, getStageColors } from "../../catalyst/CatalystMatches/stageConfig"

// ─────────────────────────────────────────────────────────────────────────
// Rebuilt to share the exact same stage vocabulary as the catalyst side
// (SupportDealFlowPipeline.jsx / stageConfig.js) instead of this file's own
// separate 9-stage list ("New Application / Application Sent / Evaluation /
// Due Diligence / Decision / Term Sheet / Active / Exit / Decline"), which
// never matched what a catalyst actually sees for the same application.
//
// LEGACY_STATUS_ALIASES lets already-written Firestore records using old
// labels (from before this fix, on either side) still resolve to the
// correct canonical stage. New application writes from AcceleratorTable.jsx
// now use the canonical names directly, so this table mostly only needs the
// aliasing for pre-existing data.
//
// KNOWN LIMITATION (same as AcceleratorTable.jsx): a catalyst's programme
// type and any custom stage renaming/reordering/added stages currently live
// only in that catalyst's own browser localStorage, not Firestore — this
// view has no way to see a specific catalyst's custom setup, so it always
// groups by the shared BIG-default stages. It's the same limitation as the
// table, not something specific to this widget.
const LEGACY_STATUS_ALIASES = {
  "Match": "Matched",
  "New Application": "Matched",
  "Application Sent": "Applied",
  "Under Review": "Evaluation",
  "In Review": "Evaluation",
  "Shortlisted": "Due Diligence",
  "Term Sheet": "Offer",
  "Support Approved": "Offer",
  "Active": "Admitted",
  "Active Support": "Admitted",
  "Successful Deals": "Admitted",
  "Exit": "Admitted",
  "Decline": "Declined",
  "Support Declined": "Declined",
  "Rejected": "Declined",
}
const normalizeStatus = (status) => LEGACY_STATUS_ALIASES[status] || status

// String → component lookup, same pattern as SupportDealFlowPipeline.jsx.
const ICONS = {
  Target, FileText, Search, Shield, AlertCircle, FileCheck, CheckCircle, XCircle, LogOut,
}
const getIcon = (name, size = 16, color = "#4a352f") => {
  const Cmp = ICONS[name] || Target
  return <Cmp size={size} className="text-current" style={{ color }} />
}

const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
}

const PipelineSkeleton = () => (
  <div className="flex gap-3 overflow-x-auto pb-4 px-1">
    {[...Array(7)].map((_, i) => (
      <div key={i} className="bg-gradient-to-br from-[#f5f0e1]/60 to-[#e6d7c3]/30 rounded-2xl flex-shrink-0 animate-pulse" style={{ width: "130px", height: "96px" }}>
        <div className="p-4 flex flex-col h-full justify-between">
          <div className="h-3 w-20 rounded-full bg-[#c8b6a6]/40" />
          <div className="h-7 w-16 rounded-lg bg-[#c8b6a6]/30 mx-auto" />
        </div>
      </div>
    ))}
  </div>
)

export function AcceleratorFlowPipeline({ accelerators = [], applications = [], onStageClick }) {
  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hoveredStage, setHoveredStage] = useState(null)
  const [selectedStage, setSelectedStage] = useState(null)
  const [smeApplications, setSmeApplications] = useState([])

  // Get effective user ID (handle company membership)
  useEffect(() => {
    const getEffectiveUser = async () => {
      const user = auth.currentUser
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const userDocRef = doc(db, "users", user.uid)
        const userDocSnap = await getDoc(userDocRef)

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data()
          const userCompanyId = userData.companyId

          if (userCompanyId) {
            const companyDocRef = doc(db, "companies", userCompanyId)
            const companyDocSnap = await getDoc(companyDocRef)

            if (companyDocSnap.exists()) {
              const companyData = companyDocSnap.data()
              const ownerId = companyData.createdBy
              setEffectiveUserId(ownerId !== user.uid ? ownerId : user.uid)
            } else {
              setEffectiveUserId(user.uid)
            }
          } else {
            setEffectiveUserId(user.uid)
          }
        } else {
          setEffectiveUserId(user.uid)
        }
      } catch (error) {
        console.error("Error checking company membership:", error)
        setEffectiveUserId(user.uid)
      }
    }

    getEffectiveUser()
  }, [])

  useEffect(() => {
    const fetchApplications = async () => {
      if (!effectiveUserId) { setLoading(false); return }
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
  }, [effectiveUserId, applications])

  // "Matched" (accelerators available to apply to, not yet applied) is
  // computed the same way the old "New Application" bucket was — real
  // accelerators from the matches table that don't have an application yet
  // — rather than relying on a status string that never gets written for
  // them (there's no Firestore record until you actually apply).
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
    result.matched = matchedCount
    smeApplications.forEach((app) => {
      const stageId = mapStatusToStageId(normalizeStatus(app.status || app.pipelineStage), DEFAULT_STAGES)
      if (stageId === "matched") return // already counted via matchedCount above
      if (result[stageId] !== undefined) result[stageId] += 1
    })
    return result
  }, [smeApplications, matchedCount])

  const liveStages = useMemo(() => DEFAULT_STAGES.filter((s) => !s.terminal), [])
  const terminalStages = useMemo(() => DEFAULT_STAGES.filter((s) => s.terminal), [])
  const totalBusinesses = useMemo(() => Object.values(counts).reduce((sum, c) => sum + c, 0), [counts])

  const getStagePercentage = useCallback((count) => {
    if (totalBusinesses === 0) return 0
    return ((count / totalBusinesses) * 100).toFixed(1)
  }, [totalBusinesses])

  const cumulativeCounts = useMemo(() => {
    const sorted = [...liveStages].sort((a, b) => a.order - b.order)
    let runningTotal = 0
    const result = {}
    for (let i = sorted.length - 1; i >= 0; i--) {
      runningTotal += counts[sorted[i].id] || 0
      result[sorted[i].id] = runningTotal
    }
    return result
  }, [liveStages, counts])

  const handleStageClick = useCallback((stageId) => {
    setSelectedStage((prev) => {
      const next = prev === stageId ? null : stageId
      onStageClick?.(next)
      return next
    })
  }, [onStageClick])

  // Same card renderer as the catalyst pipeline — identical shape/size for
  // both live and terminal stages, dark brown theme with dark grey reserved
  // for Declined/Withdrawn as the one deliberate "different kind of
  // outcome" signal.
  const renderStageCard = (stage) => {
    const isHovered = hoveredStage?.id === stage.id
    const isSelected = selectedStage === stage.id
    const count = counts[stage.id] || 0
    const percentage = getStagePercentage(count)
    const isNegativeOutcome = stage.terminal && /declined|withdrawn/i.test(stage.name || "")
    const theme = isNegativeOutcome ? { from: "#4b4844", to: "#242220" } : { from: "#4a352f", to: "#241a14" }
    const borderColor = isSelected ? "#d9b98a" : "rgba(255,255,255,0.1)"

    return (
      <div
        className={`relative flex-shrink-0 cursor-pointer group transition-all duration-300 ${isSelected ? "scale-105" : "hover:scale-[1.02]"}`}
        style={{ width: "104px" }}
        onMouseEnter={(e) => setHoveredStage({ id: stage.id, rect: e.currentTarget.getBoundingClientRect() })}
        onMouseLeave={() => setHoveredStage(null)}
        onClick={() => handleStageClick(stage.id)}
      >
        <div
          className={`rounded-xl p-2.5 transition-all duration-300 ${isHovered || isSelected ? "shadow-xl -translate-y-1" : "shadow-md hover:shadow-lg"}`}
          style={{ background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`, border: `1.5px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-white/10 flex-shrink-0">
              {getIcon(stage.icon, 11, "#ffffff")}
            </div>
            <h3 className="font-semibold text-white text-[9px] uppercase tracking-wide leading-tight truncate flex-1">{stage.name}</h3>
          </div>
          <div className="flex items-baseline justify-center">
            <span className="text-lg font-extrabold leading-none text-white">{count}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: "#c9986a" }} />
            </div>
            <span className="text-[8px] font-semibold flex-shrink-0" style={{ color: "#d9c4b0" }}>{percentage}%</span>
          </div>
        </div>

        {isHovered && (
          <PopupPortal>
            <div
              className="fixed z-[1200] pointer-events-none w-[230px] font-sans"
              style={{
                top: hoveredStage.rect.bottom + 10,
                left: Math.min(Math.max(hoveredStage.rect.left + hoveredStage.rect.width / 2 - 115, 12), window.innerWidth - 242),
              }}
            >
              <div className="bg-[#4a352f] text-[#faf7f2] text-xs rounded-2xl px-4 py-3.5 shadow-2xl">
                <p className="font-semibold mb-1.5 text-sm">{stage.name}</p>
                <p className="text-[#e6d7c3] leading-relaxed">{stage.tooltip}</p>
                <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[#c8b6a6]">{percentage}% of your applications</span>
                  <span className="text-[#a67c52] font-semibold">{count} catalyst{count === 1 ? "" : "s"}</span>
                </div>
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
            <Briefcase size={20} className="text-[#faf7f2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#4a352f] tracking-tight">Dealflow Pipeline</h2>
              <Sparkles size={14} className="text-[#a67c52]" />
            </div>
            <p className="text-xs text-[#7d5a50] mt-0.5">Track your journey with each catalyst, stage by stage</p>
          </div>
        </div>
      </div>

      {loading ? (
        <PipelineSkeleton />
      ) : (
        <>
          <div className="flex items-stretch overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-[#c8b6a6] scrollbar-track-transparent gap-1">
            {liveStages.map((stage, idx) => (
              <div key={stage.id} className="flex items-center">
                {renderStageCard(stage)}

                {idx < liveStages.length - 1 && (() => {
                  const nextStage = liveStages[idx + 1]
                  const fromCount = cumulativeCounts[stage.id] || 0
                  const toCount = cumulativeCounts[nextStage.id] || 0
                  const rate = fromCount > 0 ? ((toCount / fromCount) * 100).toFixed(1) : "0.0"
                  return (
                    <div className="flex flex-col items-center px-0.5 flex-shrink-0" style={{ minWidth: "30px" }}>
                      <span className="text-[10px] font-bold text-[#7d5a50] mb-0.5 whitespace-nowrap" title="Share of this stage that reaches the next">{rate}%</span>
                      <div className="flex items-center">
                        <div className="w-5 h-[2px] bg-gradient-to-r from-[#7d5a50] to-[#a67c52]" />
                        <ArrowRight size={14} className="text-[#5a4038] -ml-1" strokeWidth={2.5} />
                      </div>
                    </div>
                  )
                })()}
              </div>
            ))}

            {terminalStages.length > 0 && (() => {
              const negativeStages = terminalStages.filter((s) => /declined|withdrawn/i.test(s.name || ""))
              const otherStages = terminalStages.filter((s) => !/declined|withdrawn/i.test(s.name || ""))
              return (
                <div className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center px-2 flex-shrink-0 self-stretch justify-center">
                    <div className="w-px h-10 bg-[#e6d7c3]" />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {otherStages.map((stage) => <div key={stage.id} className="flex-shrink-0">{renderStageCard(stage)}</div>)}
                    {negativeStages.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-shrink-0 p-1.5 rounded-2xl" style={{ border: "2px solid #dc2626" }}>
                        {negativeStages.map((stage) => <div key={stage.id} className="flex-shrink-0">{renderStageCard(stage)}</div>)}
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
                <span className="text-xs font-bold text-[#4a352f]">{DEFAULT_STAGES.find((s) => s.id === selectedStage)?.name}</span>
                <button onClick={() => handleStageClick(null)} className="p-1 rounded-full hover:bg-white/70 text-[#7d5a50] hover:text-[#4a352f] transition-colors" title="Clear filter">✕</button>
              </div>
            ) : (
              <p className="text-xs text-[#a89482] font-medium">Click a stage to filter the list below</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AcceleratorFlowPipeline