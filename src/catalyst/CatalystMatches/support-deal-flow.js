"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePortfolio } from "../../context/PortfolioContext";
import {
  TrendingUp, FileText, Search, Shield, AlertCircle,
  FileCheck, CheckCircle, XCircle, ArrowRight, LogOut,
  Users, Target, Briefcase, Layers, DollarSign, Settings,
  ChevronUp, ChevronDown, Plus, X, Info, ChevronsUpDown
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
const getIcon = (name, size = 16) => {
  const Cmp = ICONS[name] || Target;
  return <Cmp size={size} />;
};

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
const PipelineSkeleton = () => (
  <div className="flex gap-2 overflow-x-auto pb-4 px-1">
    {[...Array(7)].map((_, i) => (
      <div
        key={i}
        className="bg-shimmer-dark bg-shimmer rounded-xl flex-shrink-0 animate-shimmer"
        style={{ width: "110px", height: "88px" }}
      >
        <div className="p-3 flex flex-col h-full justify-between">
          <div className="h-3 w-16 rounded bg-white/20" />
          <div className="h-6 w-12 rounded bg-white/20 mx-auto" />
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

// ─── Stage Customization Panel (feedback #4) ───────────────────────────────
// Lets a catalyst administrator rename, hide, and reorder stages, add a
// small number of custom stages, and — closing the last gap from the
// original feedback — configure which action fields (message, meeting,
// availability, offer upload) the SME table's "Update Stage" form shows for
// each stage. Persisted via stageConfig.js's shared settings helpers.
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
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] w-[520px] max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#4a352f]">Customize Pipeline Stages</h3>
          <button onClick={onClose} className="text-[#7d5a50] hover:text-[#4a352f]"><X size={18} /></button>
        </div>
        <p className="text-xs text-[#7d5a50] mb-4">
          Rename, hide, or reorder stages for this programme. The BIG default sequence always remains available as a template.
        </p>
        <div className="space-y-2 mb-4">
          {localOrder.map((id, i) => {
            const stage = stages.find((s) => s.id === id);
            if (!stage) return null;
            const hidden = localHidden.includes(id);
            return (
              <div key={id} className={`flex items-center gap-2 p-2 rounded-lg border ${hidden ? "opacity-40 bg-gray-50 border-gray-200" : "border-[#e6d7c3] bg-[#faf7f2]"}`}>
                <div className="flex flex-col">
                  <button disabled={i === 0} onClick={() => move(id, -1)} className="disabled:opacity-30"><ChevronUp size={14} /></button>
                  <button disabled={i === localOrder.length - 1} onClick={() => move(id, 1)} className="disabled:opacity-30"><ChevronDown size={14} /></button>
                </div>
                <input
                  value={localRenames[id] ?? stage.name}
                  onChange={(e) => setLocalRenames((prev) => ({ ...prev, [id]: e.target.value }))}
                  className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm"
                />
                {!stage.terminal && (
                  <button onClick={() => toggleHidden(id)} className="text-xs px-2 py-1 rounded-md border border-[#c8b6a6] text-[#4a352f]">
                    {hidden ? "Show" : "Hide"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mb-4">
          <input
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            placeholder="Add a custom stage..."
            className="flex-1 px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm"
          />
          <button onClick={addCustomStage} className="flex items-center gap-1 px-3 py-2 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold">
            <Plus size={14} /> Add
          </button>
        </div>

        {/* Stage Actions — configures the Update Stage form fields per stage
            in the matching table. Scoped to the BIG default stage set since
            that's what the matching table's dropdown always uses, regardless
            of which programme template is currently active for the pipeline
            view above. */}
        <div className="border-t border-[#e6d7c3] pt-4 mb-4">
          <button onClick={() => setShowStageActions((v) => !v)} className="flex items-center justify-between w-full text-left">
            <span className="text-sm font-semibold text-[#4a352f]">Stage Actions (Matching Table)</span>
            {showStageActions ? <ChevronUp size={16} className="text-[#7d5a50]" /> : <ChevronDown size={16} className="text-[#7d5a50]" />}
          </button>
          <p className="text-xs text-[#a89482] mt-1">Choose which fields appear in the Update Stage form for each stage.</p>
          {showStageActions && (
            <div className="mt-3 space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {DEFAULT_STAGES.map((stage) => {
                const config = { ...DEFAULT_STAGE_ACTIONS[stage.id], ...(localStageActions[stage.id] || {}) };
                return (
                  <div key={stage.id} className="p-2.5 rounded-lg border border-[#e6d7c3] bg-[#faf7f2]">
                    <p className="text-xs font-semibold text-[#4a352f] mb-2">{stage.name}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {STAGE_ACTION_FIELDS.map((field) => (
                        <label key={field.key} className="flex items-center gap-1.5 text-xs text-[#4a352f] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!config[field.key]}
                            onChange={() => toggleStageAction(stage.id, field.key)}
                            className="rounded border-[#c8b6a6] text-[#7d5a50]"
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

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Cancel</button>
          <button onClick={save} className="px-4 py-2 bg-[#7d5a50] text-white rounded-lg text-sm font-semibold">Save</button>
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
  const [hoveredStage, setHoveredStage] = useState(null); // { id, rect } | null
  const [selectedStage, setSelectedStage] = useState(null);

  // Persist programme type + stage customization across visits. Previously
  // these lived only in component state, which reset to defaults every time
  // this component unmounted (e.g. navigating to another page and back) —
  // that's why saved changes appeared to vanish. localStorage keeps them for
  // this browser until a real backend settings endpoint exists.
  // NOTE(backend): this should eventually be a per-catalyst/per-programme
  // settings document so customization follows the account, not the device.
  // Loaded/saved via stageConfig.js's shared helpers so SupportSMETable.jsx
  // reads the exact same key/shape (specifically `customization.stageActions`).
  const [programmeType, setProgrammeType] = useState(() => loadPipelineSettings().programmeType);
  const [customization, setCustomization] = useState(() => loadPipelineSettings().customization);

  useEffect(() => {
    savePipelineSettings(programmeType, customization);
  }, [programmeType, customization]);

  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  // Terminal outcomes + conversion metrics are collapsed by default so the
  // pipeline reads clean at a glance; the catalyst expands them on demand.
  const [showDetails, setShowDetails] = useState(false);

  // Resolve the active stage list: programme template + admin customization
  // (feedback #4). The BIG default is always selectable regardless of what
  // any individual programme is currently configured to use.
  const STAGES = useMemo(() => {
    const base = PROGRAMME_TEMPLATES[programmeType]?.stages || PROGRAMME_TEMPLATES.default.stages;
    return applyStageCustomization(base, customization);
  }, [programmeType, customization]);

  // Separate, *unfiltered* list for the customize panel — STAGES above has
  // hidden stages removed entirely (applyStageCustomization drops them), so
  // passing STAGES to the panel meant a hidden stage's row disappeared
  // completely and there was nothing left to click "Show" on. The panel
  // needs every stage, hidden or not, so toggling hidden back off actually
  // works.
  const allStagesForCustomization = useMemo(() => {
    const base = PROGRAMME_TEMPLATES[programmeType]?.stages || PROGRAMME_TEMPLATES.default.stages;
    return applyStageCustomization(base, { ...customization, hidden: [] });
  }, [programmeType, customization]);

  const liveStages = useMemo(() => STAGES.filter((s) => !s.terminal), [STAGES]);
  const terminalStages = useMemo(() => STAGES.filter((s) => s.terminal), [STAGES]);

  // Merge context data with overrides
  const mergedEnriched = useMemo(() => {
    if (!smeOverrides || !smeOverrides.length) return enriched;
    const overrideMap = new Map(smeOverrides.map(o => [`${o.smeId}_${o.programIndex}`, o]));
    return enriched.map(e => overrideMap.get(`${e.smeId}_${e.programIndex}`) || e);
  }, [enriched, smeOverrides]);

  // Calculate counts for each stage id
  const counts = useMemo(() => {
    const result = {};
    for (const stage of STAGES) result[stage.id] = 0;
    for (const sme of mergedEnriched) {
      const stageId = mapStatusToStageId(sme.pipelineStage || sme.status);
      if (result[stageId] !== undefined) result[stageId] += 1;
      else if (result.matched !== undefined) result.matched += 1; // fallback bucket
    }
    return result;
  }, [mergedEnriched, STAGES]);

  const totalBusinesses = useMemo(() => Object.values(counts).reduce((sum, c) => sum + c, 0), [counts]);

  const getStagePercentage = useCallback((count) => {
    if (totalBusinesses === 0) return 0;
    return ((count / totalBusinesses) * 100).toFixed(1);
  }, [totalBusinesses]);

  // Cumulative "at-or-beyond this stage" counts, used both to find the
  // busiest live stage and to compute adjacent-stage conversion rates.
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

  // ─── Conversion metrics (feedback #15) ───────────────────────────────────
  // Adjacent-stage conversion: what share of SMEs at-or-beyond stage A are
  // also at-or-beyond stage B (the next live stage). This is the honest
  // metric derivable from current data; time-based metrics (e.g. "average
  // time to decision") need stage-change timestamps that don't exist on the
  // record yet, so they're labelled as pending rather than fabricated.
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

  // Explicit multi-hop rate requested alongside the adjacent-stage ones
  // above: overall Evaluation → Admitted conversion, skipping over whatever
  // sits between them (Due Diligence, Decision, Offer, etc.) rather than
  // only showing step-by-step conversion. Only renders when both stages
  // exist in the currently active programme template.
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
    <div className={`w-full bg-[#faf7f2] rounded-[24px] p-6 shadow-lg border border-[#e6d7c3] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
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
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-[#4a352f]">{totalBusinesses}</div>
            <div className="text-xs text-[#7d5a50]">Total Businesses</div>
          </div>
          {showFilter && (
            <>
              {/* Programme type selector (feedback #4) */}
              <select
                value={programmeType}
                onChange={(e) => setProgrammeType(e.target.value)}
                className="px-3 py-2 bg-white border border-[#c8b6a6] rounded-lg text-xs font-semibold text-[#4a352f]"
                title="Choose the stage sequence for this programme type"
              >
                {Object.entries(PROGRAMME_TEMPLATES).map(([key, tpl]) => (
                  <option key={key} value={key}>{tpl.label}</option>
                ))}
              </select>
              <button
                onClick={() => setShowCustomizePanel(true)}
                className="p-2 rounded-lg border border-[#c8b6a6] text-[#7d5a50] hover:bg-[#f5f0e1] transition-colors"
                title="Rename, hide, reorder, or add stages"
              >
                <Settings size={16} />
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
          {/*
            Compact stage cards (feedback #13): name, count, percentage —
            icon is secondary. Thin connecting line + arrows (feedback #2)
            replace the old duplicate horizontal pipeline strip that used to
            sit below these cards.
          */}
          <div className="flex items-stretch overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#c8b6a6] scrollbar-track-transparent">
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
                    className={`relative flex-shrink-0 cursor-pointer group w-[125px] transition-all duration-200 ${isSelected ? "scale-105" : ""}`}
                    onMouseEnter={(e) => setHoveredStage({ id: stage.id, rect: e.currentTarget.getBoundingClientRect() })}
                    onMouseLeave={() => setHoveredStage(null)}
                    onClick={() => handleStageClick(stage.id)}
                  >
                    <div
                      className={`rounded-xl px-3 py-2.5 transition-all duration-200 ${isHovered || isSelected ? "shadow-lg -translate-y-0.5" : "shadow-sm"}`}
                      style={{
                        backgroundColor: colors.bgColor,
                        border: `2px solid ${isSelected || isActive ? colors.color : colors.borderColor}`,
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span style={{ color: colors.color }}>{getIcon(stage.icon, 13)}</span>
                        <h3 className="font-bold text-[#4a352f] text-[11px] leading-tight truncate">{stage.name}</h3>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-extrabold" style={{ color: colors.color }}>{count}</span>
                        <span className="text-[10px] text-[#7d5a50]">· {percentage}%</span>
                      </div>
                      <div className="w-full h-1 bg-black/10 rounded-full overflow-hidden mt-1.5">
                        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: colors.color }} />
                      </div>
                    </div>

                    {/* Tooltip: operational definition + denominator clarity
                        (feedback #3, #15). Portaled to <body> and positioned
                        from the card's own bounding rect — it used to be an
                        `absolute` child of this card, which sits inside an
                        `overflow-x-auto` row, so the tooltip was clipped or
                        buried under later cards instead of floating above
                        everything. */}
                    {isHovered && (
                      <PopupPortal>
                        <div
                          className="fixed z-[1200] pointer-events-none w-[220px]"
                          style={{
                            top: hoveredStage.rect.bottom + 8,
                            left: Math.min(Math.max(hoveredStage.rect.left + hoveredStage.rect.width / 2 - 110, 12), window.innerWidth - 232),
                          }}
                        >
                          <div className="bg-[#4a352f] text-[#faf7f2] text-xs rounded-xl px-3.5 py-3 shadow-2xl">
                            <p className="font-semibold mb-1">{stage.name}</p>
                            <p className="text-[#e6d7c3] leading-relaxed">{stage.tooltip}</p>
                            <p className="text-[#c8b6a6] mt-2 pt-2 border-t border-white/10">
                              {percentage}% of current pipeline
                            </p>
                          </div>
                        </div>
                      </PopupPortal>
                    )}
                  </div>

                  {/* Thin connector with arrow between cards, replacing the second pipeline row */}
                  {idx < liveStages.length - 1 && (
                    <div className="flex items-center px-1 flex-shrink-0">
                      <div className="w-4 h-[2px]" style={{ backgroundColor: "#c8b6a6" }} />
                      <ArrowRight size={12} className="text-[#c8b6a6] -ml-1" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
            <p className="text-xs text-[#7d5a50]">
              Click a stage to filter
              {selectedStage && (
                <span className="ml-2 text-[#a67c52] font-medium">
                  · Filtering: {STAGES.find((s) => s.id === selectedStage)?.name}
                  <button onClick={() => handleStageClick(null)} className="ml-2 text-[#7d5a50] hover:text-[#4a352f] underline">
                    Clear filter
                  </button>
                </span>
              )}
            </p>
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#c8b6a6] text-[#7d5a50] hover:bg-[#f5f0e1] transition-colors"
            >
              <ChevronsUpDown size={12} />
              {showDetails ? "Hide outcomes & insights" : "Show outcomes & insights"}
            </button>
          </div>

          {showDetails && (
          <>
          {/* ─── Declined / Withdrawn — visually separated terminal outcomes ───
              These are alternative outcomes, not the "next step" after
              Admitted (feedback #14), so they get their own muted row with
              a distinct palette rather than sitting inline with the live
              pipeline. */}
          {terminalStages.length > 0 && (
            <div className="mt-5 pt-4 border-t border-dashed border-[#e6d7c3]">
              <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-2">
                Terminal outcomes — not part of the live progression
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
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all"
                      style={{
                        backgroundColor: colors.bgColor,
                        borderColor: isSelected ? colors.color : colors.borderColor,
                      }}
                      title={stage.tooltip}
                    >
                      <span style={{ color: colors.color }}>{getIcon(stage.icon, 14)}</span>
                      <span className="text-xs font-semibold" style={{ color: colors.color }}>{stage.name}</span>
                      <span className="text-xs text-[#7d5a50]">{count} · {percentage}%</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Pipeline Insights: conversion metrics (feedback #15) ───────
              Replaces the old duplicate horizontal pipeline strip. */}
          <div className="mt-5 pt-4 border-t border-[#e6d7c3]">
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp size={14} className="text-[#7d5a50]" />
              <h4 className="text-sm font-semibold text-[#4a352f]">Pipeline Insights</h4>
              <span title="Conversion = share of SMEs at or beyond stage A that are also at or beyond stage B">
                <Info size={12} className="text-[#a89482]" />
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {conversionMetrics.map((m, i) => (
                <div key={i} className="bg-white rounded-lg border border-[#e6d7c3] px-3 py-2">
                  <p className="text-[10px] text-[#a89482] leading-tight">{m.fromLabel} → {m.toLabel}</p>
                  <p className="text-base font-bold text-[#4a352f]">{m.rate}%</p>
                </div>
              ))}
              {evaluationToAdmissionRate && (
                <div className="bg-white rounded-lg border-2 border-[#a67c52] px-3 py-2">
                  <p className="text-[10px] text-[#a67c52] leading-tight font-semibold uppercase tracking-wide">Overall</p>
                  <p className="text-[10px] text-[#a89482] leading-tight">{evaluationToAdmissionRate.fromLabel} → {evaluationToAdmissionRate.toLabel}</p>
                  <p className="text-base font-bold text-[#4a352f]">{evaluationToAdmissionRate.rate}%</p>
                </div>
              )}
              <div className="bg-white rounded-lg border border-dashed border-[#e6d7c3] px-3 py-2">
                <p className="text-[10px] text-[#a89482] leading-tight">Average time to decision</p>
                <p className="text-xs text-[#a89482] italic mt-1">Needs stage-change timestamps — not yet on the record</p>
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