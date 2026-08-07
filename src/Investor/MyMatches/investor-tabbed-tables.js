"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Users, XCircle, Eye, X, Info, Calendar, ChevronDown, Download, Plus,
  Trash2, Settings, RotateCcw, SlidersHorizontal, LayoutGrid, GripVertical,
  CheckCircle, ArrowUp, ArrowDown, ArrowUpDown
} from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import * as XLSX from "xlsx";
import { InvestorSMETable } from "./investor-sme-table";
import InvestorSMEDetailsModal from "./InvestorSMEDetailsModal";
import {
  mapStatusToStageId, getActiveStages, loadPipelineSettings, PIPELINE_REFRESH_EVENT
} from "./investorStageConfig";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "" || value === "Not specified") return "Not specified";
  const num = parseFloat(value.toString().replace(/[^0-9.]/g, ""));
  if (isNaN(num) || num === 0) return value.toString();
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
  return d ? d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "Not specified";
};

// Any wording a negative terminal stage might carry, across every programme
// template. Used twice: to pick the terminal stage ids out of the active stage
// list, and as a fallback against the row's raw status string.
const NEGATIVE_STATUS_RE = /declin|withdraw|unsuccess|reject|not proceed|pass/i;

// Renders straight to <body> so `position: fixed` popups can't be trapped by an
// ancestor that establishes a containing block.
const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
};

const HeaderInfoTooltip = ({ text }) => {
  const [rect, setRect] = useState(null);
  if (!text) return null;
  return (
    <span onMouseEnter={(e) => setRect(e.currentTarget.getBoundingClientRect())} onMouseLeave={() => setRect(null)} className="inline-flex">
      <Info size={12} style={{ color: "#d9c7b8" }} className="opacity-80 hover:opacity-100" />
      {rect && (
        <PopupPortal>
          <div className="fixed z-[1200] bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none normal-case font-normal"
            style={{ top: rect.bottom + 8, left: Math.min(Math.max(rect.left - 90, 12), window.innerWidth - 232), width: "220px" }}>
            {text}
          </div>
        </PopupPortal>
      )}
    </span>
  );
};

// ─── Column definitions ───────────────────────────────────────────────────────
// Outcome-shaped columns replace the deal-shaped ones this table used to carry.
// ROI, revenue growth, deal structure and completion date all describe money
// that moved; on an application that was declined none of them hold a value.
// What matters is what was asked for, when it came in, when it closed, and why.
const DEFAULT_COLUMN_ORDER = [
  "fundingRequested", "dealType", "appliedDate", "declinedDate", "currentStatus",
  "reason", "sector", "location", "smeStage", "teamSize"
];

const COLUMN_DEFS = {
  fundingRequested: {
    label: "Funding Requested", minWidth: "132px", filter: "range", sortKey: "fundingRequestedRaw",
    tooltip: "The amount the business asked for. Filtering and sorting use the underlying number, not the formatted label.",
  },
  dealType: {
    label: "Instrument", minWidth: "112px", filter: "select", type: "badge",
    tooltip: "The funding instrument under discussion when the application was declined — equity, debt, grant and so on.",
  },
  appliedDate: {
    label: "Date Applied", minWidth: "116px", filter: "date", type: "date",
    tooltip: "When the business submitted its application to your fund.",
  },
  declinedDate: {
    label: "Date Declined", minWidth: "120px", filter: "date", type: "date",
    tooltip: "When the application was last updated — for these rows, when it was declined or withdrawn.",
  },
  currentStatus: {
    label: "Outcome", minWidth: "128px", filter: "select", type: "status",
    tooltip: "The final stage this application ended on: declined, withdrawn, or not proceeding.",
  },
  reason: {
    label: "Reason Given", minWidth: "184px", filter: "text",
    tooltip: "The reason recorded at decline. Falls back to the last message sent when no reason was captured.",
  },
  sector: {
    label: "Sector", minWidth: "116px", filter: "select",
    tooltip: "The industry the business trades in, as captured on its profile.",
  },
  location: {
    label: "Location", minWidth: "110px", filter: "text",
    tooltip: "Where the business is based.",
  },
  smeStage: {
    label: "Funding Stage", minWidth: "122px", filter: "select",
    tooltip: "The round the business was raising when it applied — pre-seed, seed, Series A onwards, or growth.",
  },
  teamSize: {
    label: "Team Size", minWidth: "98px", filter: "text",
    tooltip: "Headcount as declared on the business profile.",
  },
};

const NAME_TOOLTIP = "The business whose application ended here. Click the eye to open the full record.";
const ACTIONS_TOOLTIP = "Open the full record for this declined application, including the reason and what was requested.";

const DEFAULT_COLUMN_VISIBILITY = {
  fundingRequested: true, dealType: true, appliedDate: true, declinedDate: true,
  currentStatus: true, reason: true, sector: true, location: true,
  smeStage: false, teamSize: false,
};

const EXPORT_HEADERS = {
  sme: "Business Name", fundingRequested: "Funding Requested", dealType: "Instrument",
  appliedDate: "Date Applied", declinedDate: "Date Declined", currentStatus: "Outcome",
  reason: "Reason Given", sector: "Sector", location: "Location",
  smeStage: "Funding Stage", teamSize: "Team Size",
};

// ─── Views ────────────────────────────────────────────────────────────────────
// A "view" bundles column visibility, order, sort and density into one named
// object, with exactly one active at a time. Editing the table edits the active
// view, so there's no hidden layout that can drift out of sync.
const BUILTIN_VIEW_ID = "__default__";
// New key: the old "successful deals" views stored a column set (ROI, deal
// structure, completion date) that no longer exists here, so they're
// deliberately not carried over.
const VIEWS_STORAGE_KEY = "investor-declined-deals-views-v1";
const DEFAULT_SORT = { key: "declinedDate", direction: "desc" };

