"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Info, MapPin, Calendar, Filter, X, Eye, BarChart3,
  ChevronDown, ChevronUp, MoreVertical, CheckCircle, XCircle,
  Clock, Users, DollarSign, Building,
  LayoutGrid, Download, MessageSquare,
  Share2, ArrowRight, SlidersHorizontal,
  RotateCcw, Settings, Target, Briefcase,
  Video, Link, LogOut, Trash2, Plus, GripVertical, ExternalLink
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


// Derives how many calendar days have elapsed since the stage was last
// updated, using the `updatedAt` field written by serverTimestamp().
// Handles three shapes the field can arrive in from Firestore:
//   • Firestore Timestamp object  → .toDate()
//   • Plain object { seconds, nanoseconds } → seconds * 1000
//   • Already a JS Date           → use directly
const calculateDaysInStage = (updatedAt) => {
  if (!updatedAt) return 0;
  let date;
  if (typeof updatedAt?.toDate === "function") {
    date = updatedAt.toDate();           // Firestore SDK Timestamp
  } else if (updatedAt?.seconds != null) {
    date = new Date(updatedAt.seconds * 1000); // serialised { seconds, nanoseconds }
  } else if (updatedAt instanceof Date) {
    date = updatedAt;
  } else {
    return 0;
  }
  const diffMs = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
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
  bigScore: { label: "BIG Score", align: "center", minWidth: "100px", filterType: "bigScore", tooltip: "BIG Score measures SME credibility and readiness — compliance, legitimacy, fundability, PIS, and leadership." },
  match: { label: "Match %", align: "center", minWidth: "110px", filterType: "match", tooltip: "Match Score measures programme fit — alignment with this programme's mandate and criteria." },
  fundingStage: { label: "Funding Stage", align: "left", minWidth: "94px", filterType: "fundingStage" },
  fundingRequired: { label: "Funding", align: "left", minWidth: "92px", filterType: "fundingRequired" },
  status: { label: "Status", align: "left", minWidth: "100px", filterType: "status" },
  applied: { label: "Applied", align: "left", minWidth: "92px", filterType: "applied" },
  daysInStage: { label: "Days in Stage", align: "left", minWidth: "134px", filterType: "daysInStage" },
  lastActivity: { label: "Last Activity", align: "left", minWidth: "108px", filterType: "lastActivity" },
  location: { label: "Location", align: "left", minWidth: "92px", filterType: "location" },
  sector: { label: "Sector", align: "left", minWidth: "100px", filterType: "sector" },
  equity: { label: "Equity", align: "left", minWidth: "92px", filterType: "equity" },
  guarantees: { label: "Guarantees", align: "left", minWidth: "100px", filterType: "guarantees" },
  support: { label: "Support", align: "left", minWidth: "92px", filterType: "support" },
  services: { label: "Services", align: "left", minWidth: "92px", filterType: "services" }
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
// visibility, column order, sort, density, and column widths — into one named,
// describable object, with exactly one view "active" at a time. Editing the
// table always edits the active view; there's no separate hidden "current
// layout" that can silently drift out of sync with whatever view you think
// you're on. That drift (edit while a saved view is loaded, then have the view
// reload later and wipe those edits) was the source of columns appearing to
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
  columnWidths: {},
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
  columnWidths: view?.columnWidths || {},
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
  // columnVisibility,columnOrder,sortConfig,density,columnWidths} } }. The
  // "live" pieces below are what the rest of the table actually
  // reads/renders from; they're initialized from the active view and, via the
  // effect further down, auto-saved back into that same view on every change.
  // Switching views is the only thing that reassigns them from a *different*
  // view's stored layout.
  const [viewsState, setViewsState] = useState(() => loadViewsState());
  const initialActiveView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID];
  const [columnVisibility, setColumnVisibility] = useState(() => initialActiveView.columnVisibility);
  const [columnOrder, setColumnOrder] = useState(() => initialActiveView.columnOrder);
  const [sortConfig, setSortConfig] = useState(() => initialActiveView.sortConfig);
  const [density, setDensity] = useState(() => initialActiveView.density);
  const [columnWidths, setColumnWidths] = useState(() => initialActiveView.columnWidths || {});

  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [columnChooserRect, setColumnChooserRect] = useState(null);
  const [showNewViewForm, setShowNewViewForm] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [newViewDescription, setNewViewDescription] = useState("");
  const [editingViewMeta, setEditingViewMeta] = useState(null); // { id, name, description } while renaming/describing an existing view
  const [bigScoreLoading, setBigScoreLoading] = useState(false);
  const [headerFilterOpen, setHeaderFilterOpen] = useState(null);
  const [localFilters, setLocalFilters] = useState({
    name: '', fundingStage: [], bigScoreRange: [0, 100], matchRange: [0, 100], status: [], sector: [], equity: [],
    fundingRequiredRange: [null, null], daysInStageRange: [null, null], appliedRange: [null, null],
    location: '', lastActivity: '', guarantees: '', support: '', services: ''
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
    fundability: { score: 0 }, governanceLeadership: { score: 0 }, operational: { score: 0 }
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

  // Auto-save: any edit to columns/order/sort/density/widths writes straight
  // back into the active view (and persists immediately) — there's no separate
  // "unsaved changes" state to lose track of, and no way for a view to
  // silently go stale relative to what's on screen.
  useEffect(() => {
    setViewsState(prev => {
      const current = prev.views[prev.activeViewId];
      if (!current) return prev;
      const updated = { ...current, columnVisibility, columnOrder, sortConfig, density, columnWidths };
      const next = { ...prev, views: { ...prev.views, [prev.activeViewId]: updated } };
      persistViewsState(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibility, columnOrder, sortConfig, density, columnWidths]);

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
    setColumnWidths(target.columnWidths || {});
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
      sortConfig: { ...sortConfig }, density, columnWidths: { ...columnWidths },
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
      setColumnWidths(def.columnWidths || {});
    }
    setNotification({ type: "success", message: "View deleted" });
  };

  // Resets whichever view is currently active back to factory-default
  // columns/order/sort/density/widths — without touching its name or
  // description, and without deleting it.
  const resetActiveViewToDefault = () => {
    const layout = createDefaultViewLayout();
    setColumnVisibility(layout.columnVisibility);
    setColumnOrder(layout.columnOrder);
    setSortConfig(layout.sortConfig);
    setDensity(layout.density);
    setColumnWidths(layout.columnWidths || {});
    setNotification({ type: "success", message: `"${activeView.name}" reset to factory defaults` });
  };

  // ─── Data mapping ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enriched) return;
    const mapped = enriched.map((item) => {
      const app = item.application || {};
      const profile = item.profile || {};
      const entity = profile.entityOverview || {};
      const overview = profile.applicationOverview || {};
      const funding = profile.useOfFunds || {};
      const evaluation = item.evaluation || {};
      const currentStatus = updatedStages[app.id] || app.pipelineStage || app.status || "Application Received";

      return {
        id: app.id,
        smeId: item.smeId,
        userId: item.smeId,
        name: entity.tradingName || entity.registeredName || app.smeName || "Unnamed SME",
        location: entity.location || "N/A",
        sector: (entity.economicSectors || []).join(", ") || "N/A",
        fundingStage: overview.fundingStage || entity.operationStage || "N/A",
        fundingRequired: formatCurrency(funding.amountRequested) || "N/A",
        fundingAmount: parseFloat((funding.amountRequested || "0").toString().replace(/[^0-9.]/g, "")) || 0,
        equityOffered: funding.equityOffered || "N/A",
        guarantees: funding.guarantees || "N/A",
        supportRequired: overview.supportRequired || "N/A",
        servicesRequired: overview.servicesRequired || "N/A",
        applicationDate: app.createdAt ? new Date(app.createdAt.seconds * 1000).toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
        applicationDateRaw: app.createdAt ? new Date(app.createdAt.seconds * 1000) : null,
        daysInStage: calculateDaysInStage(app.updatedAt),
        lastActivity: app.updatedAt ? new Date((app.updatedAt.seconds || 0) * 1000).toLocaleDateString("en-ZA", { month: "short", day: "numeric" }) : "N/A",
        matchPercentage: item.matchPercentage || 0,
        matchBreakdown: item.matchBreakdown || null,
        bigScore: evaluation.scores?.bigScore || 0,
        currentStatus,
        pipelineStage: currentStatus,
        nextStage: getNextStage(currentStatus, activeStages),
        pipelineHistory: app.pipelineHistory || [],
        documents: app.documentURLs || {},
        notes: app.notes || "",
        assignedUser: app.assignedUser || "Unassigned",
        raw: item,
      };
    });

    const filtered = stageFilter
      ? mapped.filter((s) => mapStatusToStageId(s.pipelineStage, activeStages) === stageFilter)
      : mapped;

    setSmes(filtered);
    onSMEsLoaded?.(filtered);
  }, [enriched, stageFilter, updatedStages, activeStages, onSMEsLoaded]);

  // ─── Filtering & Sorting ──────────────────────────────────────────────────
  const filteredAndSortedSMEs = useMemo(() => {
    let result = [...smes];

    if (localFilters.name?.trim()) {
      const q = localFilters.name.toLowerCase().trim();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (localFilters.fundingStage?.length > 0) {
      result = result.filter((s) => localFilters.fundingStage.some((st) => s.fundingStage.toLowerCase().includes(st.toLowerCase())));
    }
    result = result.filter((s) => s.bigScore >= localFilters.bigScoreRange[0] && s.bigScore <= localFilters.bigScoreRange[1]);
    result = result.filter((s) => s.matchPercentage >= localFilters.matchRange[0] && s.matchPercentage <= localFilters.matchRange[1]);

    if (localFilters.status?.length > 0) {
      result = result.filter((s) => {
        const stageName = getStatusStyle(s.currentStatus, activeStages).stage.name;
        return localFilters.status.includes(stageName);
      });
    }
    if (localFilters.sector?.length > 0) {
      result = result.filter((s) => localFilters.sector.some((sec) => s.sector.toLowerCase().includes(sec.toLowerCase())));
    }
    if (localFilters.equity?.length > 0) {
      result = result.filter((s) => localFilters.equity.some((e) => (s.equityOffered || "").toLowerCase().includes(e.toLowerCase())));
    }

    const [fundingMin, fundingMax] = localFilters.fundingRequiredRange;
    if (fundingMin != null) result = result.filter((s) => s.fundingAmount >= fundingMin);
    if (fundingMax != null) result = result.filter((s) => s.fundingAmount <= fundingMax);

    const [daysMin, daysMax] = localFilters.daysInStageRange;
    if (daysMin != null) result = result.filter((s) => (s.daysInStage || 0) >= daysMin);
    if (daysMax != null) result = result.filter((s) => (s.daysInStage || 0) <= daysMax);

    const [appliedFrom, appliedTo] = localFilters.appliedRange;
    if (appliedFrom) result = result.filter((s) => s.applicationDateRaw && s.applicationDateRaw >= new Date(appliedFrom));
    if (appliedTo) result = result.filter((s) => s.applicationDateRaw && s.applicationDateRaw <= new Date(new Date(appliedTo).setHours(23, 59, 59, 999)));

    const textFilter = (key, field) => {
      if (localFilters[key]?.trim()) {
        const q = localFilters[key].toLowerCase().trim();
        result = result.filter((s) => (s[field] || "").toString().toLowerCase().includes(q));
      }
    };
    textFilter("location", "location");
    textFilter("lastActivity", "lastActivity");
    textFilter("guarantees", "guarantees");
    textFilter("support", "supportRequired");
    textFilter("services", "servicesRequired");

    if (sortConfig.key === "attentionThenScore") {
      result.sort((a, b) => {
        const aFlag = getAttentionReasons(a, activeStages).length > 0 ? 1 : 0;
        const bFlag = getAttentionReasons(b, activeStages).length > 0 ? 1 : 0;
        if (aFlag !== bFlag) return bFlag - aFlag;
        return b.bigScore - a.bigScore;
      });
    } else if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key], bVal = b[sortConfig.key];
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();
        if (aVal == null) aVal = ""; if (bVal == null) bVal = "";
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [smes, sortConfig, localFilters, activeStages]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedSMEs.length / pageSize));
  const paginatedSMEs = filteredAndSortedSMEs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const sectorOptions = useMemo(
    () => [...new Set(smes.map((s) => s.sector).filter((s) => s && s !== "N/A"))].sort(),
    [smes]
  );
  const equityOptions = useMemo(
    () => [...new Set(smes.map((s) => s.equityOffered).filter((s) => s && s !== "N/A"))].sort(),
    [smes]
  );

  const activeFilterCount = (localFilters.name?.trim() ? 1 : 0)
    + localFilters.fundingStage.length + localFilters.status.length + localFilters.sector.length + localFilters.equity.length
    + (localFilters.bigScoreRange[0] > 0 || localFilters.bigScoreRange[1] < 100 ? 1 : 0)
    + (localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100 ? 1 : 0)
    + (localFilters.fundingRequiredRange[0] != null || localFilters.fundingRequiredRange[1] != null ? 1 : 0)
    + (localFilters.daysInStageRange[0] != null || localFilters.daysInStageRange[1] != null ? 1 : 0)
    + (localFilters.appliedRange[0] || localFilters.appliedRange[1] ? 1 : 0)
    + ["location", "lastActivity", "guarantees", "support", "services"]
      .filter((k) => localFilters[k]?.trim()).length;

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const toggleColumn = (key) => setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }));

  const getFilterActive = (filterType) => {
    switch (filterType) {
      case "bigScore": return localFilters.bigScoreRange[0] > 0 || localFilters.bigScoreRange[1] < 100;
      case "match": return localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100;
      case "fundingStage": return localFilters.fundingStage.length > 0;
      case "fundingRequired": return localFilters.fundingRequiredRange[0] != null || localFilters.fundingRequiredRange[1] != null;
      case "status": return localFilters.status.length > 0;
      case "applied": return !!(localFilters.appliedRange[0] || localFilters.appliedRange[1]);
      case "daysInStage": return localFilters.daysInStageRange[0] != null || localFilters.daysInStageRange[1] != null;
      case "sector": return localFilters.sector.length > 0;
      case "equity": return localFilters.equity.length > 0;
      default: return !!localFilters[filterType]?.toString().trim();
    }
  };

  // ─── Column drag-to-reorder ───────────────────────────────────────────────
  const handleColumnDragStart = (e, key) => {
    setDraggedColumn(key);
    setDragHintRect(null);
    try {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", key);
    } catch {
      // Some browsers are picky about dataTransfer in certain contexts.
    }
  };

  const handleColumnDragOver = (e, key) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (key !== dragOverColumn) setDragOverColumn(key);
  };

  const handleColumnDrop = (e, key) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === key) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }
    setColumnOrder((prev) => {
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
    setHeaderFilterOpen((prev) => (prev?.type === type ? null : { type, rect }));
  };
  const closeHeaderFilter = () => setHeaderFilterOpen(null);

  const FilterTrigger = ({ type, active }) => (
    <button
      type="button"
      onClick={(e) => openHeaderFilter(type, e)}
      className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${active ? 'text-[#e6d7c3]' : 'text-[#c8b6a6] hover:text-white'}`}
      title="Filter this column"
    >
      <SlidersHorizontal size={11} />
    </button>
  );

  const handleViewDetails = (sme) => {
    setSelectedSMEDetails(sme.raw);
    setShowSMEDetails(true);
    setActivePopup(null);
  };

  // ─── Popups ───────────────────────────────────────────────────────────────
  const openPopup = (type, sme, rect, options = {}) => {
    let popupWidth, popupHeight;
    switch (type) {
      case "bigScore": popupWidth = 380; popupHeight = 450; break;
      case "match": popupWidth = 380; popupHeight = 420; break;
      case "stage": popupWidth = 450; popupHeight = 550; break;
      case "quickActions": popupWidth = 210; popupHeight = 260; break;
      default: popupWidth = 300; popupHeight = 300;
    }

    let x = rect.left + (rect.width / 2) - (popupWidth / 2);
    let y = rect.bottom + 8;
    if (x + popupWidth > window.innerWidth - 20) x = window.innerWidth - popupWidth - 20;
    if (x < 20) x = 20;
    if (y + popupHeight > window.innerHeight - 20) y = rect.top - popupHeight - 8;
    if (y < 20) y = 20;

    setSelectedSMEForPopup(sme);
    setActivePopup({ type, smeKey: sme.id, position: { x, y }, rect });

    if (type === "bigScore") {
      setBigScoreLoading(true);
      setBigScoreData({
        compliance: { score: 0 }, legitimacy: { score: 0 },
        fundability: { score: 0 }, governanceLeadership: { score: 0 }, operational: { score: 0 }
      });
      getDoc(doc(db, "bigEvaluations", sme.smeId))
        .then((snap) => {
          if (snap.exists()) {
            const s = snap.data().scores || {};
            setBigScoreData({
              compliance: { score: s.compliance || 0 },
              legitimacy: { score: s.legitimacy || 0 },
              fundability: { score: s.fundability || 0 },
              governanceLeadership: { score: s.leadership || 0 },
              operational: { score: s.pis || 0 },
              _bigScore: s.bigScore || 0,
              _lastUpdated: s.lastUpdated || null,
            });
          }
        })
        .catch((err) => console.error("bigEvaluations fetch error:", err))
        .finally(() => setBigScoreLoading(false));
    }

    if (type === "match") {
      setMatchBreakdownData(sme.matchBreakdown || null);
    }

    if (type === "stage") {
      const presetStage = options.presetStage || sme.nextStage || getNextStage(sme.currentStatus, activeStages);
      setStageUpdateData({
        nextStage: presetStage,
        message: "", meetingTime: "", meetingLocation: "", meetingPurpose: "", termSheetFile: null,
      });
      setStageFormErrors({});
      setAvailabilities([]);
    }
  };

  const openPopupFromEvent = (type, sme, event, options) => {
    event.stopPropagation();
    openPopup(type, sme, event.currentTarget.getBoundingClientRect(), options);
  };

  const closePopup = () => {
    setActivePopup(null);
    setSelectedSMEForPopup(null);
    setMatchBreakdownData(null);
    setShowCalendarPopup(false);
  };

  // ─── Stage update ─────────────────────────────────────────────────────────
  const handleStageUpdate = async () => {
    const sme = selectedSMEForPopup;
    if (!sme) return;

    const stageFields = getStageFields(stageUpdateData.nextStage, activeStages);
    const targetId = mapStatusToStageId(stageUpdateData.nextStage, activeStages);
    const targetStage = activeStages.find((s) => s.id === targetId);

    const errors = {};
    if (!stageUpdateData.nextStage) errors.nextStage = "Please select a stage";
    if (stageFields.showMessage && !stageUpdateData.message.trim()) errors.message = "Please provide a message";
    if (stageFields.showMeeting) {
      if (!stageUpdateData.meetingLocation.trim()) errors.meetingLocation = "Please provide a meeting location";
      if (!stageUpdateData.meetingPurpose.trim()) errors.meetingPurpose = "Please provide a purpose for the meeting";
    }
    if (stageFields.showAvailability && availabilities.length === 0) {
      errors.availabilities = "Please add at least one available date";
    }

    if (Object.keys(errors).length > 0) { setStageFormErrors(errors); return; }

    setIsStageSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const stageName = targetStage?.name || stageUpdateData.nextStage;

      let attachmentUrl = null;
      if (stageUpdateData.termSheetFile) {
        const fileRef = ref(storage, `termsheets/${sme.id}/${stageUpdateData.termSheetFile.name}`);
        const snapshot = await uploadBytes(fileRef, stageUpdateData.termSheetFile);
        attachmentUrl = await getDownloadURL(snapshot.ref);
      }

      const availabilityData = availabilities.map((a) => ({
        date: a.date instanceof Date ? a.date.toISOString() : a.date,
        timeSlots: a.timeSlots,
        timeZone: a.timeZone,
        status: a.status || "available",
      }));

      const updateData = {
        status: stageName,
        pipelineStage: stageName,
        nextStage: getNextStage(stageName, activeStages),
        pipelineHistory: [...(sme.pipelineHistory || []), sme.currentStatus],
        updatedAt: serverTimestamp(),
        lastMessage: stageUpdateData.message,
      };

      if (stageFields.showMeeting) {
        updateData.meetingDetails = {
          time: stageUpdateData.meetingTime,
          location: stageUpdateData.meetingLocation,
          purpose: stageUpdateData.meetingPurpose,
        };
      }
      if (stageFields.showAvailability) updateData.availableDates = availabilityData;
      if (attachmentUrl) updateData.termsheetUrl = attachmentUrl;

      await updateDoc(doc(db, "supportApplications", sme.id), updateData);

      if (stageFields.showAvailability && availabilityData.length > 0) {
        await addDoc(collection(db, "smeCalendarEvents"), {
          smeId: sme.smeId,
          catalystId: user.uid,
          title: stageUpdateData.meetingPurpose || "Meeting",
          date: availabilityData[0].date,
          location: stageUpdateData.meetingLocation || "",
          type: "meeting",
          createdAt: new Date().toISOString(),
          availableDates: availabilityData,
        });
      }

      const subject = `${stageName}: ${sme.name}`;
      let content = `Dear ${sme.name},\n\nYour application has moved to "${stageName}".\n\n${stageUpdateData.message}\n`;
      if (stageFields.showMeeting) {
        content += `\nMeeting\nLocation: ${stageUpdateData.meetingLocation}\nPurpose: ${stageUpdateData.meetingPurpose}\n`;
      }
      if (stageFields.showAvailability && availabilities.length > 0) {
        content += `\nAvailable times:\n${availabilities.map((a, i) => {
          const dateStr = a.date instanceof Date
            ? a.date.toLocaleDateString("en-ZA", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
            : "Date unavailable";
          const timeStr = a.timeSlots?.[0] ? `${a.timeSlots[0].start} – ${a.timeSlots[0].end} ${a.timeZone}` : "Time not specified";
          return `${i + 1}. ${dateStr} (${timeStr})`;
        }).join("\n")}\n\nPlease RSVP on your calendar with your preferred time.\n`;
      }
      content += `\nBest regards,\nSupport Team`;

      const messagePayload = {
        to: sme.smeId,
        from: user.uid,
        subject,
        content,
        date: new Date().toISOString(),
        read: false,
        type: "inbox",
        applicationId: sme.id,
        attachments: attachmentUrl ? [attachmentUrl] : [],
        availableDates: stageFields.showAvailability ? availabilityData : null,
      };
      await Promise.all([
        addDoc(collection(db, "messages"), messagePayload),
        addDoc(collection(db, "messages"), { ...messagePayload, read: true, type: "sent" }),
      ]);

      setUpdatedStages((prev) => ({ ...prev, [sme.id]: stageName }));
      onStageOverride?.(sme.id, stageName);

      setNotification({ type: "success", message: `${sme.name} moved to ${stageName}` });
      closePopup();
    } catch (error) {
      console.error("Stage update error:", error);
      setNotification({ type: "error", message: `Failed to update stage: ${error.message}` });
    } finally {
      setIsStageSubmitting(false);
    }
  };

  // ─── NDA sharing ──────────────────────────────────────────────────────────
  const handleShareNDA = async (sme) => {
    if (sentNDAs[sme.id]) {
      setNotification({ type: "error", message: "NDA already sent to this SME" });
      return;
    }
    setIsNDASharing((prev) => ({ ...prev, [sme.id]: true }));
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const ndaUrl = catalystFormData?.ndaDocument || catalystFormData?.documents?.nda || null;
      if (!ndaUrl) {
        setNotification({ type: "error", message: "No NDA on file — upload one in your profile first" });
        return;
      }

      const messagePayload = {
        to: sme.smeId,
        from: user.uid,
        subject: `NDA for review: ${sme.name}`,
        content: `Dear ${sme.name},\n\nPlease find our NDA attached for your review and signature.\n\nBest regards,\nSupport Team`,
        date: new Date().toISOString(),
        read: false,
        type: "inbox",
        applicationId: sme.id,
        attachments: [ndaUrl],
      };
      await Promise.all([
        addDoc(collection(db, "messages"), messagePayload),
        addDoc(collection(db, "messages"), { ...messagePayload, read: true, type: "sent" }),
      ]);

      setSentNDAs((prev) => ({ ...prev, [sme.id]: true }));
      setNotification({ type: "success", message: `NDA sent to ${sme.name}` });
      closePopup();
    } catch (error) {
      console.error("NDA share error:", error);
      setNotification({ type: "error", message: `Failed to send NDA: ${error.message}` });
    } finally {
      setIsNDASharing((prev) => ({ ...prev, [sme.id]: false }));
    }
  };

  // ─── Export ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    try {
      // Respect the table's current visual order: pinned "Business Name"
      // first, then the reorderable columns in whatever order they've been
      // dragged into, skipping the UI-only "Action" column and hidden columns.
      const visibleCols = [
        "sme",
        ...columnOrder.filter((key) => key !== "sme" && key !== "action" && columnVisibility[key])
      ].filter((key) => columnVisibility[key] && EXPORT_FIELD_MAP[key]);

      if (visibleCols.length === 0) {
        setNotification({ type: "error", message: "No visible columns to export" });
        return;
      }
      if (filteredAndSortedSMEs.length === 0) {
        setNotification({ type: "error", message: "No SMEs to export" });
        return;
      }

      const rows = filteredAndSortedSMEs.map((sme) => {
        const row = {};
        visibleCols.forEach((key) => {
          const label = EXPORT_HEADERS[key] || key;
          let value = sme[EXPORT_FIELD_MAP[key]];
          if (key === "match") value = value != null ? `${value}%` : "";
          if (key === "status") value = getStatusStyle(sme.currentStatus, activeStages).stage.name;
          if (value === null || value === undefined) value = "";
          row[label] = value;
        });
        return row;
      });

      const headerOrder = visibleCols.map((key) => EXPORT_HEADERS[key] || key);
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headerOrder });

      worksheet["!cols"] = headerOrder.map((label) => {
        const contentLengths = rows.map((r) => String(r[label] ?? "").length);
        const maxLen = Math.max(label.length, ...contentLengths, 8);
        return { wch: Math.min(maxLen + 2, 45) };
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "SMEs");
      XLSX.writeFile(workbook, `sme-export-${new Date().toISOString().split("T")[0]}.xlsx`);
      setNotification({ type: "success", message: "Export downloaded" });
    } catch (error) {
      console.error("Export error:", error);
      setNotification({ type: "error", message: `Export failed: ${error.message}` });
    }
  };

  // ─── Availability helpers ─────────────────────────────────────────────────
  const handleDateSelect = (dates) => setTempDates(dates || []);
  const handleTimeChange = (field, value) => setTimeSlot((prev) => ({ ...prev, [field]: value }));
  const removeAvailability = (date) =>
    setAvailabilities((prev) => prev.filter((a) => a.date?.getTime?.() !== date?.getTime?.()));

  const saveSelectedDates = () => {
    setAvailabilities((prev) => ([
      ...prev,
      ...tempDates
        .filter((date) => !prev.some((a) => a.date?.getTime?.() === date.getTime?.()))
        .map((date) => ({ date, timeSlots: [{ ...timeSlot }], timeZone, status: "available" })),
    ]));
    setTempDates([]);
    setShowCalendarPopup(false);
  };

  const densityStyles = {
    comfortable: { cell: "py-3 px-3", header: "py-3 px-3", fontSize: "text-sm", avatarSize: "w-8 h-8" },
    compact: { cell: "py-2 px-2", header: "py-2 px-2", fontSize: "text-xs", avatarSize: "w-7 h-7" },
    'ultra-compact': { cell: "py-1.5 px-1.5", header: "py-1.5 px-1.5", fontSize: "text-xs", avatarSize: "w-6 h-6" },
  };
  const ds = densityStyles[density];

  // ─── Column resizing ──────────────────────────────────────────────────────
  // Drag the divider on a header's right edge to resize the column; double-click
  // it to snap that column back to auto width. Widths live in the active view
  // alongside visibility/order/sort/density, so they persist and travel with
  // whichever view is selected.
  const [resizingColumn, setResizingColumn] = useState(null);

  const widthStyle = (key, fallbackMin, fallbackMax) => {
    const w = columnWidths[key];
    if (w) return { width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` };
    return fallbackMax ? { minWidth: fallbackMin, maxWidth: fallbackMax } : { minWidth: fallbackMin };
  };

  const startResize = (event, key) => {
    event.preventDefault();
    event.stopPropagation();
    const th = event.currentTarget.closest("th");
    const startX = event.clientX;
    const startWidth = th ? th.getBoundingClientRect().width : 120;
    setResizingColumn(key);

    const onMove = (moveEvent) => {
      const next = Math.max(64, Math.round(startWidth + (moveEvent.clientX - startX)));
      setColumnWidths((prev) => ({ ...prev, [key]: next }));
    };
    const onUp = () => {
      setResizingColumn(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    // Held on <body> so the cursor doesn't flicker back as the pointer outruns
    // the 6px handle mid-drag, and so text can't be selected while resizing.
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const autoFitColumn = (key) =>
    setColumnWidths((prev) => { const { [key]: _dropped, ...rest } = prev; return rest; });

  const ColumnResizer = ({ colKey }) => (
    <span
      onMouseDown={(e) => startResize(e, colKey)}
      onDoubleClick={(e) => { e.stopPropagation(); autoFitColumn(colKey); }}
      onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onClick={(e) => e.stopPropagation()}
      title="Drag to resize · double-click to auto-fit"
      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none z-10"
      style={{ backgroundColor: resizingColumn === colKey ? "#a67c52" : "transparent" }}
    />
  );

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(t);
  }, [notification]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-4 p-6">
      {notification && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${notification.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
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
                <SlidersHorizontal size={12} /> {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">

            {/* ─── Customize Table (Views + Hide/Unhide + Density + Reset) ── */}
            <div className="relative">
              <button
                onClick={(e) => {
                  if (showColumnChooser) {
                    setShowColumnChooser(false);
                    setColumnChooserRect(null);
                  } else {
                    setColumnChooserRect(e.currentTarget.getBoundingClientRect());
                    setShowColumnChooser(true);
                    setShowNewViewForm(false);
                    setEditingViewMeta(null);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all shadow-sm"
              >
                <SlidersHorizontal size={16} /> Customize Table <ChevronDown size={14} className={`transition-transform ${showColumnChooser ? 'rotate-180' : ''}`} />
              </button>
              {showColumnChooser && columnChooserRect && (() => {
                const panelWidth = 320;
                const margin = 12;
                let left = columnChooserRect.right - panelWidth;
                left = Math.min(Math.max(left, margin), window.innerWidth - panelWidth - margin);
                const spaceBelow = window.innerHeight - columnChooserRect.bottom - margin - 8;
                const spaceAbove = columnChooserRect.top - margin - 8;
                const openUpward = spaceBelow < 320 && spaceAbove > spaceBelow;
                const maxHeight = Math.max(200, Math.min(620, openUpward ? spaceAbove : spaceBelow));
                const top = openUpward ? undefined : columnChooserRect.bottom + 8;
                const bottom = openUpward ? window.innerHeight - columnChooserRect.top + 8 : undefined;
                const allViews = Object.values(viewsState.views).sort((a, b) => (a.builtin ? -1 : b.builtin ? 1 : a.name.localeCompare(b.name)));
                return (
                  <PopupPortal>
                    <div className="fixed inset-0 z-40" onClick={() => { setShowColumnChooser(false); setColumnChooserRect(null); setShowNewViewForm(false); setEditingViewMeta(null); }} />
                    <div
                      className="fixed bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-5 z-50 overflow-y-auto"
                      style={{ left, width: panelWidth, top, bottom, maxHeight }}
                    >
                      {/* ─── Views ─────────────────────────────────────── */}
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-1">Views</h4>
                      <p className="text-xs text-[#a89482] mb-3">Edits below auto-save into whichever view is selected.</p>

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

                      {showNewViewForm ? (
                        <div className="space-y-2 mb-1">
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

                      <div className="border-t border-[#e6d7c3] my-4" />

                      {/* ─── Hide/Unhide ─────────────────────────────── */}
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Hide/Unhide</h4>
                      <p className="text-xs text-[#a89482] mb-3 flex items-center gap-1.5">
                        <GripVertical size={12} className="flex-shrink-0" /> Tip: drag a column header to reorder it, or pull its right edge to resize.
                      </p>
                      {[{ key: 'sme', label: 'Business Name' }, { key: 'bigScore', label: 'BIG Score' }, { key: 'match', label: 'Match %' }, { key: 'status', label: 'Status' }, { key: 'action', label: 'Action' }].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 py-2 px-2 rounded-lg opacity-75">
                          <input type="checkbox" checked readOnly disabled className="rounded border-[#c8b6a6]" />
                          <span className="text-sm text-[#4a352f]">{label}</span>
                        </label>
                      ))}
                      <div className="border-t border-[#e6d7c3] my-2" />
                      {[
                        { key: 'fundingStage', label: 'Funding Stage' }, { key: 'fundingRequired', label: 'Funding Required' },
                        { key: 'applied', label: 'Applied Date' }, { key: 'daysInStage', label: 'Days in Stage' },
                        { key: 'lastActivity', label: 'Last Activity' }, { key: 'location', label: 'Location' },
                        { key: 'sector', label: 'Sector' }, { key: 'equity', label: 'Equity Offered' },
                        { key: 'guarantees', label: 'Guarantees' }, { key: 'support', label: 'Support Required' },
                        { key: 'services', label: 'Services Required' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#faf7f2] cursor-pointer">
                          <input type="checkbox" checked={columnVisibility[key] || false} onChange={() => toggleColumn(key)} className="rounded border-[#c8b6a6] text-[#7d5a50]" />
                          <span className="text-sm text-[#4a352f]">{label}</span>
                        </label>
                      ))}

                      <div className="border-t border-[#e6d7c3] my-4" />
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Density</h4>
                      <div className="flex gap-1.5 mb-1">
                        {[{ key: 'comfortable', label: 'Comfortable' }, { key: 'compact', label: 'Compact' }, { key: 'ultra-compact', label: 'Ultra Compact' }].map(d => (
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

            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#7d5a50] to-[#4a352f] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all shadow-sm" title="Export the currently filtered/sorted SMEs to Excel (.xlsx)">
              <Download size={16} /> Export to Excel
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e6d7c3] shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8"><div className="space-y-4">{[...Array(8)].map((_, i) => (<div key={i} className="h-10 bg-[#f5f0e1] rounded-lg animate-pulse" />))}</div></div>
        ) : (
          <>
            <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
              <style>{`
                .smt-th { color: #faf7f2 !important; line-height: 1.1; font-size: 0.75rem !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; font-family: inherit !important; vertical-align: top !important; }
                .smt-th-draggable { cursor: grab; }
                .smt-th-draggable:active { cursor: grabbing; }
                /* Wrap header labels onto at most 2 lines instead of forcing
                   the column wider than needed. This only lays out cleanly
                   because each column also has a real min-width in
                   COLUMN_DEFS — without that floor, the browser sizes
                   wrapped-text columns to their smallest possible content. */
                .smt-th-label { flex: 1 1 auto; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; overflow-wrap: break-word; line-height: 1.2; }
                /* Column resizing: a dragged header width only holds if the
                   cells below it can shrink, so long values wrap rather than
                   setting a min-content width that forces the column back open. */
                .smt-fit th, .smt-fit td { overflow: hidden; }
                .smt-fit td { word-break: break-word; }
              `}</style>
              <table className="border-collapse smt-fit" style={{ tableLayout: 'auto' }}>
                <thead>
                  <tr className="bg-[#4a352f]">
                    <th className={`smt-th py-3 px-3 relative text-left font-semibold uppercase tracking-wider text-xs border-r border-[#e6d7c3] sticky top-0 left-0 z-30`} style={{ backgroundColor: '#4a352f', ...widthStyle('__name__', '170px', '190px') }}>
                      <div className="flex items-start gap-1 min-w-0">
                        <span className="smt-th-label">Business Name</span>
                        <FilterTrigger type="name" active={!!localFilters.name.trim()} />
                      </div>
                      <ColumnResizer colKey="__name__" />
                    </th>

                    {/* ─── Reorderable columns ────────────────────────── */}
                    {columnOrder.filter((key) => columnVisibility[key]).map((key) => {
                      const col = COLUMN_DEFS[key];
                      if (!col) return null;
                      const isDragging = draggedColumn === key;
                      const isDragOver = dragOverColumn === key && draggedColumn !== key;
                      return (
                        <th
                          key={key}
                          draggable={!resizingColumn}
                          onDragStart={(e) => handleColumnDragStart(e, key)}
                          onDragOver={(e) => handleColumnDragOver(e, key)}
                          onDrop={(e) => handleColumnDrop(e, key)}
                          onDragEnd={handleColumnDragEnd}
                          onMouseEnter={(e) => setDragHintRect(e.currentTarget.getBoundingClientRect())}
                          onMouseLeave={() => setDragHintRect(null)}
                          className={`smt-th smt-th-draggable py-3 px-3 relative font-semibold uppercase tracking-wider text-xs border-r border-[#e6d7c3] sticky top-0 z-20 select-none transition-opacity ${col.align === 'center' ? 'text-center' : 'text-left'} ${isDragging ? 'opacity-40' : ''}`}
                          style={{ ...widthStyle(key, col.minWidth), backgroundColor: isDragOver ? '#5a423b' : '#4a352f' }}
                        >
                          <div className={`flex items-start gap-1 min-w-0 ${col.align === 'center' ? 'justify-center' : ''}`}>
                            <GripVertical size={11} className="opacity-40 flex-shrink-0 mt-0.5" />
                            <span className="smt-th-label">{col.label}</span>
                            <FilterTrigger type={col.filterType} active={getFilterActive(col.filterType)} />
                            {col.tooltip && <HeaderInfoTooltip text={col.tooltip} />}
                          </div>
                          <ColumnResizer colKey={key} />
                        </th>
                      );
                    })}

                    {columnVisibility.action && (
                      <th className={`smt-th py-3 px-3 relative text-center font-semibold uppercase tracking-wider text-xs whitespace-nowrap sticky top-0 z-20`} style={{ ...widthStyle('action', '190px'), backgroundColor: '#4a352f' }}>
                        Actions
                        <ColumnResizer colKey="action" />
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedSMEs.length === 0 ? (
                    <tr><td colSpan={Object.values(columnVisibility).filter(Boolean).length + 1} className="text-center py-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-[#f5f0e1] flex items-center justify-center"><Users size={32} className="text-[#7d5a50] opacity-50" /></div>
                        <p className="text-lg font-semibold text-[#4a352f]">No SMEs Found</p>
                        <p className="text-sm text-[#7d5a50] max-w-xs">
                          {activeFilterCount > 0
                            ? "Clear a filter to widen the list."
                            : "SMEs matched to your programme will appear here once applications come in."}
                        </p>
                      </div>
                    </td></tr>
                  ) : (
                    paginatedSMEs.map((sme) => {
                      const smeKey = sme.id;
                      const bigScoreLabel = getBigScoreLabel(sme.bigScore);
                      const matchLabel = getMatchLabel(sme.matchPercentage);
                      const statusStyle = getStatusStyle(sme.currentStatus, activeStages);
                      const isTerminal = !!statusStyle.stage.terminal;
                      const nextStageLabel = sme.nextStage || "—";

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
                                <span className="line-clamp-2">{sme.fundingStage}</span>
                              </td>
                            );
                          case 'fundingRequired':
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] font-semibold border-r border-[#e6d7c3]`}>
                                {sme.fundingRequired}
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
                          case 'daysInStage': {
                            const days = sme.daysInStage || 0;
                            const color = days >= 14 ? '#ef4444' : days >= 7 ? '#f59e0b' : '#22c55e';
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} border-r border-[#e6d7c3]`}>
                                <div className="flex items-center gap-1.5" style={{ color }}>
                                  <Clock size={14} />
                                  <span className="font-semibold">{days} {days === 1 ? 'day' : 'days'}</span>
                                </div>
                              </td>
                            );
                          }
                          case 'lastActivity':
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                {sme.lastActivity}
                              </td>
                            );
                          case 'location':
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <div className="flex items-center gap-1.5"><MapPin size={14} className="text-[#7d5a50] flex-shrink-0" /><span className="line-clamp-2">{sme.location}</span></div>
                              </td>
                            );
                          case 'sector':
                          case 'equity':
                          case 'guarantees':
                          case 'support':
                          case 'services': {
                            const fieldMap = { sector: 'sector', equity: 'equityOffered', guarantees: 'guarantees', support: 'supportRequired', services: 'servicesRequired' };
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <span className="line-clamp-2">{sme[fieldMap[key]]}</span>
                              </td>
                            );
                          }
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
                              style={{ ...widthStyle('__name__', '170px', '190px'), backgroundColor: hoveredRowKey === smeKey ? '#fdf8f4' : '#ffffff' }}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`${ds.avatarSize} rounded-full bg-gradient-to-br from-[#7d5a50] to-[#4a352f] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5`}>{(sme.name || '?').charAt(0)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-1.5 flex-wrap">
                                    <span className={`${ds.fontSize} font-normal leading-snug text-[#4a352f]`}>{sme.name}</span>
                                    <button
                                      onClick={() => handleViewDetails(sme)}
                                      className="text-[#a89482] hover:text-[#7d5a50] transition-colors flex-shrink-0 mt-0.5"
                                      aria-label={`View details for ${sme.name}`}
                                      title="View details"
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
                            <td className={`${ds.cell} text-center`} style={widthStyle('action', '190px')}>
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={(e) => { if (!isTerminal) openPopupFromEvent('stage', sme, e); }}
                                  disabled={isTerminal}
                                  title={isTerminal ? `${statusStyle.stage.name} — no further stage` : `Move to ${nextStageLabel}`}
                                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                                    isTerminal
                                      ? 'bg-[#e6d7c3]/60 text-[#a89482] cursor-not-allowed'
                                      : 'text-white hover:shadow-md hover:brightness-105'
                                  }`}
                                  style={{ width: '128px', height: '34px', backgroundColor: isTerminal ? undefined : '#7d5a50' }}
                                >
                                  {!isTerminal && <ArrowRight size={13} className="flex-shrink-0" />}
                                  <span className="truncate">{isTerminal ? statusStyle.stage.name : nextStageLabel}</span>
                                </button>
                                <button
                                  onClick={(e) => openPopupFromEvent('quickActions', sme, e)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all hover:bg-[#f5f0e1] flex-shrink-0"
                                  style={{ borderColor: '#7d5a5050', color: '#7d5a50' }}
                                  title="More actions"
                                >
                                  <MoreVertical size={14} />
                                </button>
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
                <span className="text-sm text-[#4a352f]">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filteredAndSortedSMEs.length)}-{Math.min(currentPage * pageSize, filteredAndSortedSMEs.length)} of {filteredAndSortedSMEs.length} SMEs
                </span>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f]">
                  <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">First</button>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">Prev</button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pn;
                  if (totalPages <= 5) pn = i + 1;
                  else if (currentPage <= 3) pn = i + 1;
                  else if (currentPage >= totalPages - 2) pn = totalPages - 4 + i;
                  else pn = currentPage - 2 + i;
                  return <button key={pn} onClick={() => setCurrentPage(pn)} className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage === pn ? 'bg-[#7d5a50] text-white' : 'bg-white border border-[#c8b6a6] text-[#4a352f]'}`}>{pn}</button>;
                })}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">Next</button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">Last</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Drag-to-reorder hint tooltip ─────────────────────────────────── */}
      {dragHintRect && !draggedColumn && !resizingColumn && (
        <PopupPortal>
          <div
            className="fixed z-[1200] bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none normal-case font-normal flex items-center gap-1.5"
            style={{
              top: dragHintRect.bottom + 8,
              left: Math.min(Math.max(dragHintRect.left, 12), window.innerWidth - 235),
              width: '225px',
            }}
          >
            <GripVertical size={12} className="flex-shrink-0" /> Drag to reorder · pull the edge to resize
          </div>
        </PopupPortal>
      )}

      {/* ─── Column header filter popover ─────────────────────────────────── */}
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
                    <button onClick={() => setLocalFilters(p => ({ ...p, name: '' }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <input
                  autoFocus type="text" value={localFilters.name}
                  onChange={(e) => { setLocalFilters(p => ({ ...p, name: e.target.value })); setCurrentPage(1); }}
                  placeholder="Search business name..."
                  className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20"
                />
              </>
            )}

            {(headerFilterOpen.type === 'bigScore' || headerFilterOpen.type === 'match') && (() => {
              const isBig = headerFilterOpen.type === 'bigScore';
              const rangeKey = isBig ? 'bigScoreRange' : 'matchRange';
              const range = localFilters[rangeKey];
              return (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-[#4a352f]">{isBig ? 'BIG Score' : 'Match %'}: {range[0]} - {range[1]}</label>
                    {(range[0] > 0 || range[1] < 100) && (
                      <button onClick={() => setLocalFilters(p => ({ ...p, [rangeKey]: [0, 100] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <input type="number" min="0" max="100" value={range[0]}
                      onChange={(e) => setLocalFilters(p => ({ ...p, [rangeKey]: [Math.min(parseInt(e.target.value) || 0, p[rangeKey][1]), p[rangeKey][1]] }))}
                      className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                    <span className="text-[#7d5a50]">to</span>
                    <input type="number" min="0" max="100" value={range[1]}
                      onChange={(e) => setLocalFilters(p => ({ ...p, [rangeKey]: [p[rangeKey][0], Math.max(parseInt(e.target.value) || 0, p[rangeKey][0])] }))}
                      className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                  </div>
                  <input type="range" min="0" max="100" value={range[0]}
                    onChange={(e) => setLocalFilters(p => ({ ...p, [rangeKey]: [parseInt(e.target.value), p[rangeKey][1]] }))}
                    className="w-full accent-[#7d5a50]" />
                </>
              );
            })()}

            {headerFilterOpen.type === 'status' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Status</label>
                  {localFilters.status.length > 0 && (
                    <button onClick={() => setLocalFilters(p => ({ ...p, status: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeStages.map(s => (
                    <button key={s.id}
                      onClick={() => setLocalFilters(p => ({ ...p, status: p.status.includes(s.name) ? p.status.filter(x => x !== s.name) : [...p.status, s.name] }))}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.status.includes(s.name) ? 'bg-[#7d5a50] text-white' : 'bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]'}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {headerFilterOpen.type === 'fundingStage' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Funding Stage</label>
                  {localFilters.fundingStage.length > 0 && (
                    <button onClick={() => setLocalFilters(p => ({ ...p, fundingStage: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth', 'Established'].map(stage => (
                    <button key={stage}
                      onClick={() => setLocalFilters(p => ({ ...p, fundingStage: p.fundingStage.includes(stage) ? p.fundingStage.filter(x => x !== stage) : [...p.fundingStage, stage] }))}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.fundingStage.includes(stage) ? 'bg-[#7d5a50] text-white' : 'bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]'}`}>
                      {stage}
                    </button>
                  ))}
                </div>
              </>
            )}

            {(headerFilterOpen.type === 'sector' || headerFilterOpen.type === 'equity') && (() => {
              const isSector = headerFilterOpen.type === 'sector';
              const key = isSector ? 'sector' : 'equity';
              const options = isSector ? sectorOptions : equityOptions;
              return (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-[#4a352f]">{isSector ? 'Sector' : 'Equity Offered'}</label>
                    {localFilters[key].length > 0 && (
                      <button onClick={() => setLocalFilters(p => ({ ...p, [key]: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
                    {options.length === 0 && <span className="text-xs text-[#a89482]">No data available</span>}
                    {options.map(opt => (
                      <button key={opt}
                        onClick={() => setLocalFilters(p => ({ ...p, [key]: p[key].includes(opt) ? p[key].filter(x => x !== opt) : [...p[key], opt] }))}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters[key].includes(opt) ? 'bg-[#7d5a50] text-white' : 'bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </>
              );
            })()}

            {(headerFilterOpen.type === 'fundingRequired' || headerFilterOpen.type === 'daysInStage') && (() => {
              const isFunding = headerFilterOpen.type === 'fundingRequired';
              const key = isFunding ? 'fundingRequiredRange' : 'daysInStageRange';
              const range = localFilters[key];
              return (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#4a352f]">{isFunding ? 'Funding required (R)' : 'Days in stage'}</label>
                    {(range[0] != null || range[1] != null) && (
                      <button onClick={() => setLocalFilters(p => ({ ...p, [key]: [null, null] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="number" min="0" placeholder="Min" value={range[0] ?? ''}
                      onChange={(e) => setLocalFilters(p => ({ ...p, [key]: [e.target.value === '' ? null : Number(e.target.value), p[key][1]] }))}
                      className="w-full px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                    <span className="text-[#7d5a50]">to</span>
                    <input type="number" min="0" placeholder="Max" value={range[1] ?? ''}
                      onChange={(e) => setLocalFilters(p => ({ ...p, [key]: [p[key][0], e.target.value === '' ? null : Number(e.target.value)] }))}
                      className="w-full px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                  </div>
                </>
              );
            })()}

            {headerFilterOpen.type === 'applied' && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Applied between</label>
                  {(localFilters.appliedRange[0] || localFilters.appliedRange[1]) && (
                    <button onClick={() => setLocalFilters(p => ({ ...p, appliedRange: [null, null] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <div className="space-y-2">
                  <input type="date" value={localFilters.appliedRange[0] || ''}
                    onChange={(e) => setLocalFilters(p => ({ ...p, appliedRange: [e.target.value || null, p.appliedRange[1]] }))}
                    className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm" />
                  <input type="date" value={localFilters.appliedRange[1] || ''}
                    onChange={(e) => setLocalFilters(p => ({ ...p, appliedRange: [p.appliedRange[0], e.target.value || null] }))}
                    className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm" />
                </div>
              </>
            )}

            {['location', 'lastActivity', 'guarantees', 'support', 'services'].includes(headerFilterOpen.type) && (() => {
              const key = headerFilterOpen.type;
              const labels = { location: 'location', lastActivity: 'last activity', guarantees: 'guarantees', support: 'support required', services: 'services required' };
              return (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#4a352f]">Filter by {labels[key]}</label>
                    {localFilters[key] && (
                      <button onClick={() => setLocalFilters(p => ({ ...p, [key]: '' }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                    )}
                  </div>
                  <input autoFocus type="text" value={localFilters[key]}
                    onChange={(e) => setLocalFilters(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={`Search ${labels[key]}...`}
                    className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20" />
                </>
              );
            })()}
          </div>
        </PopupPortal>
      )}

      {/* ─── BIG Score Popup ──────────────────────────────────────────────── */}
      {activePopup?.type === 'bigScore' && selectedSMEForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: '380px', maxHeight: '450px', overflowY: 'auto' }}>
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">BIG Score</p>
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[200px]">{selectedSMEForPopup.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center text-xl font-bold">
                    {selectedSMEForPopup.bigScore}
                  </div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1"><X size={18} /></button>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {bigScoreLoading ? (
                <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-[#f5f0e1] rounded-xl animate-pulse" />)}</div>
              ) : (
                <>
                  <p className="text-[11px] text-[#a89482]">Each pillar is scored out of 100 and weighted equally.</p>
                  {[
                    { key: 'compliance', label: 'Compliance', desc: 'Regulatory and statutory standing' },
                    { key: 'legitimacy', label: 'Legitimacy', desc: 'Verification of business identity' },
                    { key: 'fundability', label: 'Fundability', desc: 'Financial readiness for investment' },
                    { key: 'operational', label: 'PIS', desc: 'Products, industry and services strength' },
                    { key: 'governanceLeadership', label: 'Leadership', desc: 'Management capability and governance' },
                  ].map(({ key, label, desc }) => {
                    const score = bigScoreData[key]?.score || 0;
                    const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={key} className="bg-[#faf7f2] rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <span className="text-xs font-semibold text-[#4a352f]">{label}</span>
                            <p className="text-[10px] text-[#7d5a50]">{desc}</p>
                          </div>
                          <span className="text-sm font-bold" style={{ color }}>{score}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#e6d7c3] rounded-full">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </PopupPortal>
      )}

      {/* ─── Match Breakdown Popup ────────────────────────────────────────── */}
      {activePopup?.type === 'match' && selectedSMEForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: '380px', maxHeight: '420px', overflowY: 'auto' }}>
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Why this match?</p>
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[220px]">{selectedSMEForPopup.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold">{selectedSMEForPopup.matchPercentage}%</div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1"><X size={18} /></button>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {matchBreakdownData ? (
                Object.entries(matchBreakdownData).map(([criterion, data]) => {
                  const matched = data?.matched ?? data === true;
                  return (
                    <div key={criterion} className="flex items-start gap-2 p-2.5 rounded-lg border border-[#e6d7c3] bg-[#faf7f2]">
                      {matched
                        ? <CheckCircle size={15} className="text-green-600 flex-shrink-0 mt-0.5" />
                        : <XCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#4a352f] capitalize">{criterion.replace(/([A-Z])/g, ' $1').trim()}</p>
                        {data?.reason && <p className="text-[11px] text-[#7d5a50] mt-0.5">{data.reason}</p>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-[#a89482] text-center py-6">No match breakdown available for this SME.</p>
              )}
            </div>
          </div>
        </PopupPortal>
      )}

      {/* ─── Stage Update Popup ───────────────────────────────────────────── */}
      {activePopup?.type === 'stage' && selectedSMEForPopup && (() => {
        const stageFields = getStageFields(stageUpdateData.nextStage, activeStages);
        return (
          <PopupPortal>
            <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
            <div className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden"
              style={{ top: activePopup.position.y, left: activePopup.position.x, width: '450px', maxHeight: '550px', overflowY: 'auto' }}>
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Update Stage</p>
                    <h3 className="text-sm font-bold mt-0.5 truncate max-w-[300px]">{selectedSMEForPopup.name}</h3>
                  </div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1"><X size={18} /></button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1">Select Next Stage *</label>
                  <select
                    value={stageUpdateData.nextStage}
                    onChange={(e) => {
                      setStageUpdateData(prev => ({ ...prev, nextStage: e.target.value }));
                      setStageFormErrors(prev => ({ ...prev, nextStage: null }));
                    }}
                    className={`w-full px-3 py-2 border-2 rounded-lg text-xs ${stageFormErrors.nextStage ? 'border-red-500' : 'border-[#c8b6a6]'}`}
                  >
                    <option value="">Choose a stage...</option>
                    {activeStages.map(s => (<option key={s.id} value={s.name}>{s.name}</option>))}
                  </select>
                  {stageFormErrors.nextStage && <p className="text-red-500 text-xs mt-1">{stageFormErrors.nextStage}</p>}
                </div>

                {stageUpdateData.nextStage && (
                  <>
                    {stageFields.showMessage && (
                      <div>
                        <label className="block text-xs font-semibold text-[#4a352f] mb-1">Message to SME *</label>
                        <textarea
                          value={stageUpdateData.message}
                          onChange={(e) => setStageUpdateData(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Enter your message..." rows={4}
                          className={`w-full px-3 py-2 border-2 rounded-lg text-xs resize-y ${stageFormErrors.message ? 'border-red-500' : 'border-[#c8b6a6]'}`}
                        />
                        {stageFormErrors.message && <p className="text-red-500 text-xs mt-1">{stageFormErrors.message}</p>}
                      </div>
                    )}

                    {stageFields.showMeeting && (
                      <div className="bg-[#faf7f2] rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-semibold text-[#4a352f] flex items-center gap-2"><Video size={14} /> Schedule Meeting</h4>
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Meeting Time</label>
                          <input type="datetime-local" value={stageUpdateData.meetingTime}
                            onChange={(e) => setStageUpdateData(prev => ({ ...prev, meetingTime: e.target.value }))}
                            className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-xs" />
                        </div>
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Location *</label>
                          <input type="text" value={stageUpdateData.meetingLocation}
                            onChange={(e) => setStageUpdateData(prev => ({ ...prev, meetingLocation: e.target.value }))}
                            placeholder="Office, Zoom, etc."
                            className={`w-full px-3 py-2 border-2 rounded-lg text-xs ${stageFormErrors.meetingLocation ? 'border-red-500' : 'border-[#c8b6a6]'}`} />
                          {stageFormErrors.meetingLocation && <p className="text-red-500 text-xs mt-1">{stageFormErrors.meetingLocation}</p>}
                        </div>
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Purpose *</label>
                          <input type="text" value={stageUpdateData.meetingPurpose}
                            onChange={(e) => setStageUpdateData(prev => ({ ...prev, meetingPurpose: e.target.value }))}
                            placeholder="Due diligence discussion, etc."
                            className={`w-full px-3 py-2 border-2 rounded-lg text-xs ${stageFormErrors.meetingPurpose ? 'border-red-500' : 'border-[#c8b6a6]'}`} />
                          {stageFormErrors.meetingPurpose && <p className="text-red-500 text-xs mt-1">{stageFormErrors.meetingPurpose}</p>}
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
                                    {a.date?.toLocaleDateString?.('en-ZA', { weekday: 'short', month: 'short', day: 'numeric' }) || 'Date unavailable'}
                                  </div>
                                  {a.timeSlots?.[0] && (<div className="text-xs text-[#7d5a50]">{a.timeSlots[0].start} – {a.timeSlots[0].end}</div>)}
                                </div>
                                <button onClick={() => removeAvailability(a.date)} className="text-red-500 hover:text-red-700 p-1"><X size={14} /></button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#7d5a50] italic">No availability added yet</p>
                        )}
                        {stageFormErrors.availabilities && <p className="text-red-500 text-xs mt-2">{stageFormErrors.availabilities}</p>}
                      </div>
                    )}

                    {stageFields.showTermSheet && (
                      <div>
                        <label className="block text-xs font-semibold text-[#4a352f] mb-1">Term Sheet (PDF, DOC)</label>
                        <input type="file" accept=".pdf,.doc,.docx"
                          onChange={(e) => setStageUpdateData(prev => ({ ...prev, termSheetFile: e.target.files[0] }))}
                          className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-xs" />
                        {stageUpdateData.termSheetFile && (
                          <p className="text-xs text-green-700 mt-1">Selected: {stageUpdateData.termSheetFile.name}</p>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={closePopup} className="px-4 py-2 bg-[#faf7f2] text-[#7d5a50] rounded-lg text-xs font-medium hover:bg-[#f5f0e1] transition-all">Cancel</button>
                  <button onClick={handleStageUpdate} disabled={isStageSubmitting} className="px-4 py-2 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold hover:bg-[#4a352f] transition-all disabled:opacity-50">
                    {isStageSubmitting ? 'Updating...' : 'Update Stage'}
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Popup */}
            {showCalendarPopup && (
              <>
                <div className="fixed inset-0 z-[1100]" onClick={() => setShowCalendarPopup(false)} />
                <div className="fixed z-[1101] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-6"
                  style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '360px', maxHeight: '80vh', overflowY: 'auto' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-[#4a352f]">Select Available Dates</h4>
                    <button onClick={() => setShowCalendarPopup(false)} className="text-[#7d5a50] hover:text-[#4a352f]"><X size={18} /></button>
                  </div>
                  <DayPicker mode="multiple" selected={tempDates} onSelect={handleDateSelect} disabled={{ before: new Date() }} className="mb-4" />
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-[#4a352f] mb-2">Time Slot</label>
                    <div className="flex gap-2">
                      <input type="time" value={timeSlot.start} onChange={(e) => handleTimeChange('start', e.target.value)} className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs" />
                      <span className="text-[#7d5a50] self-center">to</span>
                      <input type="time" value={timeSlot.end} onChange={(e) => handleTimeChange('end', e.target.value)} className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowCalendarPopup(false)} className="px-4 py-2 bg-[#faf7f2] text-[#7d5a50] rounded-lg text-xs">Cancel</button>
                    <button onClick={saveSelectedDates} disabled={tempDates.length === 0} className="px-4 py-2 bg-[#7d5a50] text-white rounded-lg text-xs disabled:opacity-50">
                      Save Dates ({tempDates.length})
                    </button>
                  </div>
                </div>
              </>
            )}
          </PopupPortal>
        );
      })()}

      {/* ─── Quick Actions Popup ──────────────────────────────────────────── */}
      {activePopup?.type === 'quickActions' && selectedSMEForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div className="fixed z-[1001] bg-white rounded-xl shadow-2xl border border-[#e6d7c3] py-1 overflow-hidden"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: '210px' }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#e6d7c3]">
              <span className="text-xs font-semibold text-[#4a352f]">Quick Actions</span>
              <button onClick={closePopup} className="text-[#7d5a50] hover:text-[#4a352f]"><X size={14} /></button>
            </div>
            <button onClick={() => handleViewDetails(selectedSMEForPopup)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><Eye size={12} /> View Profile</button>
            <button onClick={() => openPopup('bigScore', selectedSMEForPopup, activePopup.rect)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><Target size={12} /> BIG Score Breakdown</button>
            <button onClick={() => openPopup('match', selectedSMEForPopup, activePopup.rect)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><BarChart3 size={12} /> Why This Match?</button>
            <button onClick={() => { setNotification({ type: 'success', message: 'Messaging coming soon' }); closePopup(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><MessageSquare size={12} /> Send Message</button>
            <button
              onClick={() => handleShareNDA(selectedSMEForPopup)}
              disabled={isNDASharing[selectedSMEForPopup.id] || sentNDAs[selectedSMEForPopup.id]}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left disabled:opacity-50 border-t border-[#e6d7c3]"
            >
              <Share2 size={12} />
              {sentNDAs[selectedSMEForPopup.id] ? 'NDA Sent' : isNDASharing[selectedSMEForPopup.id] ? 'Sending...' : 'Share NDA'}
            </button>
          </div>
        </PopupPortal>
      )}

      {/* ─── SME Details Modal ────────────────────────────────────────────── */}
      {showSMEDetails && selectedSMEDetails && (
        <SMEDetailsModal
          sme={selectedSMEDetails}
          onClose={() => { setShowSMEDetails(false); setSelectedSMEDetails(null); }}
        />
      )}
    </div>
  );
}

export default SupportSMETable;