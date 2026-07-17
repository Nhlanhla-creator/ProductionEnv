"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePortfolio } from "../../context/PortfolioContext";
import {
  TrendingUp, FileText, Search, Shield, AlertCircle,
  FileCheck, CheckCircle, XCircle, ArrowRight, LogOut,
  Users, Target, Briefcase, Layers, DollarSign, Settings,
  ChevronUp, ChevronDown, Plus, X, Info, ChevronsUpDown, Sparkles
} from "lucide-react";
import {
  PROGRAMME_TEMPLATES, mapStatusToStageId, getStageColors,
  applyStageCustomization, DEFAULT_STAGES, DEFAULT_STAGE_ACTIONS,
  PIPELINE_SETTINGS_STORAGE_KEY, DEFAULT_PIPELINE_CUSTOMIZATION,
  loadPipelineSettings, savePipelineSettings,
} from "./stageConfig";

// Renders straight to <body>. Without this, `position: fixed` elements (the
// settings modal, stage tooltips) get trapped by whatever ancestor in the
// dashboard layout establishes a containing block (a transform/filter/
// overflow further up the tree) — which is what made the modal look "stuck
// inside the page" and tooltips render clipped behind other elements.
const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
};

// String → component lookup, kept next to the one file that actually needs
// JSX icon elements (stageConfig.js stays icon-library agnostic).
const ICONS = {
  Target: Target, FileText: FileText, Search: Search, Shield: Shield,
  AlertCircle: AlertCircle, FileCheck: FileCheck, CheckCircle: CheckCircle,
  XCircle: XCircle, LogOut: LogOut, Users: Users, Layers: Layers,
  DollarSign: DollarSign, TrendingUp: TrendingUp,
};
const getIcon = (name, size = 16, color = "#4a352f") => {
  const Cmp = ICONS[name] || Target;
  return <Cmp size={size} className="text-current" style={{ color }} />;
};

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
const PipelineSkeleton = () => (
  <div className="flex gap-3 overflow-x-auto pb-4 px-1">
    {[...Array(7)].map((_, i) => (
      <div
        key={i}
        className="bg-gradient-to-br from-[#f5f0e1]/60 to-[#e6d7c3]/30 rounded-2xl flex-shrink-0 animate-pulse"
        style={{ width: "130px", height: "96px" }}
      >
        <div className="p-4 flex flex-col h-full justify-between">
          <div className="h-3 w-20 rounded-full bg-[#c8b6a6]/40" />
          <div className="h-7 w-16 rounded-lg bg-[#c8b6a6]/30 mx-auto" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#f5f0e1] to-[#e6d7c3] flex items-center justify-center mb-5 shadow-inner">
      <Users size={36} className="text-[#a89482]" />
    </div>
    <h3 className="text-xl font-bold text-[#4a352f] mb-2">No Businesses in Pipeline</h3>
    <p className="text-sm text-[#7d5a50] text-center max-w-sm leading-relaxed">
      Start matching businesses to your programme criteria to build your deal flow pipeline.
    </p>
  </div>
);

// ─── Stage Customization Panel (feedback #4) ───────────────────────────────
const STAGE_ACTION_FIELDS = [
  { key: "showMessage", label: "Message to business" },
  { key: "showMeeting", label: "Meeting scheduler" },
  { key: "showAvailability", label: "Availability picker" },
  { key: "showTermSheet", label: "Offer/agreement upload" },
];

const StageCustomizePanel = ({ stages, customization, onChange, onClose }) => {
  const [localRenames, setLocalRenames] = useState(customization.renames || {});
  const [localHidden, setLocalHidden] = useState(customization.hidden || []);
  const [localOrder, setLocalOrder] = useState(stages.map((s) => s.id));
  const [newStageName, setNewStageName] = useState("");
  const [localStageActions, setLocalStageActions] = useState(customization.stageActions || {});
  const [showStageActions, setShowStageActions] = useState(false);

  const move = (id, dir) => {
    setLocalOrder((prev) => {
      const idx = prev.indexOf(id);
      const swapWith = idx + dir;
      if (swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
  };

  const toggleHidden = (id) => {
    setLocalHidden((prev) => (prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]));
  };

  const toggleStageAction = (stageId, field) => {
    setLocalStageActions((prev) => {
      const current = { ...DEFAULT_STAGE_ACTIONS[stageId], ...(prev[stageId] || {}) };
      return { ...prev, [stageId]: { ...current, [field]: !current[field] } };
    });
  };

  const addCustomStage = () => {
    if (!newStageName.trim()) return;
    const id = `custom_${newStageName.trim().toLowerCase().replace(/\s+/g, "_")}`;
    onChange({
      ...customization,
      renames: localRenames,
      hidden: localHidden,
      order: localOrder,
      stageActions: localStageActions,
      custom: [...(customization.custom || []), { id, name: newStageName.trim() }],
    });
    setNewStageName("");
  };

  const save = () => {
    onChange({ ...customization, renames: localRenames, hidden: localHidden, order: localOrder, stageActions: localStageActions });
    onClose();
  };

  return (
    <PopupPortal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#4a352f]/40 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-3xl shadow-2xl border border-[#e6d7c3] w-[540px] max-h-[85vh] overflow-y-auto p-7" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xl font-bold text-[#4a352f]">Customize Pipeline</h3>
              <p className="text-xs text-[#7d5a50] mt-0.5">Rename, hide, reorder, or add custom stages</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f0e1] transition-colors text-[#7d5a50]">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-2 mb-5 max-h-[280px] overflow-y-auto pr-1">
            {localOrder.map((id, i) => {
              const stage = stages.find((s) => s.id === id);
              if (!stage) return null;
              const hidden = localHidden.includes(id);
              const colors = getStageColors(stage.group);
              return (
                <div
                  key={id}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                    hidden ? "opacity-40 bg-[#faf7f2] border-[#e6d7c3]" : "bg-white border-[#e6d7c3] shadow-sm"
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <button disabled={i === 0} onClick={() => move(id, -1)} className="disabled:opacity-30 p-0.5 hover:bg-[#f5f0e1] rounded">
                      <ChevronUp size={14} className="text-[#7d5a50]" />
                    </button>
                    <button disabled={i === localOrder.length - 1} onClick={() => move(id, 1)} className="disabled:opacity-30 p-0.5 hover:bg-[#f5f0e1] rounded">
                      <ChevronDown size={14} className="text-[#7d5a50]" />
                    </button>
                  </div>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.bgColor }}>
                    <span style={{ color: colors.color }}>{getIcon(stage.icon, 12)}</span>
                  </div>
                  <input
                    value={localRenames[id] ?? stage.name}
                    onChange={(e) => setLocalRenames((prev) => ({ ...prev, [id]: e.target.value }))}
                    className="flex-1 px-3 py-1.5 border border-[#e6d7c3] rounded-lg text-sm bg-[#faf7f2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20"
                  />
                  {!stage.terminal && (
                    <button
                      onClick={() => toggleHidden(id)}
                      className={`text-xs px-3 py-1 rounded-lg border transition-all font-medium ${
                        hidden ? "border-[#7d5a50] text-[#7d5a50] bg-white" : "border-[#c8b6a6] text-[#4a352f] bg-[#faf7f2]"
                      }`}
                    >
                      {hidden ? "Show" : "Hide"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 mb-5 p-2.5 bg-[#faf7f2] rounded-xl border border-[#e6d7c3]">
            <input
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="Add a custom stage..."
              className="flex-1 px-3 py-2 bg-white border border-[#e6d7c3] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20"
            />
            <button
              onClick={addCustomStage}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#7d5a50] text-white rounded-lg text-sm font-semibold hover:bg-[#4a352f] transition-colors"
            >
              <Plus size={16} /> Add
            </button>
          </div>

          {/* Stage Actions */}
          <div className="border-t border-[#e6d7c3] pt-4 mb-5">
            <button onClick={() => setShowStageActions((v) => !v)} className="flex items-center justify-between w-full text-left group">
              <div>
                <span className="text-sm font-semibold text-[#4a352f]">Stage Actions</span>
                <p className="text-xs text-[#a89482] mt-0.5">Configure fields for the Update Stage form</p>
              </div>
              {showStageActions ? <ChevronUp size={18} className="text-[#7d5a50]" /> : <ChevronDown size={18} className="text-[#7d5a50]" />}
            </button>
            {showStageActions && (
              <div className="mt-3 space-y-3 max-h-[240px] overflow-y-auto pr-1">
                {DEFAULT_STAGES.map((stage) => {
                  const config = { ...DEFAULT_STAGE_ACTIONS[stage.id], ...(localStageActions[stage.id] || {}) };
                  const colors = getStageColors(stage.group);
                  return (
                    <div key={stage.id} className="p-3 rounded-xl border border-[#e6d7c3] bg-white shadow-sm">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.bgColor }}>
                          <span style={{ color: colors.color }}>{getIcon(stage.icon, 10)}</span>
                        </div>
                        <p className="text-xs font-semibold text-[#4a352f]">{stage.name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {STAGE_ACTION_FIELDS.map((field) => (
                          <label key={field.key} className="flex items-center gap-2 text-xs text-[#4a352f] cursor-pointer hover:text-[#7d5a50] transition-colors">
                            <input
                              type="checkbox"
                              checked={!!config[field.key]}
                              onChange={() => toggleStageAction(stage.id, field.key)}
                              className="rounded border-[#c8b6a6] text-[#7d5a50] focus:ring-[#7d5a50]/20 w-3.5 h-3.5"
                            />
                            {field.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 bg-[#faf7f2] text-[#7d5a50] rounded-xl text-sm font-medium hover:bg-[#f5f0e1] transition-colors">
              Cancel
            </button>
            <button onClick={save} className="px-5 py-2.5 bg-[#7d5a50] text-white rounded-xl text-sm font-semibold hover:bg-[#4a352f] transition-colors shadow-md">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </PopupPortal>
  );
};

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

  const [programmeType, setProgrammeType] = useState(() => loadPipelineSettings().programmeType);
  const [customization, setCustomization] = useState(() => loadPipelineSettings().customization);

  useEffect(() => {
    savePipelineSettings(programmeType, customization);
  }, [programmeType, customization]);

  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const STAGES = useMemo(() => {
    const base = PROGRAMME_TEMPLATES[programmeType]?.stages || PROGRAMME_TEMPLATES.default.stages;
    return applyStageCustomization(base, customization);
  }, [programmeType, customization]);

  const allStagesForCustomization = useMemo(() => {
    const base = PROGRAMME_TEMPLATES[programmeType]?.stages || PROGRAMME_TEMPLATES.default.stages;
    return applyStageCustomization(base, { ...customization, hidden: [] });
  }, [programmeType, customization]);

  const liveStages = useMemo(() => STAGES.filter((s) => !s.terminal), [STAGES]);
  const terminalStages = useMemo(() => STAGES.filter((s) => s.terminal), [STAGES]);

  const mergedEnriched = useMemo(() => {
    if (!smeOverrides || !smeOverrides.length) return enriched;
    const overrideMap = new Map(smeOverrides.map(o => [`${o.smeId}_${o.programIndex}`, o]));
    return enriched.map(e => overrideMap.get(`${e.smeId}_${e.programIndex}`) || e);
  }, [enriched, smeOverrides]);

  const counts = useMemo(() => {
    const result = {};
    for (const stage of STAGES) result[stage.id] = 0;
    for (const sme of mergedEnriched) {
      const stageId = mapStatusToStageId(sme.pipelineStage || sme.status);
      if (result[stageId] !== undefined) result[stageId] += 1;
      else if (result.matched !== undefined) result.matched += 1;
    }
    return result;
  }, [mergedEnriched, STAGES]);

  const totalBusinesses = useMemo(() => Object.values(counts).reduce((sum, c) => sum + c, 0), [counts]);

  const getStagePercentage = useCallback((count) => {
    if (totalBusinesses === 0) return 0;
    return ((count / totalBusinesses) * 100).toFixed(1);
  }, [totalBusinesses]);

  const cumulativeCounts = useMemo(() => {
    const sorted = [...liveStages].sort((a, b) => a.order - b.order);
    let runningTotal = 0;
    const result = {};
    for (let i = sorted.length - 1; i >= 0; i--) {
      runningTotal += counts[sorted[i].id] || 0;
      result[sorted[i].id] = runningTotal;
    }
    return result;
  }, [liveStages, counts]);

  const activeStageId = useMemo(() => {
    let maxCount = 0;
    let maxStage = null;
    for (const stage of liveStages) {
      const c = counts[stage.id] || 0;
      if (c > maxCount) { maxCount = c; maxStage = stage.id; }
    }
    return maxStage;
  }, [liveStages, counts]);

  const handleStageClick = useCallback((stageId) => {
    const newSelected = stageId === selectedStage ? null : stageId;
    setSelectedStage(newSelected);
    onStageClick?.(newSelected);
  }, [selectedStage, onStageClick]);

  const conversionMetrics = useMemo(() => {
    const sorted = [...liveStages].sort((a, b) => a.order - b.order);
    const rows = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const from = sorted[i], to = sorted[i + 1];
      const fromCount = cumulativeCounts[from.id] || 0;
      const toCount = cumulativeCounts[to.id] || 0;
      const rate = fromCount > 0 ? ((toCount / fromCount) * 100).toFixed(1) : "0.0";
      rows.push({ fromLabel: from.name, toLabel: to.name, rate });
    }
    return rows;
  }, [liveStages, cumulativeCounts]);

  const evaluationToAdmissionRate = useMemo(() => {
    const evalStage = liveStages.find((s) => s.id === "evaluation");
    const admittedStage = liveStages.find((s) => s.id === "admitted");
    if (!evalStage || !admittedStage) return null;
    const evalCount = cumulativeCounts["evaluation"] || 0;
    const admittedCount = cumulativeCounts["admitted"] || 0;
    const rate = evalCount > 0 ? ((admittedCount / evalCount) * 100).toFixed(1) : "0.0";
    return { fromLabel: evalStage.name, toLabel: admittedStage.name, rate };
  }, [liveStages, cumulativeCounts]);

  return (
    <div className={`w-full bg-gradient-to-br from-[#faf7f2] to-[#f5f0e1] rounded-3xl p-7 shadow-xl border border-[#e6d7c3] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7d5a50] to-[#4a352f] flex items-center justify-center shadow-md">
            <Briefcase size={22} className="text-[#faf7f2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-[#4a352f]">DealFlow Pipeline</h2>
              <Sparkles size={16} className="text-[#a67c52]" />
            </div>
            <p className="text-sm text-[#7d5a50]">Track your business journey</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right bg-white/60 backdrop-blur-sm px-5 py-2 rounded-2xl border border-[#e6d7c3]">
            <div className="text-2xl font-extrabold text-[#4a352f]">{totalBusinesses}</div>
            <div className="text-xs text-[#7d5a50] font-medium">Total Businesses</div>
          </div>
          {showFilter && (
            <>
              <select
                value={programmeType}
                onChange={(e) => setProgrammeType(e.target.value)}
                className="px-4 py-2.5 bg-white border border-[#e6d7c3] rounded-xl text-sm font-semibold text-[#4a352f] focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20 hover:border-[#c8b6a6] transition-colors cursor-pointer"
                title="Choose the stage sequence for this programme type"
              >
                {Object.entries(PROGRAMME_TEMPLATES).map(([key, tpl]) => (
                  <option key={key} value={key}>{tpl.label}</option>
                ))}
              </select>
              <button
                onClick={() => setShowCustomizePanel(true)}
                className="p-2.5 rounded-xl border border-[#e6d7c3] bg-white text-[#7d5a50] hover:bg-[#f5f0e1] hover:border-[#c8b6a6] transition-all hover:shadow-md"
                title="Rename, hide, reorder, or add stages"
              >
                <Settings size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <PipelineSkeleton />
      ) : totalBusinesses === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Stage Cards */}
          <div className="flex items-stretch overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-[#c8b6a6] scrollbar-track-transparent gap-1">
            {liveStages.map((stage, idx) => {
              const isHovered = hoveredStage?.id === stage.id;
              const isSelected = selectedStage === stage.id;
              const isActive = activeStageId === stage.id;
              const count = counts[stage.id] || 0;
              const percentage = getStagePercentage(count);
              const colors = getStageColors(stage.group);

              return (
                <div key={stage.id} className="flex items-center">
                  <div
                    className={`relative flex-shrink-0 cursor-pointer group transition-all duration-300 ${
                      isSelected ? "scale-105" : "hover:scale-[1.02]"
                    }`}
                    style={{ width: "135px" }}
                    onMouseEnter={(e) => setHoveredStage({ id: stage.id, rect: e.currentTarget.getBoundingClientRect() })}
                    onMouseLeave={() => setHoveredStage(null)}
                    onClick={() => handleStageClick(stage.id)}
                  >
                    <div
                      className={`rounded-2xl p-4 transition-all duration-300 ${
                        isHovered || isSelected ? "shadow-xl -translate-y-1" : "shadow-md hover:shadow-lg"
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${colors.bgColor} 0%, ${colors.bgColor}cc 100%)`,
                        border: `2.5px solid ${isSelected || isActive ? colors.color : colors.borderColor}`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-white/40 backdrop-blur-sm" style={{ color: colors.color }}>
                          {getIcon(stage.icon, 14)}
                        </div>
                        <h3 className="font-bold text-[#4a352f] text-xs leading-tight truncate flex-1">{stage.name}</h3>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold" style={{ color: colors.color }}>{count}</span>
                        <span className="text-[10px] text-[#7d5a50] font-medium">· {percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden mt-2.5 backdrop-blur-sm">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%`, backgroundColor: colors.color }}
                        />
                      </div>
                    </div>

                    {/* Tooltip */}
                    {isHovered && (
                      <PopupPortal>
                        <div
                          className="fixed z-[1200] pointer-events-none w-[230px]"
                          style={{
                            top: hoveredStage.rect.bottom + 10,
                            left: Math.min(Math.max(hoveredStage.rect.left + hoveredStage.rect.width / 2 - 115, 12), window.innerWidth - 242),
                          }}
                        >
                          <div className="bg-[#4a352f] text-[#faf7f2] text-xs rounded-2xl px-4 py-3.5 shadow-2xl">
                            <p className="font-semibold mb-1.5 text-sm">{stage.name}</p>
                            <p className="text-[#e6d7c3] leading-relaxed">{stage.tooltip}</p>
                            <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between">
                              <span className="text-[#c8b6a6]">{percentage}% of pipeline</span>
                              <span className="text-[#a67c52] font-semibold">{count} businesses</span>
                            </div>
                          </div>
                        </div>
                      </PopupPortal>
                    )}
                  </div>

                  {/* Connector */}
                  {idx < liveStages.length - 1 && (
                    <div className="flex items-center px-1 flex-shrink-0">
                      <div className="w-5 h-[2px] bg-gradient-to-r from-[#c8b6a6] to-[#e6d7c3]" />
                      <ArrowRight size={14} className="text-[#c8b6a6] -ml-1" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
            <p className="text-xs text-[#7d5a50] font-medium">
              Click a stage to filter
              {selectedStage && (
                <span className="ml-3 text-[#a67c52] font-semibold">
                  · Filtering: {STAGES.find((s) => s.id === selectedStage)?.name}
                  <button onClick={() => handleStageClick(null)} className="ml-2 text-[#7d5a50] hover:text-[#4a352f] underline font-medium">
                    Clear
                  </button>
                </span>
              )}
            </p>
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-white border border-[#e6d7c3] text-[#7d5a50] hover:bg-[#f5f0e1] hover:border-[#c8b6a6] transition-all hover:shadow-md"
            >
              <ChevronsUpDown size={14} />
              {showDetails ? "Hide Insights" : "Show Insights"}
            </button>
          </div>

          {showDetails && (
            <>
              {/* Terminal Outcomes */}
              {terminalStages.length > 0 && (
                <div className="mt-6 pt-5 border-t border-[#e6d7c3]">
                  <p className="text-[10px] uppercase tracking-wider text-[#a89482] font-semibold mb-3">
                    Terminal Outcomes
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {terminalStages.map((stage) => {
                      const colors = getStageColors(stage.group);
                      const count = counts[stage.id] || 0;
                      const percentage = getStagePercentage(count);
                      const isSelected = selectedStage === stage.id;
                      return (
                        <button
                          key={stage.id}
                          onClick={() => handleStageClick(stage.id)}
                          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-all hover:shadow-md ${
                            isSelected ? "shadow-lg" : ""
                          }`}
                          style={{
                            background: `linear-gradient(135deg, ${colors.bgColor} 0%, ${colors.bgColor}80 100%)`,
                            borderColor: isSelected ? colors.color : colors.borderColor,
                          }}
                          title={stage.tooltip}
                        >
                          <span style={{ color: colors.color }}>{getIcon(stage.icon, 15)}</span>
                          <span className="text-sm font-semibold" style={{ color: colors.color }}>{stage.name}</span>
                          <span className="text-xs text-[#7d5a50] font-medium">{count} · {percentage}%</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pipeline Insights */}
              <div className="mt-6 pt-5 border-t border-[#e6d7c3]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7d5a50] to-[#4a352f] flex items-center justify-center shadow-md">
                    <TrendingUp size={16} className="text-[#faf7f2]" />
                  </div>
                  <h4 className="text-base font-bold text-[#4a352f]">Pipeline Insights</h4>
                  <div className="relative group">
                    <Info size={14} className="text-[#a89482] cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      Conversion = share of SMEs at or beyond stage A that are also at or beyond stage B
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {conversionMetrics.map((m, i) => (
                    <div key={i} className="bg-white rounded-xl border border-[#e6d7c3] px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-[10px] text-[#a89482] font-medium uppercase tracking-wide">{m.fromLabel} → {m.toLabel}</p>
                      <p className="text-lg font-bold text-[#4a352f] mt-0.5">{m.rate}%</p>
                    </div>
                  ))}
                  {evaluationToAdmissionRate && (
                    <div className="bg-gradient-to-br from-[#a67c52]/10 to-[#a67c52]/5 rounded-xl border-2 border-[#a67c52] px-4 py-3 shadow-sm">
                      <p className="text-[10px] text-[#a67c52] font-bold uppercase tracking-wide">Overall</p>
                      <p className="text-[10px] text-[#7d5a50]">{evaluationToAdmissionRate.fromLabel} → {evaluationToAdmissionRate.toLabel}</p>
                      <p className="text-lg font-bold text-[#4a352f] mt-0.5">{evaluationToAdmissionRate.rate}%</p>
                    </div>
                  )}
                  <div className="bg-white rounded-xl border border-dashed border-[#e6d7c3] px-4 py-3 flex flex-col justify-center">
                    <p className="text-[10px] text-[#a89482] font-medium uppercase tracking-wide">Avg. Time to Decision</p>
                    <p className="text-xs text-[#a89482] italic mt-1">Needs stage-change timestamps</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {showCustomizePanel && (
        <StageCustomizePanel
          stages={allStagesForCustomization}
          customization={customization}
          onChange={setCustomization}
          onClose={() => setShowCustomizePanel(false)}
        />
      )}
    </div>
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export default SupportDealFlowPipeline;