const sanitizeColumnOrder = (order) => {
  if (!Array.isArray(order)) return [...DEFAULT_COLUMN_ORDER];
  const known = new Set(DEFAULT_COLUMN_ORDER);
  const deduped = order.filter((k) => known.has(k));
  return [...deduped, ...DEFAULT_COLUMN_ORDER.filter((k) => !deduped.includes(k))];
};

const createDefaultLayout = () => ({
  columnVisibility: { ...DEFAULT_COLUMN_VISIBILITY },
  columnOrder: [...DEFAULT_COLUMN_ORDER],
  sortConfig: { ...DEFAULT_SORT },
  density: "comfortable",
  columnWidths: {},
});

const createBuiltinView = () => ({ id: BUILTIN_VIEW_ID, name: "Default", description: "", builtin: true, ...createDefaultLayout() });

const sanitizeView = (view, fallbackId) => ({
  id: view?.id || fallbackId,
  name: (view?.name || "Untitled view").toString(),
  description: (view?.description || "").toString(),
  builtin: !!view?.builtin,
  columnVisibility: { ...DEFAULT_COLUMN_VISIBILITY, ...(view?.columnVisibility || {}) },
  columnOrder: sanitizeColumnOrder(view?.columnOrder),
  sortConfig: view?.sortConfig?.key ? view.sortConfig : { ...DEFAULT_SORT },
  density: view?.density || "comfortable",
  columnWidths: view?.columnWidths || {},
});

const loadViewsState = () => {
  const fresh = () => ({ activeViewId: BUILTIN_VIEW_ID, views: { [BUILTIN_VIEW_ID]: createBuiltinView() } });
  if (typeof window === "undefined") return fresh();
  try {
    const saved = JSON.parse(window.localStorage.getItem(VIEWS_STORAGE_KEY) || "null");
    const raw = saved?.views && typeof saved.views === "object" ? saved.views : {};
    const views = {};
    Object.entries(raw).forEach(([id, v]) => { views[id] = sanitizeView(v, id); });
    views[BUILTIN_VIEW_ID] = views[BUILTIN_VIEW_ID]
      ? { ...views[BUILTIN_VIEW_ID], id: BUILTIN_VIEW_ID, name: "Default", builtin: true }
      : createBuiltinView();
    const activeViewId = saved?.activeViewId && views[saved.activeViewId] ? saved.activeViewId : BUILTIN_VIEW_ID;
    return { activeViewId, views };
  } catch { return fresh(); }
};

const persistViewsState = (state) => {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(state)); }
  catch { /* private browsing / quota — works this session, just won't persist */ }
};

