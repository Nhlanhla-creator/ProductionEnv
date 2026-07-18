import React, { useState, useMemo, useRef, useEffect } from "react"
import { 
  Target, FileText, Search, Shield, AlertCircle, 
  FileCheck, CheckCircle, ArrowRight, Settings, SlidersHorizontal
} from "lucide-react"

// ─── Stage Definitions ────────────────────────────────────────────────────────
const STAGES = [
  { 
    id: "matched", 
    name: "Matched", 
    description: "Businesses matched to your criteria",
    icon: <Target size={18} />,
    color: "#7d5a50",
    bgColor: "#faf7f2",
    textColor: "#7d5a50",
    borderColor: "#e6d7c3"
  },
  { 
    id: "applied", 
    name: "Applied", 
    description: "Formal applications received",
    icon: <FileText size={18} />,
    color: "#7d5a50",
    bgColor: "#faf7f2",
    textColor: "#7d5a50",
    borderColor: "#e6d7c3"
  },
  { 
    id: "evaluation", 
    name: "Evaluation", 
    description: "Applications currently under evaluation",
    icon: <Search size={18} />,
    color: "#7d5a50",
    bgColor: "#faf7f2",
    textColor: "#7d5a50",
    borderColor: "#e6d7c3"
  },
  { 
    id: "dueDiligence", 
    name: "Due Diligence", 
    description: "Detailed compliance assessment",
    icon: <Shield size={18} />,
    color: "#7d5a50",
    bgColor: "#faf7f2",
    textColor: "#7d5a50",
    borderColor: "#e6d7c3"
  },
  { 
    id: "decision", 
    name: "Decision", 
    description: "Awaiting final decision status",
    icon: <AlertCircle size={18} />,
    color: "#7d5a50",
    bgColor: "#faf7f2",
    textColor: "#7d5a50",
    borderColor: "#e6d7c3"
  },
  { 
    id: "offer", 
    name: "Offer", 
    description: "Deal offer extended to Businesses",
    icon: <FileCheck size={18} />,
    color: "#7d5a50",
    bgColor: "#faf7f2",
    textColor: "#7d5a50",
    borderColor: "#e6d7c3"
  },
  { 
    id: "admitted", 
    name: "Admitted", 
    description: "Businesses successfully admitted/engaged",
    icon: <CheckCircle size={18} />,
    color: "#2e7d32",
    bgColor: "#e8f5e9",
    textColor: "#2e7d32",
    borderColor: "#a5d6a7"
  }
]

