"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Info, Calendar, X, Eye, ChevronDown, MoreVertical, CheckCircle,
  Clock, Users, Download, MessageSquare, ArrowRight, SlidersHorizontal,
  RotateCcw, Settings, Briefcase, Video, LayoutGrid, Trash2, Plus,
  GripVertical, AlertTriangle, XCircle, Search, Pin, PinOff,
  ArrowUp, ArrowDown, ArrowUpDown
} from "lucide-react";
import * as XLSX from "xlsx";
import CMFSMEDetailsModal from "./CMFSMEDetailsModal";
import {
  DEFAULT_STAGES, PROGRAMME_TEMPLATES, mapStatusToStageId, getStageColors,
  getNextStageId, getStageActionConfig, loadPipelineSettings, getActiveStages,
  PIPELINE_SETTINGS_EVENT,
} from "./cmfStageConfig";
import { db } from "../../firebaseConfig";        // match the path used by SupportSMETable
import { doc, getDoc } from "firebase/firestore";

// ─── Constants & Helpers ──────────────────────────────────────────────────────
const BIG_SCORE_LABELS = {
  excellent: { min: 80, label: "Excellent", color: "#22c55e" },
  strong: { min: 60, label: "Strong", color: "#86efac" },
  moderate: { min: 40, label: "Moderate", color: "#f59e0b" },
  weak: { min: 20, label: "Weak", color: "#ef4444" },
  critical: { min: 0, label: "Critical", color: "#dc2626" }
};

// Match % maps to a plain label + fit bar rather than a raw number alone
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

// Stage lookups take the currently *active* stage list as a parameter (BIG
// Default, or whichever PROGRAMME_TEMPLATES entry is selected, with any
// customization applied) — rather than resolving against a hard-coded list.
const getStageById = (id, stages = DEFAULT_STAGES) =>
  stages.find((s) => s.id === id) || stages[0];

const getStatusStyle = (status, stages = DEFAULT_STAGES) => {
  const stage = getStageById(mapStatusToStageId(status, stages), stages);
  const colors = getStageColors(stage.group);
  return { bg: colors.bgColor, text: colors.color, border: colors.borderColor, dot: colors.color, stage };
};

// Reads whatever was configured in the pipeline's "Stage Actions" panel.
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
  if (value === null || value === undefined || value === "" || value === "N/A") return "N/A";
  const num = parseFloat(value.toString().replace(/[^0-9.]/g, ""));
  if (isNaN(num) || num === 0) return "N/A";
  if (num >= 1000000) return `R${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `R${(num / 1000).toFixed(0)}K`;
  return `R${num}`;
};

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (value?.seconds != null) return new Date(value.seconds * 1000);
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (value) => {
  const d = toDate(value);
  return d ? d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "N/A";
};

// Days in stage derives from whichever timestamp the row actually carries,
// falling back through the likely fields.
const calculateDaysInStage = (row) => {
  if (row.daysInStage != null && !isNaN(Number(row.daysInStage))) return Number(row.daysInStage);
  const d = toDate(row.stageUpdatedAt || row.updatedAt || row.lastActivity || row.applicationDate);
  if (!d) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
};

// ─── Attention indicator ──────────────────────────────────────────────────────
const getAttentionReasons = (sme, stages = DEFAULT_STAGES) => {
  const reasons = [];
  if ((sme.daysInStage || 0) >= 14) reasons.push("Stalled for 14+ days");
  if ((sme.bigScore || 0) < 40 && sme.bigScore > 0) reasons.push("BIG Score below threshold");
  const stageId = mapStatusToStageId(sme.pipelineStage, stages);
  if (stageId === "decision") reasons.push("Decision pending");
  if (stageId === "evaluation" && (sme.daysInStage || 0) >= 7) reasons.push("Evaluation overdue");
  if (stageId === "offer" && (sme.daysInStage || 0) >= 7) reasons.push("Offer awaiting response");
  return reasons;
};

// Small helper component so all popups can be portaled straight to <body>.
const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
};

// ─── Column header info tooltip ───────────────────────────────────────────────
// Portaled to <body> because the header cell is sticky and would otherwise clip
// the bubble.
const HeaderInfoTooltip = ({ text }) => {
  const [rect, setRect] = useState(null);
  if (!text) return null;
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

// ─── Reorderable column definitions ───────────────────────────────────────────
// These are the columns that live *between* the pinned "Business Name" (always
// first) and "Actions" (always last) columns. Users can drag these to reorder
// them, drag their right edge to resize, pin them left/right, sort them and
// filter them. Business Name and Actions can't be hidden or reordered, but they
// resize like everything else via the reserved width keys further down.
//
// Widths are numeric px and act as the factory default a double-click on the
// divider snaps back to. They're set high enough that each header's chrome
// (grip, sort, filter, info — roughly 72px) doesn't force the label to break
// mid-word.
//
// priority drives responsive collapse: 1 survives mobile, <=3 survives tablet,
// everything shows on laptop and up.
const COLUMN_DEFS = {
  bigScore: {
    label: "BIG Score", align: "center", width: 152, filterType: "bigScore",
    visible: true, priority: 1, sortable: true,
    tooltip: "Business credibility and readiness — compliance, legitimacy, fundability, PIS and leadership, rolled into one score out of 100.",
  },
  match: {
    label: "Match %", align: "center", width: 152, filterType: "match",
    visible: true, priority: 1, sortable: true,
    tooltip: "Programme fit — how closely this business aligns with your programme's mandate and criteria. Separate from BIG Score, which measures the business itself.",
  },
  fundingStage: {
    label: "Funding Stage", width: 150, filterType: "fundingStage",
    visible: true, priority: 3, sortable: true,
    tooltip: "Where the business sits in its funding journey — startup, growth, scale or established.",
  },
  fundingRequired: {
    label: "Funding Required", width: 156, filterType: "fundingRequired",
    visible: true, priority: 2, sortable: true,
    tooltip: "The amount of support the business has asked for. Sorting and filtering use the underlying number, not the formatted label.",
  },
  status: {
    label: "Status", width: 156, filterType: "status",
    visible: true, priority: 1, sortable: true,
    tooltip: "The stage this application currently sits at in your pipeline. Stage names follow whichever programme template is selected.",
  },
  applied: {
    label: "Applied", width: 150, filterType: "applied",
    visible: true, priority: 3, sortable: true,
    tooltip: "The date the business submitted its application to this programme.",
  },
  daysInStage: {
    label: "Days in Stage", width: 150, filterType: "daysInStage",
    visible: true, priority: 2, sortable: true,
    tooltip: "How long this application has sat at its current stage. Anything past 14 days is treated as stalled and floats to the top of the default sort.",
  },
  lastActivity: {
    label: "Last Activity", width: 150, filterType: "lastActivity",
    visible: true, priority: 3, sortable: true,
    tooltip: "The most recent recorded movement on this application — a stage change, a message or a document.",
  },
  sector: {
    label: "Sector", width: 148, filterType: "sector",
    visible: false, priority: 4, sortable: true,
    tooltip: "The industry the business operates in.",
  },
  location: {
    label: "Location", width: 138, filterType: "location",
    visible: false, priority: 4, sortable: true,
    tooltip: "The city or town the business is based in.",
  },
  province: {
    label: "Province", width: 138, filterType: "province",
    visible: false, priority: 4, sortable: true,
    tooltip: "The province the business is registered or operating in.",
  },
  supportRequired: {
    label: "Support Required", width: 168, filterType: "supportRequired",
    visible: false, priority: 4, sortable: false,
    tooltip: "The kind of help the business says it needs — funding, market access, mentoring, technical support and so on.",
  },
  servicesRequired: {
    label: "Services Required", width: 172, filterType: "servicesRequired",
    visible: false, priority: 4, sortable: false,
    tooltip: "The specific services the business has asked for, in its own words.",
  },
};

const DEFAULT_COLUMN_ORDER = Object.keys(COLUMN_DEFS);
const DEFAULT_COLUMN_VISIBILITY = Object.fromEntries(
  DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].visible !== false])
);
const DEFAULT_COLUMN_WIDTHS = Object.fromEntries(
  DEFAULT_COLUMN_ORDER.map((k) => [k, COLUMN_DEFS[k].width])
);
const DEFAULT_PINNED = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, null]));

// Business Name and Actions can't be hidden or reordered, so they aren't in
// COLUMN_DEFS — but they resize like everything else, and their widths live
// under these reserved keys inside the same columnWidths map.
const NAME_KEY = "__name__";
const ACTION_KEY = "__action__";
const FIXED_WIDTHS = { [NAME_KEY]: 210, [ACTION_KEY]: 200 };
const MIN_COLUMN_WIDTH = 84;

// Sorting reads the mapped row field, which doesn't always match the column key
// (e.g. "match" lives on matchPercentage, "applied" on applicationDateRaw).
const SORT_ACCESSORS = {
  [NAME_KEY]: (r) => (r.name || "").toLowerCase(),
  bigScore: (r) => r.bigScore || 0,
  match: (r) => r.matchPercentage || 0,
  fundingStage: (r) => (r.fundingStage || "").toLowerCase(),
  fundingRequired: (r) => Number(r.fundingAmount) || 0,
  status: (r) => (r.statusLabel || "").toLowerCase(),
  applied: (r) => r.applicationDateRaw?.getTime?.() || 0,
  daysInStage: (r) => Number(r.daysInStage) || 0,
  lastActivity: (r) => toDate(r.lastActivity)?.getTime?.() || 0,
  sector: (r) => (r.sector || "").toLowerCase(),
  location: (r) => (r.location || "").toLowerCase(),
  province: (r) => (r.province || "").toLowerCase(),
  supportRequired: (r) => (r.supportRequired || "").toLowerCase(),
  servicesRequired: (r) => (r.servicesRequired || "").toLowerCase(),
};

// Maps a column key to the field on the mapped row object.
const EXPORT_FIELD_MAP = {
  sme: "name", bigScore: "bigScore", match: "matchPercentage",
  fundingStage: "fundingStage", fundingRequired: "fundingRequired",
  status: "statusLabel", applied: "applicationDateLabel", daysInStage: "daysInStage",
  lastActivity: "lastActivityLabel", sector: "sector", location: "location",
  province: "province", supportRequired: "supportRequired", servicesRequired: "servicesRequired"
  // Note: the Actions column is intentionally omitted — it's UI only.
};

const EXPORT_HEADERS = {
  sme: "Business Name", bigScore: "BIG Score", match: "Match %",
  fundingStage: "Funding Stage", fundingRequired: "Funding Required",
  status: "Status", applied: "Applied Date", daysInStage: "Days in Stage",
  lastActivity: "Last Activity", sector: "Sector", location: "Location",
  province: "Province", supportRequired: "Support Required", servicesRequired: "Services Required"
};

// ─── Custom Views ─────────────────────────────────────────────────────────────
// A "view" bundles every layout preference — column visibility, order, widths,
// pinning, sort and density — into one named, describable object, with exactly
// one view active at a time. Editing the table always edits the active view.
const DEFAULT_SORT_CONFIG = { key: "attentionThenScore", direction: "desc" };
const DEFAULT_DENSITY = "comfortable";

const BUILTIN_VIEW_ID = "__default__";
// v3: the two fixed columns now store their widths in the same map, and views
// carry a pinned map, so a v2 view would leave both undefined.
const VIEWS_STORAGE_KEY = "cmf-sme-table-views-v3";

// Keeps a stored column order valid against the columns this build actually
// knows about: drops keys that no longer exist, appends newly-introduced ones.
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
  columnWidths: { ...DEFAULT_COLUMN_WIDTHS, ...FIXED_WIDTHS },
  pinned: { ...DEFAULT_PINNED },
  sortConfig: { ...DEFAULT_SORT_CONFIG },
  density: DEFAULT_DENSITY,
});

const createBuiltinDefaultView = () => ({
  id: BUILTIN_VIEW_ID, name: "Default", description: "", builtin: true,
  ...createDefaultViewLayout(),
});

const sanitizeView = (view, fallbackId) => ({
  id: view?.id || fallbackId,
  name: (view?.name || "Untitled view").toString(),
  description: (view?.description || "").toString(),
  builtin: !!view?.builtin,
  columnVisibility: { ...DEFAULT_COLUMN_VISIBILITY, ...(view?.columnVisibility || {}) },
  columnOrder: sanitizeColumnOrder(view?.columnOrder),
  columnWidths: { ...DEFAULT_COLUMN_WIDTHS, ...FIXED_WIDTHS, ...(view?.columnWidths || {}) },
  pinned: { ...DEFAULT_PINNED, ...(view?.pinned || {}) },
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
    // Storage can fail (private browsing, quota) — the table still works for
    // the current session, it just won't persist across reloads.
  }
};

const generateViewId = () => {
  try {
    return `view_${crypto.randomUUID()}`;
  } catch {
    return `view_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
};

