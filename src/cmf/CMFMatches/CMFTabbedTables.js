"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Users, Trophy, Eye, X, Info, Calendar, ChevronDown, Download, Plus,
  Trash2, Settings, RotateCcw, SlidersHorizontal, LayoutGrid, GripVertical,
  CheckCircle, ArrowUp, ArrowDown, Building, Award
} from "lucide-react";
import * as XLSX from "xlsx";
import CMFSMETable from "./CMFSMETable";
import { mapStatusToStageId, getActiveStages, getStageColors } from "./cmfStageConfig";

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

// Renders straight to <body> so `position: fixed` popups can't be trapped by an
// ancestor that establishes a containing block.
const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
};

const HeaderInfoTooltip = ({ text }) => {
  const [rect, setRect] = useState(null);
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
  comfortable: { cell: "py-3 px-3", fontSize: "text-sm", avatar: "w-8 h-8" },
  compact: { cell: "py-2 px-2", fontSize: "text-xs", avatar: "w-7 h-7" },
  "ultra-compact": { cell: "py-1.5 px-1.5", fontSize: "text-xs", avatar: "w-6 h-6" },
};

const generateViewId = () => {
  try { return `view_${crypto.randomUUID()}`; }
  catch { return `view_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
};

// ─────────────────────────────────────────────────────────────────────────────
// CMFDataTable — the standard table, used by all three lists in this file
// (Active Deals, Funders, Catalysts). Same behaviour as the pipeline table:
// saved Views, column chooser, drag-to-reorder headers, click-to-sort,
// per-column filters, density, Excel export, pagination, sticky name column.
//
// Columns: { key, label, minWidth, filter: text|select|range|date|none,
//            type: text|date|badge|status|match, sortKey, tooltip,
//            defaultVisible, render(row), badgeColor(v), statusColor(v) }
// ─────────────────────────────────────────────────────────────────────────────
const CMFDataTable = ({
  storageKey, rows = [], loading = false, columns = [],
  primary, actions,
  exportName = "export", exportSheet = "Data", emptyState = {},
  toolbarBadge, defaultSort = { key: null, direction: "desc" },
}) => {
  const BUILTIN_VIEW_ID = "__default__";
  const VIEWS_KEY = `${storageKey}-views-v1`;
  const COLUMN_DEFS = useMemo(() => Object.fromEntries(columns.map((c) => [c.key, c])), [columns]);
  const DEFAULT_ORDER = useMemo(() => columns.map((c) => c.key), [columns]);
  const DEFAULT_VISIBILITY = useMemo(
    () => columns.reduce((acc, c) => ({ ...acc, [c.key]: c.defaultVisible !== false }), {}),
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
    sortConfig: { ...defaultSort },
    density: "comfortable",
    columnWidths: {},
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
          sortConfig: v?.sortConfig || { ...defaultSort },
          density: v?.density || "comfortable",
          columnWidths: v?.columnWidths || {},
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
  const [sortConfig, setSortConfig] = useState(initial.sortConfig);
  const [density, setDensity] = useState(initial.density);
  const [columnWidths, setColumnWidths] = useState(initial.columnWidths || {});

  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [chooserRect, setChooserRect] = useState(null);
  const [showNewViewForm, setShowNewViewForm] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [newViewDescription, setNewViewDescription] = useState("");
  const [editingViewMeta, setEditingViewMeta] = useState(null);

  const [headerFilterOpen, setHeaderFilterOpen] = useState(null);
  const [filters, setFilters] = useState({});
  const [notification, setNotification] = useState(null);
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

  // Auto-save layout edits into the active view.
  useEffect(() => {
    setViewsState((prev) => {
      const current = prev.views[prev.activeViewId];
      if (!current) return prev;
      const next = { ...prev, views: { ...prev.views, [prev.activeViewId]: { ...current, columnVisibility, columnOrder, sortConfig, density, columnWidths } } };
      persist(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibility, columnOrder, sortConfig, density, columnWidths]);

  const switchToView = (id) => {
    const target = viewsState.views[id];
    if (!target) return;
    setViewsState((prev) => { const next = { ...prev, activeViewId: id }; persist(next); return next; });
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
      setSortConfig(def.sortConfig); setDensity(def.density); setColumnWidths(def.columnWidths || {});
    }
    setNotification({ type: "success", message: "View deleted" });
  };

  const resetActiveView = () => {
    const layout = defaultLayout();
    setColumnVisibility(layout.columnVisibility); setColumnOrder(layout.columnOrder);
    setSortConfig(layout.sortConfig); setDensity(layout.density); setColumnWidths(layout.columnWidths || {});
    setNotification({ type: "success", message: `"${activeView.name}" reset to factory defaults` });
  };

  const valueOf = (row, col) => (col.getValue ? col.getValue(row) : row?.[col.key]);
  const primaryValue = (row) => (primary?.getValue ? primary.getValue(row) : row?.[primary?.key]);

  // ─── Filter / sort ──────────────────────────────────────────────────────
  const processed = useMemo(() => {
    let result = [...rows];


    if (filters.__name__?.trim()) {
      const q = filters.__name__.toLowerCase().trim();
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
      const isName = sortConfig.key === "__name__";
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
    let n = filters.__name__?.trim() ? 1 : 0;
    columns.forEach((col) => {
      const v = filters[col.key];
      if (v == null) return;
      if (Array.isArray(v)) { if (v.some((x) => x != null && x !== "")) n += 1; }
      else if (v.toString().trim()) n += 1;
    });
    return n;
  }, [filters, columns]);

  const selectOptions = (col) =>
    col.options || [...new Set(rows.map((r) => (valueOf(r, col) ?? "").toString()).filter((v) => v && v !== "N/A"))].sort();

  const toggleSort = (key) => {
    setSortConfig((prev) => {
      if (prev?.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "desc" };
    });
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

  const SortIndicator = ({ colKey }) =>
    sortConfig?.key !== colKey ? null :
      sortConfig.direction === "asc"
        ? <ArrowUp size={10} className="flex-shrink-0 text-[#e6d7c3]" />
        : <ArrowDown size={10} className="flex-shrink-0 text-[#e6d7c3]" />;

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

  const renderCell = (row, col) => {
    const value = valueOf(row, col);
    if (col.render) return col.render(row, value);
    switch (col.type) {
      case "match": {
        const score = Number(value) || 0;
        const label = getMatchLabel(score);
        return (
          <div className="flex flex-col items-center gap-1 w-full max-w-[92px] mx-auto">
            <span className={`${ds.fontSize} text-[#4a352f]`}>{score}%</span>
            <span className="text-xs font-medium" style={{ color: label.color }}>{label.label}</span>
            <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: label.color }} />
            </div>
          </div>
        );
      }
      case "status": {
        const color = col.statusColor?.(value, row) || "#7d5a50";
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
            style={{ backgroundColor: `${color}18`, color, borderColor: `${color}40` }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />{value || "—"}
          </span>
        );
      }
      case "badge":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#f5f0e1] text-[#4a352f]">{value || "—"}</span>;
      case "date":
        return <div className="flex items-center gap-1.5"><Calendar size={14} className="text-[#7d5a50]" />{formatDate(value)}</div>;
      default:
        return <span className="line-clamp-2">{value ?? "—"}</span>;
    }
  };

  const visibleColumns = columnOrder.filter((k) => columnVisibility[k] && COLUMN_DEFS[k]);

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
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Hide/Unhide</h4>
                      <p className="text-xs text-[#a89482] mb-3 flex items-center gap-1.5">
                        <GripVertical size={12} className="flex-shrink-0" /> Tip: drag a column header to reorder it, or click its label to sort.
                      </p>
                      <label className="flex items-center gap-3 py-2 px-2 rounded-lg opacity-75">
                        <input type="checkbox" checked readOnly disabled className="rounded border-[#c8b6a6]" />
                        <span className="text-sm text-[#4a352f]">{primary?.label || "Name"}</span>
                      </label>
                      {columns.map((col) => (
                        <label key={col.key} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#faf7f2] cursor-pointer">
                          <input type="checkbox" checked={columnVisibility[col.key] || false}
                            onChange={() => setColumnVisibility((p) => ({ ...p, [col.key]: !p[col.key] }))}
                            className="rounded border-[#c8b6a6] text-[#7d5a50]" />
                          <span className="text-sm text-[#4a352f]">{col.label}</span>
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
              title="Export the current filtered/sorted rows to Excel (.xlsx)">
              <Download size={16} /> Export to Excel
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e6d7c3] shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8"><div className="space-y-4">{[...Array(6)].map((_, i) => (<div key={i} className="h-10 bg-[#f5f0e1] rounded-lg animate-pulse" />))}</div></div>
        ) : (
          <>
            <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
              <style>{`
                .cmt-th { color: #faf7f2 !important; line-height: 1.1; font-size: 0.75rem !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; font-family: inherit !important; vertical-align: top !important; }
                .cmt-th-draggable { cursor: grab; }
                .cmt-th-draggable:active { cursor: grabbing; }
                /* Wrap header labels onto at most 2 lines rather than forcing
                   the column wider. Only lays out cleanly because each column
                   carries a real min-width. */
                .cmt-th-label { flex: 1 1 auto; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; overflow-wrap: break-word; line-height: 1.2; text-align: left; }
                /* Column resizing: an explicit header width only holds if the
                   cells below can shrink, so long values wrap rather than
                   forcing the column wider than the width that was dragged. */
                .bigt-fit th, .bigt-fit td { overflow: hidden; }
                .bigt-fit td { word-break: break-word; }
              `}</style>
              <table className="border-collapse bigt-fit" style={{ tableLayout: "auto" }}>
                <thead>
                  <tr className="bg-[#4a352f]">
                    <th className="cmt-th py-3 px-3 relative border-r border-[#e6d7c3] sticky top-0 left-0 z-30"
                      style={{ backgroundColor: "#4a352f", ...widthStyle("__name__", "180px", "210px") }}>
                      <div className="flex items-start gap-1 min-w-0">
                        <button onClick={() => toggleSort("__name__")} className="cmt-th-label hover:text-white transition-colors">{primary?.label || "Name"}</button>
                        <SortIndicator colKey="__name__" />
                        <FilterTrigger colKey="__name__" />
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
                          className={`cmt-th cmt-th-draggable py-3 px-3 relative border-r border-[#e6d7c3] sticky top-0 z-20 select-none transition-opacity ${draggedColumn === key ? "opacity-40" : ""}`}
                          style={{ ...widthStyle(key, col.minWidth || "100px"), backgroundColor: dragOverColumn === key && draggedColumn !== key ? "#5a423b" : "#4a352f" }}>
                          <div className={`flex items-start gap-1 min-w-0 ${col.align === "center" ? "justify-center" : ""}`}>
                            <GripVertical size={11} className="opacity-40 flex-shrink-0 mt-0.5" />
                            <button onClick={() => toggleSort(key)} className="cmt-th-label hover:text-white transition-colors">{col.label}</button>
                            <SortIndicator colKey={key} />
                            {col.filter !== "none" && <FilterTrigger colKey={key} />}
                            {col.tooltip && <HeaderInfoTooltip text={col.tooltip} />}
                          </div>
                          <ColumnResizer colKey={key} />
                        </th>
                      );
                    })}

                    {actions && (
                      <th className="cmt-th py-3 px-3 relative text-center whitespace-nowrap sticky top-0 z-20" style={{ minWidth: "110px", backgroundColor: "#4a352f" }}>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={visibleColumns.length + (actions ? 2 : 1)} className="text-center py-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-[#f5f0e1] flex items-center justify-center">
                          {emptyState.icon || <Users size={32} className="text-[#7d5a50] opacity-50" />}
                        </div>
                        <p className="text-lg font-semibold text-[#4a352f]">{emptyState.title || "Nothing here yet"}</p>
                        <p className="text-sm text-[#7d5a50] max-w-sm">
                          {activeFilterCount > 0 ? "Clear a filter to widen the list." : emptyState.description}
                        </p>
                      </div>
                    </td></tr>
                  ) : (
                    paginated.map((row, i) => {
                      const rowId = row.id ?? i;
                      return (
                        <tr key={rowId} className="border-b border-[#f0e6d9] transition-all"
                          style={{ backgroundColor: hoveredRow === rowId ? "#fdf8f4" : undefined }}
                          onMouseEnter={() => setHoveredRow(rowId)} onMouseLeave={() => setHoveredRow(null)}>
                          <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f] sticky left-0 border-r border-b border-[#e6d7c3] z-10 transition-colors`}
                            style={{ ...widthStyle("__name__", "180px", "210px"), backgroundColor: hoveredRow === rowId ? "#fdf8f4" : "#ffffff" }}>
                            <div className="flex items-start gap-2">
                              <div className={`${ds.avatar} rounded-full bg-gradient-to-br from-[#7d5a50] to-[#4a352f] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5`}>
                                {(primaryValue(row) || "?").toString().charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-1.5 flex-wrap">
                                  <span className={`${ds.fontSize} leading-snug text-[#4a352f]`}>{primaryValue(row)}</span>
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

                          {visibleColumns.map((key) => {
                            const col = COLUMN_DEFS[key];
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3] ${col.align === "center" ? "text-center" : ""}`}>
                                {renderCell(row, col)}
                              </td>
                            );
                          })}

                          {actions && (
                            <td className={`${ds.cell} text-center`} style={{ minWidth: "110px" }}>
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

      {dragHintRect && !draggedColumn && (
        <PopupPortal>
          <div className="fixed z-[1200] bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none normal-case font-normal flex items-center gap-1.5"
            style={{ top: dragHintRect.bottom + 8, left: Math.min(Math.max(dragHintRect.left, 12), window.innerWidth - 220), width: "205px" }}>
            <GripVertical size={12} className="flex-shrink-0" /> Drag to reorder · click to sort
          </div>
        </PopupPortal>
      )}

      {headerFilterOpen && (() => {
        const key = headerFilterOpen.key;
        const isName = key === "__name__";
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
              style={{ top: headerFilterOpen.rect.bottom + 8, left: Math.min(Math.max(headerFilterOpen.rect.left - 20, 12), window.innerWidth - 292), width: "280px" }}>
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
                <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
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

// ─── Partner details modal ────────────────────────────────────────────────────
const PartnerDetailsModal = ({ partner, type, onClose }) => {
  if (!partner) return null;
  const label = getMatchLabel(partner.matchPercentage);
  return (
    <PopupPortal>
      <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#4a352f]/40 backdrop-blur-sm font-sans p-4" onClick={onClose}>
        <div className="bg-white rounded-3xl shadow-2xl border border-[#e6d7c3] w-[600px] max-w-full max-h-[86vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-5 text-white sticky top-0 z-10 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">{type === "funder" ? "Funder" : "Catalyst"}</p>
              <h3 className="text-lg font-bold mt-0.5 truncate">{partner.name}</h3>
              <p className="text-xs text-[#e6d7c3] mt-0.5">{partner.type}</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1 flex-shrink-0"><X size={20} /></button>
          </div>

          <div className="p-6 space-y-6">
            <div className="px-4 py-3 rounded-xl bg-[#faf7f2] border border-[#e6d7c3]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold">Match fit</span>
                <span className="text-sm font-bold" style={{ color: label.color }}>{partner.matchPercentage}% · {label.label}</span>
              </div>
              <div className="w-full h-2 bg-[#e6d7c3] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${partner.matchPercentage}%`, backgroundColor: label.color }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                [type === "funder" ? "Funding range" : "Support focus", type === "funder" ? partner.fundingRange : partner.focus],
                ["Location focus", partner.location],
                ["Contact person", partner.contactPerson],
                ["Email", partner.email],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-1">{l}</p>
                  <p className="text-sm text-[#4a352f] break-words">{v || "N/A"}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-2">Sector focus</p>
              <div className="flex flex-wrap gap-1.5">
                {(partner.sectors || []).map((s) => (
                  <span key={s} className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#f5f0e1] text-[#4a352f]">{s}</span>
                ))}
                {(partner.sectors || []).length === 0 && <span className="text-sm text-[#a89482]">Not specified</span>}
              </div>
            </div>

            <div className="px-4 py-3 rounded-xl bg-[#faf7f2] border border-[#e6d7c3]">
              <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-1">About</p>
              <p className="text-sm text-[#4a352f] leading-relaxed">{partner.description || "No description provided."}</p>
            </div>
          </div>
        </div>
      </div>
    </PopupPortal>
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
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [partnerType, setPartnerType] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);

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

  const openPartner = (partner, type) => { setSelectedPartner(partner); setPartnerType(type); };

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
                  primary={{ key: "smseName", label: "Business Name", onView: setSelectedDeal }}
                  emptyState={{
                    icon: <Trophy size={32} className="text-[#7d5a50] opacity-50" />,
                    title: "No Active Deals Yet",
                    description: "Businesses appear here once they reach the Active or Completed stage.",
                  }}
                  columns={[
                    { key: "fundingRequired", label: "Funding", minWidth: "104px", filter: "text" },
                    { key: "equityOffered", label: "Instrument", minWidth: "104px", filter: "select", type: "badge" },
                    { key: "startDate", label: "Start Date", minWidth: "112px", filter: "date", type: "date" },
                    { key: "currentStatus", label: "Status", minWidth: "116px", filter: "select", type: "status",
                      statusColor: (v, row) => getStageColors(row.statusGroup).color },
                    { key: "sector", label: "Sector", minWidth: "110px", filter: "select" },
                    { key: "location", label: "Location", minWidth: "104px", filter: "text" },
                    { key: "supportRequired", label: "Support Required", minWidth: "130px", filter: "text", defaultVisible: false },
                  ]}
                  actions={(row) => <ViewButton onClick={() => setSelectedDeal(row)} />}
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
              primary={{ key: "name", label: "Funder Name", onView: (row) => openPartner(row, "funder"), subtitle: (row) => row.type }}
              emptyState={{
                icon: <Building size={32} className="text-[#7d5a50] opacity-50" />,
                title: "No Matched Funders",
                description: "Funders matching your businesses' criteria will appear here.",
              }}
              columns={[
                { key: "matchPercentage", label: "Match Fit", minWidth: "112px", align: "center", filter: "range", type: "match",
                  tooltip: "How closely this funder's mandate aligns with the businesses in your portfolio." },
                { key: "type", label: "Funder Type", minWidth: "116px", filter: "select" },
                { key: "fundingRange", label: "Ticket Size", minWidth: "124px", filter: "text" },
                { key: "location", label: "Location Focus", minWidth: "116px", filter: "select" },
                { key: "sectors", label: "Sector Focus", minWidth: "150px", filter: "none", sortable: false,
                  render: (row) => <SectorChips sectors={row.sectors} />, exportValue: (row) => (row.sectors || []).join(", ") },
                { key: "contactPerson", label: "Contact", minWidth: "116px", filter: "text", defaultVisible: false },
                { key: "email", label: "Email", minWidth: "150px", filter: "text", defaultVisible: false },
              ]}
              actions={(row) => <ViewButton onClick={() => openPartner(row, "funder")} />}
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
              primary={{ key: "name", label: "Organization", onView: (row) => openPartner(row, "catalyst"), subtitle: (row) => row.type }}
              emptyState={{
                icon: <Award size={32} className="text-[#7d5a50] opacity-50" />,
                title: "No Matched Catalysts",
                description: "Catalysts matching your businesses' support needs will appear here.",
              }}
              columns={[
                { key: "matchPercentage", label: "Match Fit", minWidth: "112px", align: "center", filter: "range", type: "match",
                  tooltip: "How closely this catalyst's support offering aligns with the businesses in your portfolio." },
                { key: "type", label: "Catalyst Type", minWidth: "120px", filter: "select" },
                { key: "focus", label: "Support Focus", minWidth: "130px", filter: "select" },
                { key: "location", label: "Location Focus", minWidth: "116px", filter: "select" },
                { key: "sectors", label: "Sector Focus", minWidth: "150px", filter: "none", sortable: false,
                  render: (row) => <SectorChips sectors={row.sectors} />, exportValue: (row) => (row.sectors || []).join(", ") },
                { key: "contactPerson", label: "Contact", minWidth: "116px", filter: "text", defaultVisible: false },
                { key: "email", label: "Email", minWidth: "150px", filter: "text", defaultVisible: false },
              ]}
              actions={(row) => <ViewButton onClick={() => openPartner(row, "catalyst")} />}
            />
          </div>
        )}
      </div>

      {selectedPartner && (
        <PartnerDetailsModal partner={selectedPartner} type={partnerType} onClose={() => { setSelectedPartner(null); setPartnerType(null); }} />
      )}

      {selectedDeal && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#4a352f]/40 backdrop-blur-sm font-sans p-4" onClick={() => setSelectedDeal(null)}>
            <div className="bg-white rounded-3xl shadow-2xl border border-[#e6d7c3] w-[560px] max-w-full max-h-[86vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-5 text-white sticky top-0 z-10 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Active Deal</p>
                  <h3 className="text-lg font-bold mt-0.5 truncate">{selectedDeal.smseName}</h3>
                  <p className="text-xs text-[#e6d7c3] mt-0.5">{selectedDeal.sector} · {selectedDeal.location}</p>
                </div>
                <button onClick={() => setSelectedDeal(null)} className="text-white/70 hover:text-white p-1 flex-shrink-0"><X size={20} /></button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-4">
                {[
                  ["Funding", selectedDeal.fundingRequired],
                  ["Instrument", selectedDeal.equityOffered],
                  ["Start date", formatDate(selectedDeal.startDate)],
                  ["Status", selectedDeal.currentStatus],
                  ["Sector", selectedDeal.sector],
                  ["Location", selectedDeal.location],
                  ["Support required", selectedDeal.supportRequired],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[11px] uppercase tracking-wide text-[#a89482] font-semibold mb-1">{label}</p>
                    <p className="text-sm text-[#4a352f]">{value || "N/A"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PopupPortal>
      )}
    </div>
  );
}