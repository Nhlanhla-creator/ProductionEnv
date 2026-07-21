"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Info, MapPin, Calendar, Filter, X, Eye, BarChart3,
  ChevronDown, ChevronUp, MoreVertical, CheckCircle, XCircle,
  Clock, Users, DollarSign, Building,
  LayoutGrid, Download, MessageSquare,
  Share2, ArrowRight, ArrowUp, ArrowDown, SlidersHorizontal,
  RotateCcw, Settings, Target, Briefcase,
  Video, Link, LogOut, Trash2, Plus, GripVertical
} from "lucide-react";
import { db, auth, storage } from "../../firebaseConfig";
import { serverTimestamp, doc, updateDoc, getDoc, addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import * as XLSX from "xlsx";
import { usePortfolio } from "../../context/PortfolioContext";
import SMEDetailsModal from "./SMEDetailsModal";
import { DEFAULT_STAGES, mapStatusToStageId, getStageColors, getNextStageId, getStageActionConfig, loadPipelineSettings, PROGRAMME_TEMPLATES, applyStageCustomization, getActiveStages, PIPELINE_SETTINGS_EVENT } from "./stageConfig";

// ─── Constants & Helpers ──────────────────────────────────────────────────────
const BIG_SCORE_LABELS = {
  excellent: { min: 80, label: "Excellent", color: "#22c55e" },
  strong: { min: 60, label: "Strong", color: "#86efac" },
  moderate: { min: 40, label: "Moderate", color: "#f59e0b" },
  weak: { min: 20, label: "Weak", color: "#ef4444" },
  critical: { min: 0, label: "Critical", color: "#dc2626" }
};

// Match % now maps to a plain label + fit bar instead of a 5-star rating
const MATCH_LABELS = {
  excellent: { min: 80, label: "Excellent Fit", color: "#22c55e" },
  strong: { min: 60, label: "Strong Fit", color: "#86efac" },
  moderate: { min: 40, label: "Moderate Fit", color: "#f59e0b" },
  weak: { min: 20, label: "Weak Fit", color: "#ef4444" },
  poor: { min: 0, label: "Poor Fit", color: "#dc2626" }
};

const getBigScoreLabel = (score) => {
  for (const value of Object.values(BIG_SCORE_LABELS)) {
    if (score >= value.min) return value;
  }
  return BIG_SCORE_LABELS.critical;
};

const getMatchLabel = (score) => {
  for (const value of Object.values(MATCH_LABELS)) {
    if (score >= value.min) return value;
  }
  return MATCH_LABELS.poor;
};

// Stage lookup helpers now take the currently *active* stage list as a
// parameter (BIG Default, or whichever PROGRAMME_TEMPLATES entry the
// catalyst has switched to, with any admin customization applied) — rather
// than always resolving against the flat DEFAULT_STAGES import. Without
// this, a catalyst switching to e.g. the Grant Programme template (which
// introduces a "Committee" stage) would find that stage never shows up
// anywhere in this table, since every lookup would keep resolving against
// the 9 BIG-default stages regardless of which programme is active.
const getStageById = (id, stages = DEFAULT_STAGES) =>
  stages.find((s) => s.id === id) || stages[0];

const getStatusStyle = (status, stages = DEFAULT_STAGES) => {
  const stage = getStageById(mapStatusToStageId(status, stages), stages);
  const colors = getStageColors(stage.group);
  return { bg: colors.bgColor, text: colors.color, border: colors.borderColor, dot: colors.color, stage };
};

// Reads whatever the catalyst admin configured in the pipeline's "Stage
// Actions" settings panel
const getStageFields = (stageName, stages = DEFAULT_STAGES) => {
  const id = mapStatusToStageId(stageName, stages);
  const overrides = loadPipelineSettings().customization?.stageActions || {};
  return getStageActionConfig(id, overrides);
};

const getNextStage = (currentStage, stages = DEFAULT_STAGES) => {
  const currentId = mapStatusToStageId(currentStage, stages);
  const nextId = getNextStageId(stages, currentId);
  return getStageById(nextId, stages).name;
};

const formatCurrency = (value) => {
  if (!value || value === "-" || value === "N/A") return value;
  const num = parseFloat(value.toString().replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return value;
  if (num >= 1000000) return `R${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `R${(num / 1000).toFixed(0)}K`;
  return `R${num}`;
};

// ─── Attention indicator ────────────────────────────────────
const getAttentionReasons = (sme, stages = DEFAULT_STAGES) => {
  const reasons = [];
  if ((sme.daysInStage || 0) >= 14) reasons.push("Stalled for 14+ days");
  if ((sme.bigScore || 0) < 40 && sme.bigScore > 0) reasons.push("BIG Score below threshold");
  const stageId = mapStatusToStageId(sme.pipelineStage, stages);
  if (stageId === "decision") reasons.push("Decision pending");
  if (stageId === "evaluation" && (sme.daysInStage || 0) >= 7) reasons.push("Evaluation overdue");
  return reasons;
};

// Small helper component so all popups can be portaled straight to <body>.
const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
};

// ─── Column header info tooltip ────────────────────────────────────────────
const HeaderInfoTooltip = ({ text }) => {
  const [rect, setRect] = useState(null);
  return (
    <span
      onMouseEnter={(e) => setRect(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setRect(null)}
      className="inline-flex"
    >
      <Info size={12} style={{ color: "#d9c7b8" }} className="opacity-80 hover:opacity-100" />
      {rect && (
        <PopupPortal>
          <div
            className="fixed z-[1200] bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none normal-case font-normal"
            style={{
              top: rect.bottom + 8,
              left: Math.min(Math.max(rect.left - 90, 12), window.innerWidth - 232),
              width: "220px",
            }}
          >
            {text}
          </div>
        </PopupPortal>
      )}
    </span>
  );
};

// ─── Reorderable column definitions ────────────────────────────────────────
// These are the columns that live *between* the pinned "Business Name" (always
// first) and "Actions" (always last) columns. Users can drag these to reorder
// them; the array below is only the default/fallback order.
const DEFAULT_COLUMN_ORDER = [
  "bigScore", "match", "fundingStage", "fundingRequired", "status", "applied",
  "daysInStage", "lastActivity", "location", "sector", "equity", "guarantees",
  "support", "services"
];

const COLUMN_DEFS = {
  bigScore: { label: "BIG Score", align: "center", minWidth: "100px", sortKey: "bigScore", filterType: "bigScore", tooltip: "BIG Score measures SME credibility and readiness — compliance, legitimacy, fundability, PIS, and leadership." },
  match: { label: "Match %", align: "center", minWidth: "110px", sortKey: "matchPercentage", tooltip: "Match Score measures programme fit — alignment with this programme's mandate and criteria." },
  fundingStage: { label: "Funding Stage", align: "left", filterType: "fundingStage" },
  fundingRequired: { label: "Funding", align: "left", sortKey: "fundingAmount" },
  status: { label: "Status", align: "left", filterType: "status" },
  applied: { label: "Applied", align: "left", sortKey: "applicationDateRaw" },
  daysInStage: { label: "Days in Stage", align: "left", sortKey: "daysInStage" },
  lastActivity: { label: "Last Activity", align: "left" },
  location: { label: "Location", align: "left" },
  sector: { label: "Sector", align: "left", filterType: "sector" },
  equity: { label: "Equity", align: "left" },
  guarantees: { label: "Guarantees", align: "left" },
  support: { label: "Support", align: "left" },
  services: { label: "Services", align: "left" }
};

// Maps a column key (used for visibility/order) to the actual field name on
// the mapped SME row object — these don't always match (e.g. the "sme"
// column shows the `name` field, "match" shows `matchPercentage`).
const EXPORT_FIELD_MAP = {
  sme: "name",
  bigScore: "bigScore",
  match: "matchPercentage",
  fundingStage: "fundingStage",
  fundingRequired: "fundingRequired",
  status: "currentStatus",
  applied: "applicationDate",
  location: "location",
  sector: "sector",
  equity: "equityOffered",
  guarantees: "guarantees",
  support: "supportRequired",
  services: "servicesRequired",
  daysInStage: "daysInStage",
  lastActivity: "lastActivity",
  notes: "notes",
  assignedUser: "assignedUser"
  // Note: "action" is intentionally omitted — it's a UI-only column
  // (the stage-advance button), not a data field on the SME row.
};

const EXPORT_HEADERS = {
  sme: "Business Name", bigScore: "BIG Score", match: "Match %",
  fundingStage: "Funding Stage", fundingRequired: "Funding Required",
  status: "Status", applied: "Applied Date", location: "Location",
  sector: "Sector", equity: "Equity Offered", guarantees: "Guarantees",
  support: "Support Required", services: "Services Required",
  daysInStage: "Days in Stage", lastActivity: "Last Activity",
  notes: "Notes", assignedUser: "Assigned User"
};

// ─── Custom Views ───────────────────────────────────────────────────────────
// A "view" bundles every layout preference a person can customize — column
// visibility, column order, sort, and density — into one named, describable
// object, with exactly one view "active" at a time. Editing the table always
// edits the active view; there's no separate hidden "current layout" that
// can silently drift out of sync with whatever view you think you're on.
// That drift (edit while a saved view is loaded, then have the view reload
// later and wipe those edits) was the source of columns appearing to
// "randomly" rearrange or vanish.
const DEFAULT_COLUMN_VISIBILITY = {
  sme: true, bigScore: true, match: true, fundingStage: true,
  fundingRequired: true, status: true, applied: true, action: true,
  location: false, sector: false, equity: false, guarantees: false,
  support: false, services: false, notes: false, assignedUser: false,
  daysInStage: true, lastActivity: true
};
const DEFAULT_SORT_CONFIG = { key: 'attentionThenScore', direction: 'desc' };
const DEFAULT_DENSITY = 'comfortable';

const BUILTIN_VIEW_ID = "__default__";
const VIEWS_STORAGE_KEY = "sme-table-views-v2";

// Keeps a stored column order valid against the columns this build of the
// table actually knows about: drops keys that no longer exist, and appends
// any newly-introduced columns (hidden by default) so a future column
// addition can't silently corrupt an old saved view's header row.
const sanitizeColumnOrder = (order) => {
  if (!Array.isArray(order)) return [...DEFAULT_COLUMN_ORDER];
  const known = new Set(DEFAULT_COLUMN_ORDER);
  const deduped = order.filter((key) => known.has(key));
  const missing = DEFAULT_COLUMN_ORDER.filter((key) => !deduped.includes(key));
  return [...deduped, ...missing];
};

const createDefaultViewLayout = () => ({
  columnVisibility: { ...DEFAULT_COLUMN_VISIBILITY },
  columnOrder: [...DEFAULT_COLUMN_ORDER],
  sortConfig: { ...DEFAULT_SORT_CONFIG },
  density: DEFAULT_DENSITY,
});

const createBuiltinDefaultView = () => ({
  id: BUILTIN_VIEW_ID,
  name: "Default",
  description: "",
  builtin: true,
  ...createDefaultViewLayout(),
});

// Defends against a stored view missing fields (older schema, partial
// write, etc.) by filling in safe defaults rather than letting a column set
// come out blank.
const sanitizeView = (view, fallbackId) => ({
  id: view?.id || fallbackId,
  name: (view?.name || "Untitled view").toString(),
  description: (view?.description || "").toString(),
  builtin: !!view?.builtin,
  columnVisibility: { ...DEFAULT_COLUMN_VISIBILITY, ...(view?.columnVisibility || {}) },
  columnOrder: sanitizeColumnOrder(view?.columnOrder),
  sortConfig: view?.sortConfig?.key ? view.sortConfig : { ...DEFAULT_SORT_CONFIG },
  density: view?.density || DEFAULT_DENSITY,
});

const loadViewsState = () => {
  const freshDefault = () => ({ activeViewId: BUILTIN_VIEW_ID, views: { [BUILTIN_VIEW_ID]: createBuiltinDefaultView() } });
  if (typeof window === "undefined") return freshDefault();
  try {
    const saved = JSON.parse(window.localStorage.getItem(VIEWS_STORAGE_KEY) || "null");
    const rawViews = saved?.views && typeof saved.views === "object" ? saved.views : {};
    const views = {};
    Object.entries(rawViews).forEach(([id, v]) => { views[id] = sanitizeView(v, id); });
    // The builtin Default view must always exist and keep its identity,
    // even on first load or if it was somehow dropped from storage.
    views[BUILTIN_VIEW_ID] = views[BUILTIN_VIEW_ID]
      ? { ...views[BUILTIN_VIEW_ID], id: BUILTIN_VIEW_ID, name: "Default", builtin: true }
      : createBuiltinDefaultView();
    const activeViewId = saved?.activeViewId && views[saved.activeViewId] ? saved.activeViewId : BUILTIN_VIEW_ID;
    return { activeViewId, views };
  } catch {
    return freshDefault();
  }
};

const persistViewsState = (state) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can fail (private browsing, quota) — the table still works
    // for the current session, it just won't persist across reloads.
  }
};

const generateViewId = () => {
  try {
    return `view_${crypto.randomUUID()}`;
  } catch {
    return `view_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
export function SupportSMETable({ filters, stageFilter, onSMEsLoaded, onStageOverride }) {
  const [smes, setSmes] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // ─── Views ──────────────────────────────────────────────────────────────
  // viewsState = { activeViewId, views: { [id]: {id,name,description,builtin,
  // columnVisibility,columnOrder,sortConfig,density} } }. The four "live"
  // pieces below (columnVisibility/columnOrder/sortConfig/density) are what
  // the rest of the table actually reads/renders from; they're initialized
  // from the active view and, via the effect further down, auto-saved back
  // into that same view on every change. Switching views is the only thing
  // that reassigns them from a *different* view's stored layout.
  const [viewsState, setViewsState] = useState(() => loadViewsState());
  const initialActiveView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID];
  const [columnVisibility, setColumnVisibility] = useState(() => initialActiveView.columnVisibility);
  const [columnOrder, setColumnOrder] = useState(() => initialActiveView.columnOrder);
  const [sortConfig, setSortConfig] = useState(() => initialActiveView.sortConfig);
  const [density, setDensity] = useState(() => initialActiveView.density);

  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [columnChooserRect, setColumnChooserRect] = useState(null);
  const [showViewsMenu, setShowViewsMenu] = useState(false);
  const [viewsMenuRect, setViewsMenuRect] = useState(null);
  const [showNewViewForm, setShowNewViewForm] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [newViewDescription, setNewViewDescription] = useState("");
  const [editingViewMeta, setEditingViewMeta] = useState(null); // { id, name, description } while renaming/describing an existing view

  const [headerFilterOpen, setHeaderFilterOpen] = useState(null);
  const [localFilters, setLocalFilters] = useState({
    name: '', fundingStage: [], bigScoreRange: [0, 100], status: [], sector: []
  });
  const [notification, setNotification] = useState(null);
  const [hoveredRowKey, setHoveredRowKey] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sentNDAs, setSentNDAs] = useState({});
  const [isNDASharing, setIsNDASharing] = useState({});
  const [updatedStages, setUpdatedStages] = useState({});

  // Column drag-to-reorder state
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragHintRect, setDragHintRect] = useState(null);

  // Popup states
  const [activePopup, setActivePopup] = useState(null);
  const [selectedSMEForPopup, setSelectedSMEForPopup] = useState(null);
  const [showSMEDetails, setShowSMEDetails] = useState(false);
  const [selectedSMEDetails, setSelectedSMEDetails] = useState(null);
  const [bigScoreData, setBigScoreData] = useState({
    compliance: { score: 0 }, legitimacy: { score: 0 },
    fundability: { score: 0 }, pis: { score: 0 }, leadership: { score: 0 }
  });
  const [matchBreakdownData, setMatchBreakdownData] = useState(null);
  const [stageUpdateData, setStageUpdateData] = useState({
    nextStage: "", message: "", meetingTime: "", meetingLocation: "", meetingPurpose: "", termSheetFile: null
  });
  const [stageFormErrors, setStageFormErrors] = useState({});
  const [isStageSubmitting, setIsStageSubmitting] = useState(false);
  const [availabilities, setAvailabilities] = useState([]);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [tempDates, setTempDates] = useState([]);
  const [timeSlot, setTimeSlot] = useState({ start: "09:00", end: "17:00" });
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const { enriched, catalystFormData, loading } = usePortfolio();

  // ─── Programme-aware pipeline stages ───────────────────────────────────────
  // The pipeline settings (which programme template is active, plus any
  // admin customization — renames/hidden/reordered/custom stages) live in
  // the same shared localStorage key that SupportDealFlowPipeline.jsx writes
  // to. We read them here so the table's stage list always matches whatever
  // programme is actually selected, instead of being permanently locked to
  // the BIG default stages.
  const [pipelineSettings, setPipelineSettings] = useState(() => loadPipelineSettings());

  useEffect(() => {
    const refreshPipelineSettings = () => setPipelineSettings(loadPipelineSettings());
    // 'storage' fires when another tab/window changes the settings;
    // PIPELINE_SETTINGS_EVENT fires when this same tab changes them (e.g. the
    // catalyst edits the pipeline programme type/stages and switches back to
    // this table without a full page reload); 'focus' is a cheap safety net
    // for either case.
    window.addEventListener("storage", refreshPipelineSettings);
    window.addEventListener(PIPELINE_SETTINGS_EVENT, refreshPipelineSettings);
    window.addEventListener("focus", refreshPipelineSettings);
    return () => {
      window.removeEventListener("storage", refreshPipelineSettings);
      window.removeEventListener(PIPELINE_SETTINGS_EVENT, refreshPipelineSettings);
      window.removeEventListener("focus", refreshPipelineSettings);
    };
  }, []);

  const activeProgrammeLabel = (PROGRAMME_TEMPLATES[pipelineSettings.programmeType] || PROGRAMME_TEMPLATES.default).label;
  const activeStages = useMemo(
    () => getActiveStages(pipelineSettings),
    [pipelineSettings]
  );

  // The currently active view, derived straight from viewsState — this is
  // what the UI displays as "you're editing X". Falls back to the builtin
  // Default view defensively (should never actually be missing).
  const activeView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID];

  // Auto-save: any edit to columns/order/sort/density writes straight back
  // into the active view (and persists immediately) — there's no separate
  // "unsaved changes" state to lose track of, and no way for a view to
  // silently go stale relative to what's on screen.
  useEffect(() => {
    setViewsState(prev => {
      const current = prev.views[prev.activeViewId];
      if (!current) return prev;
      const updated = { ...current, columnVisibility, columnOrder, sortConfig, density };
      const next = { ...prev, views: { ...prev.views, [prev.activeViewId]: updated } };
      persistViewsState(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibility, columnOrder, sortConfig, density]);

  // Switch the active view: loads that view's layout into the live state
  // (which then drives everything else in the table) and marks it active.
  const switchToView = (viewId) => {
    const target = viewsState.views[viewId];
    if (!target) return;
    setViewsState(prev => {
      const next = { ...prev, activeViewId: viewId };
      persistViewsState(next);
      return next;
    });
    setColumnVisibility(target.columnVisibility);
    setColumnOrder(target.columnOrder);
    setSortConfig(target.sortConfig);
    setDensity(target.density);
    setShowViewsMenu(false);
  };

  // Creates a new named (optionally described) view as a snapshot of
  // whatever the table currently looks like, and switches to it. This is
  // the only explicit "save" action left — everything else auto-saves.
  const createNewView = () => {
    const trimmedName = newViewName.trim();
    if (!trimmedName) return;
    const id = generateViewId();
    const newView = {
      id, name: trimmedName, description: newViewDescription.trim(), builtin: false,
      columnVisibility: { ...columnVisibility }, columnOrder: [...columnOrder],
      sortConfig: { ...sortConfig }, density,
    };
    setViewsState(prev => {
      const next = { activeViewId: id, views: { ...prev.views, [id]: newView } };
      persistViewsState(next);
      return next;
    });
    setNewViewName("");
    setNewViewDescription("");
    setShowNewViewForm(false);
    setNotification({ type: "success", message: `View "${trimmedName}" created` });
  };

  const startEditingViewMeta = (view) => setEditingViewMeta({ id: view.id, name: view.name, description: view.description, builtin: !!view.builtin });

  // Renames/redescribes an existing view without touching its layout. The
  // builtin Default view's name is protected (identity stays fixed), but
  // its description can still be edited like any other view's.
  const saveViewMeta = () => {
    if (!editingViewMeta) return;
    const trimmedName = editingViewMeta.name.trim();
    if (!trimmedName && !editingViewMeta.builtin) return;
    setViewsState(prev => {
      const existing = prev.views[editingViewMeta.id];
      if (!existing) return prev;
      const updated = {
        ...existing,
        name: existing.builtin ? existing.name : trimmedName,
        description: editingViewMeta.description.trim(),
      };
      const next = { ...prev, views: { ...prev.views, [editingViewMeta.id]: updated } };
      persistViewsState(next);
      return next;
    });
    setEditingViewMeta(null);
  };

  // Deletes a saved (non-builtin) view; if it was active, falls back to Default.
  const removeView = (viewId) => {
    if (viewId === BUILTIN_VIEW_ID) return;
    const wasActive = viewsState.activeViewId === viewId;
    setViewsState(prev => {
      const { [viewId]: _removed, ...restViews } = prev.views;
      const nextActiveId = prev.activeViewId === viewId ? BUILTIN_VIEW_ID : prev.activeViewId;
      const next = { activeViewId: nextActiveId, views: restViews };
      persistViewsState(next);
      return next;
    });
    if (wasActive) {
      const def = viewsState.views[BUILTIN_VIEW_ID];
      setColumnVisibility(def.columnVisibility);
      setColumnOrder(def.columnOrder);
      setSortConfig(def.sortConfig);
      setDensity(def.density);
    }
    setNotification({ type: "success", message: "View deleted" });
  };

  // Resets whichever view is currently active back to factory-default
  // columns/order/sort/density — without touching its name or description,
  // and without deleting it.
  const resetActiveViewToDefault = () => {
    const layout = createDefaultViewLayout();
    setColumnVisibility(layout.columnVisibility);
    setColumnOrder(layout.columnOrder);
    setSortConfig(layout.sortConfig);
    setDensity(layout.density);
    setNotification({ type: "success", message: `"${activeView.name}" reset to factory defaults` });
  };

  // ─── Data Processing ────────────────────────────────────────────────────────
  useEffect(() => {
    const mapRow = (a) => {
      const entity = a.profile?.entityOverview || {};
      const funding = a.profile?.useOfFunds || {};
      const financials = a.profile?.financialOverview || {};
      const multiProgram = enriched.filter((e) => e.smeId === a.smeId).length > 1;

      return {
        id: a.smeId, docId: a.docId, programIndex: a.programIndex,
        name: (entity.registeredName || a.smeName || "N/A") + (multiProgram ? ` (P${parseInt(a.programIndex || 0) + 1})` : ""),
        location: entity.location || a.location || "N/A",
        province: entity.province || a.province || "N/A",
        sector: (entity.economicSectors || []).join(", ") || a.sector || "N/A",
        fundingStage: entity.operationStage || a.fundingStage || "N/A",
        fundingRequired: formatCurrency(funding.amountRequested || a.fundingRequired || "N/A"),
        fundingAmount: parseFloat((funding.amountRequested || a.fundingRequired || "0").toString().replace(/[^0-9.]/g, "")) || 0,
        equityOffered: funding.equityType || a.equityOffered || "N/A",
        guarantees: a.guarantees || "N/A",
        supportRequired: a.supportRequired || "N/A",
        servicesRequired: a.servicesRequired || "N/A",
        applicationDate: a.applicationDate ? new Date(a.applicationDate).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
        applicationDateRaw: a.applicationDate ? new Date(a.applicationDate) : null,
        matchPercentage: a.matchPercentage || 0,
        bigScore: a.bigScore || 0,
        compliance: a.compliance || 0, legitimacy: a.legitimacy || 0,
        fundability: a.fundability || 0, pis: a.pis || 0, leadership: a.leadership || 0,
        currentStatus: a.pipelineStage || a.status || "Matched",
        pipelineStage: a.pipelineStage || a.status || "Matched",
        nextStage: a.nextStage || getNextStage(a.pipelineStage || a.status, activeStages),
        availableDates: a.availableDates || [],
        lastActivity: a.lastActivity || "N/A", daysInStage: a.daysInStage || 0,
        assignedUser: a.assignedUser || "Unassigned",
        notes: a.notes || "", documents: a.documents || [],
        matchBreakdown: a.matchBreakdown || null,
        userId: a.userId || a.smeId,
        email: a.email || entity.email || "N/A",
        director: entity.director || "N/A"
      };
    };

    let mapped = enriched.map(mapRow);

    if (stageFilter !== "admitted" && stageFilter !== "active") {
      mapped = mapped.filter((s) => mapStatusToStageId(s.pipelineStage, activeStages) !== "admitted");
    }

    if (stageFilter && stageFilter !== "initial") {
      const validIds = new Set([stageFilter]);
      mapped = mapped.filter((s) => validIds.has(mapStatusToStageId(s.pipelineStage, activeStages)));
    }

    mapped.sort((a, b) => b.bigScore - a.bigScore);
    setSmes(mapped);
    onSMEsLoaded?.(mapped);
  }, [enriched, stageFilter, catalystFormData, activeStages]);

  // ─── Filtering & Sorting ────────────────────────────────────────────────────
  const filteredAndSortedSMEs = useMemo(() => {
    let result = [...smes];

    if (localFilters.name?.trim()) {
      const query = localFilters.name.toLowerCase().trim();
      result = result.filter(sme => sme.name.toLowerCase().includes(query));
    }

    if (localFilters.fundingStage?.length > 0) {
      result = result.filter(sme => localFilters.fundingStage.some(stage => sme.fundingStage.toLowerCase().includes(stage.toLowerCase())));
    }

    result = result.filter(sme => sme.bigScore >= localFilters.bigScoreRange[0] && sme.bigScore <= localFilters.bigScoreRange[1]);

    if (localFilters.status?.length > 0) {
      result = result.filter(sme => localFilters.status.some(status => sme.currentStatus.toLowerCase().includes(status.toLowerCase())));
    }

    if (localFilters.sector?.length > 0) {
      result = result.filter(sme => localFilters.sector.some(sector => sme.sector.toLowerCase().includes(sector.toLowerCase())));
    }

    if (sortConfig.key === 'attentionThenScore') {
      result.sort((a, b) => {
        const aFlag = getAttentionReasons(a, activeStages).length > 0 ? 1 : 0;
        const bFlag = getAttentionReasons(b, activeStages).length > 0 ? 1 : 0;
        if (aFlag !== bFlag) return bFlag - aFlag;
        return b.bigScore - a.bigScore;
      });
    } else if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key], bVal = b[sortConfig.key];
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal == null) aVal = ''; if (bVal == null) bVal = '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [smes, sortConfig, localFilters, activeStages]);

  const totalPages = Math.ceil(filteredAndSortedSMEs.length / pageSize);
  const paginatedSMEs = filteredAndSortedSMEs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const sectorOptions = useMemo(
    () => [...new Set(smes.map((s) => s.sector).filter((s) => s && s !== "N/A"))].sort(),
    [smes]
  );

  const activeFilterCount = (localFilters.name?.trim() ? 1 : 0)
    + localFilters.fundingStage.length + localFilters.status.length + localFilters.sector.length
    + (localFilters.bigScoreRange[0] > 0 || localFilters.bigScoreRange[1] < 100 ? 1 : 0);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleSort = (key) => {
    setSortConfig(current => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const toggleColumn = (key) => setColumnVisibility(prev => ({ ...prev, [key]: !prev[key] }));

  const getFilterActive = (filterType) => {
    switch (filterType) {
      case 'bigScore': return localFilters.bigScoreRange[0] > 0 || localFilters.bigScoreRange[1] < 100;
      case 'fundingStage': return localFilters.fundingStage.length > 0;
      case 'status': return localFilters.status.length > 0;
      case 'sector': return localFilters.sector.length > 0;
      default: return false;
    }
  };

  // ─── Column drag-to-reorder ─────────────────────────────────────────────────
  const handleColumnDragStart = (e, key) => {
    setDraggedColumn(key);
    setDragHintRect(null);
    try {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', key);
    } catch {
      // Some browsers are picky about dataTransfer in certain contexts — safe to ignore
    }
  };

  const handleColumnDragOver = (e, key) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (key !== dragOverColumn) setDragOverColumn(key);
  };

  const handleColumnDrop = (e, key) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === key) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }
    setColumnOrder(prev => {
      const next = [...prev];
      const fromIdx = next.indexOf(draggedColumn);
      const toIdx = next.indexOf(key);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, draggedColumn);
      return next;
    });
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleColumnDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const openHeaderFilter = (type, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setHeaderFilterOpen(prev => (prev?.type === type ? null : { type, rect }));
  };
  const closeHeaderFilter = () => setHeaderFilterOpen(null);

  const FilterTrigger = ({ type, active }) => (
    <button
      type="button"
      onClick={(e) => openHeaderFilter(type, e)}
      className={`p-0.5 rounded transition-colors ${active ? "text-[#e6d7c3]" : "text-[#c8b6a6] hover:text-white"}`}
      title="Filter this column"
    >
      <SlidersHorizontal size={11} />
    </button>
  );

  const handleViewDetails = (sme) => {
    setSelectedSMEDetails(sme);
    setShowSMEDetails(true);
    setActivePopup(null);
  };

  const openPopup = (type, sme, rect) => {
    let popupWidth, popupHeight;
    switch (type) {
      case 'bigScore': popupWidth = 380; popupHeight = 450; break;
      case 'match': popupWidth = 380; popupHeight = 420; break;
      case 'stage': popupWidth = 450; popupHeight = 500; break;
      case 'quickActions': popupWidth = 200; popupHeight = 250; break;
      default: popupWidth = 300; popupHeight = 300;
    }

    let x = rect.left + (rect.width / 2) - (popupWidth / 2);
    let y = rect.bottom + 8;

    if (x + popupWidth > window.innerWidth - 20) x = window.innerWidth - popupWidth - 20;
    if (x < 20) x = 20;

    if (y + popupHeight > window.innerHeight - 20) {
      y = rect.top - popupHeight - 8;
    }
    if (y < 20) y = 20;

    setSelectedSMEForPopup(sme);
    setActivePopup({ type, smeKey: `${sme.id}_${sme.programIndex}`, position: { x, y }, rect });

    if (type === 'bigScore') {
      setBigScoreData({
        compliance: { score: sme.compliance || 0 }, legitimacy: { score: sme.legitimacy || 0 },
        fundability: { score: sme.fundability || 0 }, pis: { score: sme.pis || 0 },
        leadership: { score: sme.leadership || 0 }
      });
    }
    if (type === 'match') {
      if (sme.matchBreakdown) {
        setMatchBreakdownData(sme.matchBreakdown);
      } else {
        try {
          const contextEntry = enriched.find((a) => a.smeId === sme.id && a.programIndex === sme.programIndex);
          const programs = catalystFormData?.programmeDetails?.programs || [];
          const program = programs[parseInt(sme.programIndex || 0)] || programs[0] || null;
          if (program && contextEntry?.profile) {
            const result = calculateMatchScore(contextEntry.profile, catalystFormData, program);
            setMatchBreakdownData(result.breakdown);
          }
        } catch (err) {
          console.error("Error computing match breakdown:", err);
        }
      }
    }
    if (type === 'stage') {
      setStageUpdateData({
        nextStage: sme.nextStage || getNextStage(sme.currentStatus, activeStages),
        message: "", meetingTime: "", meetingLocation: "", meetingPurpose: "", termSheetFile: null
      });
      setStageFormErrors({});
      setAvailabilities(sme.availableDates || []);
    }
  };

  const openPopupFromEvent = (type, sme, event) => {
    event.stopPropagation();
    openPopup(type, sme, event.currentTarget.getBoundingClientRect());
  };

  const closePopup = () => {
    setActivePopup(null);
    setSelectedSMEForPopup(null);
    setMatchBreakdownData(null);
    setShowCalendarPopup(false);
  };

  const handleStageUpdate = async () => {
    const stageFields = getStageFields(stageUpdateData.nextStage, activeStages);
    const errors = {};
    if (!stageUpdateData.nextStage) errors.nextStage = "Please select a stage";
    if (stageFields.showMessage && !stageUpdateData.message.trim()) errors.message = "Please provide a message";
    if (Object.keys(errors).length > 0) { setStageFormErrors(errors); return; }

    setIsStageSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const smeId = selectedSMEForPopup.id;
      const programIndex = selectedSMEForPopup.programIndex || "0";
      const documentId = `${user.uid}_${smeId}_${programIndex}`;

      const updateData = {
        status: stageUpdateData.nextStage, pipelineStage: stageUpdateData.nextStage,
        nextStage: getNextStage(stageUpdateData.nextStage, activeStages),
        updatedAt: serverTimestamp(), lastMessage: stageUpdateData.message,
        lastActivity: new Date().toISOString()
      };

      if (stageFields.showMeeting && stageUpdateData.meetingLocation && stageUpdateData.meetingPurpose) {
        updateData.meetingDetails = {
          time: stageUpdateData.meetingTime, location: stageUpdateData.meetingLocation,
          purpose: stageUpdateData.meetingPurpose
        };
      }

      await updateDoc(doc(db, "catalystApplications", documentId), updateData);

      const stageKey = `${smeId}_${programIndex}`;
      setUpdatedStages(prev => ({ ...prev, [stageKey]: stageUpdateData.nextStage }));
      setSmes(prev => prev.map(s =>
        s.id === smeId && s.programIndex === programIndex
          ? { ...s, currentStatus: stageUpdateData.nextStage, pipelineStage: stageUpdateData.nextStage, nextStage: getNextStage(stageUpdateData.nextStage, activeStages) }
          : s
      ));

      setNotification({ type: "success", message: `Application updated to ${stageUpdateData.nextStage} successfully` });
      closePopup();
    } catch (error) {
      console.error("Stage update error:", error);
      setNotification({ type: "error", message: `Failed to update status: ${error.message}` });
    } finally {
      setIsStageSubmitting(false);
    }
  };

  const handleShareNDA = async (sme) => {
    const smeKey = `${sme.id}_${sme.programIndex}`;
    try {
      setIsNDASharing(prev => ({ ...prev, [smeKey]: true }));
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const ndaDocRef = doc(db, "ndas", user.uid);
      const ndaDoc = await getDoc(ndaDocRef);
      if (!ndaDoc.exists()) { setNotification({ type: "error", message: "No NDA found." }); return; }

      const ndaData = ndaDoc.data();
      if (!ndaData.pdfUrl) { setNotification({ type: "error", message: "NDA has no PDF URL." }); return; }

      const existingShareQuery = query(collection(db, "shared_nda"), where("catalystId", "==", user.uid), where("smeId", "==", sme.id), where("programIndex", "==", sme.programIndex));
      const existingShare = await getDocs(existingShareQuery);

      if (existingShare.empty) {
        await addDoc(collection(db, "shared_nda"), {
          catalystId: user.uid, smeId: sme.id, smeName: sme.name,
          ndaId: ndaDoc.id, ndaUrl: ndaData.pdfUrl, ndaName: ndaData.ndaContent || "NDA Document",
          sharedAt: serverTimestamp(), status: "sent", programIndex: sme.programIndex
        });
      }

      setSentNDAs(prev => ({ ...prev, [smeKey]: true }));
      setNotification({ type: "success", message: `NDA shared with ${sme.name}` });
      closePopup();
    } catch (error) {
      setNotification({ type: "error", message: `Failed to share NDA: ${error.message}` });
    } finally {
      setIsNDASharing(prev => ({ ...prev, [smeKey]: false }));
    }
  };

  const handleExport = () => {
    try {
      // Respect the table's current visual order: pinned "Business Name"
      // first, then the reorderable columns in whatever order the user has
      // dragged them into, skipping the UI-only "Action" column and any
      // hidden columns.
      const visibleCols = [
        "sme",
        ...columnOrder.filter((key) => key !== "sme" && key !== "action" && columnVisibility[key])
      ].filter((key) => columnVisibility[key] && EXPORT_FIELD_MAP[key]);

      if (visibleCols.length === 0) {
        setNotification({ type: "error", message: "No visible columns to export" });
        return;
      }
      if (filteredAndSortedSMEs.length === 0) {
        setNotification({ type: "error", message: "No businesses to export" });
        return;
      }

      const rows = filteredAndSortedSMEs.map((sme) => {
        const row = {};
        visibleCols.forEach((key) => {
          const field = EXPORT_FIELD_MAP[key];
          const label = EXPORT_HEADERS[key] || key;
          let value = sme[field];
          if (key === "match") value = value != null ? `${value}%` : "";
          if (value === null || value === undefined) value = "";
          row[label] = value;
        });
        return row;
      });

      const headerOrder = visibleCols.map((key) => EXPORT_HEADERS[key] || key);
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headerOrder });

      // Reasonable auto column widths based on header/content length so the
      // sheet doesn't open with everything squashed into narrow columns.
      worksheet["!cols"] = headerOrder.map((label, i) => {
        const key = visibleCols[i];
        const contentLengths = rows.map((r) => String(r[label] ?? "").length);
        const maxLen = Math.max(label.length, ...contentLengths, 8);
        return { wch: Math.min(maxLen + 2, 45) };
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Businesses");
      XLSX.writeFile(workbook, `business-export-${new Date().toISOString().split('T')[0]}.xlsx`);

      setNotification({ type: "success", message: "Export downloaded" });
    } catch (error) {
      console.error("Export error:", error);
      setNotification({ type: "error", message: `Export failed: ${error.message}` });
    }
  };

  // Match breakdown now carries a percentage per component
  const calculateMatchScore = (smeProfileData, catalystFormData, program = null) => {
    const breakdown = {
      fundingStage: { score: 0, maxScore: 12.5, matched: false, details: {} },
      ticketSize: { score: 0, maxScore: 12.5, matched: false, details: {} },
      geographicFit: { score: 0, maxScore: 12.5, matched: false, details: {} },
      sectorMatch: { score: 0, maxScore: 12.5, matched: false, details: {} },
      instrumentFit: { score: 0, maxScore: 12.5, matched: false, details: {} },
      supportMatch: { score: 0, maxScore: 12.5, matched: false, details: {} },
      legalEntityFit: { score: 0, maxScore: 12.5, matched: false, details: {} },
      revenueThreshold: { score: 0, maxScore: 12.5, matched: false, details: {} }
    };
    const programData = program || catalystFormData?.programmeDetails?.programs?.[0] || {};
    const matchPrefs = catalystFormData?.programBriefMatchingPreference || catalystFormData?.generalMatchingPreference || {};
    const entity = smeProfileData.entityOverview || {};
    const funding = smeProfileData.useOfFunds || {};

    const smeStage = (entity.operationStage || "").toLowerCase();
    const accelStages = Array.isArray(matchPrefs.businessLifecycleStage) ? matchPrefs.businessLifecycleStage.map(s => s.toLowerCase()) : matchPrefs.businessLifecycleStage ? [matchPrefs.businessLifecycleStage.toLowerCase()] : [];
    if (smeStage && accelStages.some(s => smeStage.includes(s) || s.includes(smeStage))) { breakdown.fundingStage.score = 12.5; breakdown.fundingStage.matched = true; }

    const smeAmount = parseFloat((funding.amountRequested || "0").toString().replace(/[^0-9.]/g, "")) || 0;
    const minTicket = parseFloat((programData.minimumSupport || "0").toString().replace(/[^0-9.]/g, "")) || 0;
    const maxTicket = parseFloat((programData.maximumSupport || "0").toString().replace(/[^0-9.]/g, "")) || Infinity;
    if (smeAmount >= minTicket && smeAmount <= maxTicket) { breakdown.ticketSize.score = 12.5; breakdown.ticketSize.matched = true; }

    const totalScore = Object.values(breakdown).reduce((sum, b) => sum + (b.score || 0), 0);
    return { score: Math.round(totalScore), breakdown };
  };


  const densityStyles = {
    'comfortable': { cell: 'py-3 px-3', header: 'py-3 px-3', fontSize: 'text-sm', avatarSize: 'w-8 h-8' },
    'compact': { cell: 'py-2 px-2', header: 'py-2 px-2', fontSize: 'text-xs', avatarSize: 'w-7 h-7' },
    'ultra-compact': { cell: 'py-1.5 px-1.5', header: 'py-1.5 px-1.5', fontSize: 'text-xs', avatarSize: 'w-6 h-6' }
  };
  const ds = densityStyles[density];

  useEffect(() => {
    const loadSentNDAs = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const snapshot = await getDocs(query(collection(db, "shared_nda"), where("catalystId", "==", user.uid), where("status", "==", "sent")));
        const sentMap = {};
        snapshot.docs.forEach(doc => { const data = doc.data(); sentMap[`${data.smeId}_${data.programIndex}`] = true; });
        setSentNDAs(sentMap);
      } catch (error) { console.error("Error loading sent NDAs:", error); }
    };
    if (auth.currentUser) loadSentNDAs();
  }, []);

  const handleDateSelect = (dates) => setTempDates(dates || []);
  const handleTimeChange = (field, value) => setTimeSlot(prev => ({ ...prev, [field]: value }));
  const removeAvailability = (date) => setAvailabilities(prev => prev.filter(a => a.date?.getTime?.() !== date?.getTime?.()));

  const saveSelectedDates = () => {
    const newAvailabilities = [
      ...availabilities,
      ...tempDates
        .filter(date => !availabilities.some(a => a.date?.getTime?.() === date.getTime?.()))
        .map(date => ({ date, timeSlots: [{ ...timeSlot }], timeZone, status: "available" }))
    ];
    setAvailabilities(newAvailabilities);
    setTempDates([]);
    setShowCalendarPopup(false);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-4 p-6">
      {notification && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${notification.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 text-current opacity-50 hover:opacity-100"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-[#faf7f2] rounded-t-2xl p-4 border border-[#e6d7c3] border-b-0 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#f5f0e1] text-[#7d5a50] border border-[#c8b6a6]" title="Determined by the pipeline's programme type setting">
              <Briefcase size={12} /> {activeProgrammeLabel} pipeline
            </span>
            {/* Always-visible active view name (+ description, if any) — no
                hover required, so it's never ambiguous which view is live. */}
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4a352f] border border-[#c8b6a6]">
              <LayoutGrid size={12} className="text-[#7d5a50] flex-shrink-0" />
              Viewing: {activeView.name}
              {activeView.description && (
                <span className="font-normal text-[#a89482]"> — {activeView.description}</span>
              )}
            </span>
            {activeFilterCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#fff3e0] text-[#e65100] border border-[#e65100]/30">
                <SlidersHorizontal size={12} /> {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">

            {/* ─── Views control ─────────────────────────────────────────── */}
            <div className="relative">
              <button
                onClick={(e) => {
                  if (showViewsMenu) {
                    setShowViewsMenu(false);
                    setViewsMenuRect(null);
                  } else {
                    setViewsMenuRect(e.currentTarget.getBoundingClientRect());
                    setShowViewsMenu(true);
                    setShowNewViewForm(false);
                    setEditingViewMeta(null);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all shadow-sm"
              >
                <LayoutGrid size={16} /> Views <ChevronDown size={14} className={`transition-transform ${showViewsMenu ? 'rotate-180' : ''}`} />
              </button>
              {showViewsMenu && viewsMenuRect && (() => {
                const panelWidth = 320;
                const margin = 12;
                let left = viewsMenuRect.right - panelWidth;
                left = Math.min(Math.max(left, margin), window.innerWidth - panelWidth - margin);
                const spaceBelow = window.innerHeight - viewsMenuRect.bottom - margin - 8;
                const spaceAbove = viewsMenuRect.top - margin - 8;
                const openUpward = spaceBelow < 320 && spaceAbove > spaceBelow;
                const maxHeight = Math.max(200, Math.min(480, openUpward ? spaceAbove : spaceBelow));
                const top = openUpward ? undefined : viewsMenuRect.bottom + 8;
                const bottom = openUpward ? window.innerHeight - viewsMenuRect.top + 8 : undefined;
                const allViews = Object.values(viewsState.views).sort((a, b) => (a.builtin ? -1 : b.builtin ? 1 : a.name.localeCompare(b.name)));
                return (
                  <PopupPortal>
                    <div className="fixed inset-0 z-40" onClick={() => { setShowViewsMenu(false); setViewsMenuRect(null); setShowNewViewForm(false); setEditingViewMeta(null); }} />
                    <div
                      className="fixed bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-4 z-50 overflow-y-auto"
                      style={{ left, width: panelWidth, top, bottom, maxHeight }}
                    >
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-1">Views</h4>
                      <p className="text-xs text-[#a89482] mb-3">Edits to columns, order, sort, and density auto-save into whichever view is selected.</p>

                      <div className="space-y-1 mb-3">
                        {allViews.map((view) => {
                          const isActive = view.id === viewsState.activeViewId;
                          const isEditing = editingViewMeta?.id === view.id;
                          if (isEditing) {
                            return (
                              <div key={view.id} className="p-2.5 rounded-lg border border-[#c8b6a6] bg-[#faf7f2] space-y-2">
                                {!view.builtin ? (
                                  <input
                                    autoFocus
                                    value={editingViewMeta.name}
                                    onChange={(e) => setEditingViewMeta(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="View name"
                                    className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm"
                                  />
                                ) : (
                                  <p className="text-sm font-semibold text-[#4a352f]">Default <span className="font-normal text-[#a89482] text-xs">(name can't be changed)</span></p>
                                )}
                                <textarea
                                  value={editingViewMeta.description}
                                  onChange={(e) => setEditingViewMeta(prev => ({ ...prev, description: e.target.value }))}
                                  placeholder="Description (optional) — what is this view for?"
                                  rows={2}
                                  className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => setEditingViewMeta(null)} className="px-2.5 py-1 text-xs text-[#7d5a50] hover:text-[#4a352f]">Cancel</button>
                                  <button onClick={saveViewMeta} className="px-2.5 py-1 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold">Save</button>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div key={view.id} className={`flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg ${isActive ? 'bg-[#f5f0e1]' : 'hover:bg-[#faf7f2]'}`}>
                              <button onClick={() => switchToView(view.id)} className="flex-1 text-left min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {isActive && <CheckCircle size={12} className="text-[#7d5a50] flex-shrink-0" />}
                                  <span className={`text-sm ${isActive ? 'font-semibold text-[#4a352f]' : 'text-[#4a352f]'}`}>{view.name}</span>
                                  {view.builtin && <span className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold">Built-in</span>}
                                </div>
                                {view.description && <p className="text-xs text-[#a89482] mt-0.5 truncate">{view.description}</p>}
                              </button>
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <button onClick={() => startEditingViewMeta(view)} title="Rename / edit description" className="text-[#a89482] hover:text-[#7d5a50] p-1">
                                  <Settings size={13} />
                                </button>
                                {!view.builtin && (
                                  <button onClick={() => removeView(view.id)} title="Delete view" className="text-[#a89482] hover:text-red-500 p-1">
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="border-t border-[#e6d7c3] pt-3">
                        {showNewViewForm ? (
                          <div className="space-y-2">
                            <input
                              autoFocus
                              value={newViewName}
                              onChange={(e) => setNewViewName(e.target.value)}
                              placeholder="New view name..."
                              className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm"
                            />
                            <textarea
                              value={newViewDescription}
                              onChange={(e) => setNewViewDescription(e.target.value)}
                              placeholder="Description (optional) — what is this view for?"
                              rows={2}
                              className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs resize-none"
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => { setShowNewViewForm(false); setNewViewName(""); setNewViewDescription(""); }} className="px-2.5 py-1 text-xs text-[#7d5a50] hover:text-[#4a352f]">Cancel</button>
                              <button onClick={createNewView} disabled={!newViewName.trim()} className="px-3 py-1.5 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold disabled:opacity-40">Create view</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setShowNewViewForm(true)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-[#c8b6a6] rounded-lg text-xs font-semibold text-[#7d5a50] hover:bg-[#faf7f2]">
                            <Plus size={13} /> New view from current layout
                          </button>
                        )}
                      </div>
                    </div>
                  </PopupPortal>
                );
              })()}
            </div>

            {/* ─── Columns control ────────────────────────────────────────── */}
            <div className="relative">
              <button
                onClick={(e) => {
                  if (showColumnChooser) {
                    setShowColumnChooser(false);
                    setColumnChooserRect(null);
                  } else {
                    setColumnChooserRect(e.currentTarget.getBoundingClientRect());
                    setShowColumnChooser(true);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all shadow-sm"
              >
                <SlidersHorizontal size={16} /> Columns <ChevronDown size={14} className={`transition-transform ${showColumnChooser ? 'rotate-180' : ''}`} />
              </button>
              {showColumnChooser && columnChooserRect && (() => {
                const panelWidth = 320;
                const margin = 12;
                let left = columnChooserRect.right - panelWidth;
                left = Math.min(Math.max(left, margin), window.innerWidth - panelWidth - margin);
                // Available vertical space below the button; fall back to opening upward if it's too tight.
                const spaceBelow = window.innerHeight - columnChooserRect.bottom - margin - 8;
                const spaceAbove = columnChooserRect.top - margin - 8;
                const openUpward = spaceBelow < 320 && spaceAbove > spaceBelow;
                const maxHeight = Math.max(200, Math.min(560, openUpward ? spaceAbove : spaceBelow));
                const top = openUpward ? undefined : columnChooserRect.bottom + 8;
                const bottom = openUpward ? window.innerHeight - columnChooserRect.top + 8 : undefined;
                return (
                  <PopupPortal>
                    <div className="fixed inset-0 z-40" onClick={() => { setShowColumnChooser(false); setColumnChooserRect(null); }} />
                    <div
                      className="fixed bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-5 z-50 overflow-y-auto"
                      style={{ left, width: panelWidth, top, bottom, maxHeight }}
                    >
                    <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Column Visibility</h4>
                    <p className="text-xs text-[#a89482] mb-3 flex items-center gap-1.5">
                      <GripVertical size={12} className="flex-shrink-0" /> Tip: drag any column header in the table to reorder it.
                    </p>
                    {[{ key: 'sme', label: 'Business Name' },{ key: 'bigScore', label: 'BIG Score' },{ key: 'match', label: 'Match %' },{ key: 'status', label: 'Status' },{ key: 'action', label: 'Action' }].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-3 py-2 px-2 rounded-lg opacity-75">
                        <input type="checkbox" checked={true} disabled={true} className="rounded border-[#c8b6a6]" />
                        <span className="text-sm text-[#4a352f]">{label}</span>
                      </label>
                    ))}
                    <div className="border-t border-[#e6d7c3] my-2" />
                    {[{ key: 'fundingStage', label: 'Funding Stage' },{ key: 'fundingRequired', label: 'Funding Required' },{ key: 'applied', label: 'Applied Date' },{ key: 'daysInStage', label: 'Days in Stage' },{ key: 'lastActivity', label: 'Last Activity' },{ key: 'location', label: 'Location' },{ key: 'sector', label: 'Sector' },{ key: 'equity', label: 'Equity Offered' },{ key: 'guarantees', label: 'Guarantees' },{ key: 'support', label: 'Support Required' },{ key: 'services', label: 'Services Required' }].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#faf7f2] cursor-pointer">
                        <input type="checkbox" checked={columnVisibility[key] || false} onChange={() => toggleColumn(key)} className="rounded border-[#c8b6a6] text-[#7d5a50]" />
                        <span className="text-sm text-[#4a352f]">{label}</span>
                      </label>
                    ))}

                    <div className="border-t border-[#e6d7c3] my-4" />
                    <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Density</h4>
                    <div className="flex gap-1.5 mb-1">
                      {[{ key: 'comfortable', label: 'Comfortable' }, { key: 'compact', label: 'Compact' }, { key: 'ultra-compact', label: 'Ultra Compact' }].map((d) => (
                        <button
                          key={d.key}
                          onClick={() => setDensity(d.key)}
                          className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${density === d.key ? 'bg-[#7d5a50] text-white' : 'bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]'}`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-[#e6d7c3] my-4" />
                    <button onClick={resetActiveViewToDefault} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#a67c52] hover:text-[#4a352f] hover:bg-[#faf7f2] border border-[#e6d7c3]">
                      <RotateCcw size={12} /> Reset "{activeView.name}" to factory defaults
                    </button>
                    </div>
                  </PopupPortal>
                );
              })()}
            </div>

            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#7d5a50] to-[#4a352f] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all shadow-sm" title="Export the currently filtered/sorted businesses to Excel (.xlsx)">
              <Download size={16} /> Export to Excel
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e6d7c3] shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8"><div className="space-y-4">{[...Array(8)].map((_, i) => (<div key={i} className="h-10 bg-shimmer-light rounded-lg animate-shimmer" />))}</div></div>
        ) : (
          <>
            <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
              <style>{`
                .smt-th { color: #faf7f2 !important; line-height: 1.1; font-size: 0.75rem !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; font-family: inherit !important; }
                .smt-th-btn { color: #faf7f2 !important; background: transparent; border: none; padding: 0; margin: 0; cursor: pointer; transition: color .15s ease; white-space: nowrap; font-size: inherit !important; font-weight: inherit !important; text-transform: inherit !important; letter-spacing: inherit !important; font-family: inherit !important; }
                .smt-th-btn:hover { color: #e6d7c3 !important; }
                .smt-th-draggable { cursor: grab; }
                .smt-th-draggable:active { cursor: grabbing; }
              `}</style>
              <table className="w-full border-collapse" style={{ minWidth: '960px' }}>
                <thead>
                  <tr className="bg-[#4a352f]">
                    <th className={`smt-th py-3 px-3 text-left font-semibold uppercase tracking-wider text-xs whitespace-nowrap border-r border-[#e6d7c3] sticky top-0 left-0 z-30`} style={{ backgroundColor: '#4a352f', minWidth: '220px', maxWidth: '260px' }}>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => handleSort('name')} className="smt-th-btn flex items-center gap-1">Business Name <span className="flex flex-col -space-y-1 opacity-60"><ArrowUp size={10} /><ArrowDown size={10} /></span></button>
                        <FilterTrigger type="name" active={!!localFilters.name.trim()} />
                      </div>
                    </th>

                    {/* ─── Reorderable columns ────────────────────────────── */}
                    {columnOrder.filter((key) => columnVisibility[key]).map((key) => {
                      const col = COLUMN_DEFS[key];
                      if (!col) return null;
                      const isDragging = draggedColumn === key;
                      const isDragOver = dragOverColumn === key && draggedColumn !== key;
                      return (
                        <th
                          key={key}
                          draggable
                          onDragStart={(e) => handleColumnDragStart(e, key)}
                          onDragOver={(e) => handleColumnDragOver(e, key)}
                          onDrop={(e) => handleColumnDrop(e, key)}
                          onDragEnd={handleColumnDragEnd}
                          onMouseEnter={(e) => setDragHintRect(e.currentTarget.getBoundingClientRect())}
                          onMouseLeave={() => setDragHintRect(null)}
                          className={`smt-th smt-th-draggable py-3 px-3 font-semibold uppercase tracking-wider text-xs whitespace-nowrap border-r border-[#e6d7c3] sticky top-0 z-20 select-none transition-opacity ${col.align === 'center' ? 'text-center' : 'text-left'} ${isDragging ? 'opacity-40' : ''}`}
                          style={{ minWidth: col.minWidth, backgroundColor: isDragOver ? '#5a423b' : '#4a352f' }}
                        >
                          <div className={`flex items-center gap-1 ${col.align === 'center' ? 'justify-center' : ''}`}>
                            <GripVertical size={11} className="opacity-40 flex-shrink-0" />
                            {col.sortKey ? (
                              <button type="button" onClick={() => handleSort(col.sortKey)} className="smt-th-btn flex items-center gap-1">
                                {col.label} <span className="flex flex-col -space-y-1 opacity-60"><ArrowUp size={10} /><ArrowDown size={10} /></span>
                              </button>
                            ) : (
                              <span>{col.label}</span>
                            )}
                            {col.filterType && <FilterTrigger type={col.filterType} active={getFilterActive(col.filterType)} />}
                            {col.tooltip && <HeaderInfoTooltip text={col.tooltip} />}
                          </div>
                        </th>
                      );
                    })}

                    {columnVisibility.action && <th className={`smt-th py-3 px-3 text-center font-semibold uppercase tracking-wider text-xs whitespace-nowrap sticky top-0 z-20`} style={{ minWidth: '190px', backgroundColor: '#4a352f' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedSMEs.length === 0 ? (
                    <tr><td colSpan={Object.values(columnVisibility).filter(Boolean).length + 1} className="text-center py-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-[#f5f0e1] flex items-center justify-center"><Users size={32} className="text-[#7d5a50] opacity-50" /></div>
                        <p className="text-lg font-semibold text-[#4a352f]">No Businesses Found</p>
                      </div>
                    </td></tr>
                  ) : (
                    paginatedSMEs.map((sme) => {
                      const bigScoreLabel = getBigScoreLabel(sme.bigScore);
                      const matchLabel = getMatchLabel(sme.matchPercentage);
                      const statusStyle = getStatusStyle(sme.currentStatus, activeStages);
                      const isTerminalNegative = /declined|withdrawn/i.test(statusStyle.stage.name || "");
                      const nextStageLabel = sme.nextStage || "—";
                      const smeKey = `${sme.id}_${sme.programIndex}`;
                      const currentStatus = updatedStages[smeKey] || sme.currentStatus;
                      const showNDAButton = mapStatusToStageId(currentStatus, activeStages) === "evaluation";
                      const ndaSent = sentNDAs[smeKey];
                      const attentionReasons = getAttentionReasons(sme, activeStages);

                      const renderCell = (key) => {
                        switch (key) {
                          case 'bigScore':
                            return (
                              <td key={key} className={`${ds.cell} text-center cursor-pointer border-r border-[#e6d7c3]`} onClick={(e) => openPopupFromEvent('bigScore', sme, e)}>
                                <div className="flex flex-col items-center gap-1">
                                  <div className="relative w-11 h-11">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                      <circle cx="18" cy="18" r="14" fill="none" stroke="#e6d7c3" strokeWidth="3" />
                                      <circle cx="18" cy="18" r="14" fill="none" stroke={bigScoreLabel.color} strokeWidth="3" strokeDasharray={`${sme.bigScore * 0.88} 88`} strokeLinecap="round" />
                                    </svg>
                                    <span className={`absolute inset-0 flex items-center justify-center ${ds.fontSize} font-normal`} style={{ color: bigScoreLabel.color }}>{sme.bigScore}</span>
                                  </div>
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${bigScoreLabel.color}20`, color: bigScoreLabel.color }}>{bigScoreLabel.label}</span>
                                </div>
                              </td>
                            );
                          case 'match':
                            return (
                              <td key={key} className={`${ds.cell} text-center cursor-pointer border-r border-[#e6d7c3]`} onClick={(e) => openPopupFromEvent('match', sme, e)}>
                                <div className="flex flex-col items-center gap-1 w-full max-w-[90px] mx-auto">
                                  <span className={`${ds.fontSize} font-normal text-[#4a352f]`}>{sme.matchPercentage}%</span>
                                  <span className="text-xs font-medium" style={{ color: matchLabel.color }}>{matchLabel.label}</span>
                                  <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${sme.matchPercentage}%`, backgroundColor: matchLabel.color }} />
                                  </div>
                                </div>
                              </td>
                            );
                          case 'fundingStage':
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f5f0e1] rounded-full text-xs font-medium">{sme.fundingStage}</span>
                              </td>
                            );
                          case 'fundingRequired':
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <span className="font-normal">{sme.fundingRequired}</span>
                              </td>
                            );
                          case 'status':
                            return (
                              <td key={key} className={`${ds.cell} border-r border-[#e6d7c3]`}>
                                <span
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
                                  style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, borderColor: statusStyle.border }}
                                  title={statusStyle.stage.tooltip}
                                >
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusStyle.dot }} />{statusStyle.stage.name}
                                </span>
                              </td>
                            );
                          case 'applied':
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <div className="flex items-center gap-1.5"><Calendar size={14} className="text-[#7d5a50]" />{sme.applicationDate}</div>
                              </td>
                            );
                          case 'daysInStage':
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <div className="flex items-center gap-1.5"><Clock size={14} className="text-[#7d5a50]" />{sme.daysInStage} days</div>
                              </td>
                            );
                          case 'lastActivity':
                            return <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>{sme.lastActivity}</td>;
                          case 'location':
                            return <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>{sme.location}</td>;
                          case 'sector':
                            return <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>{sme.sector}</td>;
                          case 'equity':
                            return <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>{sme.equityOffered}</td>;
                          case 'guarantees':
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <span className="line-clamp-1">{sme.guarantees}</span>
                              </td>
                            );
                          case 'support':
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <span className="line-clamp-1">{sme.supportRequired}</span>
                              </td>
                            );
                          case 'services':
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <span className="line-clamp-1">{sme.servicesRequired}</span>
                              </td>
                            );
                          default:
                            return null;
                        }
                      };

                      return (
                        <tr
                          key={smeKey}
                          className="border-b border-[#f0e6d9] transition-all"
                          style={{ backgroundColor: hoveredRowKey === smeKey ? '#fdf8f4' : undefined }}
                          onMouseEnter={() => setHoveredRowKey(smeKey)}
                          onMouseLeave={() => setHoveredRowKey(null)}
                        >
                          {columnVisibility.sme && (
                            <td
                              className={`${ds.cell} ${ds.fontSize} text-[#4a352f] sticky left-0 border-r border-b border-[#e6d7c3] z-10 transition-colors`}
                              style={{ minWidth: '220px', maxWidth: '260px', backgroundColor: hoveredRowKey === smeKey ? '#fdf8f4' : '#ffffff' }}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`${ds.avatarSize} rounded-full bg-gradient-to-br from-[#7d5a50] to-[#4a352f] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5`}>{sme.name.charAt(0)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-1.5 flex-wrap">
                                    <span className={`${ds.fontSize} font-normal leading-snug text-[#4a352f]`}>
                                      {sme.name}
                                    </span>
                                    <button
                                      onClick={() => handleViewDetails(sme)}
                                      className="text-[#a89482] hover:text-[#7d5a50] transition-colors flex-shrink-0 mt-0.5"
                                      aria-label={`View profile for ${sme.name}`}
                                      title="View profile"
                                    >
                                      <Eye size={13} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          )}

                          {columnOrder.filter((key) => columnVisibility[key]).map((key) => renderCell(key))}

                          {columnVisibility.action && (
                            <td className={`${ds.cell} text-center`} style={{ minWidth: '190px' }}>
                              <div className="flex flex-col items-center gap-1">
                                
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={(e) => { if (!isTerminalNegative) openPopupFromEvent('stage', sme, e); }}
                                    disabled={isTerminalNegative}
                                    title={isTerminalNegative ? `${statusStyle.stage.name} — no further stage` : `Move to ${nextStageLabel}`}
                                    className={`inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                                      isTerminalNegative
                                        ? "bg-[#e6d7c3]/60 text-[#a89482] cursor-not-allowed"
                                        : "text-white hover:shadow-md hover:brightness-105"
                                    }`}
                                    style={{ width: '128px', height: '34px', backgroundColor: isTerminalNegative ? undefined : "#7d5a50" }}
                                  >
                                    {!isTerminalNegative && <ArrowRight size={13} className="flex-shrink-0" />}
                                    <span className="truncate">{isTerminalNegative ? statusStyle.stage.name : nextStageLabel}</span>
                                  </button>
                                  <button
                                    onClick={(e) => openPopupFromEvent('quickActions', sme, e)}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all hover:bg-[#f5f0e1] flex-shrink-0"
                                    style={{ borderColor: "#7d5a5050", color: "#7d5a50" }}
                                    title="More actions"
                                  >
                                    <MoreVertical size={14} />
                                  </button>
                                </div>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#e6d7c3] bg-[#faf7f2] rounded-b-2xl">
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#4a352f]">Showing {Math.min((currentPage-1)*pageSize+1, filteredAndSortedSMEs.length)}-{Math.min(currentPage*pageSize, filteredAndSortedSMEs.length)} of {filteredAndSortedSMEs.length} Businesses</span>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f]">
                  <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage===1} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">First</button>
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">Prev</button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pn; if(totalPages<=5) pn=i+1; else if(currentPage<=3) pn=i+1; else if(currentPage>=totalPages-2) pn=totalPages-4+i; else pn=currentPage-2+i;
                  return <button key={pn} onClick={() => setCurrentPage(pn)} className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage===pn ? 'bg-[#7d5a50] text-white' : 'bg-white border border-[#c8b6a6] text-[#4a352f]'}`}>{pn}</button>;
                })}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">Next</button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage===totalPages} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">Last</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Drag-to-reorder hint tooltip ──────────────────────────────────── */}
      {dragHintRect && !draggedColumn && (
        <PopupPortal>
          <div
            className="fixed z-[1200] bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none normal-case font-normal flex items-center gap-1.5"
            style={{
              top: dragHintRect.bottom + 8,
              left: Math.min(Math.max(dragHintRect.left, 12), window.innerWidth - 200),
              width: '190px',
            }}
          >
            <GripVertical size={12} className="flex-shrink-0" /> Drag to reorder columns
          </div>
        </PopupPortal>
      )}

      {/* ─── Column header filter popover ───────────────────────────────────── */}
      {headerFilterOpen && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1090]" onClick={closeHeaderFilter} />
          <div
            className="fixed z-[1091] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-4"
            style={{
              top: headerFilterOpen.rect.bottom + 8,
              left: Math.min(Math.max(headerFilterOpen.rect.left - 20, 12), window.innerWidth - 292),
              width: '280px',
            }}
          >
            {headerFilterOpen.type === 'name' && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Filter by business name</label>
                  {localFilters.name && (
                    <button onClick={() => setLocalFilters(prev => ({ ...prev, name: '' }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <input
                  autoFocus
                  type="text"
                  value={localFilters.name}
                  onChange={(e) => { setLocalFilters(prev => ({ ...prev, name: e.target.value })); setCurrentPage(1); }}
                  placeholder="Search business name..."
                  className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20"
                />
              </>
            )}

            {headerFilterOpen.type === 'bigScore' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">BIG Score: {localFilters.bigScoreRange[0]} - {localFilters.bigScoreRange[1]}</label>
                  {(localFilters.bigScoreRange[0] > 0 || localFilters.bigScoreRange[1] < 100) && (
                    <button onClick={() => setLocalFilters(prev => ({ ...prev, bigScoreRange: [0, 100] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <input type="number" min="0" max="100" value={localFilters.bigScoreRange[0]} onChange={(e) => setLocalFilters(prev => ({ ...prev, bigScoreRange: [Math.min(parseInt(e.target.value) || 0, prev.bigScoreRange[1]), prev.bigScoreRange[1]] }))} className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                  <span className="text-[#7d5a50]">to</span>
                  <input type="number" min="0" max="100" value={localFilters.bigScoreRange[1]} onChange={(e) => setLocalFilters(prev => ({ ...prev, bigScoreRange: [prev.bigScoreRange[0], Math.max(parseInt(e.target.value) || 0, prev.bigScoreRange[0])] }))} className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                </div>
                <input type="range" min="0" max="100" value={localFilters.bigScoreRange[0]} onChange={(e) => setLocalFilters(prev => ({ ...prev, bigScoreRange: [parseInt(e.target.value), prev.bigScoreRange[1]] }))} className="w-full accent-[#7d5a50]" />
              </>
            )}

            {headerFilterOpen.type === 'status' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Status</label>
                  {localFilters.status.length > 0 && (
                    <button onClick={() => setLocalFilters(prev => ({ ...prev, status: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeStages.map(s => (
                    <button key={s.id} onClick={() => setLocalFilters(prev => ({ ...prev, status: prev.status.includes(s.name) ? prev.status.filter(x => x !== s.name) : [...prev.status, s.name] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.status.includes(s.name) ? 'bg-[#7d5a50] text-white' : 'bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]'}`}>{s.name}</button>
                  ))}
                </div>
              </>
            )}

            {headerFilterOpen.type === 'fundingStage' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Funding Stage</label>
                  {localFilters.fundingStage.length > 0 && (
                    <button onClick={() => setLocalFilters(prev => ({ ...prev, fundingStage: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Startup","Growth","Scale","Established"].map(s => (
                    <button key={s} onClick={() => setLocalFilters(prev => ({ ...prev, fundingStage: prev.fundingStage.includes(s) ? prev.fundingStage.filter(x => x !== s) : [...prev.fundingStage, s] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.fundingStage.includes(s) ? 'bg-[#7d5a50] text-white' : 'bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]'}`}>{s}</button>
                  ))}
                </div>
              </>
            )}

            {headerFilterOpen.type === 'sector' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Sector</label>
                  {localFilters.sector.length > 0 && (
                    <button onClick={() => setLocalFilters(prev => ({ ...prev, sector: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto">
                  {sectorOptions.length === 0 && <span className="text-xs text-[#a89482]">No sector data available</span>}
                  {sectorOptions.map(s => (
                    <button key={s} onClick={() => setLocalFilters(prev => ({ ...prev, sector: prev.sector.includes(s) ? prev.sector.filter(x => x !== s) : [...prev.sector, s] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.sector.includes(s) ? 'bg-[#7d5a50] text-white' : 'bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]'}`}>{s}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </PopupPortal>
      )}
      {activePopup?.type === 'bigScore' && selectedSMEForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden animate-fadeIn"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: '380px', maxHeight: '450px', overflowY: 'auto' }}>
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">BIG Score</p>
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[200px]">{selectedSMEForPopup.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center text-xl font-bold">{selectedSMEForPopup.bigScore}</div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1">
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {[{ key: 'compliance', label: 'Compliance', desc: 'Regulatory & legal standing' },
                { key: 'legitimacy', label: 'Legitimacy', desc: 'Business verification status' },
                { key: 'fundability', label: 'Fundability', desc: 'Investment readiness' },
                { key: 'pis', label: 'PIS Score', desc: 'Public Interest Score' },
                { key: 'leadership', label: 'Leadership', desc: 'Management capability' }
              ].map(({ key, label, desc }) => {
                const score = bigScoreData[key]?.score || 0;
                const lbl = getBigScoreLabel(score);
                return (
                  <div key={key} className="bg-[#faf7f2] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div><span className="text-xs font-semibold text-[#4a352f]">{label}</span><p className="text-[10px] text-[#7d5a50]">{desc}</p></div>
                      <span className="text-sm font-bold" style={{ color: lbl.color }}>{score}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#e6d7c3] rounded-full"><div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: lbl.color }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </PopupPortal>
      )}

      {/* ─── Match Breakdown Popup ─────────────────────────── */}
      {activePopup?.type === 'match' && selectedSMEForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden animate-fadeIn"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: '380px', maxHeight: '420px', overflowY: 'auto' }}>
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Why this match?</p>
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[200px]">{selectedSMEForPopup.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold">{selectedSMEForPopup.matchPercentage}%</div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1">
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {matchBreakdownData ? Object.entries(matchBreakdownData).map(([key, data]) => {
                if (!data || typeof data !== 'object') return null;
                const labels = { fundingStage: "Funding Stage", ticketSize: "Ticket Size", geographicFit: "Geographic Fit", sectorMatch: "Sector Match", instrumentFit: "Instrument Fit", supportMatch: "Support Match", legalEntityFit: "Legal Entity", revenueThreshold: "Revenue Threshold" };
                const pct = data.maxScore ? Math.round((data.score / data.maxScore) * 100) : 0;
                return (
                  <div key={key} className="p-3 rounded-lg border border-[#e6d7c3] bg-[#faf7f2] text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-[#4a352f]">{labels[key] || key}</span>
                      <span className="font-bold" style={{ color: data.matched ? "#22c55e" : "#ef4444" }}>{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: data.matched ? "#22c55e" : "#ef4444" }} />
                    </div>
                  </div>
                );
              }) : <p className="text-xs text-gray-500 text-center py-4">Loading breakdown...</p>}
            </div>
          </div>
        </PopupPortal>
      )}

      {/* ─── Stage Update Popup ───────────────────────────────────────────────── */}
      {activePopup?.type === 'stage' && selectedSMEForPopup && (() => {
        const stageFields = getStageFields(stageUpdateData.nextStage, activeStages);
        return (
          <PopupPortal>
            <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
            <div className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden animate-fadeIn"
              style={{ top: activePopup.position.y, left: activePopup.position.x, width: '450px', maxHeight: '550px', overflowY: 'auto' }}>
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Update Stage</p>
                    <h3 className="text-sm font-bold mt-0.5 truncate max-w-[300px]">{selectedSMEForPopup.name}</h3>
                  </div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1">Select Next Stage *</label>
                  <select value={stageUpdateData.nextStage} onChange={(e) => setStageUpdateData(prev => ({ ...prev, nextStage: e.target.value }))}
                    className={`w-full px-3 py-2 border-2 rounded-lg text-xs ${stageFormErrors.nextStage ? 'border-red-500' : 'border-[#c8b6a6]'}`}>
                    <option value="">Choose a stage...</option>
                    {activeStages.map(s => (<option key={s.id} value={s.name}>{s.name}</option>))}
                  </select>
                  {stageFormErrors.nextStage && <p className="text-red-500 text-xs mt-1">{stageFormErrors.nextStage}</p>}
                </div>

                {stageUpdateData.nextStage && (
                  <>
                    {stageFields.showMessage && (
                      <div>
                        <label className="block text-xs font-semibold text-[#4a352f] mb-1">Message to Business *</label>
                        <textarea value={stageUpdateData.message} onChange={(e) => setStageUpdateData(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Enter your message..." rows={3}
                          className={`w-full px-3 py-2 border-2 rounded-lg text-xs resize-y ${stageFormErrors.message ? 'border-red-500' : 'border-[#c8b6a6]'}`} />
                        {stageFormErrors.message && <p className="text-red-500 text-xs mt-1">{stageFormErrors.message}</p>}
                      </div>
                    )}

                    {stageFields.showMeeting && (
                      <div className="bg-[#faf7f2] rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-semibold text-[#4a352f] flex items-center gap-2"><Video size={14} /> Schedule Meeting <span className="font-normal text-[#7d5a50] normal-case">(optional)</span></h4>
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Meeting Time</label>
                          <input type="datetime-local" value={stageUpdateData.meetingTime} onChange={(e) => setStageUpdateData(prev => ({ ...prev, meetingTime: e.target.value }))}
                            className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-xs" />
                        </div>
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Location</label>
                          <input type="text" value={stageUpdateData.meetingLocation} onChange={(e) => setStageUpdateData(prev => ({ ...prev, meetingLocation: e.target.value }))}
                            placeholder="Office, Virtual, etc."
                            className="w-full px-3 py-2 border-2 rounded-lg text-xs border-[#c8b6a6]" />
                        </div>
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Purpose</label>
                          <input type="text" value={stageUpdateData.meetingPurpose} onChange={(e) => setStageUpdateData(prev => ({ ...prev, meetingPurpose: e.target.value }))}
                            placeholder="Initial discussion, strategy review, etc."
                            className="w-full px-3 py-2 border-2 rounded-lg text-xs border-[#c8b6a6]" />
                        </div>
                      </div>
                    )}

                    {stageFields.showAvailability && (
                      <div className="bg-[#faf7f2] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-semibold text-[#4a352f] flex items-center gap-2"><Calendar size={14} /> Your Availability</h4>
                          <button onClick={() => setShowCalendarPopup(true)} className="flex items-center gap-1 px-3 py-1.5 bg-[#7d5a50] text-white rounded-lg text-xs hover:bg-[#4a352f] transition-all">
                            <Calendar size={12} /> Add Dates
                          </button>
                        </div>
                        {availabilities.length > 0 ? (
                          <div className="space-y-2 max-h-[150px] overflow-y-auto">
                            {availabilities.map((a, i) => (
                              <div key={i} className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#e6d7c3]">
                                <div>
                                  <div className="text-xs font-medium text-[#4a352f]">
                                    {a.date?.toLocaleDateString?.('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) || 'N/A'}
                                  </div>
                                  {a.timeSlots?.[0] && (
                                    <div className="text-xs text-[#7d5a50]">{a.timeSlots[0].start} - {a.timeSlots[0].end}</div>
                                  )}
                                </div>
                                <button onClick={() => removeAvailability(a.date)} className="text-red-500 hover:text-red-700 p-1"><X size={14} /></button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#7d5a50] italic">No availability added yet</p>
                        )}
                      </div>
                    )}

                    {stageFields.showTermSheet && (
                      <div>
                        <label className="block text-xs font-semibold text-[#4a352f] mb-1">Programme Offer Document (PDF/DOC)</label>
                        <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setStageUpdateData(prev => ({ ...prev, termSheetFile: e.target.files[0] }))}
                          className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-xs" />
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={closePopup} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-all">Cancel</button>
                  <button onClick={handleStageUpdate} disabled={isStageSubmitting} className="px-4 py-2 bg-[#7d5a50] text-white rounded-lg text-xs font-medium hover:bg-[#4a352f] transition-all disabled:opacity-50">
                    {isStageSubmitting ? "Updating..." : "Update Stage"}
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Popup */}
            {showCalendarPopup && (
              <>
                <div className="fixed inset-0 z-[1100]" onClick={() => setShowCalendarPopup(false)} />
                <div className="fixed z-[1101] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-6 animate-fadeIn"
                  style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-[#4a352f]">Select Available Dates</h4>
                    <button onClick={() => setShowCalendarPopup(false)} className="text-[#7d5a50] hover:text-[#4a352f]"><X size={18} /></button>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-[#4a352f] mb-2">Time Slot</label>
                    <div className="flex gap-2">
                      <input type="time" value={timeSlot.start} onChange={(e) => handleTimeChange('start', e.target.value)} className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs" />
                      <span className="text-[#7d5a50]">to</span>
                      <input type="time" value={timeSlot.end} onChange={(e) => handleTimeChange('end', e.target.value)} className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <DayPicker mode="multiple" selected={tempDates} onSelect={handleDateSelect} fromDate={new Date()} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowCalendarPopup(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs">Cancel</button>
                    <button onClick={saveSelectedDates} disabled={tempDates.length === 0} className="px-4 py-2 bg-[#7d5a50] text-white rounded-lg text-xs disabled:opacity-50">Save Dates</button>
                  </div>
                </div>
              </>
            )}
          </PopupPortal>
        );
      })()}

      {/* ─── Quick Actions Popup ──────────────────────────────────────────────── */}
      {activePopup?.type === 'quickActions' && selectedSMEForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div className="fixed z-[1001] bg-white rounded-xl shadow-2xl border border-[#e6d7c3] py-1 overflow-hidden animate-fadeIn"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: '200px' }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#e6d7c3]">
              <span className="text-xs font-semibold text-[#4a352f]">Quick Actions</span>
              <button onClick={closePopup} className="text-[#7d5a50] hover:text-[#4a352f]"><X size={14} /></button>
            </div>
            <button onClick={() => { handleViewDetails(selectedSMEForPopup); closePopup(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><Eye size={12} /> View Profile</button>
            <button onClick={() => openPopup('bigScore', selectedSMEForPopup, activePopup.rect)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><BarChart3 size={12} /> BIG Score</button>
            <button onClick={() => openPopup('match', selectedSMEForPopup, activePopup.rect)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><Target size={12} /> Why This Match?</button>
            <button onClick={() => { setNotification({ type: "success", message: "Messaging coming soon" }); closePopup(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><MessageSquare size={12} /> Send Message</button>
            {mapStatusToStageId(selectedSMEForPopup.currentStatus, activeStages) === "evaluation" && !sentNDAs[`${selectedSMEForPopup.id}_${selectedSMEForPopup.programIndex}`] && (
              <button onClick={() => handleShareNDA(selectedSMEForPopup)} disabled={isNDASharing[`${selectedSMEForPopup.id}_${selectedSMEForPopup.programIndex}`]} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left disabled:opacity-50">
                <Share2 size={12} /> Share NDA
              </button>
            )}
          </div>
        </PopupPortal>
      )}

      {/* ─── Business Details Modal ────────────────────────────────────────────────── */}
      {showSMEDetails && selectedSMEDetails && (
        <SMEDetailsModal sme={selectedSMEDetails} isOpen={showSMEDetails} onClose={() => { setShowSMEDetails(false); setSelectedSMEDetails(null); }} />
      )}
    </div>
  );
}

// Default export added alongside the named export above so this component
// resolves correctly whether the importing file does
// `import SupportSMETable from "./SupportSMETable"` (default) or
// `import { SupportSMETable } from "./SupportSMETable"` (named).
export default SupportSMETable;