// ─── Default stage messages ───────────────────────────────────────────────────
const DEFAULT_STAGE_MESSAGES = {
  applied: "Dear Valued Partner,\n\nThank you for your application. We have received it and it is now in our review queue.\n\nWe will be in touch as your application progresses.\n\nBest regards,\nProgramme Team",
  evaluation: "Dear Valued Partner,\n\nYour application has progressed to our evaluation stage. Our team will assess your business against the programme criteria.\n\nWe appreciate your patience during this period.\n\nBest regards,\nProgramme Team",
  dueDiligence: "Dear Valued Partner,\n\nYour application has progressed to Due Diligence. Our team will now review your operations, financials, and compliance documentation.\n\nWe may reach out for additional information and appreciate your cooperation.\n\nBest regards,\nProgramme Team",
  decision: "Dear Valued Partner,\n\nYour application has reached the decision stage. Our panel is finalising its assessment and we will share the outcome shortly.\n\nBest regards,\nProgramme Team",
  offer: "Dear Valued Partner,\n\nCongratulations — we are pleased to extend an offer of participation in the programme. Please find the agreement attached for your review.\n\nWe look forward to working with you.\n\nBest regards,\nProgramme Team",
  active: "Dear Valued Partner,\n\nWelcome to the programme. You are now active and our team will be in touch shortly with your onboarding schedule.\n\nBest regards,\nProgramme Team",
  completed: "Dear Valued Partner,\n\nCongratulations on completing the programme. It has been a pleasure supporting your growth.\n\nOur team will share your final report and next-step options shortly.\n\nWarm regards,\nProgramme Team",
  declined: "Dear Applicant,\n\nThank you for applying to our programme. After careful consideration, we are unable to proceed with your application at this time.\n\nThis decision does not reflect the quality of your business, and we encourage you to apply for future intakes.\n\nRespectfully,\nProgramme Team",
};

