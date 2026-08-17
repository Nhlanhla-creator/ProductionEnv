"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Users, Trophy, Eye, X, Info, Calendar, ChevronDown, Download, Plus,
  Trash2, Settings, RotateCcw, SlidersHorizontal, LayoutGrid, GripVertical,
  CheckCircle, ArrowUp, ArrowDown, ArrowUpDown, Building, Award, Search,
  Pin, PinOff
} from "lucide-react";
import * as XLSX from "xlsx";
import CMFSMETable from "./CMFSMETable";
import CMFCatalystDetailsModal from "./CMFCatalystDetailsModal";
import CMFFunderDetailsModal from "./CMFFunderDetailsModal";
import CMFSMEDetailsModal from "./CMFSMEDetailsModal";
import { mapStatusToStageId, getActiveStages, getStageColors } from "./cmfStageConfig";
import { db, auth } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

const MATCH_LABELS = [
  { min: 80, label: "Excellent Fit", color: "#22c55e" },
  { min: 60, label: "Strong Fit", color: "#86efac" },
  { min: 40, label: "Moderate Fit", color: "#f59e0b" },
  { min: 20, label: "Weak Fit", color: "#ef4444" },
  { min: 0, label: "Poor Fit", color: "#dc2626" },
];
const getMatchLabel = (score) => MATCH_LABELS.find((m) => (score || 0) >= m.min) || MATCH_LABELS[4];

const BIG_SCORE_LABELS = {
  excellent: { min: 80, label: "Excellent", color: "#22c55e" },
  strong: { min: 60, label: "Strong", color: "#86efac" },
  moderate: { min: 40, label: "Moderate", color: "#f59e0b" },
  weak: { min: 20, label: "Weak", color: "#ef4444" },
  critical: { min: 0, label: "Critical", color: "#dc2626" }
};
const getBigScoreLabel = (score) => {
  for (const value of Object.values(BIG_SCORE_LABELS)) {
    if (score >= value.min) return value;
  }
  return BIG_SCORE_LABELS.critical;
};

// Renders straight to <body> so `position: fixed` popups can't be trapped by an
// ancestor that establishes a containing block.
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

const DENSITY = {
  comfortable: { cell: "py-3 px-3", fontSize: "text-sm", avatar: "w-8 h-8", header: "0.7rem 0.6rem" },
  compact: { cell: "py-2 px-2", fontSize: "text-xs", avatar: "w-7 h-7", header: "0.5rem 0.6rem" },
  "ultra-compact": { cell: "py-1.5 px-1.5", fontSize: "text-xs", avatar: "w-6 h-6", header: "0.5rem 0.6rem" },
};