export default function CMFDealFlowPipeline({ onStageClick, smeMatches = [], loading = false }) {
  const [hoveredStage, setHoveredStage] = useState(null)
  const [selectedStage, setSelectedStage] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const stageRefs = useRef({})

  // Calculate counts for each stage based on smeMatches
  const counts = useMemo(() => {
    const stageMapping = {
      matched: (s) => {
        const stage = (s || "").toLowerCase()
        return !stage || stage === "matched" || stage === "matching" || stage === "new"
      },
      applied: (s) => {
        const stage = (s || "").toLowerCase()
        return stage.includes("applied") || stage === "application"
      },
      evaluation: (s) => {
        const stage = (s || "").toLowerCase()
        return stage.includes("evaluation") || stage.includes("review")
      },
      dueDiligence: (s) => {
        const stage = (s || "").toLowerCase()
        return stage.includes("due diligence") || stage.includes("shortlisted")
      },
      decision: (s) => (s || "").toLowerCase() === "decision",
      offer: (s) => {
        const stage = (s || "").toLowerCase()
        return stage.includes("offer") || stage.includes("term sheet")
      },
      admitted: (s) => {
        const stage = (s || "").toLowerCase()
        return stage.includes("admitted") || stage.includes("active") || stage.includes("exited") || stage.includes("completed")
      }
    }

    const result = {}
    for (const [id, test] of Object.entries(stageMapping)) {
      result[id] = smeMatches.filter(e => {
        const stage = (e.pipelineStage || e.currentStatus || "").toLowerCase()
        return test(stage)
      }).length
    }
    return result
  }, [smeMatches])

  const handleStageClick = (stage) => {
    if (!stage?.id) return
    const nextStage = stage.id === selectedStage ? null : stage.id
    setSelectedStage(nextStage)
    if (onStageClick) {
      onStageClick(nextStage)
    }
  }

  const totalSMEs = Object.values(counts).reduce((sum, count) => sum + count, 0)

  const handleMouseEnter = (stageId, e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPosition({
      top: rect.bottom + 120,
      left: rect.left + rect.width / 2
    })
    setHoveredStage(stageId)
  }

  const handleMouseLeave = () => {
    setHoveredStage(null)
  }

  return (
    <div className="w-full bg-[#faf7f2] rounded-[24px] p-6 shadow-lg border border-[#e6d7c3] font-sans relative">
      {/* Top Header Row matching screenshot */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4a352f] flex items-center justify-center">
              <SlidersHorizontal size={20} className="text-[#faf7f2]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#4a352f]">DealFlow Pipeline</h2>
              <p className="text-sm text-[#7d5a50]">Track your business journey</p>
            </div>
          </div>
        </div>
        
        {/* Right side controls matching screenshot */}
        <div className="flex items-center gap-3">
          <div className="flex bg-white px-4 py-1 border border-[#E8D5C4] rounded-xl shadow-sm text-right items-center gap-2">
            <span className="text-xl font-extrabold text-[#4a352f]">{totalSMEs}</span>
            <span className="text-[10px] uppercase font-bold text-[#7d5a50] tracking-wider">Total Businesses</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-[#7d5a50]">Loading pipeline...</div>
      ) : (
        <>
          {/* Stage Cards */}
          <div className="relative flex items-center gap-2 overflow-x-auto pt-4 px-4 scrollbar-thin scrollbar-thumb-[#c8b6a6] scrollbar-track-transparent">
            {STAGES.map((stage, idx) => {
              const isSelected = selectedStage === stage.id
              const count = counts[stage.id] || 0
              const percentage = totalSMEs > 0 ? ((count / totalSMEs) * 100).toFixed(1) : 0

              return (
                <React.Fragment key={stage.id}>
                  <div
                    ref={el => stageRefs.current[stage.id] = el}
                    className={`relative flex-shrink-0 cursor-pointer group transition-all duration-300 ${isSelected ? 'scale-105' : ''}`}
                    onMouseEnter={(e) => handleMouseEnter(stage.id, e)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleStageClick(stage)}
                  >
                    {/* Stage Card */}
                    <div
                      className={`w-[125px] h-[110px] rounded-2xl p-3 relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${hoveredStage === stage.id || isSelected ? "-translate-y-1 shadow-lg" : "shadow-sm"}`}
                      style={{
                        backgroundColor: stage.bgColor,
                        border: isSelected ? `2.5px solid ${stage.color}` : `1px solid ${stage.borderColor}`,
                      }}
                    >
                      {/* Content */}
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#7d5a50] tracking-wide truncate max-w-[80px]">
                            {stage.name}
                          </span>
                          <span style={{ color: stage.color }}>{stage.icon}</span>
                        </div>
                        
                        <div className="mt-2">
                          <span className="text-2xl font-extrabold text-[#4a352f]">
                            {count}
                          </span>
                          <span className="text-[9px] text-[#7d5a50] font-medium ml-1.5">
                            {percentage}%
                          </span>
                        </div>

                        {/* Card bottom progress line */}
                        <div className="w-full h-1 bg-[#e6d7c3] rounded-full overflow-hidden mt-1">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: stage.color
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connect arrow between cards */}
                  {idx < STAGES.length - 1 && (
                    <ArrowRight size={14} className="text-[#c8b6a6] flex-shrink-0" />
                  )}
                </React.Fragment>
              )
            })}
          </div>

          {/* Fixed-position Tooltip */}
          {hoveredStage && (() => {
            const stage = STAGES.find(s => s.id === hoveredStage)
            if (!stage) return null
            const count = counts[stage.id] || 0
            const percentage = totalSMEs > 0 ? ((count / totalSMEs) * 100).toFixed(1) : 0
            
            return (
              <div 
                className="fixed z-[9999] pointer-events-none"
                style={{
                  top: tooltipPosition.top - 120,
                  left: tooltipPosition.left,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="bg-[#4a352f] text-[#faf7f2] text-xs rounded-xl px-4 py-3 w-[200px]">
                  <p className="font-semibold mb-1">{stage.name} Stage</p>
                  <p className="text-[#e6d7c3] leading-relaxed">{stage.description}</p>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#e6d7c3]/10">
                    <span className="text-lg font-bold">{count}</span>
                    <span className="text-[#c8b6a6]">{count === 1 ? "Business" : "Businesses"}</span>
                    <span className="text-[#c8b6a6]">·</span>
                    <span className="text-[#c8b6a6]">{percentage}%</span>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Bottom actions matching screenshot */}
          <div className="flex items-center justify-between pt-4 border-t border-[#e6d7c3] mt-4">
            <span className="text-xs text-[#7d5a50] font-medium italic">
              Click a stage to filter
            </span>
          </div>
        </>
      )}
    </div>
  )
}