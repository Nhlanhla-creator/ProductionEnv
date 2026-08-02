"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Info, Calendar, X, Eye, ChevronDown, MoreVertical, CheckCircle,
  Clock, Users, Download, MessageSquare, ArrowRight, SlidersHorizontal,
  RotateCcw, Settings, Target, Briefcase, Video, LayoutGrid, Trash2, Plus,
  GripVertical, AlertTriangle, XCircle, FileText, Star
} from "lucide-react";
import {
  doc, getDoc, getDocs, updateDoc, serverTimestamp, query, where, collection
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import * as XLSX from "xlsx";
import {
  DEFAULT_STAGES, PROGRAMME_TEMPLATES, mapStatusToStageId, getStageColors,
  getNextStageId, getStageActionConfig, loadPipelineSettings, getActiveStages,
  PIPELINE_SETTINGS_EVENT, notifyPipelineRefresh,
} from "./programSponsorStageConfig";

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

const getScoreColor = (score) => {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
};

// Stage lookups take the currently *active* stage list as a parameter (BIG
// Default, or whichever PROGRAMME_TEMPLATES entry the sponsor has switched to,
// with any customization applied) — rather than a hard-coded list. Without
// this, switching to e.g. the Learnership template (which introduces an
// "Assessment" stage) would leave that stage invisible in this table.
const getStageById = (id, stages = DEFAULT_STAGES) =>
  stages.find((s) => s.id === id) || stages[0];

const getStatusStyle = (status, stages = DEFAULT_STAGES) => {
  const stage = getStageById(mapStatusToStageId(status, stages), stages);
  const colors = getStageColors(stage.group);
  return { bg: colors.bgColor, text: colors.color, border: colors.borderColor, dot: colors.color, stage };
};

// Reads whatever the sponsor configured in the pipeline's "Stage Actions" panel.
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

const calculateMonthsLeft = (startDate, durationInMonths) => {
  if (!startDate || !durationInMonths) return null;
  const start = toDate(startDate);
  if (!start) return null;
  const duration = parseInt(durationInMonths, 10);
  if (isNaN(duration)) return null;
  const now = new Date();
  const monthsElapsed =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(0, duration - monthsElapsed);
};

// ─── Attention indicator ──────────────────────────────────────────────────────
const getAttentionReasons = (intern, stages = DEFAULT_STAGES) => {
  const reasons = [];
  const stageId = mapStatusToStageId(intern.pipelineStage, stages);
  if ((intern.bigScore || 0) < 40 && intern.bigScore > 0) reasons.push("BIG Score below threshold");
  if (stageId === "offered") reasons.push("Offer awaiting response");
  if (stageId === "completed") reasons.push("Awaiting final rating");
  // A sponsorship winding down while the placement is still live needs a call
  // on extension or absorption.
  if (intern.monthsLeft != null && intern.monthsLeft <= 1 && !["rated", "declined", "withdrawn"].includes(stageId)) {
    reasons.push("Sponsorship ending");
  }
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
// These are the columns that live *between* the pinned "Intern Name" (always
// first) and "Actions" (always last) columns. Users can drag these to reorder
// them; the array below is only the default/fallback order.
const DEFAULT_COLUMN_ORDER = [
  "bigScore", "match", "status", "internRole", "smeName", "sponsorStart",
  "internStart", "sponsorshipPeriod", "rating", "institution", "degree",
  "field", "location", "internType"
];

const COLUMN_DEFS = {
  bigScore: { label: "BIG Score", align: "center", minWidth: "100px", filterType: "bigScore", tooltip: "BIG Score measures internship readiness — presentation, professional skills, work experience and academics, weighted equally." },
  match: { label: "Match %", align: "center", minWidth: "110px", filterType: "match", tooltip: "Match Score measures fit with the role — skills, work mode, location, availability and profile completeness." },
  status: { label: "Status", align: "left", minWidth: "104px", filterType: "status" },
  internRole: { label: "Intern Role", align: "left", minWidth: "120px", filterType: "internRole" },
  smeName: { label: "SME Name", align: "left", minWidth: "110px", filterType: "smeName" },
  sponsorStart: { label: "Sponsorship Start", align: "left", minWidth: "116px", filterType: "sponsorStart" },
  internStart: { label: "Internship Start", align: "left", minWidth: "112px", filterType: "internStart" },
  sponsorshipPeriod: { label: "Sponsorship Left", align: "left", minWidth: "120px", filterType: "sponsorshipPeriod" },
  rating: { label: "Rating", align: "left", minWidth: "92px", filterType: "rating" },
  institution: { label: "Institution", align: "left", minWidth: "120px", filterType: "institution" },
  degree: { label: "Degree", align: "left", minWidth: "100px", filterType: "degree" },
  field: { label: "Field", align: "left", minWidth: "100px", filterType: "field" },
  location: { label: "Location", align: "left", minWidth: "96px", filterType: "location" },
  internType: { label: "Intern Type", align: "left", minWidth: "100px", filterType: "internType" }
};

// Maps a column key to the field on the mapped row object — these don't always
// match (e.g. "sme" shows `internName`, "match" shows `matchPercentage`).
const EXPORT_FIELD_MAP = {
  sme: "internName", bigScore: "bigScore", match: "matchPercentage",
  status: "statusLabel", internRole: "internRole", smeName: "smeName",
  sponsorStart: "sponsorStartLabel", internStart: "internStartLabel",
  sponsorshipPeriod: "sponsorshipPeriodLabel", rating: "ratingLabel",
  institution: "institution", degree: "degree", field: "field",
  location: "location", internType: "internType"
  // Note: "action" is intentionally omitted — it's a UI-only column.
};

const EXPORT_HEADERS = {
  sme: "Intern Name", bigScore: "BIG Score", match: "Match %", status: "Status",
  internRole: "Intern Role", smeName: "SME Name", sponsorStart: "Sponsorship Start",
  internStart: "Internship Start", sponsorshipPeriod: "Sponsorship Left",
  rating: "Rating", institution: "Institution", degree: "Degree", field: "Field",
  location: "Location", internType: "Intern Type"
};

// ─── Custom Views ─────────────────────────────────────────────────────────────
// A "view" bundles every layout preference — column visibility, column order,
// sort, and density — into one named, describable object, with exactly one view
// active at a time. Editing the table always edits the active view; there's no
// separate hidden "current layout" that can silently drift out of sync.
const DEFAULT_COLUMN_VISIBILITY = {
  sme: true, bigScore: true, match: true, status: true, action: true,
  internRole: true, smeName: true, sponsorStart: true, internStart: true,
  sponsorshipPeriod: true, rating: true,
  institution: false, degree: false, field: false, location: false, internType: false
};
const DEFAULT_SORT_CONFIG = { key: "attentionThenScore", direction: "desc" };
const DEFAULT_DENSITY = "comfortable";

const BUILTIN_VIEW_ID = "__default__";
const VIEWS_STORAGE_KEY = "program-sponsor-intern-table-views-v2";

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
  shortlisted: "Dear Candidate,\n\nGood news — you have been shortlisted for our programme. We will be in touch shortly with next steps.\n\nBest regards,\nProgramme Team",
  interview: "Dear Candidate,\n\nWe would like to invite you to an interview. Please confirm one of the times below.\n\nBest regards,\nProgramme Team",
  assessment: "Dear Candidate,\n\nYou have been invited to our assessment. Please confirm one of the times below and bring the documents listed in your portal.\n\nBest regards,\nProgramme Team",
  assessmentCentre: "Dear Candidate,\n\nYou have been invited to our assessment centre. Please confirm one of the times below.\n\nBest regards,\nProgramme Team",
  engaged: "Dear Candidate,\n\nWe would like to take your application further and meet with you. Please confirm a suitable time from the options below.\n\nBest regards,\nProgramme Team",
  offered: "Dear Candidate,\n\nCongratulations — we are pleased to offer you a place on our programme. Please find the offer attached for your review and acceptance.\n\nBest regards,\nProgramme Team",
  onboarding: "Dear Candidate,\n\nWelcome aboard. Please find your onboarding pack attached; our team will confirm your start date and induction schedule shortly.\n\nBest regards,\nProgramme Team",
  active: "Dear Candidate,\n\nYour placement is now active. Your supervisor will be in touch with your first-week schedule.\n\nBest regards,\nProgramme Team",
  completed: "Dear Candidate,\n\nCongratulations on completing your placement. We will share your final review and next-step options shortly.\n\nBest regards,\nProgramme Team",
  rated: "Dear Candidate,\n\nYour placement has been closed out and rated. Thank you for your contribution — your final review is available in your portal.\n\nWarm regards,\nProgramme Team",
  declined: "Dear Candidate,\n\nThank you for applying to our programme. After careful consideration, we are unable to offer you a place at this time.\n\nWe encourage you to apply for future intakes.\n\nRespectfully,\nProgramme Team",
};

// ─── Component ────────────────────────────────────────────────────────────────
export function ProgramSponsorInternTable({ filters = {}, stageFilter, onCountChange }) {
  const [rawInterns, setRawInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [updatedStages, setUpdatedStages] = useState({});

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
  const [localFilters, setLocalFilters] = useState({
    name: "", bigScoreRange: [0, 100], matchRange: [0, 100], status: [],
    internRole: "", smeName: "", institution: "", degree: "", field: "",
    location: "", internType: "", sponsorshipPeriodRange: [null, null], ratingRange: [null, null]
  });

  const [hoveredRowKey, setHoveredRowKey] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Column drag-to-reorder state
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragHintRect, setDragHintRect] = useState(null);

  // Popups
  const [activePopup, setActivePopup] = useState(null);
  const [selectedInternForPopup, setSelectedInternForPopup] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);   // full profile + documents
  const [briefModal, setBriefModal] = useState(null);       // role brief

  // Stage update form
  const [stageUpdateData, setStageUpdateData] = useState({
    nextStage: "", message: "", meetingTime: "", meetingLocation: "", meetingPurpose: "",
    offerFile: null, rating: "", feedback: ""
  });
  const [stageFormErrors, setStageFormErrors] = useState({});
  const [isStageSubmitting, setIsStageSubmitting] = useState(false);
  const [availabilities, setAvailabilities] = useState([]);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [tempDates, setTempDates] = useState([]);
  const [timeSlot, setTimeSlot] = useState({ start: "09:00", end: "17:00" });
  const [timeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // ─── Programme-aware pipeline stages ──────────────────────────────────────
  // Pipeline settings live in the shared localStorage key
  // program-sponsor-deal-flow-pipeline.jsx writes to, so the table's stage list
  // always matches whatever programme type is actually selected.
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
    const fetchSponsorAndInterns = async () => {
      const user = auth.currentUser;
      if (!user) { setLoading(false); return; }

      try {
        const sponsorProfileSnap = await getDoc(doc(db, "programSponsorProfiles", user.uid));
        if (!sponsorProfileSnap.exists()) {
          console.error("Sponsor profile not found");
          setLoading(false);
          return;
        }
        const sponsorData = sponsorProfileSnap.data();
        const sponsorOrgName = sponsorData.formData?.entityOverview?.organizationName || "";

        const applicationsSnapshot = await getDocs(collection(db, "internshipApplications"));

        const rows = await Promise.all(
          applicationsSnapshot.docs.map(async (applicationDoc) => {
            const data = applicationDoc.data();
            const internId = data.applicantId;
            if (!internId) return null;

            try {
              const internProfileSnap = await getDoc(doc(db, "internProfiles", internId));
              if (!internProfileSnap.exists()) return null;

              const profile = internProfileSnap.data();
              const affiliation = profile.formData?.programAffiliation || {};
              const internSponsorName = affiliation.sponsorName;

              // Guarded: this comparison previously called .toLowerCase() on a
              // possibly-undefined sponsor name, which threw and killed the
              // whole row rather than just skipping it.
              if (
                !internSponsorName || !sponsorOrgName ||
                internSponsorName.toLowerCase() !== sponsorOrgName.toLowerCase()
              ) return null;

              // Role brief context. Failures here shouldn't drop the row.
              let overview = {};
              let application = {};
              let applicationOverview = {};
              let internType = "Unspecified";
              try {
                const appDoc = await getDoc(doc(db, "internApplications", data.sponsorId));
                const appData = appDoc.data() || {};
                const snapshot = await getDocs(collection(db, "universalProfiles"));
                const smeData = snapshot.docs.length > 0 ? snapshot.docs[0].data() : {};
                application = appData.internshipRequest || appData || {};
                applicationOverview = appData.jobOverview || appData || {};
                overview = smeData.entityOverview || {};
                internType = application.internType || "Unspecified";
              } catch (briefError) {
                console.warn(`Error fetching brief data for ${internId}:`, briefError);
              }

              const docs = profile?.formData?.requiredDocuments || profile?.requiredDocuments || {};
              const pickDoc = (key) =>
                profile?.formData?.requiredDocuments?.[key]?.[0]?.url ||
                profile?.requiredDocuments?.[key]?.[0]?.url ||
                docs?.[key]?.[0]?.url || null;

              // Average rating
              let avgRating = null;
              try {
                const reviewsSnapshot = await getDocs(
                  query(collection(db, "internReviews"), where("internId", "==", internId))
                );
                if (!reviewsSnapshot.empty) {
                  const ratings = reviewsSnapshot.docs.map((d) => d.data().rating || 0);
                  avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
                }
              } catch (reviewError) {
                console.warn(`Error fetching reviews for ${internId}:`, reviewError);
              }

              return {
                id: applicationDoc.id,
                internId,
                internName: data.applicantName || "Unnamed Candidate",
                location: data.location || "N/A",
                institution: data.institution || "N/A",
                degree: data.degree || "N/A",
                field: data.field || "N/A",
                // Guarded: locationFlexibility was indexed at [0] without a
                // check, which threw whenever the field was missing.
                locationFlexibility: Array.isArray(data.locationFlexibility)
                  ? data.locationFlexibility[0] || "N/A"
                  : data.locationFlexibility || "N/A",
                internType,
                internRole: data.role || "N/A",
                internStart: data.startDate || "Anytime",
                sponsorStart: affiliation.programStartDate || null,
                sponsorDuration: affiliation.duration || null,
                monthsLeft: calculateMonthsLeft(affiliation.programStartDate, affiliation.duration),
                matchPercentage: data.matchAnalysis?.overallScore || data.matchPercentage || 0,
                matchAnalysis: data.matchAnalysis || null,
                smeName: data.sponsorName || "N/A",
                bigScore: data.bigInternScore || 0,
                // BIG Score components are kept *per row*. Previously a single
                // shared state object was overwritten inside the fetch loop, so
                // every row's breakdown showed the last candidate's scores.
                bigScoreBreakdown: {
                  PresentationScore: data.aiPresentationScore || 0,
                  ProfessionalSkillsScore: data.aiProfessionalSkillsScore || 0,
                  WorkExperienceScore: data.aiWorkExperienceScore || 0,
                  AcademicScore: data.aiAcademicScore || 0,
                },
                status: data.status || "New Match",
                ratingValue: avgRating,
                updatedAt: data.updatedAt || null,
                briefDescription: {
                  title: `Internship at ${overview.registeredName || overview.organizationName || "Organization"}`,
                  company: overview.registeredName || overview.organizationName || "Organization",
                  duration: application.duration || "Unspecified",
                  requirements: applicationOverview.briefDescription || null,
                  responsibilities: applicationOverview.keyTasks || null,
                  benefits: applicationOverview.learningOutcomes || null,
                  applicationProcess:
                    applicationOverview.applicationProcess ||
                    "Submit your application through the portal. Shortlisted candidates will be contacted for interviews.",
                },
                documents: {
                  CV: pickDoc("cvFile"),
                  "ID Document": pickDoc("idDocument"),
                  Transcript: pickDoc("transcriptFile"),
                  "Motivation Letter": pickDoc("motivationLetter"),
                  Portfolio: pickDoc("portfolioFile"),
                  "Proof of Study": pickDoc("proofOfStudy"),
                  References: pickDoc("references"),
                },
                email: profile?.userEmail || null,
                availableHours: profile?.skillsInterests?.availableHours || null,
                languagesSpoken: profile?.skillsInterests?.languagesSpoken || [],
                technicalSkills: profile?.skillsInterests?.technicalSkills || [],
              };
            } catch (error) {
              console.error(`Error processing intern ${internId}:`, error);
              return null;
            }
          })
        );

        const valid = rows.filter(Boolean);
        setRawInterns(valid);
        onCountChange?.(valid.length);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setNotification({ type: "error", message: "Failed to load applications" });
      } finally {
        setLoading(false);
      }
    };

    fetchSponsorAndInterns();
  }, [onCountChange]);

  // ─── Row mapping ──────────────────────────────────────────────────────────
  const interns = useMemo(() => {
    let mapped = rawInterns.map((a) => {
      const currentStatus = updatedStages[a.id] || a.status || "New Match";
      return {
        ...a,
        currentStatus,
        pipelineStage: currentStatus,
        statusLabel: getStatusStyle(currentStatus, activeStages).stage.name,
        nextStage: getNextStage(currentStatus, activeStages),
        sponsorStartLabel: a.sponsorStart ? formatDate(a.sponsorStart) : "N/A",
        internStartLabel: a.internStart && a.internStart !== "Anytime" ? formatDate(a.internStart) : (a.internStart || "N/A"),
        sponsorshipPeriodLabel: a.monthsLeft != null ? `${a.monthsLeft} months left` : "N/A",
        ratingLabel: a.ratingValue != null ? `${a.ratingValue.toFixed(1)} ★` : "No ratings yet",
      };
    });

    if (stageFilter) {
      mapped = mapped.filter((s) => mapStatusToStageId(s.pipelineStage, activeStages) === stageFilter);
    }

    return mapped;
  }, [rawInterns, updatedStages, activeStages, stageFilter]);

  // ─── Filtering & Sorting ──────────────────────────────────────────────────
  const filteredAndSortedInterns = useMemo(() => {
    let result = [...interns];


    // External filters panel (owned by the parent).
    if (filters.location) {
      result = result.filter((s) => (s.location || "").toLowerCase().includes(filters.location.toLowerCase()));
    }
    if (filters.institution) {
      result = result.filter((s) => (s.institution || "").toLowerCase().includes(filters.institution.toLowerCase()));
    }
    if (filters.matchScore) result = result.filter((s) => (s.matchPercentage || 0) >= filters.matchScore);
    if (filters.bigScore) result = result.filter((s) => (s.bigScore || 0) >= filters.bigScore);
    if (filters.field?.length > 0) {
      result = result.filter((s) => filters.field.some((f) => (s.field || "").toLowerCase().includes(f.toLowerCase())));
    }

    // Per-column header filters.
    if (localFilters.name?.trim()) {
      const q = localFilters.name.toLowerCase().trim();
      result = result.filter((s) => s.internName.toLowerCase().includes(q));
    }
    result = result.filter((s) => s.bigScore >= localFilters.bigScoreRange[0] && s.bigScore <= localFilters.bigScoreRange[1]);
    result = result.filter((s) => s.matchPercentage >= localFilters.matchRange[0] && s.matchPercentage <= localFilters.matchRange[1]);

    if (localFilters.status?.length > 0) {
      result = result.filter((s) => localFilters.status.includes(s.statusLabel));
    }

    const [periodMin, periodMax] = localFilters.sponsorshipPeriodRange;
    if (periodMin != null) result = result.filter((s) => (s.monthsLeft ?? 0) >= periodMin);
    if (periodMax != null) result = result.filter((s) => (s.monthsLeft ?? 0) <= periodMax);

    const [ratingMin, ratingMax] = localFilters.ratingRange;
    if (ratingMin != null) result = result.filter((s) => (s.ratingValue ?? 0) >= ratingMin);
    if (ratingMax != null) result = result.filter((s) => (s.ratingValue ?? 0) <= ratingMax);

    const textFilter = (key, field) => {
      if (localFilters[key]?.trim()) {
        const q = localFilters[key].toLowerCase().trim();
        result = result.filter((s) => (s[field] || "").toString().toLowerCase().includes(q));
      }
    };
    textFilter("internRole", "internRole");
    textFilter("smeName", "smeName");
    textFilter("institution", "institution");
    textFilter("degree", "degree");
    textFilter("field", "field");
    textFilter("location", "location");
    textFilter("internType", "internType");

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
  }, [interns, filters, localFilters, sortConfig, activeStages]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedInterns.length / pageSize));
  const paginatedInterns = filteredAndSortedInterns.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeFilterCount = (localFilters.name?.trim() ? 1 : 0)
    + localFilters.status.length
    + (localFilters.bigScoreRange[0] > 0 || localFilters.bigScoreRange[1] < 100 ? 1 : 0)
    + (localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100 ? 1 : 0)
    + (localFilters.sponsorshipPeriodRange[0] != null || localFilters.sponsorshipPeriodRange[1] != null ? 1 : 0)
    + (localFilters.ratingRange[0] != null || localFilters.ratingRange[1] != null ? 1 : 0)
    + ["internRole", "smeName", "institution", "degree", "field", "location", "internType"]
      .filter((k) => localFilters[k]?.trim()).length;

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const toggleColumn = (key) => setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }));

  const getFilterActive = (filterType) => {
    switch (filterType) {
      case "bigScore": return localFilters.bigScoreRange[0] > 0 || localFilters.bigScoreRange[1] < 100;
      case "match": return localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100;
      case "status": return localFilters.status.length > 0;
      case "sponsorshipPeriod": return localFilters.sponsorshipPeriodRange[0] != null || localFilters.sponsorshipPeriodRange[1] != null;
      case "rating": return localFilters.ratingRange[0] != null || localFilters.ratingRange[1] != null;
      case "sponsorStart":
      case "internStart": return false;
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
      className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${active ? "text-[#e6d7c3]" : "text-[#c8b6a6] hover:text-white"}`}
      title="Filter this column"
    >
      <SlidersHorizontal size={11} />
    </button>
  );

  // ─── Popups ───────────────────────────────────────────────────────────────
  const openPopup = (type, intern, rect, options = {}) => {
    let popupWidth, popupHeight;
    switch (type) {
      case "bigScore": popupWidth = 380; popupHeight = 440; break;
      case "match": popupWidth = 400; popupHeight = 460; break;
      case "stage": popupWidth = 450; popupHeight = 520; break;
      case "quickActions": popupWidth = 215; popupHeight = 270; break;
      default: popupWidth = 300; popupHeight = 300;
    }

    let x = rect.left + (rect.width / 2) - (popupWidth / 2);
    let y = rect.bottom + 8;
    if (x + popupWidth > window.innerWidth - 20) x = window.innerWidth - popupWidth - 20;
    if (x < 20) x = 20;
    if (y + popupHeight > window.innerHeight - 20) y = rect.top - popupHeight - 8;
    if (y < 20) y = 20;

    setSelectedInternForPopup(intern);
    setActivePopup({ type, key: intern.id, position: { x, y }, rect });

    if (type === "stage") {
      const presetStage = options.presetStage || intern.nextStage || getNextStage(intern.currentStatus, activeStages);
      const presetId = mapStatusToStageId(presetStage, activeStages);
      setStageUpdateData({
        nextStage: presetStage,
        message: DEFAULT_STAGE_MESSAGES[presetId] || "",
        meetingTime: "", meetingLocation: "", meetingPurpose: "",
        offerFile: null, rating: "", feedback: "",
      });
      setStageFormErrors({});
      setAvailabilities([]);
    }
  };

  const openPopupFromEvent = (type, intern, event, options) => {
    event.stopPropagation();
    openPopup(type, intern, event.currentTarget.getBoundingClientRect(), options);
  };

  const closePopup = () => {
    setActivePopup(null);
    setSelectedInternForPopup(null);
    setShowCalendarPopup(false);
  };

  // Forward-only through the live stages, with terminal outcomes always
  // reachable.
  const getStageProgressionError = (targetStageName, intern) => {
    const targetId = mapStatusToStageId(targetStageName, activeStages);
    const currentId = mapStatusToStageId(intern.currentStatus, activeStages);
    const target = activeStages.find((s) => s.id === targetId);
    const current = activeStages.find((s) => s.id === currentId);
    if (!target || !current) return null;
    if (target.id === current.id) return "This candidate is already at that stage";
    if (target.terminal) return null;
    if (current.terminal) return "This application has reached a final stage";
    if (target.order < current.order) return "Stages move forward only — use a terminal outcome to close or decline";
    return null;
  };

  // ─── Stage update ─────────────────────────────────────────────────────────
  // Status changes now persist. The old "Connect" button only set local React
  // state, so a refresh silently reverted every stage move.
  const handleStageUpdate = async () => {
    const intern = selectedInternForPopup;
    if (!intern) return;

    const stageFields = getStageFields(stageUpdateData.nextStage, activeStages);
    const targetId = mapStatusToStageId(stageUpdateData.nextStage, activeStages);
    const targetStage = activeStages.find((s) => s.id === targetId);

    const errors = {};
    if (!stageUpdateData.nextStage) errors.nextStage = "Please select a stage";
    else {
      const progressionError = getStageProgressionError(stageUpdateData.nextStage, intern);
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
    if (stageFields.showRating) {
      const r = Number(stageUpdateData.rating);
      if (!stageUpdateData.rating || isNaN(r) || r < 1 || r > 5) errors.rating = "Please give a rating from 1 to 5";
    }

    if (Object.keys(errors).length > 0) { setStageFormErrors(errors); return; }

    setIsStageSubmitting(true);
    try {
      const stageName = targetStage?.name || stageUpdateData.nextStage;

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
      if (stageFields.showAvailability) {
        updateData.availableDates = availabilities.map((a) => ({
          date: a.date instanceof Date ? a.date.toISOString() : a.date,
          timeSlots: a.timeSlots,
          timeZone: a.timeZone,
        }));
      }
      if (stageFields.showRating) {
        updateData.sponsorRating = Number(stageUpdateData.rating);
        updateData.sponsorFeedback = stageUpdateData.feedback || "";
      }

      await updateDoc(doc(db, "internshipApplications", intern.id), updateData);

      setUpdatedStages((prev) => ({ ...prev, [intern.id]: stageName }));
      setRawInterns((prev) => prev.map((r) =>
        r.id === intern.id ? { ...r, status: stageName, updatedAt: new Date() } : r
      ));
      notifyPipelineRefresh();

      setNotification({ type: "success", message: `${intern.internName} moved to ${stageName}` });
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
      // Respect the table's current visual order: pinned "Intern Name" first,
      // then the reorderable columns in whatever order they've been dragged
      // into, skipping the UI-only "Action" column and hidden columns.
      const visibleCols = [
        "sme",
        ...columnOrder.filter((key) => key !== "sme" && key !== "action" && columnVisibility[key])
      ].filter((key) => columnVisibility[key] && EXPORT_FIELD_MAP[key]);

      if (visibleCols.length === 0) {
        setNotification({ type: "error", message: "No visible columns to export" });
        return;
      }
      if (filteredAndSortedInterns.length === 0) {
        setNotification({ type: "error", message: "No interns to export" });
        return;
      }

      const rows = filteredAndSortedInterns.map((intern) => {
        const row = {};
        visibleCols.forEach((key) => {
          const label = EXPORT_HEADERS[key] || key;
          let value = intern[EXPORT_FIELD_MAP[key]];
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
      XLSX.utils.book_append_sheet(workbook, worksheet, "Interns");
      XLSX.writeFile(workbook, `interns-export-${new Date().toISOString().split("T")[0]}.xlsx`);
      setNotification({ type: "success", message: "Export downloaded" });
    } catch (error) {
      console.error("Export error:", error);
      setNotification({ type: "error", message: `Export failed: ${error.message}` });
    }
  };

  // ─── Availability helpers ─────────────────────────────────────────────────
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

  // Sponsorship-remaining colour: green above 70% of the term left, amber
  // 30–70%, red below 30%.
  const sponsorshipColor = (intern) => {
    if (intern.monthsLeft == null || !intern.sponsorDuration) return "#7d5a50";
    const total = parseInt(intern.sponsorDuration, 10);
    if (isNaN(total) || total === 0) return "#7d5a50";
    const pct = (intern.monthsLeft / total) * 100;
    if (pct > 70) return "#22c55e";
    if (pct > 30) return "#f59e0b";
    return "#ef4444";
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-4">
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
                      {[{ key: "sme", label: "Intern Name" }, { key: "bigScore", label: "BIG Score" }, { key: "match", label: "Match %" }, { key: "status", label: "Status" }, { key: "action", label: "Action" }].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 py-2 px-2 rounded-lg opacity-75">
                          <input type="checkbox" checked readOnly disabled className="rounded border-[#c8b6a6]" />
                          <span className="text-sm text-[#4a352f]">{label}</span>
                        </label>
                      ))}
                      <div className="border-t border-[#e6d7c3] my-2" />
                      {[
                        { key: "internRole", label: "Intern Role" }, { key: "smeName", label: "SME Name" },
                        { key: "sponsorStart", label: "Sponsorship Start" }, { key: "internStart", label: "Internship Start" },
                        { key: "sponsorshipPeriod", label: "Sponsorship Left" }, { key: "rating", label: "Rating" },
                        { key: "institution", label: "Institution" }, { key: "degree", label: "Degree" },
                        { key: "field", label: "Field" }, { key: "location", label: "Location" },
                        { key: "internType", label: "Intern Type" },
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

            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#7d5a50] to-[#4a352f] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all shadow-sm" title="Export the currently filtered/sorted interns to Excel (.xlsx)">
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
                .pst-th { color: #faf7f2 !important; line-height: 1.1; font-size: 0.75rem !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; font-family: inherit !important; vertical-align: top !important; }
                .pst-th-draggable { cursor: grab; }
                .pst-th-draggable:active { cursor: grabbing; }
                /* Wrap header labels onto at most 2 lines instead of forcing
                   the column wider than needed. This only lays out cleanly
                   because each column also has a real min-width in
                   COLUMN_DEFS — without that floor, the browser sizes
                   wrapped-text columns to their smallest possible content. */
                .pst-th-label { flex: 1 1 auto; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; overflow-wrap: break-word; line-height: 1.2; }
                /* Column resizing: an explicit header width only holds if the
                   cells below can shrink, so long values wrap rather than
                   forcing the column wider than the width that was dragged. */
                .bigt-fit th, .bigt-fit td { overflow: hidden; }
                .bigt-fit td { word-break: break-word; }
              `}</style>
              <table className="border-collapse bigt-fit" style={{ tableLayout: "auto" }}>
                <thead>
                  <tr className="bg-[#4a352f]">
                    <th className="pst-th py-3 px-3 relative text-left font-semibold uppercase tracking-wider text-xs border-r border-[#e6d7c3] sticky top-0 left-0 z-30" style={{ backgroundColor: "#4a352f", ...widthStyle("__name__", "170px", "190px") }}>
                      <div className="flex items-start gap-1 min-w-0">
                        <span className="pst-th-label">Intern Name</span>
                        <FilterTrigger type="name" active={!!localFilters.name.trim()} />
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
                          className={`pst-th pst-th-draggable py-3 px-3 relative font-semibold uppercase tracking-wider text-xs border-r border-[#e6d7c3] sticky top-0 z-20 select-none transition-opacity ${col.align === "center" ? "text-center" : "text-left"} ${isDragging ? "opacity-40" : ""}`}
                          style={{ ...widthStyle(key, col.minWidth), backgroundColor: isDragOver ? "#5a423b" : "#4a352f" }}
                        >
                          <div className={`flex items-start gap-1 min-w-0 ${col.align === "center" ? "justify-center" : ""}`}>
                            <GripVertical size={11} className="opacity-40 flex-shrink-0 mt-0.5" />
                            <span className="pst-th-label">{col.label}</span>
                            <FilterTrigger type={col.filterType} active={getFilterActive(col.filterType)} />
                            {col.tooltip && <HeaderInfoTooltip text={col.tooltip} />}
                          </div>
                          <ColumnResizer colKey={key} />
                        </th>
                      );
                    })}

                    {columnVisibility.action && (
                      <th className="pst-th py-3 px-3 relative text-center font-semibold uppercase tracking-wider text-xs whitespace-nowrap sticky top-0 z-20" style={{ minWidth: "190px", backgroundColor: "#4a352f" }}>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedInterns.length === 0 ? (
                    <tr><td colSpan={Object.values(columnVisibility).filter(Boolean).length + 1} className="text-center py-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-[#f5f0e1] flex items-center justify-center"><Users size={32} className="text-[#7d5a50] opacity-50" /></div>
                        <p className="text-lg font-semibold text-[#4a352f]">No Interns Found</p>
                        <p className="text-sm text-[#7d5a50] max-w-xs">
                          {activeFilterCount > 0
                            ? "Clear a filter to widen the list."
                            : "Candidates matched to your programme will appear here once applications come in."}
                        </p>
                      </div>
                    </td></tr>
                  ) : (
                    paginatedInterns.map((intern) => {
                      const bigScoreLabel = getBigScoreLabel(intern.bigScore);
                      const matchLabel = getMatchLabel(intern.matchPercentage);
                      const statusStyle = getStatusStyle(intern.currentStatus, activeStages);
                      const isTerminal = !!statusStyle.stage.terminal;
                      const nextStageLabel = intern.nextStage || "—";

                      const renderCell = (key) => {
                        switch (key) {
                          case "bigScore":
                            return (
                              <td key={key} className={`${ds.cell} text-center cursor-pointer border-r border-[#e6d7c3]`} onClick={(e) => openPopupFromEvent("bigScore", intern, e)}>
                                <div className="flex flex-col items-center gap-1">
                                  <div className="relative w-11 h-11">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                      <circle cx="18" cy="18" r="14" fill="none" stroke="#e6d7c3" strokeWidth="3" />
                                      <circle cx="18" cy="18" r="14" fill="none" stroke={bigScoreLabel.color} strokeWidth="3" strokeDasharray={`${intern.bigScore * 0.88} 88`} strokeLinecap="round" />
                                    </svg>
                                    <span className={`absolute inset-0 flex items-center justify-center ${ds.fontSize} font-normal`} style={{ color: bigScoreLabel.color }}>{intern.bigScore}</span>
                                  </div>
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${bigScoreLabel.color}20`, color: bigScoreLabel.color }}>{bigScoreLabel.label}</span>
                                </div>
                              </td>
                            );
                          case "match":
                            return (
                              <td key={key} className={`${ds.cell} text-center cursor-pointer border-r border-[#e6d7c3]`} onClick={(e) => openPopupFromEvent("match", intern, e)}>
                                <div className="flex flex-col items-center gap-1 w-full max-w-[90px] mx-auto">
                                  <span className={`${ds.fontSize} font-normal text-[#4a352f]`}>{intern.matchPercentage}%</span>
                                  <span className="text-xs font-medium" style={{ color: matchLabel.color }}>{matchLabel.label}</span>
                                  <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${intern.matchPercentage}%`, backgroundColor: matchLabel.color }} />
                                  </div>
                                </div>
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
                          case "internRole":
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <div className="flex items-start gap-1.5">
                                  <span className="line-clamp-2">{intern.internRole}</span>
                                  <button
                                    onClick={() => setBriefModal(intern)}
                                    className="text-[#a89482] hover:text-[#7d5a50] flex-shrink-0 mt-0.5"
                                    title="View role brief"
                                  >
                                    <FileText size={13} />
                                  </button>
                                </div>
                              </td>
                            );
                          case "sponsorStart":
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <div className="flex items-center gap-1.5"><Calendar size={14} className="text-[#7d5a50]" />{intern.sponsorStartLabel}</div>
                              </td>
                            );
                          case "internStart":
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <div className="flex items-center gap-1.5"><Calendar size={14} className="text-[#7d5a50]" />{intern.internStartLabel}</div>
                              </td>
                            );
                          case "sponsorshipPeriod":
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} border-r border-[#e6d7c3]`}>
                                <div className="flex items-center gap-1.5" style={{ color: sponsorshipColor(intern) }}>
                                  <Clock size={14} />
                                  <span className="font-semibold">{intern.sponsorshipPeriodLabel}</span>
                                </div>
                              </td>
                            );
                          case "rating":
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                {intern.ratingValue != null ? (
                                  <span className="inline-flex items-center gap-1 font-semibold" style={{ color: "#a67c52" }}>
                                    <Star size={13} /> {intern.ratingValue.toFixed(1)}
                                  </span>
                                ) : (
                                  <span className="text-[#a89482]">Not rated</span>
                                )}
                              </td>
                            );
                          case "smeName":
                          case "institution":
                          case "degree":
                          case "field":
                          case "location":
                          case "internType":
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <span className="line-clamp-2">{intern[key]}</span>
                              </td>
                            );
                          default:
                            return null;
                        }
                      };

                      return (
                        <tr
                          key={intern.id}
                          className="border-b border-[#f0e6d9] transition-all"
                          style={{ backgroundColor: hoveredRowKey === intern.id ? "#fdf8f4" : undefined }}
                          onMouseEnter={() => setHoveredRowKey(intern.id)}
                          onMouseLeave={() => setHoveredRowKey(null)}
                        >
                          {columnVisibility.sme && (
                            <td
                              className={`${ds.cell} ${ds.fontSize} text-[#4a352f] sticky left-0 border-r border-b border-[#e6d7c3] z-10 transition-colors`}
                              style={{ ...widthStyle("__name__", "170px", "190px"), backgroundColor: hoveredRowKey === intern.id ? "#fdf8f4" : "#ffffff" }}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`${ds.avatarSize} rounded-full bg-gradient-to-br from-[#7d5a50] to-[#4a352f] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5`}>{(intern.internName || "?").charAt(0)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-1.5 flex-wrap">
                                    <span className={`${ds.fontSize} font-normal leading-snug text-[#4a352f]`}>{intern.internName}</span>
                                    <button
                                      onClick={() => setDetailsModal(intern)}
                                      className="text-[#a89482] hover:text-[#7d5a50] transition-colors flex-shrink-0 mt-0.5"
                                      aria-label={`View profile for ${intern.internName}`}
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
                            <td className={`${ds.cell} text-center`} style={{ minWidth: "190px" }}>
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={(e) => { if (!isTerminal) openPopupFromEvent("stage", intern, e); }}
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
                                <button
                                  onClick={(e) => openPopupFromEvent("quickActions", intern, e)}
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

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#e6d7c3] bg-[#faf7f2] rounded-b-2xl">
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#4a352f]">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filteredAndSortedInterns.length)}-{Math.min(currentPage * pageSize, filteredAndSortedInterns.length)} of {filteredAndSortedInterns.length} Interns
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
            }}
          >
            {headerFilterOpen.type === "name" && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Filter by intern name</label>
                  {localFilters.name && (
                    <button onClick={() => setLocalFilters((p) => ({ ...p, name: "" }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <input
                  autoFocus type="text" value={localFilters.name}
                  onChange={(e) => { setLocalFilters((p) => ({ ...p, name: e.target.value })); setCurrentPage(1); }}
                  placeholder="Search intern name..."
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

            {(headerFilterOpen.type === "sponsorshipPeriod" || headerFilterOpen.type === "rating") && (() => {
              const isPeriod = headerFilterOpen.type === "sponsorshipPeriod";
              const key = isPeriod ? "sponsorshipPeriodRange" : "ratingRange";
              const range = localFilters[key];
              return (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#4a352f]">{isPeriod ? "Months left" : "Rating (1–5)"}</label>
                    {(range[0] != null || range[1] != null) && (
                      <button onClick={() => setLocalFilters((p) => ({ ...p, [key]: [null, null] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="number" min="0" step={isPeriod ? 1 : 0.5} placeholder="Min" value={range[0] ?? ""}
                      onChange={(e) => setLocalFilters((p) => ({ ...p, [key]: [e.target.value === "" ? null : Number(e.target.value), p[key][1]] }))}
                      className="w-full px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                    <span className="text-[#7d5a50]">to</span>
                    <input type="number" min="0" step={isPeriod ? 1 : 0.5} placeholder="Max" value={range[1] ?? ""}
                      onChange={(e) => setLocalFilters((p) => ({ ...p, [key]: [p[key][0], e.target.value === "" ? null : Number(e.target.value)] }))}
                      className="w-full px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                  </div>
                </>
              );
            })()}

            {["internRole", "smeName", "institution", "degree", "field", "location", "internType"].includes(headerFilterOpen.type) && (() => {
              const key = headerFilterOpen.type;
              const labels = {
                internRole: "intern role", smeName: "SME name", institution: "institution",
                degree: "degree", field: "field", location: "location", internType: "intern type",
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

      {/* ─── BIG Score Popup ──────────────────────────────────────────────── */}
      {activePopup?.type === "bigScore" && selectedInternForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: "380px", maxHeight: "440px", overflowY: "auto" }}>
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">BIG Score</p>
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[200px]">{selectedInternForPopup.internName}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center text-xl font-bold">
                    {selectedInternForPopup.bigScore}
                  </div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1"><X size={18} /></button>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-[11px] text-[#a89482]">Each component is weighted equally at 25%.</p>
              {[
                { key: "PresentationScore", label: "Presentation", desc: "Communication and presentation capability" },
                { key: "ProfessionalSkillsScore", label: "Professional Skills", desc: "Technical and professional competencies" },
                { key: "WorkExperienceScore", label: "Work Experience", desc: "Relevant experience and practical skills" },
                { key: "AcademicScore", label: "Academic", desc: "Educational background and achievement" },
              ].map(({ key, label, desc }) => {
                const score = selectedInternForPopup.bigScoreBreakdown?.[key] || 0;
                const color = getScoreColor(score);
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
            </div>
          </div>
        </PopupPortal>
      )}

      {/* ─── Match Breakdown Popup ────────────────────────────────────────── */}
      {activePopup?.type === "match" && selectedInternForPopup && (() => {
        const analysis = selectedInternForPopup.matchAnalysis;
        const breakdown = analysis?.breakdown || {};
        const summary = analysis?.matchSummary || {};
        const components = [
          { key: "skillsMatch", label: "Skills / Role", max: 30 },
          { key: "workModeCompatibility", label: "Work Mode", max: 25 },
          { key: "locationCompatibility", label: "Location", max: 20 },
          { key: "availabilityAlignment", label: "Availability", max: 15 },
          { key: "profileCompleteness", label: "Profile", max: 10 },
        ];
        return (
          <PopupPortal>
            <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
            <div className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden"
              style={{ top: activePopup.position.y, left: activePopup.position.x, width: "400px", maxHeight: "460px", overflowY: "auto" }}>
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Why this match?</p>
                    <h3 className="text-sm font-bold mt-0.5 truncate max-w-[220px]">{selectedInternForPopup.internName}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xl font-bold">{selectedInternForPopup.matchPercentage}%</div>
                    <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1"><X size={18} /></button>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {summary.overallAssessment && (
                  <p className="text-xs text-[#4a352f] bg-[#faf7f2] rounded-lg p-3 border border-[#e6d7c3]">{summary.overallAssessment}</p>
                )}
                {analysis ? components.map(({ key, label, max }) => {
                  const data = breakdown[key] || {};
                  const maxScore = data.maxScore || max;
                  const score = data.score || 0;
                  const pct = maxScore ? Math.round((score / maxScore) * 100) : 0;
                  const good = pct >= 50;
                  return (
                    <div key={key} className="p-3 rounded-lg border border-[#e6d7c3] bg-[#faf7f2] text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-[#4a352f]">
                          {label}
                          <span className="font-normal text-[#a89482]"> · {score}/{maxScore}</span>
                        </span>
                        <span className="font-bold" style={{ color: good ? "#22c55e" : "#ef4444" }}>{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden mb-1.5">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: good ? "#22c55e" : "#ef4444" }} />
                      </div>
                      {data.description && <p className="text-[11px] text-[#7d5a50]">{data.description}</p>}
                    </div>
                  );
                }) : <p className="text-xs text-[#a89482] text-center py-4">No match analysis available for this application.</p>}

                {summary.strongPoints?.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-1.5">Strengths</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {summary.strongPoints.map((p, i) => (
                        <li key={i} className="text-xs text-[#4a352f]">{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </PopupPortal>
        );
      })()}

      {/* ─── Stage Update Popup ───────────────────────────────────────────── */}
      {activePopup?.type === "stage" && selectedInternForPopup && (() => {
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
                    <h3 className="text-sm font-bold mt-0.5 truncate max-w-[300px]">{selectedInternForPopup.internName}</h3>
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
                        <label className="block text-xs font-semibold text-[#4a352f] mb-1">Message to Candidate *</label>
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
                            placeholder="Interview, induction, check-in, etc."
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

                    {stageFields.showOfferLetter && (
                      <div>
                        <label className="block text-xs font-semibold text-[#4a352f] mb-1">Offer / Agreement Document (PDF, DOC)</label>
                        <input type="file" accept=".pdf,.doc,.docx"
                          onChange={(e) => setStageUpdateData((prev) => ({ ...prev, offerFile: e.target.files[0] }))}
                          className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-xs" />
                        {stageUpdateData.offerFile && (
                          <p className="text-xs text-green-700 mt-1">Selected: {stageUpdateData.offerFile.name}</p>
                        )}
                      </div>
                    )}

                    {stageFields.showRating && (
                      <div className="bg-[#faf7f2] rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-semibold text-[#4a352f] flex items-center gap-2"><Star size={14} /> Final Rating</h4>
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Rating (1–5) *</label>
                          <input type="number" min="1" max="5" step="0.5" value={stageUpdateData.rating}
                            onChange={(e) => setStageUpdateData((prev) => ({ ...prev, rating: e.target.value }))}
                            className={`w-full px-3 py-2 border-2 rounded-lg text-xs ${stageFormErrors.rating ? "border-red-500" : "border-[#c8b6a6]"}`} />
                          {stageFormErrors.rating && <p className="text-red-500 text-xs mt-1">{stageFormErrors.rating}</p>}
                        </div>
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Feedback</label>
                          <textarea value={stageUpdateData.feedback} rows={3}
                            onChange={(e) => setStageUpdateData((prev) => ({ ...prev, feedback: e.target.value }))}
                            placeholder="What went well, what could improve..."
                            className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-xs resize-y" />
                        </div>
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
                          onClick={() => setTempDates(
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
      {activePopup?.type === "quickActions" && selectedInternForPopup && (() => {
        const intern = selectedInternForPopup;
        const stage = getStatusStyle(intern.currentStatus, activeStages).stage;
        const declinedStage = activeStages.find((s) => s.terminal && /declined/i.test(s.name));
        return (
          <PopupPortal>
            <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
            <div className="fixed z-[1001] bg-white rounded-xl shadow-2xl border border-[#e6d7c3] py-1 overflow-hidden"
              style={{ top: activePopup.position.y, left: activePopup.position.x, width: "215px" }}>
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#e6d7c3]">
                <span className="text-xs font-semibold text-[#4a352f]">Quick Actions</span>
                <button onClick={closePopup} className="text-[#7d5a50] hover:text-[#4a352f]"><X size={14} /></button>
              </div>
              <button onClick={() => { setDetailsModal(intern); closePopup(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><Eye size={12} /> View Profile & Documents</button>
              <button onClick={() => { setBriefModal(intern); closePopup(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><FileText size={12} /> View Role Brief</button>
              <button onClick={() => openPopup("bigScore", intern, activePopup.rect)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><Target size={12} /> BIG Score Breakdown</button>
              <button onClick={() => openPopup("match", intern, activePopup.rect)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><Target size={12} /> Why This Match?</button>
              <button onClick={() => { setNotification({ type: "success", message: "Messaging coming soon" }); closePopup(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><MessageSquare size={12} /> Send Message</button>
              {!stage.terminal && declinedStage && (
                <button
                  onClick={(e) => openPopupFromEvent("stage", intern, e, { presetStage: declinedStage.name })}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 text-left border-t border-[#e6d7c3]"
                >
                  <XCircle size={12} /> Decline Candidate
                </button>
              )}
            </div>
          </PopupPortal>
        );
      })()}

      {/* ─── Profile & Documents Modal ────────────────────────────────────── */}
      {detailsModal && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#4a352f]/40 backdrop-blur-sm font-sans p-4" onClick={() => setDetailsModal(null)}>
            <div className="bg-white rounded-3xl shadow-2xl border border-[#e6d7c3] w-[680px] max-w-full max-h-[86vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-5 text-white sticky top-0 z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Intern Profile</p>
                  <h3 className="text-lg font-bold mt-0.5">{detailsModal.internName}</h3>
                </div>
                <button onClick={() => setDetailsModal(null)} className="text-white/70 hover:text-white p-1"><X size={20} /></button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {[
                    ["Status", detailsModal.statusLabel],
                    ["Intern role", detailsModal.internRole],
                    ["SME", detailsModal.smeName],
                    ["Institution", detailsModal.institution],
                    ["Degree", detailsModal.degree],
                    ["Field", detailsModal.field],
                    ["Location", detailsModal.location],
                    ["Intern type", detailsModal.internType],
                    ["Sponsorship start", detailsModal.sponsorStartLabel],
                    ["Internship start", detailsModal.internStartLabel],
                    ["Sponsorship left", detailsModal.sponsorshipPeriodLabel],
                    ["Rating", detailsModal.ratingLabel],
                    ["Available hours", detailsModal.availableHours || "N/A"],
                    ["Email", detailsModal.email || "N/A"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-1">{label}</p>
                      <p className="text-sm text-[#4a352f]">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#e6d7c3]">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-1">BIG Score</p>
                    <p className="text-2xl font-bold" style={{ color: getBigScoreLabel(detailsModal.bigScore).color }}>
                      {detailsModal.bigScore}% <span className="text-sm font-medium">{getBigScoreLabel(detailsModal.bigScore).label}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-1">Match</p>
                    <p className="text-2xl font-bold" style={{ color: getMatchLabel(detailsModal.matchPercentage).color }}>
                      {detailsModal.matchPercentage}% <span className="text-sm font-medium">{getMatchLabel(detailsModal.matchPercentage).label}</span>
                    </p>
                  </div>
                </div>

                {detailsModal.technicalSkills?.length > 0 && (
                  <div className="pt-2 border-t border-[#e6d7c3]">
                    <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-2">Technical skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detailsModal.technicalSkills.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#f5f0e1] text-[#4a352f]">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-[#e6d7c3]">
                  <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-2">Documents</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(detailsModal.documents || {}).map(([label, url]) => (
                      <div key={label} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-[#e6d7c3] bg-[#faf7f2]">
                        <span className="text-xs text-[#4a352f]">{label}</span>
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#7d5a50] hover:text-[#4a352f] underline underline-offset-2 flex-shrink-0">
                            Open
                          </a>
                        ) : (
                          <span className="text-xs text-[#a89482] flex-shrink-0">Not uploaded</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PopupPortal>
      )}

      {/* ─── Role Brief Modal ─────────────────────────────────────────────── */}
      {briefModal && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#4a352f]/40 backdrop-blur-sm font-sans p-4" onClick={() => setBriefModal(null)}>
            <div className="bg-white rounded-3xl shadow-2xl border border-[#e6d7c3] w-[620px] max-w-full max-h-[86vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-5 text-white sticky top-0 z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Role Brief</p>
                  <h3 className="text-lg font-bold mt-0.5">{briefModal.briefDescription.title}</h3>
                </div>
                <button onClick={() => setBriefModal(null)} className="text-white/70 hover:text-white p-1"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#faf7f2] border border-[#e6d7c3]">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold">Host</p>
                    <p className="text-sm font-semibold text-[#4a352f]">{briefModal.briefDescription.company}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold">Duration</p>
                    <p className="text-sm font-semibold text-[#4a352f]">{briefModal.briefDescription.duration}</p>
                  </div>
                </div>

                {/* These three fields arrive as either an array or a single
                    string depending on how the host filled the form. The old
                    version rendered them straight into a <ul>, which printed
                    a bare string with no list items. */}
                {[
                  ["Requirements", briefModal.briefDescription.requirements],
                  ["Key responsibilities", briefModal.briefDescription.responsibilities],
                  ["What you'll gain", briefModal.briefDescription.benefits],
                ].map(([label, value]) => {
                  if (!value) return null;
                  const items = Array.isArray(value) ? value : [value];
                  return (
                    <div key={label}>
                      <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-2">{label}</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {items.map((item, i) => (
                          <li key={i} className="text-sm text-[#4a352f]">{item}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}

                <div className="px-4 py-3 rounded-xl bg-[#f5f0e1] border border-[#e6d7c3]">
                  <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-1">Application process</p>
                  <p className="text-sm text-[#4a352f] leading-relaxed">{briefModal.briefDescription.applicationProcess}</p>
                </div>
              </div>
            </div>
          </div>
        </PopupPortal>
      )}
    </div>
  );
}

// Default export alongside the named export so this component resolves whether
// the importing file uses `import ProgramSponsorInternTable from "./..."` or
// `import { ProgramSponsorInternTable } from "./..."`.
export default ProgramSponsorInternTable;