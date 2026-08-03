"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Info, Calendar, X, Eye, ChevronDown, MoreVertical, CheckCircle,
  Clock, Users, Download, MessageSquare, ArrowRight, SlidersHorizontal,
  RotateCcw, Settings, Target, Briefcase, Video, LayoutGrid, Trash2, Plus,
  GripVertical, AlertTriangle, XCircle, ArrowUp, ArrowDown, ArrowUpDown, Search,
  ExternalLink, Bookmark
} from "lucide-react";
import {
  collection, getDocs, query, where, serverTimestamp, doc, updateDoc, getDoc, addDoc
} from "firebase/firestore";
import { auth, db, storage } from "../../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import * as XLSX from "xlsx";
import { API_KEYS } from "../../API";
import emailjs from "@emailjs/browser";
import BusinessDetailsModal from "./BusinessDetailsModal";
import {
  DEFAULT_STAGES, PROGRAMME_TEMPLATES, mapStatusToStageId, getStageColors,
  getNextStageId, getStageActionConfig, loadPipelineSettings, getActiveStages,
  PIPELINE_SETTINGS_EVENT, notifyPipelineRefresh,
} from "./advisorStageConfig";

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

const formatLabel = (value) => {
  if (!value) return "";
  return value
    .toString()
    .split(",")
    .map((item) => item.trim())
    .map((word) => {
      if (word.toLowerCase() === "ict") return "ICT";
      if (word.toLowerCase() === "southafrica" || word.toLowerCase() === "south_africa") return "South Africa";
      return word
        .split(/[_\s-]+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
    })
    .join(", ");
};

// ─── Match scoring ────────────────────────────────────────────────────────────
// Ported verbatim from the SME-side advisor table so both sides produce the
// same eight criteria and the same verdicts. That table never reads a stored
// breakdown — it recomputes on every render — which is why its popup always
// has content and a fetch-based approach here always came back empty.
const CATEGORY_LABEL = {
  stageFit: "Stage Fit",
  skillAlignment: "Support Type Alignment",
  location: "Location",
  sector: "Sector Experience",
  compensation: "Compensation Model Fit",
  functionalExpertise: "Functional Expertise",
  legalEntityFit: "Legal Entity Fit",
  revenueThreshold: "Revenue Threshold",
};

const toArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const canon = (s) => s.toString().toLowerCase().replace(/[^a-z]/g, "");

const FE_ALIASES = {
  hr: "hr", humanresources: "hr",
  tech: "tech", technology: "tech", it: "tech", ict: "tech",
  legal: "legal", law: "legal",
  strategy: "strategy", finance: "finance", esg: "esg", governance: "governance",
};

const normFE = (list) => {
  const out = new Set();
  for (const item of toArr(list)) {
    const key = FE_ALIASES[canon(item)] || canon(item);
    if (key) out.add(key);
  }
  return [...out];
};

const overlapFE = (a, b) => {
  const A = new Set(normFE(a));
  return normFE(b).some((t) => A.has(t));
};

const parseCurrency = (value) => {
  if (value === null || value === undefined) return 0;
  const n = Number.parseFloat(value.toString().replace(/[^0-9.]/g, ""));
  return Number.isNaN(n) ? 0 : n;
};

const calculateAdvisorMatch = (smeProfile, advisorProfile) => {
  const supportFocus = toArr(smeProfile?.advisoryNeedsAssessment?.supportFocus);
  const fundingStage = (smeProfile?.entityOverview?.operationStage || "").toLowerCase();
  const smeSectors = toArr(smeProfile?.entityOverview?.economicSectors).map((s) => (s || "").toLowerCase());
  const smeLocation = (smeProfile?.entityOverview?.location || "").toLowerCase();
  const smeLegal = (smeProfile?.entityOverview?.legalStructure || "").toLowerCase();
  const smeRevenue = parseCurrency(smeProfile?.financialOverview?.annualRevenue);
  const smeFE = toArr(smeProfile?.advisoryNeedsAssessment?.functionalExpertise);

  const advForm = advisorProfile?.formData || {};
  const contact = advForm.contactDetails || {};
  const overview = advForm.personalProfessionalOverview || {};
  const selection = advForm.selectionCriteria || {};

  const advisorFE = [...new Set([...toArr(overview.functionalExpertise), ...toArr(selection.functionalExpertise)])];

  const breakdown = {
    stageFit: { matched: false, smeValue: fundingStage, advisorValue: toArr(selection.smeStageFit) },
    skillAlignment: { matched: false, smeValue: supportFocus, advisorValue: toArr(selection.advisorySupportType) },
    location: { matched: false, smeValue: smeLocation, advisorValue: contact.country || "" },
    sector: { matched: false, smeValue: smeSectors, advisorValue: toArr(overview.industryExperience) },
    compensation: { matched: false, smeValue: toArr(smeProfile?.advisoryNeedsAssessment?.compensationModel), advisorValue: selection.compensationModel || "Not specified" },
    functionalExpertise: { matched: false, smeValue: smeFE, advisorValue: advisorFE },
    legalEntityFit: { matched: false, smeValue: smeLegal, advisorValue: selection.legalEntityFit || "" },
    revenueThreshold: { matched: false, smeValue: smeRevenue, advisorValue: selection.revenueThreshold || "Not specified" },
  };

  breakdown.stageFit.matched = breakdown.stageFit.advisorValue.map((s) => (s || "").toLowerCase()).includes(fundingStage);
  breakdown.skillAlignment.matched = breakdown.skillAlignment.advisorValue.some((t) => supportFocus.includes(t));
  breakdown.location.matched = (contact.country || "").toLowerCase() === smeLocation && !!smeLocation;
  breakdown.sector.matched = breakdown.sector.advisorValue.some((s) => smeSectors.includes((s || "").toLowerCase()));
  breakdown.functionalExpertise.matched = overlapFE(smeFE, advisorFE);
  breakdown.legalEntityFit.matched = !!smeLegal && (selection.legalEntityFit || "").toLowerCase() === smeLegal;

  const smePref = breakdown.compensation.smeValue.map(canon);
  breakdown.compensation.matched = smePref.length > 0 && smePref.includes(canon(selection.compensationModel || ""));

  const revenueBands = {
    less_than_500k: [0, 500000],
    "500k_to_1m": [500000, 1000000],
    less_than_1m: [0, 1000000],
    "1m_to_5m": [1000000, 5000000],
    "5m_to_10m": [5000000, 10000000],
    "10m_plus": [10000000, Number.POSITIVE_INFINITY],
  };
  const band = revenueBands[(selection.revenueThreshold || "").toLowerCase()];
  breakdown.revenueThreshold.matched = band ? smeRevenue >= band[0] && smeRevenue <= band[1] : false;

  const matchedCount = Object.values(breakdown).filter((b) => b.matched).length;
  return { score: Math.round((matchedCount / Object.keys(breakdown).length) * 100), breakdown };
};

// Stage lookups take the currently *active* stage list as a parameter (BIG
// Default, or whichever PROGRAMME_TEMPLATES entry the advisor has switched to,
// with any customization applied) — rather than a hard-coded list. Without
// this, switching to e.g. the Project template (which introduces a "Proposal"
// stage) would leave that stage invisible in this table.
const getStageById = (id, stages = DEFAULT_STAGES) =>
  stages.find((s) => s.id === id) || stages[0];

const getStatusStyle = (status, stages = DEFAULT_STAGES) => {
  const stage = getStageById(mapStatusToStageId(status, stages), stages);
  const colors = getStageColors(stage.group);
  return { bg: colors.bgColor, text: colors.color, border: colors.borderColor, dot: colors.color, stage };
};

// Reads whatever the advisor configured in the pipeline's "Stage Actions" panel.
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

// Days in stage derives from `updatedAt` (written by serverTimestamp on every
// stage change), falling back to the application date for rows never moved.
const calculateDaysInStage = (updatedAt, createdAt) => {
  const d = toDate(updatedAt) || toDate(createdAt);
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
  if (stageId === "terms" && (sme.daysInStage || 0) >= 7) reasons.push("Terms awaiting response");
  if (stageId === "newMatch" && (sme.daysInStage || 0) >= 5) reasons.push("Not yet contacted");
  return reasons;
};

// Small helper component so all popups can be portaled straight to <body>.
const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
};

// ─── Column header info tooltip ───────────────────────────────────────────────
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
// them; the array below is only the default/fallback order.
const DEFAULT_COLUMN_ORDER = [
  "bigScore", "match", "fundingStage", "supportRequired", "status", "applied",
  "daysInStage", "lastActivity", "location", "sector", "revenueBand", "compensationModel"
];