const generateViewId = () => {
  try { return `view_${crypto.randomUUID()}`; }
  catch { return `view_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
};

// The primary (name) column and the Actions column can't be hidden or
// reordered, so they aren't in the caller's column list — but they resize like
// everything else, and their widths live under these reserved keys inside the
// same columnWidths map.
const NAME_KEY = "__name__";
const ACTION_KEY = "__action__";
const MIN_COLUMN_WIDTH = 84;

// Accepts either a numeric width or a legacy "120px" string.
const toWidth = (value, fallback) => {
  if (typeof value === "number" && !isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return fallback;
};

// ─────────────────────────────────────────────────────────────────────────────
// CMFDataTable — the standard table, used by all three lists in this file
// (Active Deals, Funders, Catalysts). Same behaviour as the catalyst matches
// table: saved Views, column chooser with search + pinning, drag-to-reorder
// headers, drag-to-resize on every column (including the two fixed ones),
// per-column sort arrows, per-column filters, an info tooltip on every header,
// density, Excel export, pagination and a sticky name column.
//
// Columns: { key, label, width, minWidth, tooltip, align,
//            filter: text|select|range|date|none,
//            type: text|date|badge|status|match,
//            sortable, priority, defaultVisible,
//            render(row, value), getValue(row), exportValue(row), options }
// ─────────────────────────────────────────────────────────────────────────────
const CMFDataTable = ({
  storageKey, rows = [], loading = false, columns = [],
  primary, actions,
  exportName = "export", exportSheet = "Data", emptyState = {},
  toolbarBadge, defaultSort = { key: null, direction: "desc" },
}) => {
  const BUILTIN_VIEW_ID = "__default__";
  // v2: the two fixed columns now store their widths in the same map, and views
  // carry a pinned map, so a v1 view would leave both undefined.
  const VIEWS_KEY = `${storageKey}-views-v2`;

  const COLUMN_DEFS = useMemo(() => Object.fromEntries(columns.map((c) => [c.key, c])), [columns]);
  const DEFAULT_ORDER = useMemo(() => columns.map((c) => c.key), [columns]);
  const DEFAULT_VISIBILITY = useMemo(
    () => columns.reduce((acc, c) => ({ ...acc, [c.key]: c.defaultVisible !== false }), {}),
    [columns]
  );
  const DEFAULT_WIDTHS = useMemo(
    () => ({
      ...columns.reduce((acc, c) => ({ ...acc, [c.key]: toWidth(c.width ?? c.minWidth, 148) }), {}),
      [NAME_KEY]: toWidth(primary?.width, 210),
      [ACTION_KEY]: toWidth(actions ? 132 : 0, 132),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns, primary?.width, !!actions]
  );
  const DEFAULT_PINNED = useMemo(
    () => columns.reduce((acc, c) => ({ ...acc, [c.key]: null }), {}),
    [columns]
  );

  const sanitizeOrder = (order) => {
    if (!Array.isArray(order)) return [...DEFAULT_ORDER];
    const known = new Set(DEFAULT_ORDER);
    const deduped = order.filter((k) => known.has(k));
    return [...deduped, ...DEFAULT_ORDER.filter((k) => !deduped.includes(k))];
  };

  const defaultLayout = () => ({
    columnVisibility: { ...DEFAULT_VISIBILITY },
    columnOrder: [...DEFAULT_ORDER],
    columnWidths: { ...DEFAULT_WIDTHS },
    pinned: { ...DEFAULT_PINNED },
    sortConfig: { ...defaultSort },
    density: "comfortable",
  });

  const builtinView = () => ({ id: BUILTIN_VIEW_ID, name: "Default", description: "", builtin: true, ...defaultLayout() });

  const loadViewsState = () => {
    const fresh = () => ({ activeViewId: BUILTIN_VIEW_ID, views: { [BUILTIN_VIEW_ID]: builtinView() } });
    if (typeof window === "undefined") return fresh();
    try {
      const saved = JSON.parse(window.localStorage.getItem(VIEWS_KEY) || "null");
      const raw = saved?.views && typeof saved.views === "object" ? saved.views : {};
      const views = {};
      Object.entries(raw).forEach(([id, v]) => {
        views[id] = {
          id: v?.id || id,
          name: (v?.name || "Untitled view").toString(),
          description: (v?.description || "").toString(),
          builtin: !!v?.builtin,
          columnVisibility: { ...DEFAULT_VISIBILITY, ...(v?.columnVisibility || {}) },
          columnOrder: sanitizeOrder(v?.columnOrder),
          columnWidths: { ...DEFAULT_WIDTHS, ...(v?.columnWidths || {}) },
          pinned: { ...DEFAULT_PINNED, ...(v?.pinned || {}) },
          sortConfig: v?.sortConfig || { ...defaultSort },
          density: v?.density || "comfortable",
        };
      });
      views[BUILTIN_VIEW_ID] = views[BUILTIN_VIEW_ID]
        ? { ...views[BUILTIN_VIEW_ID], id: BUILTIN_VIEW_ID, name: "Default", builtin: true }
        : builtinView();
      const activeViewId = saved?.activeViewId && views[saved.activeViewId] ? saved.activeViewId : BUILTIN_VIEW_ID;
      return { activeViewId, views };
    } catch { return fresh(); }
  };

  const persist = (state) => {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(VIEWS_KEY, JSON.stringify(state)); }
    catch { /* private browsing / quota — works this session, just won't persist */ }
  };

  const [viewsState, setViewsState] = useState(loadViewsState);
  const initial = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID];
  const [columnVisibility, setColumnVisibility] = useState(initial.columnVisibility);
  const [columnOrder, setColumnOrder] = useState(initial.columnOrder);
  const [columnWidths, setColumnWidths] = useState(initial.columnWidths || DEFAULT_WIDTHS);
  const [pinned, setPinned] = useState(initial.pinned || DEFAULT_PINNED);
  const [sortConfig, setSortConfig] = useState(initial.sortConfig);
  const [density, setDensity] = useState(initial.density);

  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [chooserRect, setChooserRect] = useState(null);
  const [showNewViewForm, setShowNewViewForm] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [newViewDescription, setNewViewDescription] = useState("");
  const [editingViewMeta, setEditingViewMeta] = useState(null);
  const [columnSearch, setColumnSearch] = useState("");

  const [headerFilterOpen, setHeaderFilterOpen] = useState(null);
  const [filters, setFilters] = useState({});

  const [matchScoreLoading, setMatchScoreLoading] = useState(false);
  const [matchScoreData, setMatchScoreData] = useState({
    baseScore: 55,
    sectorMatch: false,
    sectorMatchedList: [],
    sectorsRequired: [],
    locationMatch: false,
    provinceMatched: "",
    geographicFocus: [],
    totalScore: 55
  });
  const [bigScoreLoading, setBigScoreLoading] = useState(false);
  const [bigScoreData, setBigScoreData] = useState({
    compliance: 0,
    legitimacy: 0,
    fundability: 0,
    leadership: 0,
    pis: 0,
    totalScore: 0,
  });
  const [activePopup, setActivePopup] = useState(null);
  const [selectedRowForPopup, setSelectedRowForPopup] = useState(null);

  const openPopup = (type, row, rect) => {
    const popupWidth = 380;
    const popupHeight = 400;
    let x = rect.left + (rect.width / 2) - (popupWidth / 2);
    let y = rect.bottom + 8;
    if (x + popupWidth > window.innerWidth - 20) x = window.innerWidth - popupWidth - 20;
    if (x < 20) x = 20;
    if (y + popupHeight > window.innerHeight - 20) y = rect.top - popupHeight - 8;
    if (y < 20) y = 20;

    setSelectedRowForPopup(row);
    setActivePopup({ type, rowId: row.id, position: { x, y } });

    if (type === "bigScore") {
      setBigScoreLoading(true);
      setBigScoreData({
        compliance: 0,
        legitimacy: 0,
        fundability: 0,
        leadership: 0,
        pis: 0,
        totalScore: 0,
      });

      const fetchBigData = async () => {
        try {
          const docSnap = await getDoc(doc(db, "bigEvaluations", row.id));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setBigScoreData({
              compliance: data.complianceScore || 0,
              legitimacy: data.legitimacyScore || 0,
              fundability: data.fundabilityScore || 0,
              leadership: data.leadershipScore || 0,
              pis: data.publicInterestScore || 0,
              totalScore: data.totalScore || 0,
            });
          } else {
            setBigScoreData({
              compliance: row.compliance || 0,
              legitimacy: row.legitimacy || 0,
              fundability: row.fundability || 0,
              leadership: row.leadership || 0,
              pis: row.pis || 0,
              totalScore: row.bigScore || 0,
            });
          }
        } catch (err) {
          console.error("BIG score fetch error:", err);
          setBigScoreData({
            compliance: row.compliance || 0,
            legitimacy: row.legitimacy || 0,
            fundability: row.fundability || 0,
            leadership: row.leadership || 0,
            pis: row.pis || 0,
            totalScore: row.bigScore || 0,
          });
        } finally {
          setBigScoreLoading(false);
        }
      };
      fetchBigData();
    }

    if (type === "match") {
      setMatchScoreLoading(true);
      setMatchScoreData({
        baseScore: 55,
        sectorMatch: false,
        sectorMatchedList: [],
        sectorsRequired: [],
        locationMatch: false,
        provinceMatched: "",
        geographicFocus: [],
        totalScore: 55
      });

      const user = auth.currentUser;
      if (!user) {
        setMatchScoreLoading(false);
        return;
      }

      const entityId = row.id;
      let currentEffectiveId = `${user.uid}_cmf`;

      const getNestedFieldLocal = (data, pathStr) => {
        if (!data) return undefined;
        const keys = pathStr.split('.');
        let val = data;
        for (const key of keys) {
          if (val == null) break;
          val = val[key];
        }
        if (val !== undefined) return val;
        val = data.formData;
        for (const key of keys) {
          if (val == null) break;
          val = val[key];
        }
        return val;
      };

      const fetchProfileAndCmf = async () => {
        try {
          const userDocSnap = await getDoc(doc(db, "users", user.uid));
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const companyId = userData.companyId;
            if (companyId) {
              const companyDocSnap = await getDoc(doc(db, "companies", companyId));
              if (companyDocSnap.exists()) {
                const companyData = companyDocSnap.data();
                const ownerId = companyData.createdBy;
                if (ownerId && ownerId !== user.uid) {
                  currentEffectiveId = `${ownerId}_cmf`;
                }
              }
            }
          }

          let profileDocSnap = await getDoc(doc(db, "MyuniversalProfiles", entityId));
          if (!profileDocSnap.exists()) {
            profileDocSnap = await getDoc(doc(db, "catalystProfiles", entityId));
          }
          if (!profileDocSnap.exists()) {
            profileDocSnap = await getDoc(doc(db, "universalProfiles", entityId));
          }
          
          const cmfDocSnap = await getDoc(doc(db, "cmfProfiles", currentEffectiveId));

          const profileData = profileDocSnap.exists() ? profileDocSnap.data() : null;
          const cmfData = cmfDocSnap.exists() ? cmfDocSnap.data() : null;
          const cmfPref = cmfData?.generalInvestmentPreference;

          let score = 55;
          let sectorMatch = false;
          let locationMatch = false;

          const economicSectors = profileData ? (getNestedFieldLocal(profileData, "entityOverview.economicSectors") || 
                                  getNestedFieldLocal(profileData, "programBriefMatchingPreference.sectorFocus") || 
                                  (getNestedFieldLocal(profileData, "entityOverview.industrySector") ? [getNestedFieldLocal(profileData, "entityOverview.industrySector")] : [])) : [];
          
          const cmfSectors = cmfPref?.sectorFocus || ["Technology", "Logistics", "Retail", "Construction", "CleanTech"];
          const sectorsArray = Array.isArray(economicSectors) ? economicSectors : (economicSectors ? [economicSectors] : []);
          
          const matchedSectors = [];
          sectorsArray.forEach(s => {
            cmfSectors.forEach(c => {
              if (s.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(s.toLowerCase())) {
                if (!matchedSectors.includes(s)) {
                  matchedSectors.push(s);
                }
              }
            });
          });
          if (matchedSectors.length > 0) {
            sectorMatch = true;
            score += 25;
          }

          let province = profileData ? (getNestedFieldLocal(profileData, "location") || 
                         getNestedFieldLocal(profileData, "entityOverview.contactDetails.province") || 
                         getNestedFieldLocal(profileData, "entityOverview.province") || 
                         "") : "";
          const provincesList = profileData ? getNestedFieldLocal(profileData, "programBriefMatchingPreference.selectedProvinces") : null;
          if (Array.isArray(provincesList) && provincesList.length > 0) {
            province = provincesList[0];
          }
          
          const cmfLocations = cmfPref?.geographicFocus || ["Gauteng", "Western Cape", "Eastern Cape", "Limpopo", "National", "South Africa"];
          const locationMatchedList = [];
          cmfLocations.forEach(c => {
            if (String(province).toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(String(province).toLowerCase())) {
              if (!locationMatchedList.includes(c)) {
                locationMatchedList.push(c);
              }
            }
          });
          if (locationMatchedList.length > 0 || String(province).toLowerCase() === "national") {
            locationMatch = true;
            score += 15;
          }

          const totalScore = Math.min(score, 98);

          setMatchScoreData({
            baseScore: 55,
            sectorMatch,
            sectorMatchedList: matchedSectors,
            sectorsRequired: cmfSectors,
            locationMatch,
            provinceMatched: province,
            geographicFocus: cmfLocations,
            totalScore
          });

        } catch (err) {
          console.error("Match score breakdown fetch error:", err);
          setMatchScoreData(prev => ({ ...prev, _error: true }));
        } finally {
          setMatchScoreLoading(false);
        }
      };

      fetchProfileAndCmf();
    }
  };

  const openPopupFromEvent = (type, row, event) => {
    event.stopPropagation();
    openPopup(type, row, event.currentTarget.getBoundingClientRect());
  };

  const closePopup = () => {
    setActivePopup(null);
    setSelectedRowForPopup(null);
    setMatchScoreLoading(false);
  };
  const [notification, setNotification] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragHintRect, setDragHintRect] = useState(null);
  const resizingRef = useRef(null);
  const [resizingColumn, setResizingColumn] = useState(null);

  const [viewportWidth, setViewportWidth] = useState(typeof window === "undefined" ? 1440 : window.innerWidth);

  const activeView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID];
  const ds = DENSITY[density] || DENSITY.comfortable;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(t);
  }, [notification]);

  // Auto-save layout edits into the active view.
  useEffect(() => {
    setViewsState((prev) => {
      const current = prev.views[prev.activeViewId];
      if (!current) return prev;
      const next = {
        ...prev,
        views: { ...prev.views, [prev.activeViewId]: { ...current, columnVisibility, columnOrder, columnWidths, pinned, sortConfig, density } },
      };
      persist(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibility, columnOrder, columnWidths, pinned, sortConfig, density]);

  const switchToView = (id) => {
    const target = viewsState.views[id];
    if (!target) return;
    setViewsState((prev) => { const next = { ...prev, activeViewId: id }; persist(next); return next; });
    setColumnVisibility(target.columnVisibility);
    setColumnOrder(target.columnOrder);
    setColumnWidths(target.columnWidths || DEFAULT_WIDTHS);
    setPinned(target.pinned || DEFAULT_PINNED);
    setSortConfig(target.sortConfig);
    setDensity(target.density);
  };

  const createNewView = () => {
    const name = newViewName.trim();
    if (!name) return;
    const id = generateViewId();
    const view = {
      id, name, description: newViewDescription.trim(), builtin: false,
      columnVisibility: { ...columnVisibility }, columnOrder: [...columnOrder],
      columnWidths: { ...columnWidths }, pinned: { ...pinned },
      sortConfig: { ...sortConfig }, density,
    };
    setViewsState((prev) => { const next = { activeViewId: id, views: { ...prev.views, [id]: view } }; persist(next); return next; });
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
      persist(next);
      return next;
    });
    setEditingViewMeta(null);
  };

  const removeView = (id) => {
    if (id === BUILTIN_VIEW_ID) return;
    const wasActive = viewsState.activeViewId === id;
    setViewsState((prev) => {
      const { [id]: _drop, ...rest } = prev.views;
      const next = { activeViewId: wasActive ? BUILTIN_VIEW_ID : prev.activeViewId, views: rest };
      persist(next);
      return next;
    });
    if (wasActive) {
      const def = viewsState.views[BUILTIN_VIEW_ID];
      setColumnVisibility(def.columnVisibility); setColumnOrder(def.columnOrder);
      setColumnWidths(def.columnWidths || DEFAULT_WIDTHS); setPinned(def.pinned || DEFAULT_PINNED);
      setSortConfig(def.sortConfig); setDensity(def.density);
    }
    setNotification({ type: "success", message: "View deleted" });
  };

  const resetActiveView = () => {
    const layout = defaultLayout();
    setColumnVisibility(layout.columnVisibility); setColumnOrder(layout.columnOrder);
    setColumnWidths(layout.columnWidths); setPinned(layout.pinned);
    setSortConfig(layout.sortConfig); setDensity(layout.density);
    setNotification({ type: "success", message: `"${activeView.name}" reset to factory defaults` });
  };

  const toggleColumn = (key) => setColumnVisibility((p) => ({ ...p, [key]: !p[key] }));
  const cyclePin = (key) =>
    setPinned((prev) => ({
      ...prev,
      [key]: prev[key] === "left" ? "right" : prev[key] === "right" ? null : "left",
    }));

  const valueOf = (row, col) => (col?.getValue ? col.getValue(row) : row?.[col?.key]);
  const primaryValue = (row) => (primary?.getValue ? primary.getValue(row) : row?.[primary?.key]);

  // ─── Filter / sort ──────────────────────────────────────────────────────
  const processed = useMemo(() => {
    let result = [...rows];

    if (filters[NAME_KEY]?.trim()) {
      const q = filters[NAME_KEY].toLowerCase().trim();
      result = result.filter((row) => (primaryValue(row) ?? "").toString().toLowerCase().includes(q));
    }

    columns.forEach((col) => {
      const value = filters[col.key];
      if (value == null || col.filter === "none") return;
      if (col.filter === "select" && Array.isArray(value) && value.length) {
        result = result.filter((row) => value.includes((valueOf(row, col) ?? "").toString()));
      } else if (col.filter === "range" && Array.isArray(value)) {
        const [min, max] = value;
        if (min != null) result = result.filter((row) => Number(valueOf(row, col) || 0) >= min);
        if (max != null) result = result.filter((row) => Number(valueOf(row, col) || 0) <= max);
      } else if (col.filter === "date" && Array.isArray(value)) {
        const [from, to] = value;
        if (from) result = result.filter((row) => { const d = toDate(valueOf(row, col)); return d && d >= new Date(from); });
        if (to) result = result.filter((row) => { const d = toDate(valueOf(row, col)); return d && d <= new Date(new Date(to).setHours(23, 59, 59, 999)); });
      } else if ((col.filter === "text" || !col.filter) && value.toString().trim()) {
        const q = value.toString().toLowerCase().trim();
        result = result.filter((row) => (valueOf(row, col) ?? "").toString().toLowerCase().includes(q));
      }
    });

    if (sortConfig?.key) {
      const isName = sortConfig.key === NAME_KEY;
      const col = isName ? null : COLUMN_DEFS[sortConfig.key];
      const isDate = col?.type === "date";
      const isNumber = col?.filter === "range" || col?.type === "match";
      result.sort((a, b) => {
        let av = isName ? primaryValue(a) : valueOf(a, col);
        let bv = isName ? primaryValue(b) : valueOf(b, col);
        if (isDate) { av = toDate(av)?.getTime() ?? 0; bv = toDate(bv)?.getTime() ?? 0; }
        else if (isNumber) { av = Number(av) || 0; bv = Number(bv) || 0; }
        else { av = (av ?? "").toString().toLowerCase(); bv = (bv ?? "").toString().toLowerCase(); }
        if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
        if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, filters, sortConfig, columns]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const paginated = processed.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => { setCurrentPage(1); }, [filters, pageSize]);

  const activeFilterCount = useMemo(() => {
    let n = filters[NAME_KEY]?.trim() ? 1 : 0;
    columns.forEach((col) => {
      const v = filters[col.key];
      if (v == null) return;
      if (Array.isArray(v)) { if (v.some((x) => x != null && x !== "")) n += 1; }
      else if (v.toString().trim()) n += 1;
    });
    return n;
  }, [filters, columns]);

  const clearAllFilters = () => setFilters({});

  const selectOptions = (col) =>
    col.options || [...new Set(rows.map((r) => (valueOf(r, col) ?? "").toString()).filter((v) => v && v !== "N/A"))].sort();

  // ─── Sorting ────────────────────────────────────────────────────────────
  // asc → desc → cleared.
  const toggleSort = (key, event) => {
    event.stopPropagation();
    setSortConfig((prev) => {
      if (prev?.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "desc" };
    });
  };

  const SortTrigger = ({ colKey }) => {
    const isActive = sortConfig?.key === colKey;
    return (
      <button
        type="button"
        onClick={(e) => toggleSort(colKey, e)}
        className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${isActive ? "text-[#e6d7c3]" : "text-[#c8b6a6] hover:text-white"}`}
        title={isActive ? (sortConfig.direction === "asc" ? "Sort descending" : "Clear sort") : "Sort ascending"}
      >
        {isActive
          ? (sortConfig.direction === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)
          : <ArrowUpDown size={11} />}
      </button>
    );
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

  // ─── Drag to reorder ────────────────────────────────────────────────────
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

  // ─── Widths + resize ────────────────────────────────────────────────────
  // widthOf is declared above startResize because startResize calls it — a
  // const referenced before its initializer throws at render. It covers the
  // reorderable columns *and* the two fixed ones, so every column in the table
  // can be dragged wider.
  const widthOf = useCallback(
    (key) => columnWidths[key] ?? DEFAULT_WIDTHS[key] ?? 148,
    [columnWidths, DEFAULT_WIDTHS]
  );

  const startResize = (event, key) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = widthOf(key);
    resizingRef.current = key;
    setResizingColumn(key);

    const onMove = (moveEvent) => {
      const next = Math.max(MIN_COLUMN_WIDTH, Math.round(startWidth + (moveEvent.clientX - startX)));
      setColumnWidths((prev) => ({ ...prev, [key]: next }));
    };
    const onUp = () => {
      resizingRef.current = null;
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

  // Double-click a divider to put that column back to its default width.
  const resetColumnWidth = (key) =>
    setColumnWidths((prev) => ({ ...prev, [key]: DEFAULT_WIDTHS[key] ?? 148 }));

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

  // ─── Export ─────────────────────────────────────────────────────────────
  const handleExport = () => {
    try {
      const visible = columnOrder.filter((k) => columnVisibility[k] && COLUMN_DEFS[k]);
      if (processed.length === 0) { setNotification({ type: "error", message: "Nothing to export" }); return; }
      const header = [primary?.label || "Name", ...visible.map((k) => COLUMN_DEFS[k].label)];
      const data = processed.map((row) => {
        const out = { [header[0]]: primaryValue(row) ?? "" };
        visible.forEach((k) => {
          const col = COLUMN_DEFS[k];
          let v = col.exportValue ? col.exportValue(row) : valueOf(row, col);
          if (col.type === "date") v = formatDate(v);
          if (col.type === "match") v = v != null ? `${v}%` : "";
          if (Array.isArray(v)) v = v.join(", ");
          out[col.label] = v ?? "";
        });
        return out;
      });
      const worksheet = XLSX.utils.json_to_sheet(data, { header });
      worksheet["!cols"] = header.map((label) => {
        const lengths = data.map((r) => String(r[label] ?? "").length);
        return { wch: Math.min(Math.max(label.length, ...lengths, 8) + 2, 45) };
      });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, exportSheet);
      XLSX.writeFile(workbook, `${exportName}-${new Date().toISOString().split("T")[0]}.xlsx`);
      setNotification({ type: "success", message: "Export downloaded" });
    } catch (error) {
      console.error("Export error:", error);
      setNotification({ type: "error", message: `Export failed: ${error.message}` });
    }
  };

  // ─── Layout ─────────────────────────────────────────────────────────────
  const maxPriority = viewportWidth < 640 ? 1 : viewportWidth < 1024 ? 3 : 99;

  const visibleColumnKeys = useMemo(
    () => columnOrder.filter((k) => columnVisibility[k] && COLUMN_DEFS[k] && (COLUMN_DEFS[k].priority ?? 1) <= maxPriority),
    [columnOrder, columnVisibility, COLUMN_DEFS, maxPriority]
  );

  const collapsedByViewport = useMemo(
    () => columnOrder.filter((k) => columnVisibility[k] && COLUMN_DEFS[k] && (COLUMN_DEFS[k].priority ?? 1) > maxPriority).length,
    [columnOrder, columnVisibility, COLUMN_DEFS, maxPriority]
  );

  const orderedColumns = useMemo(() => {
    const left = visibleColumnKeys.filter((k) => pinned[k] === "left");
    const right = visibleColumnKeys.filter((k) => pinned[k] === "right");
    const middle = visibleColumnKeys.filter((k) => !pinned[k]);
    return [...left, ...middle, ...right];
  }, [visibleColumnKeys, pinned]);

  const nameWidth = widthOf(NAME_KEY);
  const actionWidth = actions ? widthOf(ACTION_KEY) : 0;

  const stickyOffsets = useMemo(() => {
    const offsets = {};
    let leftAcc = nameWidth;
    orderedColumns.forEach((key) => {
      if (pinned[key] === "left") {
        offsets[key] = { side: "left", value: leftAcc };
        leftAcc += widthOf(key);
      }
    });
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

  const searchedColumns = DEFAULT_ORDER.filter((key) =>
    (COLUMN_DEFS[key]?.label || "").toLowerCase().includes(columnSearch.toLowerCase())
  );

  // ─── Cell renderer ──────────────────────────────────────────────────────
  const renderCellBody = (row, col) => {
    const value = valueOf(row, col);
    if (col.render) return col.render(row, value);
    switch (col.type) {
      case "bigScore": {
        const score = Number(value) || 0;
        const label = getBigScoreLabel(score);
        return (
          <div className="flex flex-col items-center gap-1">
            <div className="relative w-11 h-11">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#e6d7c3" strokeWidth="3" />
                <circle cx="18" cy="18" r="14" fill="none" stroke={label.color} strokeWidth="3" strokeDasharray={`${score * 0.88} 88`} strokeLinecap="round" />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center ${ds.fontSize} font-semibold`} style={{ color: label.color }}>{score || "—"}</span>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: `${label.color}20`, color: label.color }}>{label.label}</span>
          </div>
        );
      }
      case "match": {
        const score = Number(value) || 0;
        const label = getMatchLabel(score);
        return (
          <div className="flex flex-col items-center gap-1">
            <div className="relative w-11 h-11">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#e6d7c3" strokeWidth="3" />
                <circle cx="18" cy="18" r="14" fill="none" stroke={label.color} strokeWidth="3" strokeDasharray={`${score * 0.88} 88`} strokeLinecap="round" />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center ${ds.fontSize} font-semibold`} style={{ color: label.color }}>{score}%</span>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: `${label.color}20`, color: label.color }}>{label.label}</span>
          </div>
        );
      }
      case "status": {
        const color = col.statusColor?.(value, row) || "#7d5a50";
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
            style={{ backgroundColor: `${color}18`, color, borderColor: `${color}40` }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />{value || "—"}
          </span>
        );
      }
      case "badge":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#f5f0e1] text-[#4a352f]">{value || "—"}</span>;
      case "date":
        return <div className="flex items-center gap-1.5"><Calendar size={13} className="text-[#7d5a50] flex-shrink-0" />{formatDate(value)}</div>;
      default:
        return <span className="line-clamp-2 break-words">{value ?? "—"}</span>;
    }
  };

  const renderCell = (row, key, rowBg) => {
    const col = COLUMN_DEFS[key];
    if (!col) return null;
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

    const isMatch = col.type === "match";
    const isBig = col.type === "bigScore";
    const cellClass = `${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-b border-[#e6d7c3] align-top ${col.align === "center" ? "text-center" : ""} ${(isMatch || isBig) ? "cursor-pointer hover:bg-[#faf7f2]/60 transition-colors" : ""}`;
    const clickHandler = isMatch ? (e) => openPopupFromEvent("match", row, e) : isBig ? (e) => openPopupFromEvent("bigScore", row, e) : undefined;
    const titleText = isMatch ? "Click to see the Match Fit breakdown" : isBig ? "Click to see the BIG Score breakdown" : undefined;

    return (
      <td
        key={key}
        className={cellClass}
        style={stickyStyle}
        onClick={clickHandler}
        title={titleText}
      >
        {renderCellBody(row, col)}
      </td>
    );
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

      <div className="bg-[#faf7f2] rounded-t-2xl p-4 border border-[#e6d7c3] border-b-0 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {toolbarBadge && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#f5f0e1] text-[#7d5a50] border border-[#c8b6a6]">
                {toolbarBadge.icon} {toolbarBadge.label}
              </span>
            )}
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4a352f] border border-[#c8b6a6]">
              <LayoutGrid size={12} className="text-[#7d5a50] flex-shrink-0" />
              Viewing: {activeView.name}
              {activeView.description && <span className="font-normal text-[#a89482]"> — {activeView.description}</span>}
            </span>
            {activeFilterCount > 0 && (
              <>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#fff3e0] text-[#e65100] border border-[#e65100]/30">
                  <SlidersHorizontal size={12} /> {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                </span>
                <button onClick={clearAllFilters} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#a67c52] hover:text-[#4a352f] hover:bg-white border border-[#e6d7c3] transition-colors">
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
            <div className="relative">
              <button onClick={(e) => {
                if (showColumnChooser) { setShowColumnChooser(false); setChooserRect(null); }
                else { setChooserRect(e.currentTarget.getBoundingClientRect()); setShowColumnChooser(true); setShowNewViewForm(false); setEditingViewMeta(null); }
              }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all shadow-sm">
                <SlidersHorizontal size={16} /> Customize Table <ChevronDown size={14} className={`transition-transform ${showColumnChooser ? "rotate-180" : ""}`} />
              </button>

              {showColumnChooser && chooserRect && (() => {
                const panelWidth = 340, margin = 12;
                const left = Math.min(Math.max(chooserRect.right - panelWidth, margin), window.innerWidth - panelWidth - margin);
                const spaceBelow = window.innerHeight - chooserRect.bottom - margin - 8;
                const spaceAbove = chooserRect.top - margin - 8;
                const upward = spaceBelow < 320 && spaceAbove > spaceBelow;
                const maxHeight = Math.max(200, Math.min(640, upward ? spaceAbove : spaceBelow));
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
                                {!view.builtin && <button onClick={() => removeView(view.id)} title="Delete view" className="text-[#a89482] hover:text-red-500 p-1"><Trash2 size={13} /></button>}
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
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Columns</h4>

                      <div className="relative mb-3">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a89482] pointer-events-none" />
                        <input value={columnSearch} onChange={(e) => setColumnSearch(e.target.value)} placeholder="Search columns..."
                          className="w-full pl-7 pr-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs" />
                      </div>

                      <p className="text-xs text-[#a89482] mb-3 flex items-center gap-1.5">
                        <GripVertical size={12} className="flex-shrink-0" /> Drag a header to reorder, drag its right edge to resize. Every column resizes, including the pinned ones.
                      </p>

                      <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg opacity-75">
                        <input type="checkbox" checked disabled className="rounded border-[#c8b6a6]" />
                        <span className="text-sm text-[#4a352f] flex-1">{primary?.label || "Name"}</span>
                        <span className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold">Pinned</span>
                      </div>
                      {actions && (
                        <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg opacity-75">
                          <input type="checkbox" checked disabled className="rounded border-[#c8b6a6]" />
                          <span className="text-sm text-[#4a352f] flex-1">Actions</span>
                          <span className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold">Always last</span>
                        </div>
                      )}
                      <div className="border-t border-[#e6d7c3] my-2" />

                      {searchedColumns.length === 0 && <p className="text-xs text-[#a89482] px-2 py-1.5">No columns match that search.</p>}
                      {searchedColumns.map((key) => (
                        <div key={key} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[#faf7f2]">
                          <label className="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
                            <input type="checkbox" checked={columnVisibility[key] || false} onChange={() => toggleColumn(key)}
                              className="rounded border-[#c8b6a6] text-[#7d5a50]" />
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
                        {[["comfortable", "Comfortable"], ["compact", "Compact"], ["ultra-compact", "Ultra"]].map(([key, label]) => (
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
              title="Export the current filtered/sorted rows to Excel (.xlsx)">
              <Download size={16} /> Export to Excel
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-b-2xl border border-[#e6d7c3] shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8"><div className="space-y-4">{[...Array(6)].map((_, i) => (<div key={i} className="h-10 bg-[#f5f0e1] rounded-lg animate-pulse" />))}</div></div>
        ) : (
          <>
            <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
              <style>{`
                /* No 'position: relative' here — it silently overrides the
                   sticky positioning on every <th>. Sticky is itself a
                   positioned ancestor, so the grip and resize handle still
                   anchor. */
                .cmt-th { color: #faf7f2 !important; vertical-align: top !important; }
                .cmt-th-draggable { cursor: grab; }
                .cmt-th-draggable:active { cursor: grabbing; }
                .cmt-th-row { display: flex; align-items: flex-start; gap: 2px; min-width: 0; }
                /* overflow-wrap: normal stops the browser splitting inside a
                   word, which is what turns "Match Fit" into "MAT CH.." in
                   narrow columns. */
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
                    {/* Primary name column — pinned, and resizable like the rest */}
                    <th className="cmt-th text-left font-semibold uppercase tracking-wider text-xs sticky top-0 left-0 z-30"
                      style={{
                        backgroundColor: "#4a352f",
                        width: nameWidth,
                        padding: ds.header,
                        borderBottom: "1px solid #e6d7c3",
                        boxShadow: "2px 0 0 #e6d7c3",
                      }}>
                      <div className="cmt-th-row">
                        <span className="cmt-th-label" title={primary?.label || "Name"}>{primary?.label || "Name"}</span>
                        <span className="cmt-th-tools">
                          <SortTrigger colKey={NAME_KEY} />
                          <FilterTrigger colKey={NAME_KEY} />
                          <HeaderInfoTooltip text={primary?.tooltip || "The name of the record. Click the eye to open its full details."} />
                        </span>
                      </div>
                      <ColumnResizer colKey={NAME_KEY} />
                    </th>

                    {orderedColumns.map((key) => {
                      const col = COLUMN_DEFS[key];
                      const isDragging = draggedColumn === key;
                      const isDragOver = dragOverColumn === key && draggedColumn !== key;
                      const offset = stickyOffsets[key];
                      return (
                        <th key={key} draggable={!resizingColumn}
                          onDragStart={(e) => { setDraggedColumn(key); setDragHintRect(null); try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", key); } catch { /* some browsers are picky */ } }}
                          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (key !== dragOverColumn) setDragOverColumn(key); }}
                          onDrop={(e) => handleDrop(e, key)}
                          onDragEnd={() => { setDraggedColumn(null); setDragOverColumn(null); }}
                          onMouseEnter={(e) => setDragHintRect(e.currentTarget.getBoundingClientRect())}
                          onMouseLeave={() => setDragHintRect(null)}
                          className={`cmt-th cmt-th-draggable font-semibold uppercase tracking-wider text-xs sticky top-0 select-none transition-opacity ${col.align === "center" ? "text-center" : "text-left"} ${isDragging ? "opacity-40" : ""}`}
                          style={{
                            width: widthOf(key),
                            padding: ds.header,
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
                          }}>
                          <GripVertical size={11} className="cmt-th-grip" />
                          <div className={`cmt-th-row ${col.align === "center" ? "justify-center" : ""}`}>
                            <span className="cmt-th-label" title={col.label}>{col.label}</span>
                            <span className="cmt-th-tools">
                              {pinned[key] && <Pin size={10} className="opacity-60 mt-0.5" />}
                              {col.sortable !== false && <SortTrigger colKey={key} />}
                              {col.filter !== "none" && <FilterTrigger colKey={key} />}
                              <HeaderInfoTooltip text={col.tooltip} />
                            </span>
                          </div>
                          <ColumnResizer colKey={key} />
                        </th>
                      );
                    })}

                    {actions && (
                      <th className="cmt-th text-center font-semibold uppercase tracking-wider text-xs sticky top-0 z-20"
                        style={{ width: actionWidth, backgroundColor: "#4a352f", padding: ds.header, borderBottom: "1px solid #e6d7c3" }}>
                        <div className="cmt-th-row justify-center">
                          <span className="cmt-th-label">Actions</span>
                          <HeaderInfoTooltip text="Open the full record to see everything captured about it." />
                        </div>
                        <ColumnResizer colKey={ACTION_KEY} />
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={orderedColumns.length + (actions ? 2 : 1)} className="text-center py-20 border-b border-[#e6d7c3]">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-20 h-20 rounded-full bg-[#f5f0e1] flex items-center justify-center">
                            {emptyState.icon || <Users size={32} className="text-[#7d5a50] opacity-50" />}
                          </div>
                          <p className="text-lg font-semibold text-[#4a352f]">{emptyState.title || "Nothing here yet"}</p>
                          <p className="text-sm text-[#7d5a50] max-w-sm">
                            {activeFilterCount > 0 ? "Clear a filter to widen the list." : emptyState.description}
                          </p>
                          {activeFilterCount > 0 && (
                            <button onClick={clearAllFilters} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7d5a50] text-white">Clear all filters</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((row, i) => {
                      const rowId = row.id ?? i;
                      const rowBg = hoveredRow === rowId ? "#fdf8f4" : "#ffffff";
                      return (
                        <tr key={rowId}
                          style={{ backgroundColor: rowBg, transition: "background-color .15s" }}
                          onMouseEnter={() => setHoveredRow(rowId)} onMouseLeave={() => setHoveredRow(null)}>
                          <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f] sticky left-0 z-10 align-top border-b border-[#e6d7c3]`}
                            style={{ width: nameWidth, backgroundColor: rowBg, boxShadow: "2px 0 0 #e6d7c3" }}>
                            <div className="flex items-start gap-2 min-w-0">
                              <div className={`${ds.avatar} rounded-full bg-gradient-to-br from-[#7d5a50] to-[#4a352f] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5`}>
                                {(primaryValue(row) || "?").toString().charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-1.5 flex-wrap">
                                  <span className={`${ds.fontSize} font-medium leading-snug text-[#4a352f] break-words`}>{primaryValue(row)}</span>
                                  {primary?.onView && (
                                    <button onClick={() => primary.onView(row)} className="text-[#a89482] hover:text-[#7d5a50] transition-colors flex-shrink-0 mt-0.5"
                                      aria-label={`View details for ${primaryValue(row)}`} title="View details">
                                      <Eye size={13} />
                                    </button>
                                  )}
                                </div>
                                {primary?.subtitle && <p className="text-[11px] text-[#a89482] mt-0.5 truncate">{primary.subtitle(row)}</p>}
                              </div>
                            </div>
                          </td>

                          {orderedColumns.map((key) => renderCell(row, key, rowBg))}

                          {actions && (
                            <td className={`${ds.cell} text-center align-top border-b border-[#e6d7c3]`} style={{ width: actionWidth, backgroundColor: rowBg }}>
                              <div className="flex items-center justify-center gap-1.5">{actions(row)}</div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-[#e6d7c3] bg-[#faf7f2] rounded-b-2xl flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#4a352f]">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, processed.length)}-{Math.min(currentPage * pageSize, processed.length)} of {processed.length}
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

      {/* ─── Match Fit Breakdown Popup ────────────────────────────────────── */}
      {activePopup?.type === "match" && selectedRowForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div
            className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: "380px", maxHeight: "480px", overflowY: "auto" }}
          >
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Match Fit Breakdown</p>
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[200px]">{primaryValue(selectedRowForPopup)}</h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center text-xl font-bold">
                    {matchScoreLoading ? "…" : `${matchScoreData.totalScore}%`}
                  </div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors p-1"><X size={18} /></button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {matchScoreLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (<div key={i} className="h-16 bg-[#f5f0e1] rounded-xl animate-pulse" />))}
                </div>
              ) : matchScoreData._error ? (
                <p className="text-xs text-red-600 text-center py-6">Couldn't load the breakdown. Try again shortly.</p>
              ) : (
                <>
                  {/* Base Alignment Score */}
                  <div className="bg-[#faf7f2] rounded-xl p-3 border border-[#e6d7c3]/40">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <div>
                        <span className="text-xs font-bold text-[#4a352f]">Base Compatibility</span>
                        <p className="text-[10px] text-[#7d5a50]">Ecosystem onboarding alignment</p>
                      </div>
                      <span className="text-sm font-bold text-[#7d5a50]">{matchScoreData.baseScore}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#e6d7c3] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#7d5a50]" style={{ width: `${matchScoreData.baseScore}%` }} />
                    </div>
                  </div>

                  {/* Sector Fit */}
                  <div className="bg-[#faf7f2] rounded-xl p-3 border border-[#e6d7c3]/40">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <div>
                        <span className="text-xs font-bold text-[#4a352f]">Sector Fit</span>
                        <p className="text-[10px] text-[#7d5a50]">
                          {matchScoreData.sectorMatch 
                            ? `Matches your focus: ${matchScoreData.sectorMatchedList.join(", ")}`
                            : "No overlapping sectors with your focus list"}
                        </p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: matchScoreData.sectorMatch ? "#22c55e" : "#dc2626" }}>
                        {matchScoreData.sectorMatch ? "+25%" : "+0%"}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#e6d7c3] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: matchScoreData.sectorMatch ? "100%" : "0%", backgroundColor: matchScoreData.sectorMatch ? "#22c55e" : "#dc2626" }} />
                    </div>
                    {matchScoreData.sectorsRequired && matchScoreData.sectorsRequired.length > 0 && (
                      <p className="text-[9px] text-[#a89482] mt-1">Your focus sectors: {matchScoreData.sectorsRequired.join(", ")}</p>
                    )}
                  </div>

                  {/* Geographic Fit */}
                  <div className="bg-[#faf7f2] rounded-xl p-3 border border-[#e6d7c3]/40">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <div>
                        <span className="text-xs font-bold text-[#4a352f]">Geographic Fit</span>
                        <p className="text-[10px] text-[#7d5a50]">
                          {matchScoreData.locationMatch 
                            ? `Location aligns: ${matchScoreData.provinceMatched || "National"}`
                            : `Location (${matchScoreData.provinceMatched || "N/A"}) is outside your geographic focus`}
                        </p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: matchScoreData.locationMatch ? "#22c55e" : "#dc2626" }}>
                        {matchScoreData.locationMatch ? "+15%" : "+0%"}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#e6d7c3] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: matchScoreData.locationMatch ? "100%" : "0%", backgroundColor: matchScoreData.locationMatch ? "#22c55e" : "#dc2626" }} />
                    </div>
                    {matchScoreData.geographicFocus && matchScoreData.geographicFocus.length > 0 && (
                      <p className="text-[9px] text-[#a89482] mt-1">Your location focus: {matchScoreData.geographicFocus.join(", ")}</p>
                    )}
                  </div>

                  {/* Capping Note */}
                  {matchScoreData.totalScore === 98 && (
                    <p className="text-[10px] text-[#a89482] italic text-center">
                      * Maximum score is capped at 98%.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </PopupPortal>
      )}

      {/* ─── BIG Score Breakdown Popup ────────────────────────────────────── */}
      {activePopup?.type === "bigScore" && selectedRowForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div
            className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: "380px" }}
          >
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">BIG Score Breakdown</p>
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[200px]">{primaryValue(selectedRowForPopup)}</h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center text-xl font-bold">
                    {bigScoreLoading ? "…" : `${bigScoreData.totalScore}`}
                  </div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors p-1"><X size={18} /></button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {bigScoreLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[...Array(5)].map((_, i) => (<div key={i} className="h-12 bg-[#f5f0e1] rounded-xl" />))}
                </div>
              ) : (
                <>
                  {[
                    { label: "Compliance & Governance", value: bigScoreData.compliance, color: "#4a352f" },
                    { label: "Legitimacy & Legitimation", value: bigScoreData.legitimacy, color: "#7d5a50" },
                    { label: "Fundability Readiness", value: bigScoreData.fundability, color: "#8d6e63" },
                    { label: "Leadership & Human Capital", value: bigScoreData.leadership, color: "#a1887f" },
                    { label: "Public Interest Score", value: bigScoreData.pis, color: "#bcaaa4" }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-[#faf7f2] rounded-xl p-3 border border-[#e6d7c3]/40">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <span className="text-xs font-bold text-[#4a352f]">{item.label}</span>
                        <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#e6d7c3] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </PopupPortal>
      )}

      {dragHintRect && !draggedColumn && (
        <PopupPortal>
          <div className="fixed z-[1200] bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none normal-case font-normal flex items-center gap-1.5"
            style={{ top: dragHintRect.bottom + 8, left: Math.min(Math.max(dragHintRect.left, 12), window.innerWidth - 220), width: "205px" }}>
            <GripVertical size={12} className="flex-shrink-0" /> Drag to reorder · edge to resize
          </div>
        </PopupPortal>
      )}

      {headerFilterOpen && (() => {
        const key = headerFilterOpen.key;
        const isName = key === NAME_KEY;
        const col = isName ? { label: primary?.label || "Name", filter: "text" } : COLUMN_DEFS[key];
        if (!col) return null;
        const filterType = col.filter || "text";
        const value = filters[key];
        const setValue = (v) => setFilters((p) => ({ ...p, [key]: v }));
        const clear = () => setFilters((p) => { const { [key]: _drop, ...rest } = p; return rest; });

        return (
          <PopupPortal>
            <div className="fixed inset-0 z-[1090]" onClick={() => setHeaderFilterOpen(null)} />
            <div className="fixed z-[1091] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-4"
              style={{ top: headerFilterOpen.rect.bottom + 8, left: Math.min(Math.max(headerFilterOpen.rect.left - 20, 12), window.innerWidth - 312), width: "300px", maxHeight: "70vh", overflowY: "auto" }}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[#4a352f]">Filter by {col.label.toLowerCase()}</label>
                {value != null && <button onClick={clear} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
              </div>

              {filterType === "text" && (
                <input autoFocus type="text" value={value || ""} onChange={(e) => setValue(e.target.value)}
                  placeholder={`Search ${col.label.toLowerCase()}...`}
                  className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20" />
              )}
              {filterType === "select" && (
                <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto">
                  {selectOptions(col).length === 0 && <span className="text-xs text-[#a89482]">No data available</span>}
                  {selectOptions(col).map((opt) => {
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
              {filterType === "range" && (
                <div className="flex items-center gap-3">
                  <input type="number" placeholder="Min" value={value?.[0] ?? ""}
                    onChange={(e) => setValue([e.target.value === "" ? null : Number(e.target.value), value?.[1] ?? null])}
                    className="w-full px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                  <span className="text-[#7d5a50]">to</span>
                  <input type="number" placeholder="Max" value={value?.[1] ?? ""}
                    onChange={(e) => setValue([value?.[0] ?? null, e.target.value === "" ? null : Number(e.target.value)])}
                    className="w-full px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                </div>
              )}
              {filterType === "date" && (
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
    </div>
  );
};

// ─── Sector chips (shared cell renderer for funders/catalysts) ────────────────
const SectorChips = ({ sectors = [] }) => (
  <div className="flex flex-wrap gap-1">
    {sectors.slice(0, 2).map((s) => (
      <span key={s} className="bg-[#faf7f2] text-[#7d5a50] border border-[#e6d7c3] px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap">{s}</span>
    ))}
    {sectors.length > 2 && (
      <span className="bg-[#faf7f2] text-[#7d5a50] border border-[#e6d7c3] px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap" title={sectors.slice(2).join(", ")}>
        +{sectors.length - 2}
      </span>
    )}
    {sectors.length === 0 && <span className="text-[#a89482] text-xs">—</span>}
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CMFTabbedTables({
  filters = {},
  stageFilter,
  smeMatches = [],
  funderMatches = [],
  catalystMatches = [],
  loading = false,
  onUpdateStage,
  onStageOverride,
}) {
  const [activeTab, setActiveTab] = useState("businesses");
  const [businessSubTab, setBusinessSubTab] = useState("pipeline");
  // Each list opens its own full-profile modal — catalysts get the catalyst
  // modal, funders the funder modal, businesses the business modal — rather
  // than one generic partner card for all three.
  const [selectedCatalyst, setSelectedCatalyst] = useState(null);
  const [selectedFunder, setSelectedFunder] = useState(null);
  const [selectedSME, setSelectedSME] = useState(null);

  const activeStages = useMemo(() => getActiveStages(), []);

  // The pipeline/active split previously ran on loose substring matching
  // ("active"/"exit"/"admitted"), which misfired on renamed stages and dropped
  // Declined and Withdrawn rows out of both lists entirely. Both sides now
  // resolve through the shared stage config.
  const activeDealIds = useMemo(() => {
    const ids = new Set(["active", "completed"]);
    activeStages.filter((s) => s.terminal && s.group === "success").forEach((s) => ids.add(s.id));
    return ids;
  }, [activeStages]);

  const pipelineMatches = useMemo(
    () => smeMatches.filter((sme) => !activeDealIds.has(mapStatusToStageId(sme.currentStatus || sme.pipelineStage, activeStages))),
    [smeMatches, activeDealIds, activeStages]
  );

  const activeDeals = useMemo(
    () => smeMatches
      .filter((sme) => activeDealIds.has(mapStatusToStageId(sme.currentStatus || sme.pipelineStage, activeStages)))
      .map((sme) => {
        const stageId = mapStatusToStageId(sme.currentStatus || sme.pipelineStage, activeStages);
        const stage = activeStages.find((s) => s.id === stageId);
        return {
          id: sme.id,
          // The full business record travels with the row so opening a deal
          // shows the same complete profile the pipeline table shows, not just
          // the seven summary fields this table displays.
          raw: sme,
          smseName: sme.name,
          fundingRequired: sme.fundingRequired,
          equityOffered: sme.equityOffered || sme.investmentType || "N/A",
          startDate: sme.applicationDate,
          sector: sme.sector,
          location: sme.location,
          currentStatus: stage?.name || sme.currentStatus,
          statusGroup: stage?.group,
          supportRequired: sme.supportRequired,
        };
      }),
    [smeMatches, activeDealIds, activeStages]
  );

  // Parent filters, applied to partner lists.
  const applyPartnerFilters = (list) =>
    list.filter((item) => {
      if (filters.location) {
        const loc = (item.location || "").toLowerCase();
        if (!loc.includes(filters.location.toLowerCase()) && loc !== "national") return false;
      }
      if (filters.matchScore && (item.matchPercentage || 0) < filters.matchScore) return false;
      if (filters.sectors?.length > 0) {
        const hit = (item.sectors || []).some((sec) => filters.sectors.some((f) => f.toLowerCase() === sec.toLowerCase()));
        if (!hit) return false;
      }
      return true;
    });

  const filteredFunders = useMemo(() => applyPartnerFilters(funderMatches), [funderMatches, filters]);
  const filteredCatalysts = useMemo(() => applyPartnerFilters(catalystMatches), [catalystMatches, filters]);

  const TABS = [
    { id: "businesses", label: "Businesses", icon: <Users size={16} />, count: pipelineMatches.length },
    { id: "funders", label: "Funders", icon: <Building size={16} />, count: filteredFunders.length },
    { id: "catalysts", label: "Catalysts", icon: <Award size={16} />, count: filteredCatalysts.length },
  ];

  const openDeal = (row) => setSelectedSME(row?.raw || row);

  const ViewButton = ({ onClick }) => (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white hover:shadow-md hover:brightness-105 transition-all"
      style={{ backgroundColor: "#7d5a50" }}>
      <Eye size={13} /> View
    </button>
  );

  return (
    <div className="w-full font-sans">
      {/* Tabs. The old version mutated e.target.style on hover, which broke
          whenever the pointer landed on the icon or count badge instead of the
          button — leaving tabs stuck in their hover colour. */}
      <div className="flex gap-2 p-2 bg-gradient-to-r from-[#f5f0e1] to-[#faf7f2] rounded-t-2xl border border-[#e6d7c3] border-b-0 shadow-sm overflow-x-auto">
        {TABS.map(({ id, label, icon, count }) => {
          const isActive = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                isActive ? "bg-gradient-to-r from-[#7d5a50] to-[#4a352f] text-white shadow-md" : "text-[#7d5a50] hover:bg-white/70"
              }`}>
              {icon}{label}
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isActive ? "bg-white/20 text-white" : "bg-[#7d5a50]/10 text-[#4a352f]"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-b-2xl border border-[#e6d7c3] border-t-0 shadow-lg min-h-[500px]">
        {/* Businesses */}
        {activeTab === "businesses" && (
          <>
            <div className="flex border-b border-[#e6d7c3] px-6 pt-4 bg-[#faf7f2]/60 gap-1 overflow-x-auto">
              {[["pipeline", "Pipeline Matches", pipelineMatches.length], ["active", "Active Deals", activeDeals.length]].map(([id, label, count]) => (
                <button key={id} onClick={() => setBusinessSubTab(id)}
                  className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                    businessSubTab === id ? "border-[#7d5a50] text-[#4a352f]" : "border-transparent text-[#a89482] hover:text-[#7d5a50]"
                  }`}>
                  {label} <span className="text-[#a89482] font-normal">({count})</span>
                </button>
              ))}
            </div>

            {businessSubTab === "pipeline" ? (
              <CMFSMETable
                filters={filters}
                stageFilter={stageFilter}
                smeMatches={pipelineMatches}
                loading={loading}
                onUpdateStage={onUpdateStage}
                onStageOverride={onStageOverride}
              />
            ) : (
              <div className="p-6">
                <CMFDataTable
                  storageKey="cmf-active-deals"
                  rows={activeDeals}
                  loading={loading}
                  exportName="active-deals"
                  exportSheet="Active Deals"
                  defaultSort={{ key: "startDate", direction: "desc" }}
                  toolbarBadge={{ icon: <Trophy size={12} />, label: `${activeDeals.length} active deal${activeDeals.length === 1 ? "" : "s"}` }}
                  primary={{
                    key: "smseName", label: "Business Name", width: 216, onView: openDeal,
                    tooltip: "The business this deal belongs to. Click the eye to open the full deal record.",
                  }}
                  emptyState={{
                    icon: <Trophy size={32} className="text-[#7d5a50] opacity-50" />,
                    title: "No Active Deals Yet",
                    description: "Businesses appear here once they reach the Active or Completed stage.",
                  }}
                  columns={[
                    { key: "fundingRequired", label: "Funding", width: 148, filter: "text", priority: 1,
                      tooltip: "The support amount agreed or requested for this deal." },
                    { key: "equityOffered", label: "Instrument", width: 152, filter: "select", type: "badge", priority: 2,
                      tooltip: "The form the support takes — grant, equity, loan, in-kind and so on." },
                    { key: "startDate", label: "Start Date", width: 150, filter: "date", type: "date", priority: 3,
                      tooltip: "When the business entered the programme. Sorting and filtering use the real date, not the formatted label." },
                    { key: "currentStatus", label: "Status", width: 154, filter: "select", type: "status", priority: 1,
                      tooltip: "Where this deal stands — Active while it's running, Completed once the business has graduated.",
                      statusColor: (v, row) => getStageColors(row.statusGroup).color },
                    { key: "sector", label: "Sector", width: 146, filter: "select", priority: 3,
                      tooltip: "The industry the business operates in." },
                    { key: "location", label: "Location", width: 140, filter: "text", priority: 4,
                      tooltip: "Where the business is based." },
                    { key: "supportRequired", label: "Support Required", width: 172, filter: "text", defaultVisible: false, sortable: false, priority: 4,
                      tooltip: "The kind of help this business asked for when it applied." },
                  ]}
                  actions={(row) => <ViewButton onClick={() => openDeal(row)} />}
                />
              </div>
            )}
          </>
        )}

        {/* Funders */}
        {activeTab === "funders" && (
          <div className="p-6">
            <CMFDataTable
              storageKey="cmf-funders"
              rows={filteredFunders}
              loading={loading}
              exportName="funder-matches"
              exportSheet="Funders"
              defaultSort={{ key: "matchPercentage", direction: "desc" }}
              toolbarBadge={{ icon: <Building size={12} />, label: `${filteredFunders.length} of ${funderMatches.length} matched` }}
              primary={{
                key: "name", label: "Funder Name", width: 220, onView: (row) => setSelectedFunder(row), subtitle: (row) => row.type,
                tooltip: "The funding organisation, with its type underneath. Click the eye to open its full profile.",
              }}
              emptyState={{
                icon: <Building size={32} className="text-[#7d5a50] opacity-50" />,
                title: "No Matched Funders",
                description: "Funders matching your businesses' criteria will appear here.",
              }}
              columns={[
                { key: "matchPercentage", label: "Match Fit", width: 152, align: "center", filter: "range", type: "match", priority: 1,
                  tooltip: "How closely this funder's mandate aligns with the businesses in your portfolio — stage, ticket size, geography and sector." },
                { key: "type", label: "Funder Type", width: 150, filter: "select", priority: 2,
                  tooltip: "What kind of funder this is — DFI, bank, VC, angel, corporate ESD and so on." },
                { key: "fundingRange", label: "Ticket Size", width: 154, filter: "text", priority: 2,
                  tooltip: "The band between the smallest and largest amount this funder typically deploys." },
                { key: "location", label: "Location Focus", width: 152, filter: "select", priority: 3,
                  tooltip: "Where this funder can deploy capital. Outside it, a business can't be funded even if everything else fits." },
                { key: "sectors", label: "Sector Focus", width: 178, filter: "none", sortable: false, priority: 3,
                  tooltip: "The industries this funder backs. Hover the +N chip to see the rest.",
                  render: (row) => <SectorChips sectors={row.sectors} />, exportValue: (row) => (row.sectors || []).join(", ") },
                { key: "contactPerson", label: "Contact", width: 150, filter: "text", defaultVisible: false, priority: 4,
                  tooltip: "The named person to approach at this organisation." },
                { key: "email", label: "Email", width: 180, filter: "text", defaultVisible: false, priority: 4,
                  tooltip: "The contact address for enquiries and submissions." },
                { key: "bigScore", label: "BIG Score", width: 148, align: "center", filter: "range", type: "bigScore", priority: 3, defaultVisible: false,
                  tooltip: "The Business Integrity & Growth compliance score." },
              ]}
              actions={(row) => <ViewButton onClick={() => setSelectedFunder(row)} />}
            />
          </div>
        )}

        {/* Catalysts */}
        {activeTab === "catalysts" && (
          <div className="p-6">
            <CMFDataTable
              storageKey="cmf-catalysts"
              rows={filteredCatalysts}
              loading={loading}
              exportName="catalyst-matches"
              exportSheet="Catalysts"
              defaultSort={{ key: "matchPercentage", direction: "desc" }}
              toolbarBadge={{ icon: <Award size={12} />, label: `${filteredCatalysts.length} of ${catalystMatches.length} matched` }}
              primary={{
                key: "name", label: "Organization", width: 220, onView: (row) => setSelectedCatalyst(row), subtitle: (row) => row.type,
                tooltip: "The organisation running the support programme, with its type underneath. Click the eye to open its full profile.",
              }}
              emptyState={{
                icon: <Award size={32} className="text-[#7d5a50] opacity-50" />,
                title: "No Matched Catalysts",
                description: "Catalysts matching your businesses' support needs will appear here.",
              }}
              columns={[
                { key: "matchPercentage", label: "Match Fit", width: 152, align: "center", filter: "range", type: "match", priority: 1,
                  tooltip: "How closely this catalyst's support offering aligns with the businesses in your portfolio." },
                { key: "type", label: "Catalyst Type", width: 154, filter: "select", priority: 2,
                  tooltip: "What kind of organisation this is — accelerator, incubator, ESD programme, supplier development and so on." },
                { key: "focus", label: "Support Focus", width: 160, filter: "select", priority: 2,
                  tooltip: "The kind of help offered — funding, market access, mentoring, technical support, training or incubation." },
                { key: "location", label: "Location Focus", width: 152, filter: "select", priority: 3,
                  tooltip: "Where this catalyst operates. Outside it, a business can't be admitted even if everything else fits." },
                { key: "sectors", label: "Sector Focus", width: 178, filter: "none", sortable: false, priority: 3,
                  tooltip: "The industries this catalyst accepts businesses from. Hover the +N chip to see the rest.",
                  render: (row) => <SectorChips sectors={row.sectors} />, exportValue: (row) => (row.sectors || []).join(", ") },
                { key: "contactPerson", label: "Contact", width: 150, filter: "text", defaultVisible: false, priority: 4,
                  tooltip: "The named person to approach at this organisation." },
                { key: "email", label: "Email", width: 180, filter: "text", defaultVisible: false, priority: 4,
                  tooltip: "The contact address for enquiries and applications." },
                { key: "bigScore", label: "BIG Score", width: 148, align: "center", filter: "range", type: "bigScore", priority: 3, defaultVisible: false,
                  tooltip: "The Business Integrity & Growth compliance score." },
              ]}
              actions={(row) => <ViewButton onClick={() => setSelectedCatalyst(row)} />}
            />
          </div>
        )}
      </div>

      <CMFCatalystDetailsModal
        catalyst={selectedCatalyst}
        isOpen={!!selectedCatalyst}
        onClose={() => setSelectedCatalyst(null)}
      />

      <CMFFunderDetailsModal
        funder={selectedFunder}
        isOpen={!!selectedFunder}
        onClose={() => setSelectedFunder(null)}
      />

      <CMFSMEDetailsModal
        sme={selectedSME}
        isOpen={!!selectedSME}
        onClose={() => setSelectedSME(null)}
      />
    </div>
  );
}