// ─── Component ────────────────────────────────────────────────────────────────
export function CMFSMETable({
  filters = {},
  stageFilter,
  smeMatches = [],
  loading = false,
  onUpdateStage,
  onStageOverride,
  onSMEsLoaded
}) {
  const [selectedSME, setSelectedSME] = useState(null);
  const [updatedStages, setUpdatedStages] = useState({});
  const [notification, setNotification] = useState(null);

  // ─── Views ────────────────────────────────────────────────────────────────
  const [viewsState, setViewsState] = useState(() => loadViewsState());
  const initialActiveView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID];
  const [columnVisibility, setColumnVisibility] = useState(() => initialActiveView.columnVisibility);
  const [columnOrder, setColumnOrder] = useState(() => initialActiveView.columnOrder);
  const [columnWidths, setColumnWidths] = useState(() => initialActiveView.columnWidths);
  const [pinned, setPinned] = useState(() => initialActiveView.pinned);
  const [sortConfig, setSortConfig] = useState(() => initialActiveView.sortConfig);
  const [density, setDensity] = useState(() => initialActiveView.density);

  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [columnChooserRect, setColumnChooserRect] = useState(null);
  const [showNewViewForm, setShowNewViewForm] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [newViewDescription, setNewViewDescription] = useState("");
  const [editingViewMeta, setEditingViewMeta] = useState(null);
  const [columnSearch, setColumnSearch] = useState("");

  const [headerFilterOpen, setHeaderFilterOpen] = useState(null);
  const [localFilters, setLocalFilters] = useState({
    name: "", fundingStage: [], bigScoreRange: [0, 100], matchRange: [0, 100], status: [],
    sector: [], fundingRequiredRange: [null, null], daysInStageRange: [null, null],
    appliedRange: [null, null], location: "", province: "", lastActivity: "",
    supportRequired: "", servicesRequired: ""
  });

  const [hoveredRowKey, setHoveredRowKey] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Column drag-to-reorder + resize state
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragHintRect, setDragHintRect] = useState(null);
  const resizingRef = useRef(null);
  const [resizingColumn, setResizingColumn] = useState(null);

  const [viewportWidth, setViewportWidth] = useState(typeof window === "undefined" ? 1440 : window.innerWidth);

  // Popups
  const [activePopup, setActivePopup] = useState(null);
  const [selectedSMEForPopup, setSelectedSMEForPopup] = useState(null);
  const [stageUpdateData, setStageUpdateData] = useState({
    nextStage: "", message: "", meetingTime: "", meetingLocation: "", meetingPurpose: "", agreementFile: null
  });
  const [stageFormErrors, setStageFormErrors] = useState({});
  const [isStageSubmitting, setIsStageSubmitting] = useState(false);
  const [availabilities, setAvailabilities] = useState([]);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [tempDates, setTempDates] = useState([]);
  const [timeSlot, setTimeSlot] = useState({ start: "09:00", end: "17:00" });
  const [timeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // ─── Programme-aware pipeline stages ──────────────────────────────────────
  const [pipelineSettings, setPipelineSettings] = useState(() => loadPipelineSettings());

const [bigScoreLoading, setBigScoreLoading] = useState(false);
  const [bigScoreData, setBigScoreData] = useState({
    compliance: { score: 0 }, legitimacy: { score: 0 },
    fundability: { score: 0 }, governanceLeadership: { score: 0 }, operational: { score: 0 }
  });

  useEffect(() => {
    const refresh = () => setPipelineSettings(loadPipelineSettings());
    window.addEventListener("storage", refresh);
    window.addEventListener(PIPELINE_SETTINGS_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(PIPELINE_SETTINGS_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const activeProgrammeLabel = (PROGRAMME_TEMPLATES[pipelineSettings.programmeType] || PROGRAMME_TEMPLATES.default).label;
  const activeStages = useMemo(() => getActiveStages(pipelineSettings), [pipelineSettings]);

  const activeView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID];

  // Auto-save: any edit to columns/order/widths/pinning/sort/density writes
  // straight back into the active view (and persists immediately).
  useEffect(() => {
    setViewsState((prev) => {
      const current = prev.views[prev.activeViewId];
      if (!current) return prev;
      const updated = { ...current, columnVisibility, columnOrder, columnWidths, pinned, sortConfig, density };
      const next = { ...prev, views: { ...prev.views, [prev.activeViewId]: updated } };
      persistViewsState(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibility, columnOrder, columnWidths, pinned, sortConfig, density]);

  const switchToView = (viewId) => {
    const target = viewsState.views[viewId];
    if (!target) return;
    setViewsState((prev) => {
      const next = { ...prev, activeViewId: viewId };
      persistViewsState(next);
      return next;
    });
    setColumnVisibility(target.columnVisibility);
    setColumnOrder(target.columnOrder);
    setColumnWidths(target.columnWidths);
    setPinned(target.pinned);
    setSortConfig(target.sortConfig);
    setDensity(target.density);
  };

  const createNewView = () => {
    const trimmedName = newViewName.trim();
    if (!trimmedName) return;
    const id = generateViewId();
    const newView = {
      id, name: trimmedName, description: newViewDescription.trim(), builtin: false,
      columnVisibility: { ...columnVisibility }, columnOrder: [...columnOrder],
      columnWidths: { ...columnWidths }, pinned: { ...pinned },
      sortConfig: { ...sortConfig }, density,
    };
    setViewsState((prev) => {
      const next = { activeViewId: id, views: { ...prev.views, [id]: newView } };
      persistViewsState(next);
      return next;
    });
    setNewViewName("");
    setNewViewDescription("");
    setShowNewViewForm(false);
    setNotification({ type: "success", message: `View "${trimmedName}" created` });
  };

  const startEditingViewMeta = (view) =>
    setEditingViewMeta({ id: view.id, name: view.name, description: view.description, builtin: !!view.builtin });

  const saveViewMeta = () => {
    if (!editingViewMeta) return;
    const trimmedName = editingViewMeta.name.trim();
    if (!trimmedName && !editingViewMeta.builtin) return;
    setViewsState((prev) => {
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

  const removeView = (viewId) => {
    if (viewId === BUILTIN_VIEW_ID) return;
    const wasActive = viewsState.activeViewId === viewId;
    setViewsState((prev) => {
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
      setColumnWidths(def.columnWidths);
      setPinned(def.pinned);
      setSortConfig(def.sortConfig);
      setDensity(def.density);
    }
    setNotification({ type: "success", message: "View deleted" });
  };

  const resetActiveViewToDefault = () => {
    const layout = createDefaultViewLayout();
    setColumnVisibility(layout.columnVisibility);
    setColumnOrder(layout.columnOrder);
    setColumnWidths(layout.columnWidths);
    setPinned(layout.pinned);
    setSortConfig(layout.sortConfig);
    setDensity(layout.density);
    setNotification({ type: "success", message: `"${activeView.name}" reset to factory defaults` });
  };

  const toggleColumn = (key) => setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  const cyclePin = (key) =>
    setPinned((prev) => ({
      ...prev,
      [key]: prev[key] === "left" ? "right" : prev[key] === "right" ? null : "left",
    }));

  // ─── Row mapping ──────────────────────────────────────────────────────────
  const smes = useMemo(() => {
    return smeMatches.map((item) => {
      const currentStatus = updatedStages[item.id] || item.pipelineStage || item.currentStatus || "Matched";
      const daysInStage = calculateDaysInStage({ ...item, daysInStage: item.daysInStage });
      return {
        ...item,
        name: item.name || item.smeName || "Unnamed Business",
        bigScore: item.bigScore || 0,
        matchPercentage: item.matchPercentage || 0,
        fundingStage: item.fundingStage || "N/A",
        fundingRequired: item.fundingRequired || formatCurrency(item.fundingAmount),
        fundingAmount: item.fundingAmount || 0,
        sector: item.sector || "N/A",
        location: item.location || "N/A",
        province: item.province || "N/A",
        supportRequired: item.supportRequired || "N/A",
        servicesRequired: item.servicesRequired || "N/A",
        applicationDateRaw: toDate(item.applicationDate),
        applicationDateLabel: formatDate(item.applicationDate),
        lastActivityLabel: item.lastActivity ? (toDate(item.lastActivity) ? formatDate(item.lastActivity) : item.lastActivity) : "N/A",
        daysInStage,
        currentStatus,
        pipelineStage: currentStatus,
        statusLabel: getStatusStyle(currentStatus, activeStages).stage.name,
        nextStage: getNextStage(currentStatus, activeStages),
      };
    });
  }, [smeMatches, updatedStages, activeStages]);

  useEffect(() => { onSMEsLoaded?.(smes); }, [smes, onSMEsLoaded]);

  // ─── Filtering & Sorting ──────────────────────────────────────────────────
  const filteredAndSortedSMEs = useMemo(() => {
    let result = [...smes];

    // Stage filter from the pipeline (a stage id, not a loose string).
    if (stageFilter) {
      result = result.filter((s) => mapStatusToStageId(s.pipelineStage, activeStages) === stageFilter);
    }

    // External filters panel (owned by the parent).
    if (filters.location) {
      result = result.filter((s) => (s.location || "").toLowerCase() === filters.location.toLowerCase());
    }
    if (filters.matchScore) {
      result = result.filter((s) => (s.matchPercentage || 0) >= filters.matchScore);
    }
    if (filters.minValue) {
      const min = parseFloat(filters.minValue.toString().replace(/[^0-9.]/g, ""));
      if (!isNaN(min)) result = result.filter((s) => (s.fundingAmount || 0) >= min);
    }
    if (filters.maxValue) {
      const max = parseFloat(filters.maxValue.toString().replace(/[^0-9.]/g, ""));
      if (!isNaN(max)) result = result.filter((s) => (s.fundingAmount || 0) <= max);
    }
    if (filters.sectors?.length > 0) {
      result = result.filter((s) => filters.sectors.includes(s.sector));
    }
    if (filters.stages?.length > 0) {
      result = result.filter((s) => filters.stages.includes(s.fundingStage));
    }

    // Per-column header filters.
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
      result = result.filter((s) => localFilters.status.includes(s.statusLabel));
    }
    if (localFilters.sector?.length > 0) {
      result = result.filter((s) => localFilters.sector.some((sec) => s.sector.toLowerCase().includes(sec.toLowerCase())));
    }

    const [fundingMin, fundingMax] = localFilters.fundingRequiredRange;
    if (fundingMin != null) result = result.filter((s) => (s.fundingAmount || 0) >= fundingMin);
    if (fundingMax != null) result = result.filter((s) => (s.fundingAmount || 0) <= fundingMax);

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
    textFilter("province", "province");
    textFilter("lastActivity", "lastActivityLabel");
    textFilter("supportRequired", "supportRequired");
    textFilter("servicesRequired", "servicesRequired");

    if (sortConfig?.key === "attentionThenScore") {
      result.sort((a, b) => {
        const aFlag = getAttentionReasons(a, activeStages).length > 0 ? 1 : 0;
        const bFlag = getAttentionReasons(b, activeStages).length > 0 ? 1 : 0;
        if (aFlag !== bFlag) return bFlag - aFlag;
        return b.bigScore - a.bigScore;
      });
    } else if (sortConfig?.key) {
      const accessor = SORT_ACCESSORS[sortConfig.key] || ((r) => (r[sortConfig.key] ?? "").toString().toLowerCase());
      result.sort((a, b) => {
        const av = accessor(a);
        const bv = accessor(b);
        if (typeof av === "number" && typeof bv === "number") {
          return sortConfig.direction === "asc" ? av - bv : bv - av;
        }
        const cmp = (av ?? "").toString().localeCompare((bv ?? "").toString());
        return sortConfig.direction === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [smes, stageFilter, filters, localFilters, sortConfig, activeStages]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedSMEs.length / pageSize));
  const paginatedSMEs = filteredAndSortedSMEs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { setCurrentPage(1); }, [localFilters, pageSize, stageFilter]);

  const sectorOptions = useMemo(
    () => [...new Set(smes.map((s) => s.sector).filter((s) => s && s !== "N/A"))].sort(),
    [smes]
  );
  const fundingStageOptions = useMemo(
    () => [...new Set(smes.map((s) => s.fundingStage).filter((s) => s && s !== "N/A"))].sort(),
    [smes]
  );

  const activeFilterCount = (localFilters.name?.trim() ? 1 : 0)
    + localFilters.fundingStage.length + localFilters.status.length + localFilters.sector.length
    + (localFilters.bigScoreRange[0] > 0 || localFilters.bigScoreRange[1] < 100 ? 1 : 0)
    + (localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100 ? 1 : 0)
    + (localFilters.fundingRequiredRange[0] != null || localFilters.fundingRequiredRange[1] != null ? 1 : 0)
    + (localFilters.daysInStageRange[0] != null || localFilters.daysInStageRange[1] != null ? 1 : 0)
    + (localFilters.appliedRange[0] || localFilters.appliedRange[1] ? 1 : 0)
    + ["location", "province", "lastActivity", "supportRequired", "servicesRequired"]
      .filter((k) => localFilters[k]?.trim()).length;

  const clearAllFilters = () => {
    setLocalFilters({
      name: "", fundingStage: [], bigScoreRange: [0, 100], matchRange: [0, 100], status: [],
      sector: [], fundingRequiredRange: [null, null], daysInStageRange: [null, null],
      appliedRange: [null, null], location: "", province: "", lastActivity: "",
      supportRequired: "", servicesRequired: ""
    });
  };

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

  // ─── Widths + resize ──────────────────────────────────────────────────────
  // widthOf is declared above startResize because startResize calls it — a
  // const referenced before its initializer throws at render. It covers the
  // reorderable columns *and* the two fixed ones, so every column in the table
  // can be dragged wider.
  const widthOf = useCallback(
    (key) => columnWidths[key] ?? COLUMN_DEFS[key]?.width ?? FIXED_WIDTHS[key] ?? 140,
    [columnWidths]
  );

  const startResize = (e, key) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = widthOf(key);
    resizingRef.current = key;
    setResizingColumn(key);

    const onMove = (ev) => {
      const next = Math.max(MIN_COLUMN_WIDTH, startWidth + (ev.clientX - startX));
      setColumnWidths((prev) => ({ ...prev, [key]: next }));
    };
    const onUp = () => {
      resizingRef.current = null;
      setResizingColumn(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    // Held on <body> so the cursor doesn't flicker back as the pointer leaves
    // the 6px handle mid-drag, and so text can't be selected while resizing.
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Double-click a divider to put that column back to its default width.
  const resetColumnWidth = (key) =>
    setColumnWidths((prev) => ({
      ...prev,
      [key]: COLUMN_DEFS[key]?.width ?? FIXED_WIDTHS[key] ?? 140,
    }));

  const ColumnResizer = ({ colKey }) => (
    <div
      className="cmt-resize"
      onMouseDown={(e) => startResize(e, colKey)}
      onDoubleClick={(e) => { e.stopPropagation(); resetColumnWidth(colKey); }}
      onClick={(e) => e.stopPropagation()}
      onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
      title="Drag to resize · double-click to reset"
      style={{ background: resizingColumn === colKey ? "rgba(255,255,255,0.35)" : undefined }}
    />
  );

  // ─── Header filter + sort ─────────────────────────────────────────────────
  const openHeaderFilter = (type, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setHeaderFilterOpen((prev) => (prev?.type === type ? null : { type, rect }));
  };
  const closeHeaderFilter = () => setHeaderFilterOpen(null);

  // asc → desc → back to the default "needs attention first" sort.
  const toggleSort = (key, event) => {
    event.stopPropagation();
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { ...DEFAULT_SORT_CONFIG };
    });
  };

  const FilterTrigger = ({ type, active }) => (
    <button
      type="button"
      onClick={(e) => openHeaderFilter(type, e)}
      className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${active ? "text-[#e6d7c3]" : "text-[#c8b6a6] hover:text-white"}`}
      title="Filter this column"
    >
      <SlidersHorizontal size={11} />
    </button>
  );

  const SortTrigger = ({ columnKey }) => {
    const isActive = sortConfig?.key === columnKey;
    return (
      <button
        type="button"
        onClick={(e) => toggleSort(columnKey, e)}
        className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${isActive ? "text-[#e6d7c3]" : "text-[#c8b6a6] hover:text-white"}`}
        title={isActive ? (sortConfig.direction === "asc" ? "Sort descending" : "Clear sort") : "Sort ascending"}
      >
        {isActive
          ? (sortConfig.direction === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)
          : <ArrowUpDown size={11} />}
      </button>
    );
  };

  // ─── Popups ───────────────────────────────────────────────────────────────
  const openPopup = (type, sme, rect, options = {}) => {
    let popupWidth, popupHeight;
    switch (type) {
      case "stage": popupWidth = 450; popupHeight = 500; break;
      case "bigScore": popupWidth = 380; popupHeight = 480; break;
      case "quickActions": popupWidth = 210; popupHeight = 220; break;
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

    if (type === "stage") {
      const presetStage = options.presetStage || sme.nextStage || getNextStage(sme.currentStatus, activeStages);
      const presetId = mapStatusToStageId(presetStage, activeStages);
      setStageUpdateData({
        nextStage: presetStage,
        message: DEFAULT_STAGE_MESSAGES[presetId] || "",
        meetingTime: "", meetingLocation: "", meetingPurpose: "", agreementFile: null,
      });
      setStageFormErrors({});
      setAvailabilities(sme.availableDates || []);
    }

    if (type === "bigScore") {
      setBigScoreLoading(true);
      setBigScoreData({
        compliance: { score: 0 }, legitimacy: { score: 0 },
        fundability: { score: 0 }, governanceLeadership: { score: 0 }, operational: { score: 0 }
      });
      const userId = sme.userId || sme.smeId || sme.id;
      getDoc(doc(db, "bigEvaluations", userId))
        .then((snap) => {
          if (!snap.exists()) {
            setBigScoreData((prev) => ({ ...prev, _missing: true }));
            return;
          }
          const s = snap.data().scores || {};
          setBigScoreData({
            compliance:           { score: s.compliance           || 0 },
            legitimacy:           { score: s.legitimacy           || 0 },
            fundability:          { score: s.fundability          || 0 },
            governanceLeadership: { score: s.governanceLeadership || 0 },
            operational:          { score: s.operational          || 0 },
            _bigScore:            s.bigScore    || 0,
            _lastUpdated:         s.lastUpdated || null,
          });
        })
        .catch((err) => {
          console.error("bigEvaluations fetch error:", err);
          setBigScoreData((prev) => ({ ...prev, _error: true }));
        })
        .finally(() => setBigScoreLoading(false));
    }
  };

  const openPopupFromEvent = (type, sme, event, options) => {
    event.stopPropagation();
    openPopup(type, sme, event.currentTarget.getBoundingClientRect(), options);
  };

 const closePopup = () => {
    setActivePopup(null);
    setSelectedSMEForPopup(null);
    setShowCalendarPopup(false);
    setBigScoreLoading(false);   // 👈 add
  };

  // Forward-only through the live stages, with terminal outcomes always
  // reachable.
  const getStageProgressionError = (targetStageName, sme) => {
    const targetId = mapStatusToStageId(targetStageName, activeStages);
    const currentId = mapStatusToStageId(sme.currentStatus, activeStages);
    const target = activeStages.find((s) => s.id === targetId);
    const current = activeStages.find((s) => s.id === currentId);
    if (!target || !current) return null;
    if (target.id === current.id) return "This business is already at that stage";
    if (target.terminal) return null;
    if (current.terminal) return "This application has reached a final stage";
    if (target.order < current.order) return "Stages move forward only — use a terminal outcome to close or decline";
    return null;
  };

  const handleStageUpdate = async () => {
    const sme = selectedSMEForPopup;
    if (!sme) return;

    const stageFields = getStageFields(stageUpdateData.nextStage, activeStages);
    const targetId = mapStatusToStageId(stageUpdateData.nextStage, activeStages);
    const targetStage = activeStages.find((s) => s.id === targetId);

    const errors = {};
    if (!stageUpdateData.nextStage) errors.nextStage = "Please select a stage";
    else {
      const progressionError = getStageProgressionError(stageUpdateData.nextStage, sme);
      if (progressionError) errors.nextStage = progressionError;
    }
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
      // The parent owns persistence. The extra payload argument is additive, so
      // an existing `onUpdateStage(id, stage)` handler keeps working unchanged.
      await onUpdateStage?.(sme.id, targetStage?.name || stageUpdateData.nextStage, {
        stageId: targetId,
        message: stageUpdateData.message,
        meeting: stageFields.showMeeting ? {
          time: stageUpdateData.meetingTime,
          location: stageUpdateData.meetingLocation,
          purpose: stageUpdateData.meetingPurpose,
        } : null,
        availability: stageFields.showAvailability
          ? availabilities.map((a) => ({
              date: a.date instanceof Date ? a.date.toISOString() : a.date,
              timeSlots: a.timeSlots,
              timeZone: a.timeZone,
            }))
          : null,
        agreementFile: stageUpdateData.agreementFile || null,
      });

      const newStageName = targetStage?.name || stageUpdateData.nextStage;
      setUpdatedStages((prev) => ({ ...prev, [sme.id]: newStageName }));
      onStageOverride?.(sme.id, newStageName);
      setNotification({ type: "success", message: `${sme.name} moved to ${newStageName}` });
      closePopup();
    } catch (error) {
      console.error("Stage update error:", error);
      setNotification({ type: "error", message: `Failed to update stage: ${error.message}` });
    } finally {
      setIsStageSubmitting(false);
    }
  };

  // ─── Export ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    try {
      // Respect the table's current visual order: pinned "Business Name" first,
      // then the reorderable columns in whatever order they've been dragged
      // into, skipping hidden ones. Columns collapsed purely by viewport size
      // are still exported — they're visible in the view, just not on this
      // screen.
      const visibleCols = ["sme", ...columnOrder.filter((key) => columnVisibility[key] && EXPORT_FIELD_MAP[key])];

      if (filteredAndSortedSMEs.length === 0) {
        setNotification({ type: "error", message: "No businesses to export" });
        return;
      }

      const rows = filteredAndSortedSMEs.map((sme) => {
        const row = {};
        visibleCols.forEach((key) => {
          const label = EXPORT_HEADERS[key] || key;
          let value = sme[EXPORT_FIELD_MAP[key]];
          if (key === "match") value = value != null ? `${value}%` : "";
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
      XLSX.utils.book_append_sheet(workbook, worksheet, "Businesses");
      XLSX.writeFile(workbook, `pipeline-export-${new Date().toISOString().split("T")[0]}.xlsx`);
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

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(t);
  }, [notification]);

  // ─── Layout ───────────────────────────────────────────────────────────────
  const maxPriority = viewportWidth < 640 ? 1 : viewportWidth < 1024 ? 3 : 99;

  const visibleColumnKeys = useMemo(
    () => columnOrder.filter((key) => columnVisibility[key] && COLUMN_DEFS[key] && COLUMN_DEFS[key].priority <= maxPriority),
    [columnOrder, columnVisibility, maxPriority]
  );

  const collapsedByViewport = useMemo(
    () => columnOrder.filter((key) => columnVisibility[key] && COLUMN_DEFS[key] && COLUMN_DEFS[key].priority > maxPriority).length,
    [columnOrder, columnVisibility, maxPriority]
  );

  const orderedColumns = useMemo(() => {
    const left = visibleColumnKeys.filter((k) => pinned[k] === "left");
    const right = visibleColumnKeys.filter((k) => pinned[k] === "right");
    const middle = visibleColumnKeys.filter((k) => !pinned[k]);
    return [...left, ...middle, ...right];
  }, [visibleColumnKeys, pinned]);

  const nameWidth = widthOf(NAME_KEY);
  const actionWidth = widthOf(ACTION_KEY);

  const stickyOffsets = useMemo(() => {
    const offsets = {};
    // Left-pinned columns stack to the right of the frozen name column.
    let leftAcc = nameWidth;
    orderedColumns.forEach((key) => {
      if (pinned[key] === "left") {
        offsets[key] = { side: "left", value: leftAcc };
        leftAcc += widthOf(key);
      }
    });
    // Actions is not pinned, so right-pinned columns stick to the table edge.
    let rightAcc = 0;
    [...orderedColumns].reverse().forEach((key) => {
      if (pinned[key] === "right") {
        offsets[key] = { side: "right", value: rightAcc };
        rightAcc += widthOf(key);
      }
    });
    return offsets;
  }, [orderedColumns, pinned, widthOf, nameWidth]);

  const totalWidth = nameWidth + actionWidth + orderedColumns.reduce((sum, key) => sum + widthOf(key), 0);

  const cellPad = density === "compact" ? "py-2 px-2" : density === "ultra-compact" ? "py-1.5 px-1.5" : "py-3 px-3";
  const cellFont = density === "comfortable" ? "text-sm" : "text-xs";
  const avatarSize = density === "comfortable" ? "w-8 h-8" : density === "compact" ? "w-7 h-7" : "w-6 h-6";
  const headerPadding = density === "comfortable" ? "0.7rem 0.6rem" : "0.5rem 0.6rem";

  const searchedColumns = DEFAULT_COLUMN_ORDER.filter((key) =>
    COLUMN_DEFS[key].label.toLowerCase().includes(columnSearch.toLowerCase())
  );

  // ─── Cell renderer ────────────────────────────────────────────────────────
  const renderCell = (key, sme, rowBg) => {
    const offset = stickyOffsets[key];
    const stickyStyle = offset
      ? {
          position: "sticky",
          [offset.side]: `${offset.value}px`,
          zIndex: 9,
          backgroundColor: rowBg,
          boxShadow: offset.side === "left" ? "2px 0 0 #e6d7c3" : "-2px 0 0 #e6d7c3",
        }
      : {};
    const cls = `${cellPad} ${cellFont} text-[#4a352f] border-r border-b border-[#e6d7c3] align-top`;

    switch (key) {
      case "bigScore": {
        const label = getBigScoreLabel(sme.bigScore);
        return (
         <td
            key={key}
            className={`${cellPad} text-center border-r border-b border-[#e6d7c3] align-top cursor-pointer hover:bg-[#faf7f2]/60 transition-colors`}
            style={stickyStyle}
            onClick={(e) => openPopupFromEvent("bigScore", sme, e)}
            title="Click to see the BIG Score breakdown"
          >
            <div className="flex flex-col items-center gap-1">
              <div className="relative w-11 h-11">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#e6d7c3" strokeWidth="3" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke={label.color} strokeWidth="3" strokeDasharray={`${sme.bigScore * 0.88} 88`} strokeLinecap="round" />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center ${cellFont} font-semibold`} style={{ color: label.color }}>{sme.bigScore}</span>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: `${label.color}20`, color: label.color }}>{label.label}</span>
            </div>
          </td>
        );
      }
      case "match": {
        const label = getMatchLabel(sme.matchPercentage);
        return (
          <td key={key} className={`${cellPad} text-center border-r border-b border-[#e6d7c3] align-top`} style={stickyStyle}>
            <div className="flex flex-col items-center gap-1 w-full">
              <span className={`${cellFont} font-semibold text-[#4a352f]`}>{sme.matchPercentage}%</span>
              <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: label.color }}>{label.label}</span>
              <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${sme.matchPercentage}%`, backgroundColor: label.color }} />
              </div>
            </div>
          </td>
        );
      }
      case "fundingStage":
        return (
          <td key={key} className={cls} style={stickyStyle}>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f5f0e1] rounded-full text-xs font-medium">{sme.fundingStage}</span>
          </td>
        );
      case "fundingRequired":
        return <td key={key} className={cls} style={stickyStyle}><span className="font-medium">{sme.fundingRequired}</span></td>;
      case "status": {
        const statusStyle = getStatusStyle(sme.currentStatus, activeStages);
        return (
          <td key={key} className={`${cellPad} border-r border-b border-[#e6d7c3] align-top`} style={stickyStyle}>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
              style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, borderColor: statusStyle.border }}
              title={statusStyle.stage.tooltip}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusStyle.dot }} />
              {statusStyle.stage.name}
            </span>
          </td>
        );
      }
      case "applied":
        return (
          <td key={key} className={cls} style={stickyStyle}>
            <div className="flex items-center gap-1.5"><Calendar size={13} className="text-[#7d5a50] flex-shrink-0" />{sme.applicationDateLabel}</div>
          </td>
        );
      case "daysInStage":
        return (
          <td key={key} className={cls} style={stickyStyle}>
            <div className="flex items-center gap-1.5"><Clock size={13} className="text-[#7d5a50] flex-shrink-0" />{sme.daysInStage} days</div>
          </td>
        );
      case "lastActivity":
        return <td key={key} className={cls} style={stickyStyle}>{sme.lastActivityLabel}</td>;
      case "sector":
      case "location":
      case "province":
        return <td key={key} className={cls} style={stickyStyle}><span className="break-words">{sme[key]}</span></td>;
      case "supportRequired":
      case "servicesRequired":
        return <td key={key} className={cls} style={stickyStyle}><span className="line-clamp-2 break-words">{sme[key]}</span></td>;
      default:
        return null;
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
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
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4a352f] border border-[#c8b6a6]">
              <LayoutGrid size={12} className="text-[#7d5a50] flex-shrink-0" />
              Viewing: {activeView.name}
              {activeView.description && (<span className="font-normal text-[#a89482]"> — {activeView.description}</span>)}
            </span>
            {activeFilterCount > 0 && (
              <>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#fff3e0] text-[#e65100] border border-[#e65100]/30">
                  <SlidersHorizontal size={12} /> {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                </span>
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#a67c52] hover:text-[#4a352f] hover:bg-white border border-[#e6d7c3] transition-colors"
                >
                  Clear all filters
                </button>
              </>
            )}
            {collapsedByViewport > 0 && (
              <span className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#a89482] border border-[#e6d7c3]">
                {collapsedByViewport} column{collapsedByViewport > 1 ? "s" : ""} hidden on this screen size
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* ─── Customize Table (Views + Columns + Density + Reset) ──── */}
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
                <SlidersHorizontal size={16} /> Customize Table <ChevronDown size={14} className={`transition-transform ${showColumnChooser ? "rotate-180" : ""}`} />
              </button>

              {showColumnChooser && columnChooserRect && (() => {
                const panelWidth = 340;
                const margin = 12;
                let left = columnChooserRect.right - panelWidth;
                left = Math.min(Math.max(left, margin), window.innerWidth - panelWidth - margin);
                const spaceBelow = window.innerHeight - columnChooserRect.bottom - margin - 8;
                const spaceAbove = columnChooserRect.top - margin - 8;
                const openUpward = spaceBelow < 320 && spaceAbove > spaceBelow;
                const maxHeight = Math.max(200, Math.min(640, openUpward ? spaceAbove : spaceBelow));
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
                                    onChange={(e) => setEditingViewMeta((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="View name"
                                    className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm"
                                  />
                                ) : (
                                  <p className="text-sm font-semibold text-[#4a352f]">Default <span className="font-normal text-[#a89482] text-xs">(name can't be changed)</span></p>
                                )}
                                <textarea
                                  value={editingViewMeta.description}
                                  onChange={(e) => setEditingViewMeta((prev) => ({ ...prev, description: e.target.value }))}
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
                            <div key={view.id} className={`flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg ${isActive ? "bg-[#f5f0e1]" : "hover:bg-[#faf7f2]"}`}>
                              <button onClick={() => switchToView(view.id)} className="flex-1 text-left min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {isActive && <CheckCircle size={12} className="text-[#7d5a50] flex-shrink-0" />}
                                  <span className={`text-sm ${isActive ? "font-semibold text-[#4a352f]" : "text-[#4a352f]"}`}>{view.name}</span>
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
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Columns</h4>

                      <div className="relative mb-3">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a89482] pointer-events-none" />
                        <input
                          value={columnSearch}
                          onChange={(e) => setColumnSearch(e.target.value)}
                          placeholder="Search columns..."
                          className="w-full pl-7 pr-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                        />
                      </div>

                      <p className="text-xs text-[#a89482] mb-3 flex items-center gap-1.5">
                        <GripVertical size={12} className="flex-shrink-0" /> Drag a header to reorder, drag its right edge to resize. Every column resizes, including the pinned ones.
                      </p>

                      <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg opacity-75">
                        <input type="checkbox" checked disabled className="rounded border-[#c8b6a6]" />
                        <span className="text-sm text-[#4a352f] flex-1">Business Name</span>
                        <span className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold">Pinned</span>
                      </div>
                      <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg opacity-75">
                        <input type="checkbox" checked disabled className="rounded border-[#c8b6a6]" />
                        <span className="text-sm text-[#4a352f] flex-1">Actions</span>
                        <span className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold">Always last</span>
                      </div>
                      <div className="border-t border-[#e6d7c3] my-2" />

                      {searchedColumns.length === 0 && <p className="text-xs text-[#a89482] px-2 py-1.5">No columns match that search.</p>}
                      {searchedColumns.map((key) => (
                        <div key={key} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[#faf7f2]">
                          <label className="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
                            <input
                              type="checkbox"
                              checked={columnVisibility[key] || false}
                              onChange={() => toggleColumn(key)}
                              className="rounded border-[#c8b6a6] text-[#7d5a50]"
                            />
                            <span className="text-sm text-[#4a352f] truncate">{COLUMN_DEFS[key].label}</span>
                          </label>
                          <button
                            onClick={() => cyclePin(key)}
                            title={pinned[key] === "left" ? "Pinned left — click to pin right" : pinned[key] === "right" ? "Pinned right — click to unpin" : "Pin left"}
                            className={`p-1 rounded flex-shrink-0 ${pinned[key] ? "text-[#7d5a50]" : "text-[#c8b6a6] hover:text-[#7d5a50]"}`}
                          >
                            {pinned[key] ? <Pin size={13} /> : <PinOff size={13} />}
                          </button>
                          <span className="text-[10px] text-[#a89482] w-7 text-right flex-shrink-0">
                            {pinned[key] === "left" ? "L" : pinned[key] === "right" ? "R" : ""}
                          </span>
                        </div>
                      ))}

                      <div className="border-t border-[#e6d7c3] my-4" />
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Density</h4>
                      <div className="flex gap-1.5 mb-1">
                        {[{ key: "comfortable", label: "Comfortable" }, { key: "compact", label: "Compact" }, { key: "ultra-compact", label: "Ultra" }].map((d) => (
                          <button
                            key={d.key}
                            onClick={() => setDensity(d.key)}
                            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${density === d.key ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}
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
      <div className="bg-white rounded-b-2xl border border-[#e6d7c3] shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8"><div className="space-y-4">{[...Array(8)].map((_, i) => (<div key={i} className="h-10 bg-[#f5f0e1] rounded-lg animate-pulse" />))}</div></div>
        ) : (
          <>
            <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
              <style>{`
                /* No 'position: relative' here — it silently overrides the
                   sticky positioning on every <th>, so the header would scroll
                   away while the pinned body cells stayed. Sticky is itself a
                   positioned ancestor, so the grip and resize handle still
                   anchor. */
                .cmt-th { color: #faf7f2 !important; vertical-align: top !important; }
                .cmt-th-draggable { cursor: grab; }
                .cmt-th-draggable:active { cursor: grabbing; }
                .cmt-th-row { display: flex; align-items: flex-start; gap: 2px; min-width: 0; }
                /* overflow-wrap: normal stops the browser splitting inside a
                   word, which is what turns "Match %" into "MAT CH.." and
                   "Status" into "STA TUS" in narrow columns. */
                .cmt-th-label {
                  flex: 1 1 auto; min-width: 0;
                  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
                  overflow: hidden; white-space: normal;
                  overflow-wrap: normal; word-break: normal; hyphens: none;
                  line-height: 1.2; letter-spacing: 0.02em;
                }
                .cmt-th-tools { display: flex; align-items: center; flex-shrink: 0; }
                /* The drag grip leaves the flex flow and only appears on hover,
                   buying every header ~14px more room for its label. */
                .cmt-th-grip { position: absolute; left: 3px; top: 10px; opacity: 0; transition: opacity .15s; }
                .cmt-th:hover .cmt-th-grip { opacity: .45; }
                .cmt-resize { position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: col-resize; z-index: 5; }
                .cmt-resize:hover { background: rgba(255,255,255,0.25); }
              `}</style>

              <table
                className="text-sm"
                style={{
                  /* separate (not collapse) — collapsed borders are dropped by
                     sticky cells, which makes the pinned column lose its edge
                     and mispaint over its neighbour while scrolling. */
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  tableLayout: "fixed",
                  width: totalWidth,
                  minWidth: "100%",
                }}
              >
                <thead>
                  <tr>
                    {/* Business Name — pinned first column, resizable like the rest */}
                    <th
                      className="cmt-th text-left font-semibold uppercase tracking-wider text-xs sticky top-0 left-0 z-30"
                      style={{
                        backgroundColor: "#4a352f",
                        width: nameWidth,
                        padding: headerPadding,
                        borderBottom: "1px solid #e6d7c3",
                        boxShadow: "2px 0 0 #e6d7c3",
                      }}
                    >
                      <div className="cmt-th-row">
                        <span className="cmt-th-label" title="Business Name">Business Name</span>
                        <span className="cmt-th-tools">
                          <SortTrigger columnKey={NAME_KEY} />
                          <FilterTrigger type="name" active={!!localFilters.name.trim()} />
                          <HeaderInfoTooltip text="The registered name of the business. Click the eye to open its full profile." />
                        </span>
                      </div>
                      <ColumnResizer colKey={NAME_KEY} />
                    </th>

                    {/* ─── Reorderable columns ──────────────────────── */}
                    {orderedColumns.map((key) => {
                      const col = COLUMN_DEFS[key];
                      const isDragging = draggedColumn === key;
                      const isDragOver = dragOverColumn === key && draggedColumn !== key;
                      const offset = stickyOffsets[key];
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
                          className={`cmt-th cmt-th-draggable font-semibold uppercase tracking-wider text-xs sticky top-0 select-none transition-opacity ${col.align === "center" ? "text-center" : "text-left"} ${isDragging ? "opacity-40" : ""}`}
                          style={{
                            width: widthOf(key),
                            padding: headerPadding,
                            backgroundColor: isDragOver ? "#5a423b" : "#4a352f",
                            zIndex: offset ? 25 : 20,
                            borderBottom: "1px solid #e6d7c3",
                            borderRight: "1px solid #e6d7c3",
                            ...(offset
                              ? {
                                  [offset.side]: `${offset.value}px`,
                                  boxShadow: offset.side === "left" ? "2px 0 0 #e6d7c3" : "-2px 0 0 #e6d7c3",
                                }
                              : {}),
                          }}
                        >
                          <GripVertical size={11} className="cmt-th-grip" />
                          <div className={`cmt-th-row ${col.align === "center" ? "justify-center" : ""}`}>
                            <span className="cmt-th-label" title={col.label}>{col.label}</span>
                            <span className="cmt-th-tools">
                              {pinned[key] && <Pin size={10} className="opacity-60 mt-0.5" />}
                              {col.sortable && <SortTrigger columnKey={key} />}
                              {col.filterType && <FilterTrigger type={col.filterType} active={getFilterActive(col.filterType)} />}
                              <HeaderInfoTooltip text={col.tooltip} />
                            </span>
                          </div>
                          <ColumnResizer colKey={key} />
                        </th>
                      );
                    })}

                    {/* Actions scrolls horizontally with the table — only top-0,
                        so it still holds position on vertical scroll. */}
                    <th
                      className="cmt-th text-center font-semibold uppercase tracking-wider text-xs sticky top-0 z-20"
                      style={{
                        backgroundColor: "#4a352f",
                        width: actionWidth,
                        padding: headerPadding,
                        borderBottom: "1px solid #e6d7c3",
                      }}
                    >
                      <div className="cmt-th-row justify-center">
                        <span className="cmt-th-label">Actions</span>
                        <HeaderInfoTooltip text="Move the application to its next stage, or open quick actions to view the profile, message the business or decline it." />
                      </div>
                      <ColumnResizer colKey={ACTION_KEY} />
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedSMEs.length === 0 ? (
                    <tr>
                      <td colSpan={orderedColumns.length + 2} className="text-center py-20 border-b border-[#e6d7c3]">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-20 h-20 rounded-full bg-[#f5f0e1] flex items-center justify-center"><Users size={32} className="text-[#7d5a50] opacity-50" /></div>
                          <p className="text-lg font-semibold text-[#4a352f]">No Businesses Found</p>
                          <p className="text-sm text-[#7d5a50] max-w-xs">
                            {activeFilterCount > 0 ? "Clear a filter to widen the list." : "Matched businesses will appear here as your programme criteria are applied."}
                          </p>
                          {activeFilterCount > 0 && (
                            <button onClick={clearAllFilters} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7d5a50] text-white">Clear all filters</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedSMEs.map((sme) => {
                      const statusStyle = getStatusStyle(sme.currentStatus, activeStages);
                      const isTerminal = !!statusStyle.stage.terminal;
                      const nextStageLabel = sme.nextStage || "—";
                      const rowBg = hoveredRowKey === sme.id ? "#fdf8f4" : "#ffffff";

                      return (
                        <tr
                          key={sme.id}
                          onMouseEnter={() => setHoveredRowKey(sme.id)}
                          onMouseLeave={() => setHoveredRowKey(null)}
                          style={{ backgroundColor: rowBg, transition: "background-color .15s" }}
                        >
                          {/* Business Name — pinned left */}
                          <td
                            className={`${cellPad} ${cellFont} text-[#4a352f] sticky left-0 z-10 align-top border-b border-[#e6d7c3]`}
                            style={{ width: nameWidth, backgroundColor: rowBg, boxShadow: "2px 0 0 #e6d7c3" }}
                          >
                            <div className="flex items-start gap-2 min-w-0">
                              <div className={`${avatarSize} rounded-full bg-gradient-to-br from-[#7d5a50] to-[#4a352f] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5`}>
                                {(sme.name || "B").charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-1.5 flex-wrap">
                                  <span className="font-medium leading-snug text-[#4a352f] break-words">{sme.name}</span>
                                  <button
                                    onClick={() => setSelectedSME(sme)}
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

                          {orderedColumns.map((key) => renderCell(key, sme, rowBg))}

                          {/* Actions — scrolls with the table */}
                          <td
                            className={`${cellPad} align-top border-b border-[#e6d7c3] text-center`}
                            style={{ width: actionWidth, backgroundColor: rowBg }}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={(e) => { if (!isTerminal) openPopupFromEvent("stage", sme, e); }}
                                disabled={isTerminal}
                                title={isTerminal ? `${statusStyle.stage.name} — no further stage` : `Move to ${nextStageLabel}`}
                                className={`inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                                  isTerminal ? "bg-[#e6d7c3]/60 text-[#a89482] cursor-not-allowed" : "text-white hover:shadow-md hover:brightness-105"
                                }`}
                                style={{
                                  width: `${Math.max(100, actionWidth - 62)}px`,
                                  height: "34px",
                                  backgroundColor: isTerminal ? undefined : "#7d5a50",
                                }}
                              >
                                {!isTerminal && <ArrowRight size={13} className="flex-shrink-0" />}
                                <span className="truncate">{isTerminal ? statusStyle.stage.name : nextStageLabel}</span>
                              </button>
                              <button
                                onClick={(e) => openPopupFromEvent("quickActions", sme, e)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all hover:bg-[#f5f0e1] flex-shrink-0"
                                style={{ borderColor: "#7d5a5050", color: "#7d5a50" }}
                                title="More actions"
                                aria-label="More actions"
                              >
                                <MoreVertical size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#e6d7c3] bg-[#faf7f2] rounded-b-2xl flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#4a352f]">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filteredAndSortedSMEs.length)}-{Math.min(currentPage * pageSize, filteredAndSortedSMEs.length)} of {filteredAndSortedSMEs.length} Businesses
                </span>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f]">
                  <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">First</button>
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">Prev</button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pn;
                  if (totalPages <= 5) pn = i + 1;
                  else if (currentPage <= 3) pn = i + 1;
                  else if (currentPage >= totalPages - 2) pn = totalPages - 4 + i;
                  else pn = currentPage - 2 + i;
                  return <button key={pn} onClick={() => setCurrentPage(pn)} className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage === pn ? "bg-[#7d5a50] text-white" : "bg-white border border-[#c8b6a6] text-[#4a352f]"}`}>{pn}</button>;
                })}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">Next</button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">Last</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Drag-to-reorder hint tooltip ─────────────────────────────────── */}
      {dragHintRect && !draggedColumn && (
        <PopupPortal>
          <div
            className="fixed z-[1200] bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none normal-case font-normal flex items-center gap-1.5"
            style={{
              top: dragHintRect.bottom + 8,
              left: Math.min(Math.max(dragHintRect.left, 12), window.innerWidth - 210),
              width: "200px",
            }}
          >
            <GripVertical size={12} className="flex-shrink-0" /> Drag to reorder · edge to resize
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
              left: Math.min(Math.max(headerFilterOpen.rect.left - 20, 12), window.innerWidth - 312),
              width: "300px",
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            {headerFilterOpen.type === "name" && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Filter by business name</label>
                  {localFilters.name && (
                    <button onClick={() => setLocalFilters((p) => ({ ...p, name: "" }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <input
                  autoFocus type="text" value={localFilters.name}
                  onChange={(e) => { setLocalFilters((p) => ({ ...p, name: e.target.value })); setCurrentPage(1); }}
                  placeholder="Search business name..."
                  className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20"
                />
              </>
            )}

            {(headerFilterOpen.type === "bigScore" || headerFilterOpen.type === "match") && (() => {
              const isBig = headerFilterOpen.type === "bigScore";
              const rangeKey = isBig ? "bigScoreRange" : "matchRange";
              const range = localFilters[rangeKey];
              return (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-[#4a352f]">{isBig ? "BIG Score" : "Match %"}: {range[0]} - {range[1]}</label>
                    {(range[0] > 0 || range[1] < 100) && (
                      <button onClick={() => setLocalFilters((p) => ({ ...p, [rangeKey]: [0, 100] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <input type="number" min="0" max="100" value={range[0]}
                      onChange={(e) => setLocalFilters((p) => ({ ...p, [rangeKey]: [Math.min(parseInt(e.target.value) || 0, p[rangeKey][1]), p[rangeKey][1]] }))}
                      className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                    <span className="text-[#7d5a50]">to</span>
                    <input type="number" min="0" max="100" value={range[1]}
                      onChange={(e) => setLocalFilters((p) => ({ ...p, [rangeKey]: [p[rangeKey][0], Math.max(parseInt(e.target.value) || 0, p[rangeKey][0])] }))}
                      className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                  </div>
                  <input type="range" min="0" max="100" value={range[0]}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, [rangeKey]: [parseInt(e.target.value), p[rangeKey][1]] }))}
                    className="w-full accent-[#7d5a50]" />
                </>
              );
            })()}

            {headerFilterOpen.type === "status" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Status</label>
                  {localFilters.status.length > 0 && (
                    <button onClick={() => setLocalFilters((p) => ({ ...p, status: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeStages.map((s) => (
                    <button key={s.id}
                      onClick={() => setLocalFilters((p) => ({ ...p, status: p.status.includes(s.name) ? p.status.filter((x) => x !== s.name) : [...p.status, s.name] }))}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.status.includes(s.name) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {(headerFilterOpen.type === "fundingStage" || headerFilterOpen.type === "sector") && (() => {
              const isStage = headerFilterOpen.type === "fundingStage";
              const key = isStage ? "fundingStage" : "sector";
              const options = isStage
                ? (fundingStageOptions.length ? fundingStageOptions : ["Startup", "Growth", "Scale", "Established"])
                : sectorOptions;
              return (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-[#4a352f]">{isStage ? "Funding Stage" : "Sector"}</label>
                    {localFilters[key].length > 0 && (
                      <button onClick={() => setLocalFilters((p) => ({ ...p, [key]: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
                    {options.length === 0 && <span className="text-xs text-[#a89482]">No data available</span>}
                    {options.map((s) => (
                      <button key={s}
                        onClick={() => setLocalFilters((p) => ({ ...p, [key]: p[key].includes(s) ? p[key].filter((x) => x !== s) : [...p[key], s] }))}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters[key].includes(s) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              );
            })()}

            {(headerFilterOpen.type === "fundingRequired" || headerFilterOpen.type === "daysInStage") && (() => {
              const isFunding = headerFilterOpen.type === "fundingRequired";
              const key = isFunding ? "fundingRequiredRange" : "daysInStageRange";
              const range = localFilters[key];
              return (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#4a352f]">{isFunding ? "Funding Required (R)" : "Days in Stage"}</label>
                    {(range[0] != null || range[1] != null) && (
                      <button onClick={() => setLocalFilters((p) => ({ ...p, [key]: [null, null] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="number" min="0" placeholder="Min" value={range[0] ?? ""}
                      onChange={(e) => setLocalFilters((p) => ({ ...p, [key]: [e.target.value === "" ? null : Number(e.target.value), p[key][1]] }))}
                      className="w-full px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                    <span className="text-[#7d5a50]">to</span>
                    <input type="number" min="0" placeholder="Max" value={range[1] ?? ""}
                      onChange={(e) => setLocalFilters((p) => ({ ...p, [key]: [p[key][0], e.target.value === "" ? null : Number(e.target.value)] }))}
                      className="w-full px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                  </div>
                </>
              );
            })()}

            {headerFilterOpen.type === "applied" && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Applied Date</label>
                  {(localFilters.appliedRange[0] || localFilters.appliedRange[1]) && (
                    <button onClick={() => setLocalFilters((p) => ({ ...p, appliedRange: [null, null] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <div className="space-y-2">
                  <input type="date" value={localFilters.appliedRange[0] || ""}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, appliedRange: [e.target.value || null, p.appliedRange[1]] }))}
                    className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm" />
                  <input type="date" value={localFilters.appliedRange[1] || ""}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, appliedRange: [p.appliedRange[0], e.target.value || null] }))}
                    className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm" />
                </div>
              </>
            )}

            {["location", "province", "lastActivity", "supportRequired", "servicesRequired"].includes(headerFilterOpen.type) && (() => {
              const key = headerFilterOpen.type;
              const labels = {
                location: "location", province: "province", lastActivity: "last activity",
                supportRequired: "support required", servicesRequired: "services required",
              };
              return (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#4a352f]">Filter by {labels[key]}</label>
                    {localFilters[key] && (
                      <button onClick={() => setLocalFilters((p) => ({ ...p, [key]: "" }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                    )}
                  </div>
                  <input autoFocus type="text" value={localFilters[key]}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={`Search ${labels[key]}...`}
                    className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20" />
                </>
              );
            })()}
          </div>
        </PopupPortal>
      )}


{/* ─── BIG Score Breakdown Popup ────────────────────────────────────── */}
      {activePopup?.type === "bigScore" && selectedSMEForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div
            className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: "380px", maxHeight: "480px", overflowY: "auto" }}
          >
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">BIG Score</p>
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[200px]">{selectedSMEForPopup.name}</h3>
                  {bigScoreData._lastUpdated && (
                    <p className="text-[10px] text-[#f5f0e1]/70 mt-0.5">
                      Updated {formatDate(bigScoreData._lastUpdated)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center text-xl font-bold">
                    {bigScoreLoading ? "…" : (bigScoreData._bigScore || selectedSMEForPopup.bigScore)}
                  </div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors p-1"><X size={18} /></button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {bigScoreLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (<div key={i} className="h-16 bg-[#f5f0e1] rounded-xl animate-pulse" />))}
                </div>
              ) : bigScoreData._error ? (
                <p className="text-xs text-red-600 text-center py-6">Couldn't load the breakdown. Try again shortly.</p>
              ) : bigScoreData._missing ? (
                <p className="text-xs text-[#7d5a50] text-center py-6">
                  No detailed BIG Score breakdown has been recorded for this business yet.
                </p>
              ) : (
                [
                  { key: "compliance",           label: "Compliance",             desc: "Regulatory & legal standing" },
                  { key: "legitimacy",           label: "Legitimacy",             desc: "Business verification status" },
                  { key: "fundability",          label: "Capital Appeal",         desc: "Investment readiness & fundability" },
                  { key: "governanceLeadership", label: "Governance & Leadership",desc: "Governance structure & leadership capability" },
                  { key: "operational",          label: "Operational",            desc: "Operational capacity & systems" },
                ].map(({ key, label, desc }) => {
                  const score = bigScoreData[key]?.score || 0;
                  const lbl = getBigScoreLabel(score);
                  return (
                    <div key={key} className="bg-[#faf7f2] rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-[#4a352f]">{label}</span>
                          <p className="text-[10px] text-[#7d5a50]">{desc}</p>
                        </div>
                        <span className="text-sm font-bold flex-shrink-0" style={{ color: lbl.color }}>{score}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#e6d7c3] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: lbl.color }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </PopupPortal>
      )}

      
      {/* ─── Stage Update Popup ───────────────────────────────────────────── */}
      {activePopup?.type === "stage" && selectedSMEForPopup && (() => {
        const stageFields = getStageFields(stageUpdateData.nextStage, activeStages);
        return (
          <PopupPortal>
            <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
            <div className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden"
              style={{ top: activePopup.position.y, left: activePopup.position.x, width: "450px", maxHeight: "550px", overflowY: "auto" }}>
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
                      const stageId = mapStatusToStageId(e.target.value, activeStages);
                      setStageUpdateData((prev) => ({
                        ...prev,
                        nextStage: e.target.value,
                        message: DEFAULT_STAGE_MESSAGES[stageId] || prev.message,
                      }));
                      setStageFormErrors((prev) => ({ ...prev, nextStage: null }));
                    }}
                    className={`w-full px-3 py-2 border-2 rounded-lg text-xs ${stageFormErrors.nextStage ? "border-red-500" : "border-[#c8b6a6]"}`}
                  >
                    <option value="">Choose a stage...</option>
                    {activeStages.map((s) => (<option key={s.id} value={s.name}>{s.name}</option>))}
                  </select>
                  {stageFormErrors.nextStage && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertTriangle size={12} /> {stageFormErrors.nextStage}</p>}
                </div>

                {stageUpdateData.nextStage && (
                  <>
                    {stageFields.showMessage && (
                      <div>
                        <label className="block text-xs font-semibold text-[#4a352f] mb-1">Message to Business *</label>
                        <textarea
                          value={stageUpdateData.message}
                          onChange={(e) => setStageUpdateData((prev) => ({ ...prev, message: e.target.value }))}
                          placeholder="Enter your message..." rows={4}
                          className={`w-full px-3 py-2 border-2 rounded-lg text-xs resize-y ${stageFormErrors.message ? "border-red-500" : "border-[#c8b6a6]"}`}
                        />
                        <p className="text-[11px] text-[#a89482] mt-1">A template is loaded for this stage — edit it to suit.</p>
                        {stageFormErrors.message && <p className="text-red-500 text-xs mt-1">{stageFormErrors.message}</p>}
                      </div>
                    )}

                    {stageFields.showMeeting && (
                      <div className="bg-[#faf7f2] rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-semibold text-[#4a352f] flex items-center gap-2"><Video size={14} /> Schedule Meeting</h4>
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Meeting Time</label>
                          <input type="datetime-local" value={stageUpdateData.meetingTime}
                            onChange={(e) => setStageUpdateData((prev) => ({ ...prev, meetingTime: e.target.value }))}
                            className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-xs" />
                        </div>
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Location *</label>
                          <input type="text" value={stageUpdateData.meetingLocation}
                            onChange={(e) => setStageUpdateData((prev) => ({ ...prev, meetingLocation: e.target.value }))}
                            placeholder="Office, Virtual, etc."
                            className={`w-full px-3 py-2 border-2 rounded-lg text-xs ${stageFormErrors.meetingLocation ? "border-red-500" : "border-[#c8b6a6]"}`} />
                          {stageFormErrors.meetingLocation && <p className="text-red-500 text-xs mt-1">{stageFormErrors.meetingLocation}</p>}
                        </div>
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Purpose *</label>
                          <input type="text" value={stageUpdateData.meetingPurpose}
                            onChange={(e) => setStageUpdateData((prev) => ({ ...prev, meetingPurpose: e.target.value }))}
                            placeholder="Initial discussion, site visit, etc."
                            className={`w-full px-3 py-2 border-2 rounded-lg text-xs ${stageFormErrors.meetingPurpose ? "border-red-500" : "border-[#c8b6a6]"}`} />
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
                                    {a.date?.toLocaleDateString?.("en-ZA", { weekday: "short", month: "short", day: "numeric" }) || "Date unavailable"}
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

                    {stageFields.showAgreement && (
                      <div>
                        <label className="block text-xs font-semibold text-[#4a352f] mb-1">Offer / Agreement Document (PDF, DOC)</label>
                        <input type="file" accept=".pdf,.doc,.docx"
                          onChange={(e) => setStageUpdateData((prev) => ({ ...prev, agreementFile: e.target.files[0] }))}
                          className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-xs" />
                        {stageUpdateData.agreementFile && (
                          <p className="text-xs text-green-700 mt-1">Selected: {stageUpdateData.agreementFile.name}</p>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={closePopup} className="px-4 py-2 bg-[#faf7f2] text-[#7d5a50] rounded-lg text-xs font-medium hover:bg-[#f5f0e1] transition-all">Cancel</button>
                  <button onClick={handleStageUpdate} disabled={isStageSubmitting} className="px-4 py-2 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold hover:bg-[#4a352f] transition-all disabled:opacity-50">
                    {isStageSubmitting ? "Updating..." : "Update Stage"}
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Popup */}
            {showCalendarPopup && (
              <>
                <div className="fixed inset-0 z-[1100]" onClick={() => setShowCalendarPopup(false)} />
                <div className="fixed z-[1101] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-6"
                  style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "360px", maxHeight: "80vh", overflowY: "auto" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-[#4a352f]">Select Available Dates</h4>
                    <button onClick={() => setShowCalendarPopup(false)} className="text-[#7d5a50] hover:text-[#4a352f]"><X size={18} /></button>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-[#4a352f] mb-2">Time Slot</label>
                    <div className="flex gap-2">
                      <input type="time" value={timeSlot.start} onChange={(e) => handleTimeChange("start", e.target.value)} className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs" />
                      <span className="text-[#7d5a50] self-center">to</span>
                      <input type="time" value={timeSlot.end} onChange={(e) => handleTimeChange("end", e.target.value)} className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs" />
                    </div>
                  </div>
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {[...Array(12)].map((_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() + i + 1);
                      const isSelected = tempDates.some((d) => d.toDateString() === date.toDateString());
                      return (
                        <button
                          key={i}
                          onClick={() => handleDateSelect(
                            isSelected
                              ? tempDates.filter((d) => d.toDateString() !== date.toDateString())
                              : [...tempDates, date]
                          )}
                          className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                            isSelected ? "bg-[#7d5a50] text-white border-[#7d5a50]" : "bg-[#faf7f2] text-[#4a352f] border-[#e6d7c3] hover:bg-[#f5f0e1]"
                          }`}
                        >
                          {date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                        </button>
                      );
                    })}
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
      {activePopup?.type === "quickActions" && selectedSMEForPopup && (() => {
        const sme = selectedSMEForPopup;
        const stage = getStatusStyle(sme.currentStatus, activeStages).stage;
        const declinedStage = activeStages.find((s) => s.terminal && /declined/i.test(s.name));
        return (
          <PopupPortal>
            <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
            <div className="fixed z-[1001] bg-white rounded-xl shadow-2xl border border-[#e6d7c3] py-1 overflow-hidden"
              style={{ top: activePopup.position.y, left: activePopup.position.x, width: "210px" }}>
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#e6d7c3]">
                <span className="text-xs font-semibold text-[#4a352f]">Quick Actions</span>
                <button onClick={closePopup} className="text-[#7d5a50] hover:text-[#4a352f]"><X size={14} /></button>
              </div>
              <button onClick={() => { setSelectedSME(sme); closePopup(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><Eye size={12} /> View Profile</button>
              {!stage.terminal && (
                <button onClick={(e) => openPopupFromEvent("stage", sme, e)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left">
                  <ArrowRight size={12} /> Move to {sme.nextStage}
                </button>
              )}
              <button
                onClick={() => { window.location.href = `/cmf-messages?smeId=${sme.id}`; }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
              >
                <MessageSquare size={12} /> Message Business
              </button>
              {!stage.terminal && declinedStage && (
                <button
                  onClick={(e) => openPopupFromEvent("stage", sme, e, { presetStage: declinedStage.name })}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 text-left border-t border-[#e6d7c3]"
                >
                  <XCircle size={12} /> Decline Application
                </button>
              )}
            </div>
          </PopupPortal>
        );
      })()}

      {/* ─── Business Details Modal ───────────────────────────────────────── */}
      <CMFSMEDetailsModal
        sme={selectedSME}
        isOpen={!!selectedSME}
        onClose={() => setSelectedSME(null)}
      />
    </div>
  );
}

// Default export alongside the named export so this component resolves whether
// the importing file uses `import CMFSMETable from "./CMFSMETable"` or
// `import { CMFSMETable } from "./CMFSMETable"`.
export default CMFSMETable;