// `sortKey` is the field on the mapped row that the arrows sort by — it isn't
// always the column key (match sorts on matchPercentage, Date Applied on the
// raw Date rather than the formatted label).
const COLUMN_DEFS = {
  bigScore: { label: "BIG Score", align: "center", minWidth: "100px", filterType: "bigScore", sortKey: "bigScore", tooltip: "A standardized score that validates your business's readiness and trustworthiness — across compliance, governance, and legitimacy." },
  match: { label: "Match %", align: "center", minWidth: "110px", filterType: "match", sortKey: "matchPercentage", tooltip: "Match Score measures fit between the business's needs and your advisory expertise." },
  fundingStage: { label: "Funding Stage", align: "left", minWidth: "94px", filterType: "fundingStage", sortKey: "fundingStage", tooltip: "How far along the business is in raising capital — pre-seed, seed, Series A and so on." },
  supportRequired: { label: "Support Required", align: "left", minWidth: "120px", filterType: "supportRequired", sortKey: "supportRequired", tooltip: "The kind of advisory help this business has asked for." },
  status: { label: "Status", align: "left", minWidth: "100px", filterType: "status", sortKey: "statusLabel", tooltip: "Where this application sits in your pipeline, from New Match through to a final outcome." },
  applied: { label: "Date Applied", align: "left", minWidth: "108px", filterType: "applied", sortKey: "applicationDateRaw", tooltip: "The date this business applied to work with you." },
  daysInStage: { label: "Days in Stage", align: "left", minWidth: "134px", filterType: "daysInStage", sortKey: "daysInStage", tooltip: "How long the application has sat at its current stage. High numbers usually mean it needs attention." },
  lastActivity: { label: "Last Activity", align: "left", minWidth: "108px", filterType: "lastActivity", sortKey: "lastActivityLabel", tooltip: "When this application was last updated by either side." },
  location: { label: "Location", align: "left", minWidth: "92px", filterType: "location", sortKey: "location", tooltip: "Where the business operates from." },
  sector: { label: "Sector", align: "left", minWidth: "100px", filterType: "sector", sortKey: "sector", tooltip: "The industry the business trades in." },
  revenueBand: { label: "Revenue Band", align: "left", minWidth: "104px", filterType: "revenueBand", sortKey: "revenueBand", tooltip: "The business's annual revenue range." },
  compensationModel: { label: "Compensation", align: "left", minWidth: "110px", filterType: "compensationModel", sortKey: "compensationModel", tooltip: "How this business expects to compensate an advisor." }
};

// Maps a column key to the field on the mapped row object — these don't always
// match (e.g. "sme" shows `name`, "match" shows `matchPercentage`).
const EXPORT_FIELD_MAP = {
  sme: "name", bigScore: "bigScore", match: "matchPercentage",
  fundingStage: "fundingStage", supportRequired: "supportRequired",
  status: "statusLabel", applied: "applicationDateLabel", daysInStage: "daysInStage",
  lastActivity: "lastActivityLabel", location: "location", sector: "sector",
  revenueBand: "revenueBand", compensationModel: "compensationModel"
  // Note: "action" is intentionally omitted — it's a UI-only column.
};

const EXPORT_HEADERS = {
  sme: "Business Name", bigScore: "BIG Score", match: "Match %",
  fundingStage: "Funding Stage", supportRequired: "Support Required",
  status: "Status", applied: "Date Applied", daysInStage: "Days in Stage",
  lastActivity: "Last Activity", location: "Location", sector: "Sector",
  revenueBand: "Revenue Band", compensationModel: "Compensation Model"
};

// ─── Custom Views ─────────────────────────────────────────────────────────────
// A "view" bundles every layout preference — column visibility, column order,
// sort, and density — into one named, describable object, with exactly one view
// active at a time. Editing the table always edits the active view; there's no
// separate hidden "current layout" that can silently drift out of sync.
const DEFAULT_COLUMN_VISIBILITY = {
  sme: true, bigScore: true, match: true, fundingStage: true,
  supportRequired: true, status: true, applied: true, action: true,
  daysInStage: true, lastActivity: true,
  location: false, sector: false, revenueBand: false, compensationModel: false
};
const DEFAULT_SORT_CONFIG = { key: "attentionThenScore", direction: "desc" };
const DEFAULT_DENSITY = "comfortable";

const BUILTIN_VIEW_ID = "__default__";
const VIEWS_STORAGE_KEY = "advisor-sme-table-views-v2";

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
  sortConfig: { ...DEFAULT_SORT_CONFIG },
  density: DEFAULT_DENSITY,
  columnWidths: {},
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
  contacted: "Dear Partner,\n\nThank you for your interest. I have reviewed your profile and would like to explore how my advisory support could help your business.\n\nPlease let me know a time that suits you from the options below.\n\nBest regards,\nAdvisory Support Team",
  intro: "Dear Partner,\n\nLooking forward to our introductory session. It's a chance for us both to test fit before committing to anything.\n\nPlease confirm one of the times below.\n\nBest regards,\nAdvisory Support Team",
  evaluation: "Dear Partner,\n\nYour application has progressed to the evaluation stage. I'm assessing your needs against my areas of expertise and will share feedback shortly.\n\nBest regards,\nAdvisory Support Team",
  diligence: "Dear Partner,\n\nWe are now scoping the engagement in detail. I may reach out for additional information about your operations and objectives.\n\nBest regards,\nAdvisory Support Team",
  proposal: "Dear Partner,\n\nPlease find attached my proposal covering scope, deliverables and pricing for your review.\n\nHappy to walk through it whenever suits you.\n\nBest regards,\nAdvisory Support Team",
  decision: "Dear Partner,\n\nWe have reached the decision stage. I'll confirm the outcome and next steps shortly.\n\nBest regards,\nAdvisory Support Team",
  terms: "Dear Partner,\n\nPlease find the engagement terms attached for your review and signature.\n\nOnce signed, we can schedule our first working session.\n\nBest regards,\nAdvisory Support Team",
  successful: "Dear Partner,\n\nDelighted to confirm our engagement is now under way. I'll be in touch shortly with our working schedule and first milestones.\n\nWarm regards,\nAdvisory Support Team",
  declined: "Dear Partner,\n\nThank you for considering my advisory support. After careful thought, I'm unable to take on this engagement at present.\n\nThis is not a reflection on your business, and I wish you every success.\n\nRespectfully,\nAdvisory Support Team",
};

