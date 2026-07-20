"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePortfolio } from "../../context/PortfolioContext";
import {
  TrendingUp, FileText, Search, Shield, AlertCircle,
  FileCheck, CheckCircle, XCircle, ArrowRight, LogOut,
  Users, Target, Briefcase, Layers, DollarSign, Settings,
  ChevronUp, ChevronDown, Plus, X, Sparkles
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

const StageCustomizePanel = ({ stages, customization, onChange, onClose, programmeType, setProgrammeType }) => {
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
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#4a352f]/40 backdrop-blur-sm font-sans" onClick={onClose}>
        <div className="bg-white rounded-3xl shadow-2xl border border-[#e6d7c3] w-[540px] max-h-[85vh] overflow-y-auto p-7" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xl font-bold text-[#4a352f]">Customize Stages</h3>
              <p className="text-xs text-[#7d5a50] mt-0.5">Rename, hide, reorder, or add custom stages</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f0e1] transition-colors text-[#7d5a50]">
              <X size={20} />
            </button>
          </div>

          {setProgrammeType && (
            <div className="mb-5">
              <label className="block text-xs font-semibold text-[#4a352f] mb-2">Programme Type</label>
              <select
                value={programmeType}
                onChange={(e) => setProgrammeType(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#faf7f2] border border-[#e6d7c3] rounded-xl text-sm font-semibold text-[#4a352f] focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20 cursor-pointer"
                title="Choose the stage sequence for this programme type"
              >
                {Object.entries(PROGRAMME_TEMPLATES).map(([key, tpl]) => (
                  <option key={key} value={key}>{tpl.label}</option>
                ))}
              </select>
            </div>
          )}

          <p className="text-xs font-semibold text-[#a89482] uppercase tracking-wide mb-2">Stages in this pipeline</p>

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

  const handleStageClick = useCallback((stageId) => {
    const newSelected = stageId === selectedStage ? null : stageId;
    setSelectedStage(newSelected);
    onStageClick?.(newSelected);
  }, [selectedStage, onStageClick]);

  // Every stage card — sequential or terminal — shares this renderer, so
  // Declined/Withdrawn are guaranteed the same shape and size as the rest
  // rather than needing a second, drifting implementation. Cards use a dark
  // brown theme with white text; Declined/Withdrawn use dark grey instead,
  // as the one deliberate signal that those two are a different kind of
  // outcome — everything else about the card (size, layout, type scale) is
  // identical.
  const renderStageCard = (stage) => {
    const isHovered = hoveredStage?.id === stage.id;
    const isSelected = selectedStage === stage.id;
    // Matched is the entry point every SME passes through, so "Matched"
    // should read as a running total — everyone who has ever been matched,
    // not just whoever hasn't moved on yet. That's the same number as the
    // total across every stage (live and terminal).
    const count = stage.id === "matched" ? totalBusinesses : (counts[stage.id] || 0);
    const percentage = getStagePercentage(count);
    const isNegativeOutcome = stage.terminal && /declined|withdrawn/i.test(stage.name || "");
    const theme = isNegativeOutcome
      ? { from: "#4b4844", to: "#242220" } // dark grey — Declined / Withdrawn
      : { from: "#4a352f", to: "#241a14" }; // dark brown — every other stage
    const borderColor = isSelected ? "#d9b98a" : "rgba(255,255,255,0.1)";

    return (
      <div
        className={`relative flex-shrink-0 cursor-pointer group transition-all duration-300 ${
          isSelected ? "scale-105" : "hover:scale-[1.02]"
        }`}
        style={{ width: "104px" }}
        onMouseEnter={(e) => setHoveredStage({ id: stage.id, rect: e.currentTarget.getBoundingClientRect() })}
        onMouseLeave={() => setHoveredStage(null)}
        onClick={() => handleStageClick(stage.id)}
      >
        <div
          className={`rounded-xl p-2.5 transition-all duration-300 ${
            isHovered || isSelected ? "shadow-xl -translate-y-1" : "shadow-md hover:shadow-lg"
          }`}
          style={{
            background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
            border: `1.5px solid ${borderColor}`,
          }}
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
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%`, backgroundColor: "#c9986a" }}
              />
            </div>
            <span className="text-[8px] font-semibold flex-shrink-0" style={{ color: "#d9c4b0" }}>{percentage}%</span>
          </div>
        </div>

        {/* Tooltip */}
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
                  <span className="text-[#c8b6a6]">{percentage}% of pipeline</span>
                  <span className="text-[#a67c52] font-semibold">{count} businesses</span>
                </div>
              </div>
            </div>
          </PopupPortal>
        )}
      </div>
    );
  };

  return (
    <div className={`w-full font-sans bg-gradient-to-br from-[#faf7f2] to-[#f5f0e1] rounded-3xl p-7 shadow-xl border border-[#e6d7c3] ${className}`}>
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
            <p className="text-xs text-[#7d5a50] mt-0.5">Track your business journey, stage by stage</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleStageClick("matched")}
            className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-5 py-2.5 rounded-2xl border transition-all hover:bg-[#f5f0e1]"
            style={{ borderColor: selectedStage === "matched" ? "#d9b98a" : "#e6d7c3" }}
            title="Show newly matched businesses"
          >
            <span className="text-3xl font-extrabold text-[#4a352f] leading-none">{counts["matched"] || 0}</span>
            <span className="text-[10px] text-[#7d5a50] font-semibold uppercase tracking-wide">New Businesses</span>
          </button>
          {showFilter && (
            <button
              onClick={() => setShowCustomizePanel(true)}
              className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-[#e6d7c3] text-sm font-semibold text-[#4a352f] hover:bg-[#f5f0e1] transition-all"
              title="Rename, hide, reorder, or add stages"
            >
              <Settings size={16} className="text-[#7d5a50]" />
              Customize Stages
            </button>
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
            {liveStages.map((stage, idx) => (
              <div key={stage.id} className="flex items-center">
                {renderStageCard(stage)}

                {/* Connector — conversion rate to the next stage, shown
                    above the arrow (previously a separate "Pipeline
                    Insights" card; now lives where it's actually useful,
                    right on the flow it describes). */}
                {idx < liveStages.length - 1 && (() => {
                  const nextStage = liveStages[idx + 1];
                  const fromCount = cumulativeCounts[stage.id] || 0;
                  const toCount = cumulativeCounts[nextStage.id] || 0;
                  const rate = fromCount > 0 ? ((toCount / fromCount) * 100).toFixed(1) : "0.0";
                  return (
                    <div className="flex flex-col items-center px-0.5 flex-shrink-0" style={{ minWidth: "30px" }}>
                      <span className="text-[10px] font-bold text-[#7d5a50] mb-0.5 whitespace-nowrap" title="Share of this stage that reaches the next">
                        {rate}%
                      </span>
                      <div className="flex items-center">
                        <div className="w-5 h-[2px] bg-gradient-to-r from-[#c8b6a6] to-[#e6d7c3]" />
                        <ArrowRight size={14} className="text-[#c8b6a6] -ml-1" />
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}

            {/* Terminal outcomes now live at the end of the same pipeline
                row (previously tucked away in a collapsible Insights
                section) — a slim divider marks them as endpoints, but they
                use the exact same card shape/size as the flow stages.
                Declined/Withdrawn get one shared red border wrapping the
                pair, rather than each card having its own. */}
            {terminalStages.length > 0 && (() => {
              const negativeStages = terminalStages.filter((s) => /declined|withdrawn/i.test(s.name || ""));
              const otherStages = terminalStages.filter((s) => !/declined|withdrawn/i.test(s.name || ""));
              return (
                <div className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center px-2 flex-shrink-0 self-stretch justify-center">
                    <div className="w-px h-10 bg-[#e6d7c3]" />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {otherStages.map((stage) => (
                      <div key={stage.id} className="flex-shrink-0">
                        {renderStageCard(stage)}
                      </div>
                    ))}
                    {negativeStages.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-shrink-0 p-1.5 rounded-2xl" style={{ border: "2px solid #dc2626" }}>
                        {negativeStages.map((stage) => (
                          <div key={stage.id} className="flex-shrink-0">
                            {renderStageCard(stage)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex items-center mt-4 flex-wrap gap-3">
            {selectedStage ? (
              <div className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full bg-[#a67c52]/10 border border-[#a67c52]/40">
                <span className="text-xs font-semibold text-[#7d5a50]">Filtering</span>
                <span className="text-xs font-bold text-[#4a352f]">{STAGES.find((s) => s.id === selectedStage)?.name}</span>
                <button
                  onClick={() => handleStageClick(null)}
                  className="p-1 rounded-full hover:bg-white/70 text-[#7d5a50] hover:text-[#4a352f] transition-colors"
                  title="Clear filter"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <p className="text-xs text-[#a89482] font-medium">Click a stage to filter the list below</p>
            )}
          </div>
        </>
      )}

      {showCustomizePanel && (
        <StageCustomizePanel
          stages={allStagesForCustomization}
          customization={customization}
          onChange={setCustomization}
          onClose={() => setShowCustomizePanel(false)}
          programmeType={programmeType}
          setProgrammeType={setProgrammeType}
        />
      )}
    </div>
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export default SupportDealFlowPipeline;