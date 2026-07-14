"use client";

import { useState, useMemo, useCallback } from "react";
import { usePortfolio } from "../../context/PortfolioContext";
import { 
  TrendingUp, FileText, Search, Shield, AlertCircle, 
  FileCheck, CheckCircle, XCircle, Clock, ArrowRight,
  Users, Target, Briefcase, Layers
} from "lucide-react";

// ─── Stage Definitions (Matching Table Statuses Exactly) ──────────────────────
const STAGES = [
  { 
    id: "matching", 
    name: "Matching", 
    description: "Businesses matched to your programme criteria",
    icon: <Target size={18} />,
    color: "#7d5a50",
    bgColor: "#f5f0e1",
    textColor: "#7d5a50",
    borderColor: "#c8b6a6",
    order: 0
  },
  { 
    id: "application", 
    name: "Application", 
    description: "Formal applications received from businesses",
    icon: <FileText size={18} />,
    color: "#7d5a50",
    bgColor: "#f5f0e1",
    textColor: "#7d5a50",
    borderColor: "#c8b6a6",
    order: 1
  },
  { 
    id: "evaluation", 
    name: "Evaluation", 
    description: "Applications currently under review",
    icon: <Search size={18} />,
    color: "#7d5a50",
    bgColor: "#f5f0e1",
    textColor: "#7d5a50",
    borderColor: "#c8b6a6",
    order: 2
  },
  { 
    id: "dueDiligence", 
    name: "Due Diligence", 
    description: "Detailed assessment and verification",
    icon: <Shield size={18} />,
    color: "#7d5a50",
    bgColor: "#f5f0e1",
    textColor: "#7d5a50",
    borderColor: "#c8b6a6",
    order: 3
  },
  { 
    id: "decision", 
    name: "Decision", 
    description: "Awaiting final funding decision",
    icon: <AlertCircle size={18} />,
    color: "#7d5a50",
    bgColor: "#f5f0e1",
    textColor: "#7d5a50",
    borderColor: "#c8b6a6",
    order: 4
  },
  { 
    id: "termSheet", 
    name: "Term Sheet", 
    description: "Term sheet issued for review",
    icon: <FileCheck size={18} />,
    color: "#7d5a50",
    bgColor: "#f5f0e1",
    textColor: "#7d5a50",
    borderColor: "#c8b6a6",
    order: 5
  },
  { 
    id: "active", 
    name: "Active", 
    description: "Businesses actively receiving support",
    icon: <CheckCircle size={18} />,
    color: "#a67c52",
    bgColor: "#f5f0e1",
    textColor: "#a67c52",
    borderColor: "#c8b6a6",
    order: 6
  },
  { 
    id: "exited", 
    name: "Exited", 
    description: "Successfully completed programme",
    icon: <TrendingUp size={18} />,
    color: "#7d5a50",
    bgColor: "#faf7f2",
    textColor: "#7d5a50",
    borderColor: "#e6d7c3",
    order: 7
  },
  { 
    id: "declined", 
    name: "Declined", 
    description: "Applications not proceeding",
    icon: <XCircle size={18} />,
    color: "#7d5a50",
    bgColor: "#f5f0e1",
    textColor: "#7d5a50",
    borderColor: "#c8b6a6",
    order: 8
  }
];

// ─── Stage Mapping Configuration ──────────────────────────────────────────────
const STAGE_KEYWORDS = {
  matching: ['matching', 'matched', 'new', 'initial', 'prospect', 'lead'],
  application: ['application', 'applied', 'submitted', 'application received'],
  evaluation: ['evaluation', 'under review', 'in review', 'reviewing', 'assessment'],
  dueDiligence: ['due diligence', 'shortlisted', 'verification', 'assessment'],
  decision: ['decision', 'pending decision', 'final review'],
  termSheet: ['term sheet', 'support approved', 'offer', 'terms'],
  active: ['active', 'ongoing', 'in progress', 'supporting'],
  exited: ['exit', 'completed', 'graduated', 'finished', 'closed'],
  declined: ['decline', 'rejected', 'withdrawn', 'cancelled', 'not proceeding']
};

// ─── Helper Functions ──────────────────────────────────────────────────────────
const mapStatusToStage = (status) => {
  if (!status) return 'matching';
  const normalized = status.toLowerCase().trim();
  
  for (const [stageId, keywords] of Object.entries(STAGE_KEYWORDS)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      return stageId;
    }
  }
  return 'matching'; // Default fallback
};