// ─── Component ────────────────────────────────────────────────────────────────
export function AdvisorTable({ filters, stageFilter, onMatchesCountChange, onSMEsLoaded }) {
  const [rawApps, setRawApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [updatedStages, setUpdatedStages] = useState({});
  // Rows with an in-flight save/unsave write, so the bookmark can't be
  // double-fired.
  const [savingRows, setSavingRows] = useState({});
  // "Saved" toolbar toggle, same behaviour as the SME-side advisor table:
  // narrows the table to bookmarked rows and is how you get them back.
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // ─── Views ────────────────────────────────────────────────────────────────
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
  const [editingViewMeta, setEditingViewMeta] = useState(null);

  const [headerFilterOpen, setHeaderFilterOpen] = useState(null);
  // Every filter that used to be a free-text box is now a list of selected
  // values, so the header popovers can offer what's actually in the table.
  const [localFilters, setLocalFilters] = useState({
    name: [], fundingStage: [], bigScoreRange: [0, 100], matchRange: [0, 100], status: [],
    sector: [], daysInStageRange: [null, null], appliedRange: [null, null],
    location: [], lastActivity: [], supportRequired: [], revenueBand: [], compensationModel: []
  });
  const [chipSearch, setChipSearch] = useState("");

  const [hoveredRowKey, setHoveredRowKey] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  // Fixed page size — the rows-per-page dropdown was removed from the footer.
  const [pageSize] = useState(25);

  // Column drag-to-reorder state
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragHintRect, setDragHintRect] = useState(null);

  // Popups
  const [activePopup, setActivePopup] = useState(null);
  const [selectedSMEForPopup, setSelectedSMEForPopup] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  // Match breakdown shown in the "Why this match?" popup. Held separately
  // from the row because it often has to be fetched — see loadMatchBreakdown.
  const [matchBreakdownData, setMatchBreakdownData] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchComputedScore, setMatchComputedScore] = useState(null);
  // The advisor's own profile is the same for every row, so it's fetched once
  // and reused rather than re-read each time a popup opens.
  const advisorProfileRef = useRef(null);

  // Stage update form
  const [stageUpdateData, setStageUpdateData] = useState({
    nextStage: "", message: "", meetingTime: "", meetingLocation: "", meetingPurpose: "", termSheetFile: null
  });
  const [stageFormErrors, setStageFormErrors] = useState({});
  const [isStageSubmitting, setIsStageSubmitting] = useState(false);
  const [availabilities, setAvailabilities] = useState([]);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [tempDates, setTempDates] = useState([]);
  const [timeSlot, setTimeSlot] = useState({ start: "09:00", end: "17:00" });
  const [timeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // ─── Engagement-aware pipeline stages ─────────────────────────────────────
  // Pipeline settings live in the shared localStorage key
  // AdvisorDealFlowPipeline.jsx writes to, so the table's stage list always
  // matches whatever engagement type is actually selected.
  const [pipelineSettings, setPipelineSettings] = useState(() => loadPipelineSettings());

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

  const activeProgrammeLabel = (PROGRAMME_TEMPLATES[pipelineSettings.programmeType] || PROGRAMME_TEMPLATES.default).label;
  const activeStages = useMemo(() => getActiveStages(pipelineSettings), [pipelineSettings]);

  const activeView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID];

  // Auto-save: any edit to columns/order/sort/density writes straight back into
  // the active view (and persists immediately).
  useEffect(() => {
    setViewsState((prev) => {
      const current = prev.views[prev.activeViewId];
      if (!current) return prev;
      const updated = { ...current, columnVisibility, columnOrder, sortConfig, density, columnWidths };
      const next = { ...prev, views: { ...prev.views, [prev.activeViewId]: updated } };
      persistViewsState(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibility, columnOrder, sortConfig, density, columnWidths]);

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
    setSortConfig(target.sortConfig);
    setDensity(target.density);
    setColumnWidths(target.columnWidths || {});
  };

  const createNewView = () => {
    const trimmedName = newViewName.trim();
    if (!trimmedName) return;
    const id = generateViewId();
    const newView = {
      id, name: trimmedName, description: newViewDescription.trim(), builtin: false,
      columnVisibility: { ...columnVisibility }, columnOrder: [...columnOrder],
      sortConfig: { ...sortConfig }, density, columnWidths: { ...columnWidths },
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
      setSortConfig(def.sortConfig);
      setDensity(def.density);
      setColumnWidths(def.columnWidths || {});
    }
    setNotification({ type: "success", message: "View deleted" });
  };

  const resetActiveViewToDefault = () => {
    const layout = createDefaultViewLayout();
    setColumnVisibility(layout.columnVisibility);
    setColumnOrder(layout.columnOrder);
    setSortConfig(layout.sortConfig);
    setDensity(layout.density);
    setColumnWidths(layout.columnWidths || {});
    setNotification({ type: "success", message: `"${activeView.name}" reset to factory defaults` });
  };

  // ─── Data loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAdvisorApplications = async () => {
      const user = auth.currentUser;
      if (!user) { setLoading(false); return; }

      try {
        const snapshot = await getDocs(
          query(collection(db, "AdvisorApplications"), where("advisorId", "==", user.uid))
        );
        // BIG Score components are kept *per row* here. Previously a single
        // shared state object was overwritten inside the map, so every row's
        // breakdown popup showed the last-fetched application's scores.
        const rows = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            docId: docSnap.id,
            id: data.smeId,
            ...data,
            bigScoreBreakdown: {
              pis: data.pis || 0,
              compliance: data.compliance || 0,
              legitimacy: data.legitimacy || 0,
              fundability: data.fundability || 0,
              leadership: data.leadership || 0,
            },
            availableDates: (data.availableDates || []).map((a) => ({ ...a, date: new Date(a.date) })),
          };
        });
        setRawApps(rows);
        onMatchesCountChange?.(rows.length);
      } catch (error) {
        console.error("Failed to fetch advisor applications:", error);
        setRawApps([]);
        onMatchesCountChange?.(0);
        setNotification({ type: "error", message: "Failed to load applications" });
      } finally {
        setLoading(false);
      }
    };

    fetchAdvisorApplications();
  }, [onMatchesCountChange]);

  // ─── Row mapping ──────────────────────────────────────────────────────────
  const smes = useMemo(() => {
    let mapped = rawApps.map((a) => {
      const currentStatus = updatedStages[a.id] || a.status || a.pipelineStage || "New Match";
      return {
        id: a.id,
        docId: a.docId,
        smeId: a.smeId,
        // The business's own auth/profile user id, used when opening their
        // dashboard. Falls back to smeId, which is what the platform uses as
        // the universalProfiles document id.
        userId: a.userId || a.smeUserId || a.smeId || a.id,
        name: a.smeName || "Unnamed Business",
        location: formatLabel(a.smeLocation) || "N/A",
        sector: formatLabel(a.smeSector) || "N/A",
        fundingStage: formatLabel(a.smeStage) || "N/A",
        supportRequired: formatLabel(a.smeSupport) || "N/A",
        revenueBand: a.revenue || "N/A",
        compensationModel: formatLabel(a.advisorCompensationModel) || "N/A",
        bigScore: a.bigScore || 0,
        bigScoreBreakdown: a.bigScoreBreakdown,
        matchPercentage: a.matchPercentage || 0,
        // The breakdown has been written under three different names by three
        // different writers over time; the popup falls back to fetching it
        // from the mirror collections when none of these are present.
        matchBreakdown: a.matchBreakdown || a.breakdown || a.matchDetails || {},
        applicationDateLabel: formatDate(a.createdAt),
        applicationDateRaw: toDate(a.createdAt),
        lastActivityLabel: formatDate(a.updatedAt),
        daysInStage: calculateDaysInStage(a.updatedAt, a.createdAt),
        currentStatus,
        pipelineStage: currentStatus,
        statusLabel: getStatusStyle(currentStatus, activeStages).stage.name,
        nextStage: getNextStage(currentStatus, activeStages),
        availableDates: a.availableDates || [],
        // Bookmark flag, stored on the application document itself so it
        // follows the advisor across devices rather than living in this
        // browser's localStorage.
        saved: !!a.saved,
        raw: a,
      };
    });

    if (stageFilter) {
      mapped = mapped.filter((s) => mapStatusToStageId(s.pipelineStage, activeStages) === stageFilter);
    }

    return mapped;
  }, [rawApps, updatedStages, activeStages, stageFilter]);

  useEffect(() => { onSMEsLoaded?.(smes); }, [smes, onSMEsLoaded]);

  // ─── Filtering & Sorting ──────────────────────────────────────────────────
  const filteredAndSortedSMEs = useMemo(() => {
    let result = [...smes];

    const matchesAny = (selected, value) =>
      !selected?.length || selected.some((v) => (value || "").toString().toLowerCase().includes(v.toLowerCase()));

    // Saved-only view. Kept out of activeFilterCount deliberately — it's a
    // view toggle with its own visible chip, not a column filter.
    if (showSavedOnly) result = result.filter((s) => s.saved);

    // External filters panel (owned by the parent).
    if (filters?.location) {
      result = result.filter((s) => (s.location || "").toLowerCase().includes(filters.location.toLowerCase()));
    }
    if (filters?.matchScore) {
      result = result.filter((s) => (s.matchPercentage || 0) >= filters.matchScore);
    }
    if (filters?.sectors?.length > 0) {
      result = result.filter((s) => filters.sectors.some((sec) => (s.sector || "").toLowerCase().includes(sec.toLowerCase())));
    }
    if (filters?.stages?.length > 0) {
      result = result.filter((s) => filters.stages.some((st) => (s.fundingStage || "").toLowerCase().includes(st.toLowerCase())));
    }

    // Per-column header filters.
    result = result.filter((s) => matchesAny(localFilters.name, s.name));

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

    const [daysMin, daysMax] = localFilters.daysInStageRange;
    if (daysMin != null) result = result.filter((s) => (s.daysInStage || 0) >= daysMin);
    if (daysMax != null) result = result.filter((s) => (s.daysInStage || 0) <= daysMax);

    const [appliedFrom, appliedTo] = localFilters.appliedRange;
    if (appliedFrom) result = result.filter((s) => s.applicationDateRaw && s.applicationDateRaw >= new Date(appliedFrom));
    if (appliedTo) result = result.filter((s) => s.applicationDateRaw && s.applicationDateRaw <= new Date(new Date(appliedTo).setHours(23, 59, 59, 999)));

    result = result.filter((s) =>
      matchesAny(localFilters.location, s.location)
      && matchesAny(localFilters.lastActivity, s.lastActivityLabel)
      && matchesAny(localFilters.supportRequired, s.supportRequired)
      && matchesAny(localFilters.revenueBand, s.revenueBand)
      && matchesAny(localFilters.compensationModel, s.compensationModel)
    );

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
  }, [smes, filters, localFilters, sortConfig, activeStages, showSavedOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedSMEs.length / pageSize));
  const paginatedSMEs = filteredAndSortedSMEs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ─── Filter options, taken from the rows themselves ───────────────────────
  const uniqueOf = (accessor) =>
    [...new Set(smes.map(accessor).filter((v) => v && v !== "N/A" && v !== "-"))].sort();

  const sectorOptions = useMemo(() => uniqueOf((s) => s.sector), [smes]);
  const fundingStageOptions = useMemo(() => uniqueOf((s) => s.fundingStage), [smes]);
  const nameOptions = useMemo(() => uniqueOf((s) => s.name), [smes]);
  const locationOptions = useMemo(() => uniqueOf((s) => s.location), [smes]);
  const lastActivityOptions = useMemo(() => uniqueOf((s) => s.lastActivityLabel), [smes]);
  const supportRequiredOptions = useMemo(() => uniqueOf((s) => s.supportRequired), [smes]);
  const revenueBandOptions = useMemo(() => uniqueOf((s) => s.revenueBand), [smes]);
  const compensationModelOptions = useMemo(() => uniqueOf((s) => s.compensationModel), [smes]);

  // Counted off every mapped row, not the filtered list, so the chip still
  // reads the true total while a filter is narrowing the table.
  const savedCount = useMemo(() => smes.filter((s) => s.saved).length, [smes]);

  const activeFilterCount = localFilters.name.length
    + localFilters.fundingStage.length + localFilters.status.length + localFilters.sector.length
    + (localFilters.bigScoreRange[0] > 0 || localFilters.bigScoreRange[1] < 100 ? 1 : 0)
    + (localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100 ? 1 : 0)
    + (localFilters.daysInStageRange[0] != null || localFilters.daysInStageRange[1] != null ? 1 : 0)
    + (localFilters.appliedRange[0] || localFilters.appliedRange[1] ? 1 : 0)
    + ["location", "lastActivity", "supportRequired", "revenueBand", "compensationModel"]
      .reduce((sum, k) => sum + localFilters[k].length, 0);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const toggleColumn = (key) => setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }));

  const getFilterActive = (filterType) => {
    switch (filterType) {
      case "bigScore": return localFilters.bigScoreRange[0] > 0 || localFilters.bigScoreRange[1] < 100;
      case "match": return localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100;
      case "applied": return !!(localFilters.appliedRange[0] || localFilters.appliedRange[1]);
      case "daysInStage": return localFilters.daysInStageRange[0] != null || localFilters.daysInStageRange[1] != null;
      default: return Array.isArray(localFilters[filterType]) && localFilters[filterType].length > 0;
    }
  };

  // ─── Save / bookmark ──────────────────────────────────────────────────────
  // Writes `saved` onto the application document. The UI flips first and rolls
  // back if the write fails, so the star never lags behind the click. Note this
  // deliberately does NOT touch `updatedAt`: that field drives "Days in Stage"
  // and "Last Activity", and bookmarking is not pipeline activity — stamping it
  // here would silently reset every stalled-row indicator.
  const toggleSaved = async (sme) => {
    const key = sme.docId;
    if (!key || savingRows[key]) return;

    const nextSaved = !sme.saved;
    setSavingRows((prev) => ({ ...prev, [key]: true }));
    setRawApps((prev) => prev.map((a) => (a.docId === key ? { ...a, saved: nextSaved } : a)));

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      await updateDoc(doc(db, "AdvisorApplications", key), {
        saved: nextSaved,
        savedAt: nextSaved ? serverTimestamp() : null,
      });
      setNotification({
        type: "success",
        message: nextSaved ? `${sme.name} saved` : `${sme.name} removed from saved`,
      });
    } catch (error) {
      console.error("Save toggle error:", error);
      setRawApps((prev) => prev.map((a) => (a.docId === key ? { ...a, saved: !nextSaved } : a)));
      setNotification({
        type: "error",
        message: `Couldn't ${nextSaved ? "save" : "remove"} ${sme.name}: ${error.message}`,
      });
    } finally {
      setSavingRows((prev) => { const { [key]: _done, ...rest } = prev; return rest; });
    }
  };

  // Sends the advisor to this business's own /dashboard, restricted to just the
  // BIG Score tab (no "Improve My BIG Score" tools tab, no ability to switch),
  // with a visible "Back" control to return. Same session-storage "investor
  // view" pattern the catalyst table and the Growth Suite / Documents
  // navigation already rely on (viewingSMEId / viewingSMEName /
  // investorViewMode / viewOrigin), plus the viewOnlyBigScore flag that
  // Dashboard.jsx checks to lock the view down to that one tab.
  const handleViewBigScorePage = (sme) => {
    sessionStorage.setItem("viewingSMEId", sme.userId || sme.smeId || sme.id);
    sessionStorage.setItem("viewingSMEName", sme.name);
    sessionStorage.setItem("investorViewMode", "true");
    sessionStorage.setItem("viewOrigin", "advisor");
    sessionStorage.setItem("viewOnlyBigScore", "true");
    window.location.href = "/dashboard";
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
    setChipSearch("");
    setHeaderFilterOpen((prev) => (prev?.type === type ? null : { type, rect }));
  };
  const closeHeaderFilter = () => { setHeaderFilterOpen(null); setChipSearch(""); };

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

  // ─── Sort arrows ──────────────────────────────────────────────────────────
  // The table already sorted, but only through the saved view — there was no
  // way to change it from the header. Third press returns to the table's
  // default (attention first, then BIG Score) rather than to no order at all,
  // so rows never fall back to fetch order.
  const toggleSort = (key, event) => {
    event.stopPropagation();
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { ...DEFAULT_SORT_CONFIG };
    });
  };

  const SortTrigger = ({ sortKey }) => {
    const isActive = sortConfig?.key === sortKey;
    return (
      <button
        type="button"
        onClick={(e) => toggleSort(sortKey, e)}
        className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${isActive ? "text-[#e6d7c3]" : "text-[#c8b6a6] hover:text-white"}`}
        title={isActive ? (sortConfig.direction === "asc" ? "Sort descending" : "Reset sorting") : "Sort ascending"}
      >
        {isActive
          ? (sortConfig.direction === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)
          : <ArrowUpDown size={11} />}
      </button>
    );
  };

  // ─── Match breakdown ──────────────────────────────────────────────────────
  // Computed here, not fetched. Nothing writes a breakdown to Firestore: the
  // SME-side table runs calculateAdvisorMatch on every render and throws the
  // result away, and handleConnect only persists the headline percentage. So
  // this popup recomputes from the same two profiles the SME side uses —
  // universalProfiles + advisoryApplications for the business's needs, and the
  // signed-in advisor's own advisorProfiles document — and gets identical
  // verdicts.
  const loadMatchBreakdown = async (sme) => {
    setMatchBreakdownData(null);
    setMatchComputedScore(null);
    setMatchLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) { setMatchBreakdownData({}); return; }

      // The business's own id, not the AdvisorApplications row key.
      const smeId = sme.smeId || sme.id;

      const [advisorSnap, smeSnap, needsSnap] = await Promise.all([
        advisorProfileRef.current
          ? Promise.resolve(null)
          : getDoc(doc(db, "advisorProfiles", user.uid)),
        getDoc(doc(db, "universalProfiles", smeId)),
        getDoc(doc(db, "advisoryApplications", smeId)),
      ]);

      if (advisorSnap) {
        advisorProfileRef.current = advisorSnap.exists() ? advisorSnap.data() : {};
      }

      const smeProfile = {
        ...(smeSnap.exists() ? smeSnap.data() : {}),
        advisoryNeedsAssessment: needsSnap.exists()
          ? needsSnap.data().advisoryNeedsAssessment || {}
          : {},
      };

      const { score, breakdown } = calculateAdvisorMatch(smeProfile, advisorProfileRef.current || {});
      setMatchBreakdownData(breakdown);
      setMatchComputedScore(score);
    } catch (error) {
      console.error("Match breakdown computation failed:", error);
      setMatchBreakdownData({});
    } finally {
      setMatchLoading(false);
    }
  };

  // ─── Popups ───────────────────────────────────────────────────────────────
  const openPopup = (type, sme, rect, options = {}) => {
    let popupWidth, popupHeight;
    switch (type) {
      case "bigScore": popupWidth = 380; popupHeight = 450; break;
      case "match": popupWidth = 380; popupHeight = 420; break;
      case "stage": popupWidth = 450; popupHeight = 520; break;
      // Grew as rows were added (BIG Score page, Save Match, View Saved), so
      // the flip-upward calculation below still has an accurate height.
      case "quickActions": popupWidth = 230; popupHeight = 380; break;
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

    if (type === "match") loadMatchBreakdown(sme);

    if (type === "stage") {
      const presetStage = options.presetStage || sme.nextStage || getNextStage(sme.currentStatus, activeStages);
      const presetId = mapStatusToStageId(presetStage, activeStages);
      setStageUpdateData({
        nextStage: presetStage,
        message: DEFAULT_STAGE_MESSAGES[presetId] || "",
        meetingTime: "", meetingLocation: "", meetingPurpose: "", termSheetFile: null,
      });
      setStageFormErrors({});
      setAvailabilities(sme.availableDates || []);
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
    setMatchBreakdownData(null);
    setMatchComputedScore(null);
    setMatchLoading(false);
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

  // ─── Stage update ─────────────────────────────────────────────────────────
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
      if (!stageUpdateData.meetingPurpose.trim()) errors.meetingPurpose = "Please provide a meeting purpose";
    }
    if (stageFields.showAvailability && availabilities.length === 0) {
      errors.availabilities = "Please add at least one available date";
    }

    if (Object.keys(errors).length > 0) { setStageFormErrors(errors); return; }

    setIsStageSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const advisorId = user.uid;
      const smeId = sme.id;
      const stageName = targetStage?.name || stageUpdateData.nextStage;

      let attachmentUrl = null;
      if (stageUpdateData.termSheetFile) {
        const storageRef = ref(storage, `advisor_termsheets/${smeId}/${stageUpdateData.termSheetFile.name}`);
        const snapshot = await uploadBytes(storageRef, stageUpdateData.termSheetFile);
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
        updatedAt: serverTimestamp(),
        ...(stageUpdateData.message && { lastMessage: stageUpdateData.message }),
      };

      if (stageFields.showMeeting) {
        updateData.meetingDetails = {
          time: stageUpdateData.meetingTime,
          location: stageUpdateData.meetingLocation,
          purpose: stageUpdateData.meetingPurpose,
        };
      }
      if (stageFields.showAvailability && availabilityData.length > 0) {
        updateData.availableDates = availabilityData;
      }
      if (attachmentUrl) updateData.termsheetUrl = attachmentUrl;

      const documentId = `${advisorId}_${smeId}`;
      const documentSmeId = `${smeId}_${advisorId}`;

      const docRef = doc(db, "AdvisorApplications", documentId);
      const docSnapshot = await getDoc(docRef);
      if (!docSnapshot.exists()) {
        throw new Error(`Document ${documentId} does not exist in AdvisorApplications`);
      }
      await updateDoc(docRef, updateData);

      // Mirror onto the related collections. Failures here are logged rather
      // than thrown, so a missing mirror doc can't roll back a valid update.
      try {
        await updateDoc(doc(db, "AdvisoryMatches", documentSmeId), {
          status: stageName,
          ...(updateData.availableDates && { availableDates: updateData.availableDates }),
        });
        await updateDoc(doc(db, "SmeAdvisorApplications", documentSmeId), {
          status: stageName,
          ...(updateData.availableDates && { availableDates: updateData.availableDates }),
        });
      } catch (matchError) {
        console.warn("Could not update related collections:", matchError.message);
      }

      if (stageFields.showMeeting && stageUpdateData.meetingTime && stageUpdateData.meetingLocation) {
        try {
          await addDoc(collection(db, "smeCalendarEvents"), {
            smeId,
            advisorId,
            title: stageUpdateData.meetingPurpose,
            date: stageUpdateData.meetingTime,
            location: stageUpdateData.meetingLocation,
            type: "advisory_meeting",
            createdAt: new Date().toISOString(),
            ...(updateData.availableDates && { availableDates: updateData.availableDates }),
          });
        } catch (calendarError) {
          console.error("Error creating calendar event:", calendarError);
        }
      }

      // In-app message to the business (inbox + sent copies).
      const subject = `Update: ${stageName} Stage for Your Application`;
      const isNegative = targetStage?.group === "negative";
      let content = isNegative
        ? `Dear ${sme.name},\n\nWe regret to inform you that your application has been moved to the "${stageName}" stage.\n\n${stageUpdateData.message}`
        : `Dear ${sme.name},\n\nYour application has progressed to the "${stageName}" stage.\n\n${stageUpdateData.message}`;

      if (stageFields.showMeeting) {
        content += `\n\nMeeting Details:`;
        if (stageUpdateData.meetingTime) content += `\n- Date: ${new Date(stageUpdateData.meetingTime).toLocaleString()}`;
        content += `\n- Location: ${stageUpdateData.meetingLocation}\n- Purpose: ${stageUpdateData.meetingPurpose}`;
      }
      if (stageFields.showAvailability && availabilities.length > 0) {
        content += `\n\nAvailable Meeting Times:\n`;
        content += availabilities.map((a, idx) => {
          const dateStr = a.date instanceof Date
            ? a.date.toLocaleDateString("en-ZA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
            : "Date unavailable";
          const timeStr = a.timeSlots?.[0]
            ? `${a.timeSlots[0].start} - ${a.timeSlots[0].end} ${a.timeZone}`
            : "Time not specified";
          return `${idx + 1}. ${dateStr} (${timeStr})`;
        }).join("\n");
        content += `\n\nPlease reply with your preferred meeting time from the options above.`;
      }
      content += `\n\nBest regards,\nAdvisory Support Team`;

      const messagePayload = {
        to: smeId,
        from: advisorId,
        subject,
        content,
        date: new Date().toISOString(),
        read: false,
        type: "inbox",
        applicationId: documentId,
        attachments: attachmentUrl ? [attachmentUrl] : [],
        ...(updateData.availableDates && { availableDates: updateData.availableDates }),
      };

      await Promise.all([
        addDoc(collection(db, "messages"), messagePayload),
        addDoc(collection(db, "messages"), { ...messagePayload, read: true, type: "sent" }),
      ]);

      // Email notification (best effort — never blocks the stage update).
      try {
        const emailjsConfig = {
          serviceId: API_KEYS.SERVICE_ID_MESSAGES,
          templateId: API_KEYS.TEMPLATE_ID_MESSAGES,
          publicKey: API_KEYS.PUBLIC_KEY_ID_MESSAGES,
        };
        if (!window.emailjs) {
          emailjs.init(emailjsConfig.publicKey);
          window.emailjs = emailjs;
        }

        const advisorName = user?.displayName || "Advisory Team";
        let smeEmail = null;
        const profileSnap = await getDoc(doc(db, "universalProfiles", smeId));
        if (profileSnap.exists()) {
          const p = profileSnap.data();
          smeEmail = p.email || p.contactDetails?.email || p.contactEmail || p.businessEmail || p.personalEmail;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (smeEmail && emailRegex.test(smeEmail)) {
          await window.emailjs.send(
            emailjsConfig.serviceId,
            emailjsConfig.templateId,
            {
              to_email: smeEmail,
              subject: `Application Stage Update: ${stageName}`,
              from_name: advisorName,
              date: new Date().toLocaleDateString(),
              message: content,
              portal_url: `https://www.bigmarketplace.africa/applications/${documentId}`,
              has_attachments: attachmentUrl ? "true" : "false",
              attachments_count: attachmentUrl ? "1" : "0",
            },
            emailjsConfig.publicKey
          );
        } else {
          console.warn("No valid email found for business", smeId);
        }
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
      }

      setUpdatedStages((prev) => ({ ...prev, [smeId]: stageName }));
      setRawApps((prev) => prev.map((a) =>
        a.id === smeId
          ? { ...a, status: stageName, pipelineStage: stageName, updatedAt: new Date(), availableDates: availabilities }
          : a
      ));
      notifyPipelineRefresh();

      setNotification({ type: "success", message: `${sme.name} moved to ${stageName}` });
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
      XLSX.writeFile(workbook, `advisory-export-${new Date().toISOString().split("T")[0]}.xlsx`);
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
    comfortable: { cell: "py-3 px-3", fontSize: "text-sm", avatarSize: "w-8 h-8" },
    compact: { cell: "py-2 px-2", fontSize: "text-xs", avatarSize: "w-7 h-7" },
    "ultra-compact": { cell: "py-1.5 px-1.5", fontSize: "text-xs", avatarSize: "w-6 h-6" },
  };
  const ds = densityStyles[density] || densityStyles.comfortable;

  // ─── Column resizing ──────────────────────────────────────────────────────
  // Drag the divider on a header's right edge to resize the column; double-click
  // it to snap that column back to auto width. Widths are stored per view
  // alongside visibility/order/sort/density, so they persist and travel with
  // whichever view is active.
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
    // Held on <body> so the cursor doesn't flicker back as the pointer leaves
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

  // Every chip-list filter is driven by this one array.
  const FILTER_OPTION_SETS = [
    { type: "name", label: "Business name", options: nameOptions },
    { type: "location", label: "Location", options: locationOptions },
    { type: "lastActivity", label: "Last activity", options: lastActivityOptions },
    { type: "supportRequired", label: "Support required", options: supportRequiredOptions },
    { type: "revenueBand", label: "Revenue band", options: revenueBandOptions },
    { type: "compensationModel", label: "Compensation model", options: compensationModelOptions },
  ];

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
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#f5f0e1] text-[#7d5a50] border border-[#c8b6a6]" title="Determined by the pipeline's engagement type setting">
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
            {/* Saved matches. The bookmark on each row writes here; this is
                where you get them back. */}
            {(showSavedOnly || savedCount > 0) && (
              <button
                onClick={() => { setShowSavedOnly((v) => !v); setCurrentPage(1); }}
                title={showSavedOnly ? "Show all businesses" : "Show only saved businesses"}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  showSavedOnly
                    ? "bg-[#a67c52] text-white border-[#a67c52]"
                    : "bg-white text-[#4a352f] border-[#c8b6a6] hover:bg-[#f5f0e1]"
                }`}
              >
                <Bookmark size={12} fill={showSavedOnly ? "#ffffff" : "none"} />
                {showSavedOnly ? "Showing saved only" : "Saved"} ({savedCount})
              </button>
            )}
            {activeFilterCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#fff3e0] text-[#e65100] border border-[#e65100]/30">
                <SlidersHorizontal size={12} /> {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">

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
                <SlidersHorizontal size={16} /> Customize Table <ChevronDown size={14} className={`transition-transform ${showColumnChooser ? "rotate-180" : ""}`} />
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

                      {/* ─── Hide/Unhide ─────────────────────────────── */}
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Hide/Unhide</h4>
                      <p className="text-xs text-[#a89482] mb-3 flex items-center gap-1.5">
                        <GripVertical size={12} className="flex-shrink-0" /> Tip: drag any column header in the table to reorder it.
                      </p>
                      {[{ key: "sme", label: "Business Name" }, { key: "bigScore", label: "BIG Score" }, { key: "match", label: "Match %" }, { key: "status", label: "Status" }, { key: "action", label: "Action" }].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 py-2 px-2 rounded-lg opacity-75">
                          <input type="checkbox" checked readOnly disabled className="rounded border-[#c8b6a6]" />
                          <span className="text-sm text-[#4a352f]">{label}</span>
                        </label>
                      ))}
                      <div className="border-t border-[#e6d7c3] my-2" />
                      {[
                        { key: "fundingStage", label: "Funding Stage" }, { key: "supportRequired", label: "Support Required" },
                        { key: "applied", label: "Date Applied" }, { key: "daysInStage", label: "Days in Stage" },
                        { key: "lastActivity", label: "Last Activity" }, { key: "location", label: "Location" },
                        { key: "sector", label: "Sector" }, { key: "revenueBand", label: "Revenue Band" },
                        { key: "compensationModel", label: "Compensation Model" },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#faf7f2] cursor-pointer">
                          <input type="checkbox" checked={columnVisibility[key] || false} onChange={() => toggleColumn(key)} className="rounded border-[#c8b6a6] text-[#7d5a50]" />
                          <span className="text-sm text-[#4a352f]">{label}</span>
                        </label>
                      ))}

                      <div className="border-t border-[#e6d7c3] my-4" />
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Density</h4>
                      <div className="flex gap-1.5 mb-1">
                        {[{ key: "comfortable", label: "Comfortable" }, { key: "compact", label: "Compact" }, { key: "ultra-compact", label: "Ultra Compact" }].map((d) => (
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
      <div className="bg-white rounded-2xl border border-[#e6d7c3] shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8"><div className="space-y-4">{[...Array(8)].map((_, i) => (<div key={i} className="h-10 bg-[#f5f0e1] rounded-lg animate-pulse" />))}</div></div>
        ) : (
          <>
            <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
              <style>{`
                .adt-th { color: #faf7f2 !important; line-height: 1.1; font-size: 0.75rem !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; font-family: inherit !important; vertical-align: top !important; }
                .adt-th-draggable { cursor: grab; }
                .adt-th-draggable:active { cursor: grabbing; }
                /* Wrap header labels onto at most 2 lines instead of forcing
                   the column wider than needed. This only lays out cleanly
                   because each column also has a real min-width in
                   COLUMN_DEFS — without that floor, the browser sizes
                   wrapped-text columns to their smallest possible content. */
                .adt-th-label { flex: 1 1 auto; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; overflow-wrap: break-word; line-height: 1.2; }
                /* Column resizing: an explicit header width only holds if the
                   cells below can shrink, so long values wrap rather than
                   forcing the column wider than the width that was dragged. */
                .bigt-fit th, .bigt-fit td { overflow: hidden; }
                .bigt-fit td { word-break: break-word; }
              `}</style>
              <table className="border-collapse bigt-fit" style={{ tableLayout: "auto" }}>
                <thead>
                  <tr className="bg-[#4a352f]">
                    <th className="adt-th py-3 px-3 relative text-left font-semibold uppercase tracking-wider text-xs border-r border-[#e6d7c3] sticky top-0 left-0 z-30" style={{ backgroundColor: "#4a352f", ...widthStyle("__name__", "170px", "190px") }}>
                      <div className="flex items-start gap-1 min-w-0">
                        <span className="adt-th-label">Business Name</span>
                        <SortTrigger sortKey="name" />
                        <FilterTrigger type="name" active={localFilters.name.length > 0} />
                        <HeaderInfoTooltip text="The business that applied to work with you. Click the eye to open its full profile." />
                      </div>
                      <ColumnResizer colKey="__name__" />
                    </th>

                    {/* ─── Reorderable columns ──────────────────────── */}
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
                          className={`adt-th adt-th-draggable py-3 px-3 relative font-semibold uppercase tracking-wider text-xs border-r border-[#e6d7c3] sticky top-0 z-20 select-none transition-opacity ${col.align === "center" ? "text-center" : "text-left"} ${isDragging ? "opacity-40" : ""}`}
                          style={{ ...widthStyle(key, col.minWidth), backgroundColor: isDragOver ? "#5a423b" : "#4a352f" }}
                        >
                          <div className={`flex items-start gap-1 min-w-0 ${col.align === "center" ? "justify-center" : ""}`}>
                            <GripVertical size={11} className="opacity-40 flex-shrink-0 mt-0.5" />
                            <span className="adt-th-label">{col.label}</span>
                            {col.sortKey && <SortTrigger sortKey={col.sortKey} />}
                            <FilterTrigger type={col.filterType} active={getFilterActive(col.filterType)} />
                            <HeaderInfoTooltip text={col.tooltip} />
                          </div>
                          <ColumnResizer colKey={key} />
                        </th>
                      );
                    })}

                    {columnVisibility.action && (
                      <th className="adt-th py-3 px-3 relative text-center font-semibold uppercase tracking-wider text-xs whitespace-nowrap sticky top-0 z-20" style={{ minWidth: "230px", backgroundColor: "#4a352f" }}>
                        <div className="flex items-start gap-1 justify-center">
                          <span>Actions</span>
                          <HeaderInfoTooltip text="Move the application to its next stage, save it for later with the star, or open quick actions for more options — including the business's BIG Score page." />
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedSMEs.length === 0 ? (
                    <tr><td colSpan={Object.values(columnVisibility).filter(Boolean).length + 1} className="text-center py-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-[#f5f0e1] flex items-center justify-center"><Users size={32} className="text-[#7d5a50] opacity-50" /></div>
                        <p className="text-lg font-semibold text-[#4a352f]">
                          {showSavedOnly ? "No Saved Businesses" : "No Businesses Found"}
                        </p>
                        <p className="text-sm text-[#7d5a50] max-w-xs">
                          {showSavedOnly
                            ? "Bookmark a row to keep it here."
                            : activeFilterCount > 0
                              ? "Clear a filter to widen the list."
                              : "Apply to businesses that match your expertise — your applications appear here."}
                        </p>
                        {showSavedOnly && (
                          <button
                            onClick={() => setShowSavedOnly(false)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7d5a50] text-white"
                          >
                            Show all businesses
                          </button>
                        )}
                      </div>
                    </td></tr>
                  ) : (
                    paginatedSMEs.map((sme) => {
                      const bigScoreLabel = getBigScoreLabel(sme.bigScore);
                      const matchLabel = getMatchLabel(sme.matchPercentage);
                      const statusStyle = getStatusStyle(sme.currentStatus, activeStages);
                      const isTerminal = !!statusStyle.stage.terminal;
                      const nextStageLabel = sme.nextStage || "—";
                      const isSaving = !!savingRows[sme.docId];

                      const renderCell = (key) => {
                        switch (key) {
                          case "bigScore":
                            return (
                              <td key={key} className={`${ds.cell} text-center cursor-pointer border-r border-[#e6d7c3]`} onClick={(e) => openPopupFromEvent("bigScore", sme, e)}>
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
                          case "match":
                            return (
                              <td key={key} className={`${ds.cell} text-center cursor-pointer border-r border-[#e6d7c3]`} onClick={(e) => openPopupFromEvent("match", sme, e)}>
                                <div className="flex flex-col items-center gap-1 w-full max-w-[90px] mx-auto">
                                  <span className={`${ds.fontSize} font-normal text-[#4a352f]`}>{sme.matchPercentage}%</span>
                                  <span className="text-xs font-medium" style={{ color: matchLabel.color }}>{matchLabel.label}</span>
                                  <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${sme.matchPercentage}%`, backgroundColor: matchLabel.color }} />
                                  </div>
                                </div>
                              </td>
                            );
                          case "fundingStage":
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f5f0e1] rounded-full text-xs font-medium">{sme.fundingStage}</span>
                              </td>
                            );
                          case "status":
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
                          case "applied":
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <div className="flex items-center gap-1.5"><Calendar size={14} className="text-[#7d5a50]" />{sme.applicationDateLabel}</div>
                              </td>
                            );
                          case "daysInStage":
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <div className="flex items-center gap-1.5"><Clock size={14} className="text-[#7d5a50]" />{sme.daysInStage} days</div>
                              </td>
                            );
                          case "lastActivity":
                            return <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>{sme.lastActivityLabel}</td>;
                          case "location":
                          case "sector":
                          case "revenueBand":
                          case "compensationModel":
                            return <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>{sme[key]}</td>;
                          case "supportRequired":
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <span className="line-clamp-2">{sme.supportRequired}</span>
                              </td>
                            );
                          default:
                            return null;
                        }
                      };

                      return (
                        <tr
                          key={sme.id}
                          className="border-b border-[#f0e6d9] transition-all"
                          style={{ backgroundColor: hoveredRowKey === sme.id ? "#fdf8f4" : undefined }}
                          onMouseEnter={() => setHoveredRowKey(sme.id)}
                          onMouseLeave={() => setHoveredRowKey(null)}
                        >
                          {columnVisibility.sme && (
                            <td
                              className={`${ds.cell} ${ds.fontSize} text-[#4a352f] sticky left-0 border-r border-b border-[#e6d7c3] z-10 transition-colors`}
                              style={{ ...widthStyle("__name__", "170px", "190px"), backgroundColor: hoveredRowKey === sme.id ? "#fdf8f4" : "#ffffff" }}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`${ds.avatarSize} rounded-full bg-gradient-to-br from-[#7d5a50] to-[#4a352f] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5`}>{(sme.name || "B").charAt(0)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-1.5 flex-wrap">
                                    <span className={`${ds.fontSize} font-normal leading-snug text-[#4a352f]`}>{sme.name}</span>
                                    <button
                                      onClick={() => setShowDetails(sme)}
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
                            <td className={`${ds.cell} text-center`} style={{ minWidth: "230px" }}>
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={(e) => { if (!isTerminal) openPopupFromEvent("stage", sme, e); }}
                                  disabled={isTerminal}
                                  title={isTerminal ? `${statusStyle.stage.name} — no further stage` : `Move to ${nextStageLabel}`}
                                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                                    isTerminal
                                      ? "bg-[#e6d7c3]/60 text-[#a89482] cursor-not-allowed"
                                      : "text-white hover:shadow-md hover:brightness-105"
                                  }`}
                                  style={{ width: "128px", height: "34px", backgroundColor: isTerminal ? undefined : "#7d5a50" }}
                                >
                                  {!isTerminal && <ArrowRight size={13} className="flex-shrink-0" />}
                                  <span className="truncate">{isTerminal ? statusStyle.stage.name : nextStageLabel}</span>
                                </button>

                                {/* Save match — same bookmark, colours and
                                    borderless treatment as the SME-side
                                    advisor table. Dims while the write is in
                                    flight. */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleSaved(sme); }}
                                  disabled={isSaving}
                                  aria-pressed={sme.saved}
                                  aria-label={sme.saved ? "Remove from saved" : "Save match"}
                                  title={sme.saved ? "Remove from saved" : "Save match"}
                                  className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-[#f5f0e1] flex-shrink-0 ${isSaving ? "opacity-50 cursor-wait" : ""}`}
                                  style={{ color: sme.saved ? "#a67c52" : "#c8b6a6" }}
                                >
                                  <Bookmark size={14} fill={sme.saved ? "#a67c52" : "none"} />
                                </button>

                                <button
                                  onClick={(e) => openPopupFromEvent("quickActions", sme, e)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all hover:bg-[#f5f0e1] flex-shrink-0"
                                  style={{ borderColor: "#7d5a5050", color: "#7d5a50" }}
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

            {/* Pagination — the "Showing X–Y of N Businesses" readout and the
                rows-per-page dropdown were both removed; page size is fixed at
                25 and only the page buttons remain. */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-[#e6d7c3] bg-[#faf7f2] rounded-b-2xl">
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
              left: Math.min(Math.max(dragHintRect.left, 12), window.innerWidth - 200),
              width: "190px",
            }}
          >
            <GripVertical size={12} className="flex-shrink-0" /> Drag to reorder columns
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
              width: "280px",
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
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
                ? (fundingStageOptions.length ? fundingStageOptions : ["Pre-Seed", "Seed", "Series A", "Series B", "Growth"])
                : sectorOptions;
              return (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-[#4a352f]">{isStage ? "Funding Stage" : "Sector"}</label>
                    {localFilters[key].length > 0 && (
                      <button onClick={() => setLocalFilters((p) => ({ ...p, [key]: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto">
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

            {headerFilterOpen.type === "daysInStage" && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Days in Stage</label>
                  {(localFilters.daysInStageRange[0] != null || localFilters.daysInStageRange[1] != null) && (
                    <button onClick={() => setLocalFilters((p) => ({ ...p, daysInStageRange: [null, null] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input type="number" min="0" placeholder="Min" value={localFilters.daysInStageRange[0] ?? ""}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, daysInStageRange: [e.target.value === "" ? null : Number(e.target.value), p.daysInStageRange[1]] }))}
                    className="w-full px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                  <span className="text-[#7d5a50]">to</span>
                  <input type="number" min="0" placeholder="Max" value={localFilters.daysInStageRange[1] ?? ""}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, daysInStageRange: [p.daysInStageRange[0], e.target.value === "" ? null : Number(e.target.value)] }))}
                    className="w-full px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                </div>
              </>
            )}

            {headerFilterOpen.type === "applied" && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Date Applied</label>
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

            {/* Chip-list filters: the values actually present in the table,
                with a search box only once the list is long enough to need
                one. */}
            {FILTER_OPTION_SETS.map(({ type, label, options }) => {
              if (headerFilterOpen.type !== type) return null;
              const shown = options.filter((o) => o.toString().toLowerCase().includes(chipSearch.toLowerCase()));
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#4a352f]">{label}</label>
                    {localFilters[type].length > 0 && (
                      <button onClick={() => setLocalFilters((p) => ({ ...p, [type]: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                    )}
                  </div>

                  {options.length > 8 && (
                    <div className="relative mb-2">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a89482] pointer-events-none" />
                      <input
                        autoFocus
                        value={chipSearch}
                        onChange={(e) => setChipSearch(e.target.value)}
                        placeholder={`Search ${label.toLowerCase()}...`}
                        className="w-full pl-7 pr-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
                    {shown.length === 0 && (
                      <span className="text-xs text-[#a89482]">
                        {options.length === 0 ? "No data available" : "Nothing matches that search."}
                      </span>
                    )}
                    {shown.map((value) => (
                      <button
                        key={value}
                        onClick={() =>
                          setLocalFilters((p) => ({
                            ...p,
                            [type]: p[type].includes(value) ? p[type].filter((x) => x !== value) : [...p[type], value],
                          }))
                        }
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters[type].includes(value) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </PopupPortal>
      )}

      {/* ─── BIG Score Popup ──────────────────────────────────────────────── */}
      {activePopup?.type === "bigScore" && selectedSMEForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: "380px", maxHeight: "480px", overflowY: "auto" }}>
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
              {[
                { key: "compliance", label: "Compliance", desc: "Regulatory & legal standing" },
                { key: "legitimacy", label: "Legitimacy", desc: "Business verification status" },
                { key: "fundability", label: "Capital Appeal", desc: "Investment readiness & fundability" },
                { key: "pis", label: "Performance", desc: "Performance indicators & strategic metrics" },
                { key: "leadership", label: "Leadership", desc: "Management team quality & experience" },
              ].map(({ key, label, desc }) => {
                const score = selectedSMEForPopup.bigScoreBreakdown?.[key] || 0;
                const lbl = getBigScoreLabel(score);
                return (
                  <div key={key} className="bg-[#faf7f2] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-xs font-semibold text-[#4a352f]">{label}</span>
                        <p className="text-[10px] text-[#7d5a50]">{desc}</p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: lbl.color }}>{score}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#e6d7c3] rounded-full">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: lbl.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Same jump-off as the catalyst table: opens the business's own
                dashboard, locked to the BIG Score tab. */}
            <div className="px-4 pb-4">
              <button
                onClick={() => handleViewBigScorePage(selectedSMEForPopup)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#7d5a50] hover:text-[#4a352f] hover:bg-[#faf7f2] border border-[#e6d7c3]"
              >
                <ExternalLink size={12} /> Open full BIG Score page
              </button>
            </div>
          </div>
        </PopupPortal>
      )}

      {/* ─── Match Breakdown Popup ────────────────────────────────────────── */}
      {activePopup?.type === "match" && selectedSMEForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: "380px", maxHeight: "420px", overflowY: "auto" }}>
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Why this match?</p>
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[200px]">{selectedSMEForPopup.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold">{matchComputedScore ?? selectedSMEForPopup.matchPercentage}%</div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1"><X size={18} /></button>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {matchLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (<div key={i} className="h-16 bg-[#f5f0e1] rounded-lg animate-pulse" />))}
                </div>
              ) : Object.keys(matchBreakdownData || {}).length > 0 ? (
                Object.entries(matchBreakdownData).map(([key, c]) => {
                  const matched = !!c?.matched;
                  const color = matched ? "#22c55e" : "#ef4444";
                  const smeValue = Array.isArray(c.smeValue)
                    ? c.smeValue.join(", ") || "Not specified"
                    : String(c.smeValue || "Not specified");
                  const advisorValue = Array.isArray(c.advisorValue)
                    ? c.advisorValue.join(", ") || "Not specified"
                    : String(c.advisorValue || "Not specified");
                  return (
                    <div key={key} className="p-3 rounded-lg border border-[#e6d7c3] bg-[#faf7f2] text-xs">
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <span className="font-semibold text-[#4a352f]">{CATEGORY_LABEL[key] || formatLabel(key)}</span>
                        <span className="font-bold flex-shrink-0" style={{ color }}>
                          {matched ? "Match" : "No match"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden mb-2">
                        <div className="h-full rounded-full" style={{ width: matched ? "100%" : "0%", backgroundColor: color }} />
                      </div>
                      {/* Mirror of the SME-side wording, flipped to this side's
                          point of view: the business states a need, you offer. */}
                      <div className="text-[11px] text-[#7d5a50] leading-relaxed">
                        <div><span className="font-semibold">Business needs:</span> {smeValue}</div>
                        <div className="mt-0.5"><span className="font-semibold">You offer:</span> {advisorValue}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-[#a89482] m-0">Couldn't score this match.</p>
                  <p className="text-[11px] text-[#a89482] mt-1 m-0">
                    Either this business has no advisory needs assessment on file, or your own advisor profile is incomplete.
                  </p>
                </div>
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
                            placeholder="Initial discussion, strategy review, etc."
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

                    {stageFields.showTermSheet && (
                      <div>
                        <label className="block text-xs font-semibold text-[#4a352f] mb-1">Terms / Agreement Document (PDF, DOC)</label>
                        <input type="file" accept=".pdf,.doc,.docx"
                          onChange={(e) => setStageUpdateData((prev) => ({ ...prev, termSheetFile: e.target.files[0] }))}
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
                  style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "400px", maxHeight: "80vh", overflowY: "auto" }}>
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
                  <div className="mb-4">
                    <DayPicker mode="multiple" selected={tempDates} onSelect={handleDateSelect} fromDate={new Date()} />
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
              style={{ top: activePopup.position.y, left: activePopup.position.x, width: "230px" }}>
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#e6d7c3]">
                <span className="text-xs font-semibold text-[#4a352f]">Quick Actions</span>
                <button onClick={closePopup} className="text-[#7d5a50] hover:text-[#4a352f]"><X size={14} /></button>
              </div>
              <button onClick={() => { setShowDetails(sme); closePopup(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><Eye size={12} /> View Profile</button>
              <button onClick={() => openPopup("bigScore", sme, activePopup.rect)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><Target size={12} /> BIG Score Breakdown</button>
              {/* Opens the business's own dashboard, locked to the BIG Score
                  tab — same behaviour as the catalyst table's action. */}
              <button onClick={() => { handleViewBigScorePage(sme); closePopup(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><ExternalLink size={12} /> Open BIG Score Page</button>
              <button onClick={() => openPopup("match", sme, activePopup.rect)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><Target size={12} /> Why This Match?</button>
              <button onClick={() => { setNotification({ type: "success", message: "Messaging coming soon" }); closePopup(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><MessageSquare size={12} /> Send Message</button>
              {/* Both entry points call the same toggleSaved, so the row
                  bookmark and this item can't drift apart. */}
              <button
                onClick={() => { closePopup(); toggleSaved(sme); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
              >
                <Bookmark size={12} fill={sme.saved ? "#a67c52" : "none"} />
                {sme.saved ? "Remove from Saved" : "Save Match"}
              </button>
              <button
                onClick={() => {
                  closePopup();
                  setShowSavedOnly(true);
                  setCurrentPage(1);
                  setNotification({
                    type: "success",
                    message: savedCount > 0
                      ? `Showing your ${savedCount} saved business${savedCount === 1 ? "" : "es"}.`
                      : "You haven't saved any businesses yet — use the bookmark on a row.",
                  });
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"
              >
                <LayoutGrid size={12} /> View Saved ({savedCount})
              </button>
              {!stage.terminal && declinedStage && (
                <button
                  onClick={(e) => openPopupFromEvent("stage", sme, e, { presetStage: declinedStage.name })}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 text-left border-t border-[#e6d7c3]"
                >
                  <XCircle size={12} /> Decline Engagement
                </button>
              )}
            </div>
          </PopupPortal>
        );
      })()}

      {/* ─── Business Profile pop-up ───────────────────────────────────────
          Same component shape as the Advisor table's name pop-up, so both
          tables open an identical-looking profile. smeId is the
          universalProfiles document id; sme.id is only the row key. */}
      {showDetails && (
        <BusinessDetailsModal
          business={{
            businessId: showDetails.smeId || showDetails.id,
            businessName: showDetails.name,
            finalScore: showDetails.matchPercentage,
          }}
          isOpen
          onClose={() => setShowDetails(null)}
        />
      )}
    </div>
  );
}

// Default export alongside the named export so this component resolves whether
// the importing file uses `import AdvisorTable from "./AdvisorTable"` or
// `import { AdvisorTable } from "./AdvisorTable"`.
export default AdvisorTable;