"use client";

import { useState, useMemo } from "react";
import { usePortfolio } from "../../context/PortfolioContext";
import { 
  TrendingUp, FileText, Search, Shield, AlertCircle, 
  FileCheck, CheckCircle, XCircle, Clock, ArrowRight,
  Users, Target, Briefcase
} from "lucide-react";

// ─── Stage Definitions (Matching Table Statuses Exactly) ──────────────────────
const STAGES = [
  { 
    id: "matching", 
    name: "Matching", 
    description: "SMEs matched to your programme criteria",
    icon: <Target size={18} />,
    color: "#7d5a50",
    bgColor: "#f5f0e1",
    textColor: "#7d5a50",
    borderColor: "#c8b6a6"
  },
  { 
    id: "application", 
    name: "Application", 
    description: "Formal applications received from SMEs",
    icon: <FileText size={18} />,
    color: "#7d5a50",
    bgColor: "#f5f0e1",
    textColor: "#7d5a50",
    borderColor: "#c8b6a6"
  },
  { 
    id: "evaluation", 
    name: "Evaluation", 
    description: "Applications currently under review",
    icon: <Search size={18} />,
    color: "#7d5a50",
    bgColor: "#f5f0e1",
    textColor: "#7d5a50",
    borderColor: "#c8b6a6"
  },
  { 
    id: "dueDiligence", 
    name: "Due Diligence", 
    description: "Detailed assessment and verification",
    icon: <Shield size={18} />,
    color: "#7d5a50",
    bgColor: "#f5f0e1",
    textColor: "#7d5a50",
    borderColor: "#c8b6a6"
  },
  { 
    id: "decision", 
    name: "Decision", 
    description: "Awaiting final funding decision",
    icon: <AlertCircle size={18} />,
    color: "#7d5a50",
    bgColor: "#f5f0e1",
    textColor: "#7d5a50",
    borderColor: "#c8b6a6"
  },
  { 
    id: "termSheet", 
    name: "Term Sheet", 
    description: "Term sheet issued for review",
    icon: <FileCheck size={18} />,
    color: "#7d5a50",
    bgColor: "#f5f0e1",
    textColor: "#7d5a50",
    borderColor: "#c8b6a6"
  },
  { 
    id: "active", 
    name: "Active", 
    description: "SMEs actively receiving support",
    icon: <CheckCircle size={18} />,
    color: "#a67c52",
    bgColor: "#f5f0e1",
    textColor: "#a67c52",
    borderColor: "#c8b6a6"
  },
  { 
    id: "exited", 
    name: "Exited", 
    description: "Successfully completed programme",
    icon: <TrendingUp size={18} />,
    color: "#7d5a50",
    bgColor: "#faf7f2",
    textColor: "#7d5a50",
    borderColor: "#e6d7c3"
  },
  { 
    id: "declined", 
    name: "Declined", 
    description: "Applications not proceeding",
    icon: <XCircle size={18} />,
    color: "#7d5a50",
    bgColor: "#f5f0e1",
    textColor: "#7d5a50",
    borderColor: "#c8b6a6"
  }
];

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
const PipelineSkeleton = () => (
  <div className="flex gap-3 overflow-x-auto pb-4 px-1">
    {[...Array(9)].map((_, i) => (
      <div
        key={i}
        className="bg-shimmer-dark bg-shimmer rounded-2xl flex-shrink-0 animate-shimmer"
        style={{ width: "150px", height: "140px" }}
      >
        <div className="p-4 flex flex-col h-full justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20" />
            <div className="h-3 w-16 rounded bg-white/20" />
          </div>
          <div className="h-10 w-12 rounded bg-white/20 mx-auto" />
          <div className="h-2 w-full rounded bg-white/20" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
export function SupportDealFlowPipeline({ onStageClick, smeOverrides = [] }) {
  const { enriched, loading } = usePortfolio();
  const [hoveredStage, setHoveredStage] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);

  // Merge context data with overrides
  const mergedEnriched = useMemo(() => {
    if (!smeOverrides || !smeOverrides.length) return enriched;
    const overrideMap = new Map(smeOverrides.map(o => [`${o.smeId}_${o.programIndex}`, o]));
    return enriched.map(e => overrideMap.get(`${e.smeId}_${e.programIndex}`) || e);
  }, [enriched, smeOverrides]);

  // Calculate counts for each stage
  const counts = useMemo(() => {
    const stageMapping = {
      matching: (s) => {
        const stage = (s || "").toLowerCase();
        return !stage || stage === "matching" || stage === "matched" || stage === "new" || stage === "initial";
      },
      application: (s) => {
        const stage = (s || "").toLowerCase();
        return stage.includes("application") || stage.includes("applied");
      },
      evaluation: (s) => {
        const stage = (s || "").toLowerCase();
        return stage.includes("evaluation") || stage.includes("under review") || stage.includes("in review");
      },
      dueDiligence: (s) => {
        const stage = (s || "").toLowerCase();
        return stage.includes("due diligence") || stage.includes("shortlisted");
      },
      decision: (s) => (s || "").toLowerCase() === "decision",
      termSheet: (s) => {
        const stage = (s || "").toLowerCase();
        return stage.includes("term sheet") || stage.includes("support approved");
      },
      active: (s) => {
        const stage = (s || "").toLowerCase();
        return stage.includes("active");
      },
      exited: (s) => {
        const stage = (s || "").toLowerCase();
        return stage.includes("exit") || stage.includes("completed") || stage.includes("graduated");
      },
      declined: (s) => {
        const stage = (s || "").toLowerCase();
        return stage.includes("decline") || stage.includes("reject") || stage.includes("withdrawn");
      }
    };

    const result = {};
    for (const [id, test] of Object.entries(stageMapping)) {
      result[id] = mergedEnriched.filter(e => {
        const stage = (e.pipelineStage || e.status || "").toLowerCase();
        return test(stage);
      }).length;
    }
    return result;
  }, [mergedEnriched]);

  const handleStageClick = (stage) => {
    if (!stage?.id) return;
    setSelectedStage(stage.id === selectedStage ? null : stage.id);
    if (onStageClick) {
      onStageClick(stage.id === "all" ? null : stage.id);
    }
  };

  const totalSMEs = Object.values(counts).reduce((sum, count) => sum + count, 0);

  // Find the active stage (where most SMEs are)
  const activeStageId = useMemo(() => {
    let maxCount = 0;
    let maxStage = null;
    for (const [id, count] of Object.entries(counts)) {
      if (count > maxCount && id !== 'exited' && id !== 'declined') {
        maxCount = count;
        maxStage = id;
      }
    }
    return maxStage;
  }, [counts]);

  return (
    <div className="w-full bg-[#faf7f2] rounded-[24px] p-6 shadow-lg border border-[#e6d7c3]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7d5a50] flex items-center justify-center">
              <Briefcase size={20} className="text-[#faf7f2]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#4a352f]">DealFlow Pipeline</h2>
              <p className="text-sm text-[#7d5a50]">Track your SME journey</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-[#4a352f]">{totalSMEs}</div>
            <div className="text-xs text-[#7d5a50]">Total SMEs</div>
          </div>
          <div className="w-3 h-3 rounded-full bg-[#a67c52] animate-pulse" 
            title="Pipeline Active" />
        </div>
      </div>

      {loading ? (
        <PipelineSkeleton />
      ) : (
        <>
          {/* Stage Cards */}
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#c8b6a6] scrollbar-track-transparent">
            {STAGES.map((stage) => {
              const isHovered = hoveredStage === stage.id;
              const isSelected = selectedStage === stage.id;
              const count = counts[stage.id] || 0;
              const percentage = totalSMEs > 0 ? ((count / totalSMEs) * 100).toFixed(1) : 0;

              return (
                <div
                  key={stage.id}
                  className={`
                    relative flex-shrink-0 cursor-pointer group
                    transition-all duration-300
                    ${isSelected ? 'scale-105' : ''}
                  `}
                  onMouseEnter={() => setHoveredStage(stage.id)}
                  onMouseLeave={() => setHoveredStage(null)}
                  onClick={() => handleStageClick(stage)}
                >
                  {/* Stage Card */}
                  <div
                    className={`
                      w-[150px] h-[140px] rounded-2xl p-4 relative overflow-hidden
                      flex flex-col justify-between transition-all duration-300
                      ${isHovered || isSelected ? "shadow-xl -translate-y-1" : "shadow-md"}
                    `}
                    style={{
                      backgroundColor: stage.bgColor,
                      border: `2px solid ${isSelected ? stage.color : stage.borderColor}`,
                    }}
                  >
                    {/* Hover gradient overlay */}
                    <div 
                      className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                      style={{
                        background: `linear-gradient(135deg, ${stage.color}10 0%, ${stage.color}20 100%)`
                      }}
                    />

                    {/* Decorative circle background */}
                    <div 
                      className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{ backgroundColor: stage.color }}
                    />
                    <div 
                      className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{ backgroundColor: stage.color }}
                    />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col h-full">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${stage.color}20` }}
                          >
                            <span style={{ color: stage.color }}>{stage.icon}</span>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-xs font-bold text-[#4a352f] leading-tight mt-1">
                        {stage.name}
                      </h3>

                      {/* Count */}
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <span 
                          className="text-3xl font-extrabold"
                          style={{ color: stage.color }}
                        >
                          {count}
                        </span>
                        <span className="text-xs text-[#7d5a50] font-medium">
                          {percentage}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-[#e6d7c3]/50 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            background: `linear-gradient(90deg, ${stage.color}, ${stage.color}80)`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 pointer-events-none">
                      <div className="bg-[#4a352f] text-[#faf7f2] text-xs rounded-xl px-4 py-3 w-[200px] shadow-2xl">
                        <p className="font-semibold mb-1">{stage.name} Stage</p>
                        <p className="text-[#e6d7c3] leading-relaxed">{stage.description}</p>
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#e6d7c3]/10">
                          <span className="text-lg font-bold">{count}</span>
                          <span className="text-[#c8b6a6]">SMEs</span>
                          <span className="text-[#c8b6a6]">·</span>
                          <span className="text-[#c8b6a6]">{percentage}%</span>
                        </div>
                      </div>
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2">
                        <div className="border-[6px] border-transparent border-t-[#4a352f]" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pipeline Flow Visualization */}
          <div className="mt-6 pt-4 border-t border-[#e6d7c3]">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              {STAGES.map((stage, idx) => (
                <div key={stage.id} className="flex items-center">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#faf7f2] border border-[#e6d7c3] shadow-sm">
                    <div 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="text-xs font-medium text-[#4a352f]">{stage.name}</span>
                  </div>
                  {idx < STAGES.length - 1 && (
                    <ArrowRight size={14} className="text-[#c8b6a6] mx-0.5" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-[#7d5a50] mt-3">
              Click on any stage to filter the table below
            </p>
          </div>
        </>
      )}
    </div>
  );
}