const calculateStageCounts = (smes) => {
  const counts = {};
  for (const stage of STAGES) {
    counts[stage.id] = 0;
  }
  
  for (const sme of smes) {
    const stage = mapStatusToStage(sme.pipelineStage || sme.status);
    if (counts[stage] !== undefined) {
      counts[stage] += 1;
    }
  }
  return counts;
};

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

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="w-20 h-20 rounded-full bg-[#f5f0e1] flex items-center justify-center mb-4">
      <Users size={32} className="text-[#c8b6a6]" />
    </div>
    <h3 className="text-lg font-semibold text-[#4a352f] mb-2">No Businesses in Pipeline</h3>
    <p className="text-sm text-[#7d5a50] text-center max-w-sm">
      Start matching businesses to your programme criteria to build your deal flow pipeline.
    </p>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
export function SupportDealFlowPipeline({ 
  onStageClick, 
  smeOverrides = [],
  showFilter = true,
  className = ""
}) {
  const { enriched, loading } = usePortfolio();
  const [hoveredStage, setHoveredStage] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'compact'

  // Merge context data with overrides
  const mergedEnriched = useMemo(() => {
    if (!smeOverrides || !smeOverrides.length) return enriched;
    const overrideMap = new Map(smeOverrides.map(o => [`${o.smeId}_${o.programIndex}`, o]));
    return enriched.map(e => overrideMap.get(`${e.smeId}_${e.programIndex}`) || e);
  }, [enriched, smeOverrides]);

  // Calculate counts for each stage using the helper
  const counts = useMemo(() => {
    return calculateStageCounts(mergedEnriched);
  }, [mergedEnriched]);

  // Calculate total businesses
  const totalBusinesses = useMemo(() => {
    return Object.values(counts).reduce((sum, count) => sum + count, 0);
  }, [counts]);

  // Find the active stage (where most businesses are)
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

  // Handle stage click with proper cleanup
  const handleStageClick = useCallback((stage) => {
    if (!stage?.id) return;
    const newSelected = stage.id === selectedStage ? null : stage.id;
    setSelectedStage(newSelected);
    if (onStageClick) {
      onStageClick(newSelected);
    }
  }, [selectedStage, onStageClick]);

  // Handle view mode toggle
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'cards' ? 'compact' : 'cards');
  }, []);

  // Get stage percentage
  const getStagePercentage = useCallback((count) => {
    if (totalBusinesses === 0) return 0;
    return ((count / totalBusinesses) * 100).toFixed(1);
  }, [totalBusinesses]);

  // Get the stage data by id
  const getStageById = useCallback((id) => {
    return STAGES.find(stage => stage.id === id);
  }, []);

  return (
    <div className={`w-full bg-[#faf7f2] rounded-[24px] p-6 shadow-lg border border-[#e6d7c3] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7d5a50] flex items-center justify-center">
              <Briefcase size={20} className="text-[#faf7f2]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#4a352f]">DealFlow Pipeline</h2>
              <p className="text-sm text-[#7d5a50]">Track your business journey</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-[#4a352f]">{totalBusinesses}</div>
            <div className="text-xs text-[#7d5a50]">Total Businesses</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#a67c52] animate-pulse" 
              title="Pipeline Active" />
            {showFilter && (
              <button
                onClick={toggleViewMode}
                className="p-1.5 rounded-lg hover:bg-[#f5f0e1] transition-colors"
                title={`Switch to ${viewMode === 'cards' ? 'compact' : 'card'} view`}
              >
                <Layers size={16} className="text-[#7d5a50]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <PipelineSkeleton />
      ) : totalBusinesses === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Stage Cards */}
          <div className={`flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#c8b6a6] scrollbar-track-transparent ${
            viewMode === 'compact' ? 'gap-1.5' : ''
          }`}>
            {STAGES.map((stage) => {
              const isHovered = hoveredStage === stage.id;
              const isSelected = selectedStage === stage.id;
              const count = counts[stage.id] || 0;
              const percentage = getStagePercentage(count);
              const isActive = activeStageId === stage.id;

              // Skip rendering if count is 0 and not in compact mode
              if (count === 0 && viewMode === 'compact') return null;

              return (
                <div
                  key={stage.id}
                  className={`
                    relative flex-shrink-0 cursor-pointer group
                    transition-all duration-300
                    ${isSelected ? 'scale-105' : ''}
                    ${viewMode === 'compact' ? 'w-[120px]' : 'w-[150px]'}
                  `}
                  onMouseEnter={() => setHoveredStage(stage.id)}
                  onMouseLeave={() => setHoveredStage(null)}
                  onClick={() => handleStageClick(stage)}
                >
                  {/* Stage Card */}
                  <div
                    className={`
                      h-[140px] rounded-2xl p-4 relative overflow-hidden
                      flex flex-col justify-between transition-all duration-300
                      ${isHovered || isSelected ? "shadow-xl -translate-y-1" : "shadow-md"}
                      ${viewMode === 'compact' ? 'h-[120px] p-3' : ''}
                    `}
                    style={{
                      backgroundColor: stage.bgColor,
                      border: `2px solid ${isSelected ? stage.color : isActive ? stage.color : stage.borderColor}`,
                      borderWidth: isActive && !isSelected ? '2px' : '2px',
                    }}
                  >
                    {/* Active indicator glow */}
                    {isActive && !isSelected && (
                      <div 
                        className="absolute inset-0 rounded-2xl animate-pulse"
                        style={{
                          boxShadow: `inset 0 0 20px ${stage.color}30`
                        }}
                      />
                    )}

                    {/* Hover gradient overlay */}
                    <div 
                      className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`}
                      style={{
                        background: `linear-gradient(135deg, ${stage.color}10 0%, ${stage.color}20 100%)`
                      }}
                    />

                    {/* Decorative circle backgrounds */}
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
                            className={`rounded-lg flex items-center justify-center ${
                              viewMode === 'compact' ? 'w-6 h-6' : 'w-8 h-8'
                            }`}
                            style={{ backgroundColor: `${stage.color}20` }}
                          >
                            <span style={{ color: stage.color }}>{stage.icon}</span>
                          </div>
                        </div>
                        {viewMode === 'compact' && count > 0 && (
                          <span 
                            className="text-xs font-bold"
                            style={{ color: stage.color }}
                          >
                            {count}
                          </span>
                        )}
                      </div>
                      
                      <h3 className={`font-bold text-[#4a352f] leading-tight ${
                        viewMode === 'compact' ? 'text-[10px]' : 'text-xs'
                      }`}>
                        {stage.name}
                      </h3>

                      {/* Count - only show in card view */}
                      {viewMode !== 'compact' && (
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
                      )}

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

                  {/* Tooltip - only in card view */}
                  {isHovered && viewMode !== 'compact' && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 pointer-events-none">
                      <div className="bg-[#4a352f] text-[#faf7f2] text-xs rounded-xl px-4 py-3 w-[200px] shadow-2xl">
                        <p className="font-semibold mb-1">{stage.name} Stage</p>
                        <p className="text-[#e6d7c3] leading-relaxed">{stage.description}</p>
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#e6d7c3]/10">
                          <span className="text-lg font-bold">{count}</span>
                          <span className="text-[#c8b6a6]">Businesses</span>
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
              {STAGES.map((stage, idx) => {
                const count = counts[stage.id] || 0;
                if (count === 0 && viewMode === 'compact') return null;
                
                return (
                  <div key={stage.id} className="flex items-center">
                    <div 
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#faf7f2] border border-[#e6d7c3] shadow-sm transition-all ${
                        count > 0 ? 'opacity-100' : 'opacity-40'
                      }`}
                    >
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="text-xs font-medium text-[#4a352f]">
                        {stage.name}
                        {count > 0 && (
                          <span className="ml-1 text-[#7d5a50]">({count})</span>
                        )}
                      </span>
                    </div>
                    {idx < STAGES.length - 1 && count > 0 && (
                      <ArrowRight size={14} className="text-[#c8b6a6] mx-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-[#7d5a50] mt-3">
              Click on any stage to filter the table below
              {selectedStage && (
                <span className="block mt-1 text-[#a67c52] font-medium">
                  Currently filtering: {getStageById(selectedStage)?.name}
                  <button
                    onClick={() => handleStageClick({ id: null })}
                    className="ml-2 text-[#7d5a50] hover:text-[#4a352f] underline"
                  >
                    Clear filter
                  </button>
                </span>
              )}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export default SupportDealFlowPipeline;