const generateViewId = () => {
  try { return `view_${crypto.randomUUID()}`; }
  catch { return `view_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
};

const DENSITY = {
  comfortable: { cell: "py-3 px-3", fontSize: "text-sm", avatar: "w-8 h-8" },
  compact: { cell: "py-2 px-2", fontSize: "text-xs", avatar: "w-7 h-7" },
  "ultra-compact": { cell: "py-1.5 px-1.5", fontSize: "text-xs", avatar: "w-6 h-6" },
};

// ─── Declined Deals Table ─────────────────────────────────────────────────────
const DeclinedInvestorDealsTable = ({ onCountChange }) => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [notification, setNotification] = useState(null);

  const [viewsState, setViewsState] = useState(() => loadViewsState());
  const initialView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID];
  const [columnVisibility, setColumnVisibility] = useState(() => initialView.columnVisibility);
  const [columnOrder, setColumnOrder] = useState(() => initialView.columnOrder);
  const [sortConfig, setSortConfig] = useState(() => initialView.sortConfig);
  const [density, setDensity] = useState(() => initialView.density);
  const [columnWidths, setColumnWidths] = useState(() => initialView.columnWidths || {});

  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [chooserRect, setChooserRect] = useState(null);
  const [showNewViewForm, setShowNewViewForm] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [newViewDescription, setNewViewDescription] = useState("");
  const [editingViewMeta, setEditingViewMeta] = useState(null);

  const [headerFilterOpen, setHeaderFilterOpen] = useState(null);
  const [filters, setFilters] = useState({});
  const [hoveredRow, setHoveredRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragHintRect, setDragHintRect] = useState(null);

  const activeView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID];
  const ds = DENSITY[density] || DENSITY.comfortable;

  // ─── Column resizing ──────────────────────────────────────────────────────
  // Drag the divider on a header's right edge to resize the column; double-click
  // it to snap that column back to auto width. Every header carries one —
  // including the pinned Business Name and the Actions column. Widths are stored
  // per view alongside visibility/order/sort/density, so they persist and travel
  // with whichever view is active.
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

  // ─── Data ───────────────────────────────────────────────────────────────
  const fetchDeals = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }

    try {
      setLoading(true);
      // Rows resolve through the shared stage config rather than a fixed list of
      // status strings, so a renamed stage or a different programme template
      // can't quietly empty this table. getActiveStages needs the current
      // pipeline settings passed in; calling it bare returns the fallback stage
      // list, whose terminal ids may not match the template actually in use.
      const stages = getActiveStages(loadPipelineSettings());
      const declinedIds = new Set(
        stages
          .filter((s) => s.terminal && (s.group === "negative" || NEGATIVE_STATUS_RE.test(s.name || "")))
          .map((s) => s.id)
      );

      const snapshot = await getDocs(query(collection(db, "investorApplications"), where("funderId", "==", user.uid)));

      const rows = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const rawStatus = (data.pipelineStage || data.stage || data.status || "").toString();
        const stageId = mapStatusToStageId(rawStatus, stages);
        const stage = stages.find((s) => s.id === stageId);

        // Two ways in. mapStatusToStageId falls back to the first stage for
        // anything it doesn't recognise, so a row declined under a different
        // template would otherwise be misread as an early stage and vanish. The
        // raw-status check catches those.
        const matchedStage = declinedIds.has(stageId);
        if (!matchedStage && !NEGATIVE_STATUS_RE.test(rawStatus)) continue;

        let smeName = data.companyName || data.smeName || "Unnamed Business";
        let location = "Not specified";
        let sector = "Not specified";
        let teamSize = "Not specified";
        let smeStage = "Not specified";
        // Held whole, not just the four fields the columns use — the shared
        // details modal renders the full profile and needs the original
        // document.
        let profile = null;

        if (data.smeId) {
          try {
            const profileSnap = await getDoc(doc(db, "universalProfiles", data.smeId));
            if (profileSnap.exists()) {
              const p = profileSnap.data();
              profile = p;
              smeName = p.entityOverview?.tradingName || p.entityOverview?.registeredName || smeName;
              location = formatLabel(p.entityOverview?.location) || location;
              sector = formatLabel(p.entityOverview?.economicSectors?.[0]) || sector;
              teamSize = p.entityOverview?.employeeCount || teamSize;
              smeStage = formatLabel(p.applicationOverview?.fundingStage || p.entityOverview?.operationStage) || smeStage;
            }
          } catch (error) {
            console.error("Error fetching profile for", data.smeId, error);
          }
        }

        rows.push({
          id: docSnap.id,
          smeId: data.smeId,
          smeName,
          fundingRequested: formatCurrency(data.fundingRequired),
          fundingRequestedRaw: parseFloat((data.fundingRequired || "0").toString().replace(/[^0-9.]/g, "")) || 0,
          dealType: formatLabel(data.fundingDetails?.investmentType || data.investmentType) || "Not specified",
          appliedDate: data.createdAt || null,
          // `updatedAt` is written on every stage change, so for a terminal row
          // it is the moment the decline was recorded.
          declinedDate: data.updatedAt || data.createdAt || null,
          reason: data.declineReason || data.lastMessage || "No reason recorded",
          sector, location, teamSize, smeStage,
          // Prefer the configured stage name, but keep whatever the document
          // actually says when the stage list doesn't know it — showing the real
          // outcome beats showing a guess.
          currentStatus: (matchedStage && stage?.name) || rawStatus || "Declined",
          matchPercentage: data.matchPercentage ?? null,
          // Feed the shared details modal the same three things the pipeline
          // table gives it: the application document, the profile, and the
          // documents the business uploaded for this fund.
          raw: data,
          profile,
          documents: data.documentURLs || {},
        });
      }

      setDeals(rows);
      onCountChange?.(rows.length);
    } catch (error) {
      console.error("Error fetching declined applications:", error);
      setNotification({ type: "error", message: "Failed to load declined applications" });
      onCountChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  // Declining an application in the pipeline table lands it here — refresh on
  // that signal rather than making the investor reload the page. This only works
  // because the wrapper keeps both tables mounted; an unmounted table has no
  // listener to fire.
  useEffect(() => {
    const refresh = () => fetchDeals();
    window.addEventListener(PIPELINE_REFRESH_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(PIPELINE_REFRESH_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [fetchDeals]);

  // ─── Views ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setViewsState((prev) => {
      const current = prev.views[prev.activeViewId];
      if (!current) return prev;
      const next = { ...prev, views: { ...prev.views, [prev.activeViewId]: { ...current, columnVisibility, columnOrder, sortConfig, density, columnWidths } } };
      persistViewsState(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibility, columnOrder, sortConfig, density, columnWidths]);

  const switchToView = (viewId) => {
    const target = viewsState.views[viewId];
    if (!target) return;
    setViewsState((prev) => { const next = { ...prev, activeViewId: viewId }; persistViewsState(next); return next; });
    setColumnVisibility(target.columnVisibility);
    setColumnOrder(target.columnOrder);
    setSortConfig(target.sortConfig);
    setDensity(target.density);
    setColumnWidths(target.columnWidths || {});
  };

  const createNewView = () => {
    const name = newViewName.trim();
    if (!name) return;
    const id = generateViewId();
    const view = { id, name, description: newViewDescription.trim(), builtin: false, columnVisibility: { ...columnVisibility }, columnOrder: [...columnOrder], sortConfig: { ...sortConfig }, density, columnWidths: { ...columnWidths } };
    setViewsState((prev) => { const next = { activeViewId: id, views: { ...prev.views, [id]: view } }; persistViewsState(next); return next; });
    setNewViewName(""); setNewViewDescription(""); setShowNewViewForm(false);
    setNotification({ type: "success", message: `View "${name}" created` });
  };

  const saveViewMeta = () => {
    if (!editingViewMeta) return;
    const name = editingViewMeta.name.trim();
    if (!name && !editingViewMeta.builtin) return;
    setViewsState((prev) => {
      const existing = prev.views[editingViewMeta.id];
      if (!existing) return prev;
      const updated = { ...existing, name: existing.builtin ? existing.name : name, description: editingViewMeta.description.trim() };
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
      const { [viewId]: _drop, ...rest } = prev.views;
      const next = { activeViewId: wasActive ? BUILTIN_VIEW_ID : prev.activeViewId, views: rest };
      persistViewsState(next);
      return next;
    });
    if (wasActive) {
      const def = viewsState.views[BUILTIN_VIEW_ID];
      setColumnVisibility(def.columnVisibility); setColumnOrder(def.columnOrder);
      setSortConfig(def.sortConfig); setDensity(def.density); setColumnWidths(def.columnWidths || {});
    }
    setNotification({ type: "success", message: "View deleted" });
  };

  const resetActiveView = () => {
    const layout = createDefaultLayout();
    setColumnVisibility(layout.columnVisibility); setColumnOrder(layout.columnOrder);
    setSortConfig(layout.sortConfig); setDensity(layout.density); setColumnWidths(layout.columnWidths || {});
    setNotification({ type: "success", message: `"${activeView.name}" reset to factory defaults` });
  };

  // ─── Filter / sort ──────────────────────────────────────────────────────
  const processed = useMemo(() => {
    let result = [...deals];

    if (filters.__name__?.trim()) {
      const q = filters.__name__.toLowerCase().trim();
      result = result.filter((d) => d.smeName.toLowerCase().includes(q));
    }

    Object.entries(COLUMN_DEFS).forEach(([key, col]) => {
      const value = filters[key];
      if (value == null) return;
      if (col.filter === "text" && value.toString().trim()) {
        const q = value.toString().toLowerCase().trim();
        result = result.filter((d) => (d[key] || "").toString().toLowerCase().includes(q));
      }
      if (col.filter === "select" && Array.isArray(value) && value.length) {
        result = result.filter((d) => value.includes((d[key] || "").toString()));
      }
      if (col.filter === "range" && Array.isArray(value)) {
        const field = col.sortKey || key;
        const [min, max] = value;
        if (min != null) result = result.filter((d) => Number(d[field] || 0) >= min);
        if (max != null) result = result.filter((d) => Number(d[field] || 0) <= max);
      }
      if (col.filter === "date" && Array.isArray(value)) {
        const [from, to] = value;
        if (from) result = result.filter((d) => { const x = toDate(d[key]); return x && x >= new Date(from); });
        if (to) result = result.filter((d) => { const x = toDate(d[key]); return x && x <= new Date(new Date(to).setHours(23, 59, 59, 999)); });
      }
    });

    if (sortConfig?.key) {
      const isName = sortConfig.key === "__name__";
      const col = isName ? null : COLUMN_DEFS[sortConfig.key];
      const field = isName ? "smeName" : (col?.sortKey || sortConfig.key);
      const isDate = col?.type === "date";
      const isNumber = col?.filter === "range";
      result.sort((a, b) => {
        let av = a[field], bv = b[field];
        if (isDate) { av = toDate(av)?.getTime() ?? 0; bv = toDate(bv)?.getTime() ?? 0; }
        else if (isNumber) { av = Number(av) || 0; bv = Number(bv) || 0; }
        else { av = (av ?? "").toString().toLowerCase(); bv = (bv ?? "").toString().toLowerCase(); }
        if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
        if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [deals, filters, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const paginated = processed.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => { setCurrentPage(1); }, [filters, pageSize]);

  const activeFilterCount = useMemo(() => {
    let n = filters.__name__?.trim() ? 1 : 0;
    Object.keys(COLUMN_DEFS).forEach((key) => {
      const v = filters[key];
      if (v == null) return;
      if (Array.isArray(v)) { if (v.some((x) => x != null && x !== "")) n += 1; }
      else if (v.toString().trim()) n += 1;
    });
    return n;
  }, [filters]);

  const selectOptions = (key) =>
    [...new Set(deals.map((d) => (d[key] || "").toString()).filter((v) => v && v !== "Not specified"))].sort();

  // ─── Column interaction ─────────────────────────────────────────────────
  // Three-state, same as the pipeline table: ascending, descending, then back to
  // this table's default (most recently declined first) rather than to no order
  // at all — otherwise rows fall back to fetch order, which reads as random.
  const toggleSort = (key, event) => {
    event?.stopPropagation();
    setSortConfig((prev) => {
      if (prev?.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { ...DEFAULT_SORT };
    });
  };

  const SortTrigger = ({ colKey }) => {
    const isActive = sortConfig?.key === colKey;
    return (
      <button type="button"
        onClick={(e) => toggleSort(colKey, e)}
        className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${isActive ? "text-[#e6d7c3]" : "text-[#c8b6a6] hover:text-white"}`}
        title={isActive ? (sortConfig.direction === "asc" ? "Sort descending" : "Reset sorting") : "Sort ascending"}>
        {isActive
          ? (sortConfig.direction === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)
          : <ArrowUpDown size={11} />}
      </button>
    );
  };

  const handleDrop = (e, key) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === key) { setDraggedColumn(null); setDragOverColumn(null); return; }
    setColumnOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(draggedColumn), to = next.indexOf(key);
      if (from === -1 || to === -1) return prev;
      next.splice(from, 1); next.splice(to, 0, draggedColumn);
      return next;
    });
    setDraggedColumn(null); setDragOverColumn(null);
  };

  const FilterTrigger = ({ colKey }) => {
    const v = filters[colKey];
    const active = Array.isArray(v) ? v.some((x) => x != null && x !== "") : !!v?.toString().trim();
    return (
      <button type="button"
        onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); setHeaderFilterOpen((p) => (p?.key === colKey ? null : { key: colKey, rect })); }}
        className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${active ? "text-[#e6d7c3]" : "text-[#c8b6a6] hover:text-white"}`}
        title="Filter this column">
        <SlidersHorizontal size={11} />
      </button>
    );
  };

  // ─── Export ─────────────────────────────────────────────────────────────
  const handleExport = () => {
    try {
      const visible = columnOrder.filter((k) => columnVisibility[k] && COLUMN_DEFS[k]);
      if (processed.length === 0) { setNotification({ type: "error", message: "No declined applications to export" }); return; }

      const header = [EXPORT_HEADERS.sme, ...visible.map((k) => EXPORT_HEADERS[k])];
      const rows = processed.map((d) => {
        const row = { [EXPORT_HEADERS.sme]: d.smeName };
        visible.forEach((k) => {
          row[EXPORT_HEADERS[k]] = COLUMN_DEFS[k].type === "date" ? formatDate(d[k]) : (d[k] ?? "");
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows, { header });
      worksheet["!cols"] = header.map((label) => {
        const lengths = rows.map((r) => String(r[label] ?? "").length);
        return { wch: Math.min(Math.max(label.length, ...lengths, 8) + 2, 45) };
      });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Declined Applications");
      XLSX.writeFile(workbook, `declined-applications-${new Date().toISOString().split("T")[0]}.xlsx`);
      setNotification({ type: "success", message: "Export downloaded" });
    } catch (error) {
      console.error("Export error:", error);
      setNotification({ type: "error", message: `Export failed: ${error.message}` });
    }
  };

  const visibleColumns = columnOrder.filter((k) => columnVisibility[k] && COLUMN_DEFS[k]);

  const renderCell = (deal, key) => {
    const col = COLUMN_DEFS[key];
    switch (col.type) {
      case "badge":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#f5f0e1] text-[#4a352f]">{deal[key] || "—"}</span>;
      case "status":
        // Red rather than green — these are negative outcomes.
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
            style={{ backgroundColor: "#fee2e2", color: "#991b1b", borderColor: "#fecaca" }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#991b1b" }} />{deal[key]}
          </span>
        );
      case "date":
        return <div className="flex items-center gap-1.5"><Calendar size={14} className="text-[#7d5a50]" />{formatDate(deal[key])}</div>;
      default:
        if (key === "fundingRequested") return <span className="font-semibold">{deal.fundingRequested}</span>;
        return <span className="line-clamp-2">{deal[key] ?? "—"}</span>;
    }
  };

  return (
    <div className="w-full space-y-4 font-sans">
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
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#f5f0e1] text-[#7d5a50] border border-[#c8b6a6]">
              <XCircle size={12} /> {deals.length} declined application{deals.length === 1 ? "" : "s"}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4a352f] border border-[#c8b6a6]">
              <LayoutGrid size={12} className="text-[#7d5a50] flex-shrink-0" />
              Viewing: {activeView.name}
              {activeView.description && <span className="font-normal text-[#a89482]"> — {activeView.description}</span>}
            </span>
            {activeFilterCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#fff3e0] text-[#e65100] border border-[#e65100]/30">
                <SlidersHorizontal size={12} /> {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">

            <div className="relative">
              <button onClick={(e) => {
                if (showColumnChooser) { setShowColumnChooser(false); setChooserRect(null); }
                else { setChooserRect(e.currentTarget.getBoundingClientRect()); setShowColumnChooser(true); setShowNewViewForm(false); setEditingViewMeta(null); }
              }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all shadow-sm">
                <SlidersHorizontal size={16} /> Customize Table <ChevronDown size={14} className={`transition-transform ${showColumnChooser ? "rotate-180" : ""}`} />
              </button>

              {showColumnChooser && chooserRect && (() => {
                const panelWidth = 320, margin = 12;
                const left = Math.min(Math.max(chooserRect.right - panelWidth, margin), window.innerWidth - panelWidth - margin);
                const spaceBelow = window.innerHeight - chooserRect.bottom - margin - 8;
                const spaceAbove = chooserRect.top - margin - 8;
                const upward = spaceBelow < 320 && spaceAbove > spaceBelow;
                const maxHeight = Math.max(200, Math.min(620, upward ? spaceAbove : spaceBelow));
                const allViews = Object.values(viewsState.views).sort((a, b) => (a.builtin ? -1 : b.builtin ? 1 : a.name.localeCompare(b.name)));
                return (
                  <PopupPortal>
                    <div className="fixed inset-0 z-40" onClick={() => { setShowColumnChooser(false); setChooserRect(null); setShowNewViewForm(false); setEditingViewMeta(null); }} />
                    <div className="fixed bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-5 z-50 overflow-y-auto"
                      style={{ left, width: panelWidth, top: upward ? undefined : chooserRect.bottom + 8, bottom: upward ? window.innerHeight - chooserRect.top + 8 : undefined, maxHeight }}>

                      <h4 className="text-sm font-semibold text-[#4a352f] mb-1">Views</h4>
                      <p className="text-xs text-[#a89482] mb-3">Edits below auto-save into whichever view is selected.</p>

                      <div className="space-y-1 mb-3">
                        {allViews.map((view) => {
                          const isActive = view.id === viewsState.activeViewId;
                          if (editingViewMeta?.id === view.id) {
                            return (
                              <div key={view.id} className="p-2.5 rounded-lg border border-[#c8b6a6] bg-[#faf7f2] space-y-2">
                                {!view.builtin ? (
                                  <input autoFocus value={editingViewMeta.name} onChange={(e) => setEditingViewMeta((p) => ({ ...p, name: e.target.value }))}
                                    placeholder="View name" className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm" />
                                ) : (
                                  <p className="text-sm font-semibold text-[#4a352f]">Default <span className="font-normal text-[#a89482] text-xs">(name can't be changed)</span></p>
                                )}
                                <textarea rows={2} value={editingViewMeta.description} onChange={(e) => setEditingViewMeta((p) => ({ ...p, description: e.target.value }))}
                                  placeholder="Description (optional) — what is this view for?" className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs resize-none" />
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
                                <button onClick={() => setEditingViewMeta({ id: view.id, name: view.name, description: view.description, builtin: !!view.builtin })}
                                  title="Rename / edit description" className="text-[#a89482] hover:text-[#7d5a50] p-1"><Settings size={13} /></button>
                                {!view.builtin && (
                                  <button onClick={() => removeView(view.id)} title="Delete view" className="text-[#a89482] hover:text-red-500 p-1"><Trash2 size={13} /></button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {showNewViewForm ? (
                        <div className="space-y-2 mb-1">
                          <input autoFocus value={newViewName} onChange={(e) => setNewViewName(e.target.value)} placeholder="New view name..."
                            className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm" />
                          <textarea rows={2} value={newViewDescription} onChange={(e) => setNewViewDescription(e.target.value)}
                            placeholder="Description (optional) — what is this view for?" className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs resize-none" />
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
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Hide/Unhide</h4>
                      <p className="text-xs text-[#a89482] mb-3 flex items-center gap-1.5">
                        <GripVertical size={12} className="flex-shrink-0" /> Tip: drag any column header to reorder it, or drag its right edge to resize.
                      </p>
                      <label className="flex items-center gap-3 py-2 px-2 rounded-lg opacity-75">
                        <input type="checkbox" checked readOnly disabled className="rounded border-[#c8b6a6]" />
                        <span className="text-sm text-[#4a352f]">Business Name</span>
                      </label>
                      {DEFAULT_COLUMN_ORDER.map((key) => (
                        <label key={key} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#faf7f2] cursor-pointer">
                          <input type="checkbox" checked={columnVisibility[key] || false}
                            onChange={() => setColumnVisibility((p) => ({ ...p, [key]: !p[key] }))}
                            className="rounded border-[#c8b6a6] text-[#7d5a50]" />
                          <span className="text-sm text-[#4a352f]">{COLUMN_DEFS[key].label}</span>
                        </label>
                      ))}

                      <div className="border-t border-[#e6d7c3] my-4" />
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Density</h4>
                      <div className="flex gap-1.5 mb-1">
                        {[["comfortable", "Comfortable"], ["compact", "Compact"], ["ultra-compact", "Ultra Compact"]].map(([key, label]) => (
                          <button key={key} onClick={() => setDensity(key)}
                            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${density === key ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>
                            {label}
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-[#e6d7c3] my-4" />
                      <button onClick={resetActiveView} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#a67c52] hover:text-[#4a352f] hover:bg-[#faf7f2] border border-[#e6d7c3]">
                        <RotateCcw size={12} /> Reset "{activeView.name}" to factory defaults
                      </button>
                    </div>
                  </PopupPortal>
                );
              })()}
            </div>

            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#7d5a50] to-[#4a352f] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all shadow-sm"
              title="Export the current filtered/sorted declined applications to Excel (.xlsx)">
              <Download size={16} /> Export to Excel
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e6d7c3] shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8"><div className="space-y-4">{[...Array(6)].map((_, i) => (<div key={i} className="h-10 bg-[#f5f0e1] rounded-lg animate-pulse" />))}</div></div>
        ) : (
          <>
            <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
              <style>{`
                .idd-th { color: #faf7f2 !important; line-height: 1.1; font-size: 0.75rem !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; font-family: inherit !important; vertical-align: top !important; }
                .idd-th-draggable { cursor: grab; }
                .idd-th-draggable:active { cursor: grabbing; }
                /* Wrap header labels onto at most 2 lines rather than forcing
                   the column wider. Only lays out cleanly because every column
                   carries a real min-width. */
                .idd-th-label { flex: 1 1 auto; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; overflow-wrap: break-word; line-height: 1.2; text-align: left; }
                /* Column resizing: an explicit header width only holds if the
                   cells below can shrink, so long values wrap rather than
                   forcing the column wider than the width that was dragged. */
                .bigt-fit th, .bigt-fit td { overflow: hidden; }
                .bigt-fit td { word-break: break-word; }
              `}</style>
              <table className="border-collapse bigt-fit" style={{ tableLayout: "auto" }}>
                <thead>
                  <tr className="bg-[#4a352f]">
                    <th className="idd-th py-3 px-3 relative border-r border-[#e6d7c3] sticky top-0 left-0 z-30"
                      style={{ backgroundColor: "#4a352f", ...widthStyle("__name__", "180px", "200px") }}>
                      <div className="flex items-start gap-1 min-w-0">
                        <span className="idd-th-label">Business Name</span>
                        <SortTrigger colKey="__name__" />
                        <FilterTrigger colKey="__name__" />
                        <HeaderInfoTooltip text={NAME_TOOLTIP} />
                      </div>
                      <ColumnResizer colKey="__name__" />
                    </th>

                    {visibleColumns.map((key) => {
                      const col = COLUMN_DEFS[key];
                      return (
                        <th key={key} draggable={!resizingColumn}
                          onDragStart={(e) => { setDraggedColumn(key); setDragHintRect(null); try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", key); } catch { /* some browsers are picky */ } }}
                          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (key !== dragOverColumn) setDragOverColumn(key); }}
                          onDrop={(e) => handleDrop(e, key)}
                          onDragEnd={() => { setDraggedColumn(null); setDragOverColumn(null); }}
                          onMouseEnter={(e) => setDragHintRect(e.currentTarget.getBoundingClientRect())}
                          onMouseLeave={() => setDragHintRect(null)}
                          className={`idd-th idd-th-draggable py-3 px-3 relative border-r border-[#e6d7c3] sticky top-0 z-20 select-none transition-opacity ${draggedColumn === key ? "opacity-40" : ""}`}
                          style={{ ...widthStyle(key, col.minWidth), backgroundColor: dragOverColumn === key && draggedColumn !== key ? "#5a423b" : "#4a352f" }}>
                          <div className="flex items-start gap-1 min-w-0">
                            <GripVertical size={11} className="opacity-40 flex-shrink-0 mt-0.5" />
                            <span className="idd-th-label">{col.label}</span>
                            <SortTrigger colKey={key} />
                            <FilterTrigger colKey={key} />
                            <HeaderInfoTooltip text={col.tooltip} />
                          </div>
                          <ColumnResizer colKey={key} />
                        </th>
                      );
                    })}

                    {/* Actions resizes too — it's the only column whose width
                        isn't driven by its content, so it's the one most likely
                        to need tightening on a narrow screen. */}
                    <th className="idd-th py-3 px-3 relative text-center whitespace-nowrap sticky top-0 z-20"
                      style={{ backgroundColor: "#4a352f", ...widthStyle("__actions__", "110px") }}>
                      <div className="flex items-start gap-1 justify-center">
                        <span>Actions</span>
                        <HeaderInfoTooltip text={ACTIONS_TOOLTIP} />
                      </div>
                      <ColumnResizer colKey="__actions__" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={visibleColumns.length + 2} className="text-center py-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-[#f5f0e1] flex items-center justify-center">
                          <XCircle size={32} className="text-[#7d5a50] opacity-50" />
                        </div>
                        <p className="text-lg font-semibold text-[#4a352f]">No Declined Applications</p>
                        <p className="text-sm text-[#7d5a50] max-w-sm">
                          {activeFilterCount > 0
                            ? "Clear a filter to widen the list."
                            : "Applications appear here once you decline them in your pipeline."}
                        </p>
                      </div>
                    </td></tr>
                  ) : (
                    paginated.map((deal) => (
                      <tr key={deal.id} className="border-b border-[#f0e6d9] transition-all"
                        style={{ backgroundColor: hoveredRow === deal.id ? "#fdf8f4" : undefined }}
                        onMouseEnter={() => setHoveredRow(deal.id)} onMouseLeave={() => setHoveredRow(null)}>
                        <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f] sticky left-0 border-r border-b border-[#e6d7c3] z-10 transition-colors`}
                          style={{ ...widthStyle("__name__", "180px", "200px"), backgroundColor: hoveredRow === deal.id ? "#fdf8f4" : "#ffffff" }}>
                          <div className="flex items-start gap-2">
                            <div className={`${ds.avatar} rounded-full bg-gradient-to-br from-[#7d5a50] to-[#4a352f] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5`}>
                              {(deal.smeName || "?").charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-1.5 flex-wrap">
                                <span className={`${ds.fontSize} leading-snug text-[#4a352f]`}>{deal.smeName}</span>
                                <button onClick={() => setSelectedDeal(deal)} className="text-[#a89482] hover:text-[#7d5a50] transition-colors flex-shrink-0 mt-0.5"
                                  aria-label={`View declined application for ${deal.smeName}`} title="View details">
                                  <Eye size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {visibleColumns.map((key) => (
                          <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}
                            style={widthStyle(key, COLUMN_DEFS[key].minWidth)}>
                            {renderCell(deal, key)}
                          </td>
                        ))}

                        <td className={`${ds.cell} text-center`} style={widthStyle("__actions__", "110px")}>
                          <button onClick={() => setSelectedDeal(deal)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white hover:shadow-md hover:brightness-105 transition-all"
                            style={{ backgroundColor: "#7d5a50" }}>
                            <Eye size={13} /> View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#e6d7c3] bg-[#faf7f2] rounded-b-2xl flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#4a352f]">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, processed.length)}-{Math.min(currentPage * pageSize, processed.length)} of {processed.length} Applications
                </span>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f]">
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
                  return <button key={pn} onClick={() => setCurrentPage(pn)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage === pn ? "bg-[#7d5a50] text-white" : "bg-white border border-[#c8b6a6] text-[#4a352f]"}`}>{pn}</button>;
                })}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">Next</button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">Last</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Drag hint */}
      {dragHintRect && !draggedColumn && (
        <PopupPortal>
          <div className="fixed z-[1200] bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none normal-case font-normal flex items-center gap-1.5"
            style={{ top: dragHintRect.bottom + 8, left: Math.min(Math.max(dragHintRect.left, 12), window.innerWidth - 220), width: "205px" }}>
            <GripVertical size={12} className="flex-shrink-0" /> Drag to reorder columns
          </div>
        </PopupPortal>
      )}

      {/* Header filter popover */}
      {headerFilterOpen && (() => {
        const key = headerFilterOpen.key;
        const isName = key === "__name__";
        const col = isName ? { label: "Business Name", filter: "text" } : COLUMN_DEFS[key];
        if (!col) return null;
        const value = filters[key];
        const setValue = (v) => setFilters((p) => ({ ...p, [key]: v }));
        const clear = () => setFilters((p) => { const { [key]: _drop, ...rest } = p; return rest; });

        return (
          <PopupPortal>
            <div className="fixed inset-0 z-[1090]" onClick={() => setHeaderFilterOpen(null)} />
            <div className="fixed z-[1091] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-4"
              style={{ top: headerFilterOpen.rect.bottom + 8, left: Math.min(Math.max(headerFilterOpen.rect.left - 20, 12), window.innerWidth - 292), width: "280px" }}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[#4a352f]">Filter by {col.label.toLowerCase()}</label>
                {value != null && <button onClick={clear} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
              </div>

              {col.filter === "text" && (
                <input autoFocus type="text" value={value || ""} onChange={(e) => setValue(e.target.value)}
                  placeholder={`Search ${col.label.toLowerCase()}...`}
                  className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20" />
              )}

              {col.filter === "select" && (
                <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
                  {selectOptions(key).length === 0 && <span className="text-xs text-[#a89482]">No data available</span>}
                  {selectOptions(key).map((opt) => {
                    const selected = Array.isArray(value) && value.includes(opt);
                    return (
                      <button key={opt} onClick={() => setValue(selected ? value.filter((v) => v !== opt) : [...(value || []), opt])}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${selected ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {col.filter === "range" && (
                <div className="flex items-center gap-3">
                  <input type="number" placeholder="Min (R)" value={value?.[0] ?? ""}
                    onChange={(e) => setValue([e.target.value === "" ? null : Number(e.target.value), value?.[1] ?? null])}
                    className="w-full px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                  <span className="text-[#7d5a50]">to</span>
                  <input type="number" placeholder="Max (R)" value={value?.[1] ?? ""}
                    onChange={(e) => setValue([value?.[0] ?? null, e.target.value === "" ? null : Number(e.target.value)])}
                    className="w-full px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                </div>
              )}

              {col.filter === "date" && (
                <div className="space-y-2">
                  <input type="date" value={value?.[0] || ""} onChange={(e) => setValue([e.target.value || null, value?.[1] ?? null])}
                    className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm" />
                  <input type="date" value={value?.[1] || ""} onChange={(e) => setValue([value?.[0] ?? null, e.target.value || null])}
                    className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm" />
                </div>
              )}
            </div>
          </PopupPortal>
        );
      })()}

      {/* Declined application details */}
      {selectedDeal && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#4a352f]/40 backdrop-blur-sm font-sans p-4" onClick={() => setSelectedDeal(null)}>
            <div className="bg-white rounded-3xl shadow-2xl border border-[#e6d7c3] w-[660px] max-w-full max-h-[86vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-5 text-white sticky top-0 z-10 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Declined application</p>
                  <h3 className="text-lg font-bold mt-0.5 truncate">{selectedDeal.smeName}</h3>
                  <p className="text-xs text-[#e6d7c3] mt-0.5">{selectedDeal.sector} · {selectedDeal.location}</p>
                </div>
                <button onClick={() => setSelectedDeal(null)} className="text-white/70 hover:text-white p-1 flex-shrink-0"><X size={20} /></button>
              </div>

              <div className="p-6 space-y-6">
                {[
                  { label: "What was requested", fields: [
                    ["Funding requested", selectedDeal.fundingRequested],
                    ["Instrument", selectedDeal.dealType],
                    ["Funding stage", selectedDeal.smeStage],
                    ["Match score", selectedDeal.matchPercentage != null ? `${selectedDeal.matchPercentage}%` : "Not recorded"],
                  ]},
                  { label: "Timeline", fields: [
                    ["Date applied", formatDate(selectedDeal.appliedDate)],
                    ["Date declined", formatDate(selectedDeal.declinedDate)],
                    ["Outcome", selectedDeal.currentStatus],
                  ]},
                  { label: "Company", fields: [
                    ["Sector", selectedDeal.sector],
                    ["Location", selectedDeal.location],
                    ["Team size", selectedDeal.teamSize],
                  ]},
                ].map((section) => (
                  <div key={section.label}>
                    <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-3">{section.label}</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {section.fields.map(([label, value]) => (
                        <div key={label}>
                          <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-1">{label}</p>
                          <p className="text-sm text-[#4a352f]">{value ?? "N/A"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="px-4 py-3 rounded-xl bg-[#faf7f2] border border-[#e6d7c3]">
                  <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-1">Reason given</p>
                  <p className="text-sm text-[#4a352f] leading-relaxed whitespace-pre-line">{selectedDeal.reason}</p>
                </div>
              </div>
            </div>
          </div>
        </PopupPortal>
      )}
    </div>
  );
};

// ─── Wrapper ──────────────────────────────────────────────────────────────────
const InvestorTabbedTables = ({ filters, stageFilter, activeTab, setActiveTab, onDealComplete }) => {
  const [declinedCount, setDeclinedCount] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);

  // Controlled by the parent when activeTab/setActiveTab are passed, with a
  // local fallback so this component also works standalone.
  const [localTab, setLocalTab] = useState("sme-opportunities");
  // "portfolio" was this tab's id while it held successful deals. A parent that
  // still passes it keeps working rather than landing on an unknown tab and
  // rendering nothing.
  const rawTab = activeTab ?? localTab;
  const tab = rawTab === "portfolio" ? "declined-deals" : rawTab;
  const setTab = setActiveTab ?? setLocalTab;

  const handleDeclinedCount = useCallback((n) => setDeclinedCount(n), []);
  const handleMatchesLoaded = useCallback((rows) => setMatchesCount(rows.length), []);

  const TABS = [
    { id: "sme-opportunities", label: "My Matches", icon: <Users size={16} />, count: matchesCount },
    { id: "declined-deals", label: "Declined Deals", icon: <XCircle size={16} />, count: declinedCount },
  ];

  return (
    <div className="w-full font-sans">
      {/* Tabs. The old version mutated e.target.style on hover, which broke
          whenever the pointer landed on the icon or count badge instead of the
          button — leaving tabs stuck in their hover colour. CSS classes can't
          get orphaned that way. */}
      <div className="flex gap-2 p-2 bg-gradient-to-r from-[#f5f0e1] to-[#faf7f2] rounded-t-2xl border border-[#e6d7c3] border-b-0 shadow-sm overflow-x-auto">
        {TABS.map(({ id, label, icon, count }) => {
          const isActive = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                isActive ? "bg-gradient-to-r from-[#7d5a50] to-[#4a352f] text-white shadow-md" : "text-[#7d5a50] hover:bg-white/70"
              }`}>
              {icon}
              {label}
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isActive ? "bg-white/20 text-white" : "bg-[#7d5a50]/10 text-[#4a352f]"
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Both tables stay mounted and the inactive one is hidden, rather than
          unmounted. Two things depend on this: the tab count badges are fed by
          the tables themselves, which never report from a table that hasn't
          rendered; and the declined table's PIPELINE_REFRESH_EVENT listener has
          to exist at the moment an application is declined over on the matches
          tab. */}
      <div className="bg-white rounded-b-2xl border border-[#e6d7c3] border-t-0 shadow-lg min-h-[500px]">
        <div style={{ display: tab === "sme-opportunities" ? "block" : "none" }}>
          <InvestorSMETable
            filters={filters}
            stageFilter={stageFilter}
            onDealComplete={onDealComplete}
            onSMEsLoaded={handleMatchesLoaded}
          />
        </div>
        <div className="p-6" style={{ display: tab === "declined-deals" ? "block" : "none" }}>
          <DeclinedInvestorDealsTable onCountChange={handleDeclinedCount} />
        </div>
      </div>
    </div>
  );
};

export default InvestorTabbedTables;