"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FaChevronLeft, FaChevronRight, FaEdit, FaSave, FaTimes, FaPlus, FaTrash,
  FaCalendarAlt, FaClock, FaUsers, FaSyncAlt, FaMapMarkerAlt, FaClipboardList,
  FaChartLine, FaTasks, FaRegStar, FaExclamationTriangle, FaShieldAlt, FaBell,
  FaCheckCircle, FaInfoCircle, FaTimesCircle, FaFolderOpen, FaLayerGroup,
  FaExternalLinkAlt, FaFileAlt, FaBullseye, FaSearch, FaSort, FaSortUp, FaSortDown,
  FaChevronDown, FaChevronUp, FaArchive, FaBoxOpen, FaUndo, FaRegSquare,
} from "react-icons/fa";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useLocation, useNavigate } from "react-router-dom";

const functions = getFunctions();

/* ════════════════════════════════════════════════════════════════════════════
   Categories — the same vocabulary Integrated Actions uses, so a category set
   here reads identically there. "Overall Company Health" is gone; "General" is
   the catch-all, and users can add their own.
   ════════════════════════════════════════════════════════════════════════ */
const RAPS_CATEGORIES = [
  { name: "Strategy & Execution", color: "#2196F3", bg: "#E3F2FD" },
  { name: "Financial Performance", color: "#FF9800", bg: "#FFF3E0" },
  { name: "Operational Performance", color: "#9C27B0", bg: "#F3E5F5" },
  { name: "People", color: "#FF5722", bg: "#FBE9E7" },
  { name: "ESG Impact", color: "#8BC34A", bg: "#F1F8E9" },
  { name: "Marketing & Sales", color: "#E91E63", bg: "#FCE4EC" },
  { name: "General", color: "#607D8B", bg: "#ECEFF1" },
];

const DEPARTMENT_OPTIONS = [
  { name: "Marketing", color: "#E91E63", bg: "#FCE4EC" },
  { name: "Finance", color: "#FF9800", bg: "#FFF3E0" },
  { name: "Operations", color: "#9C27B0", bg: "#F3E5F5" },
  { name: "Human Resources", color: "#FF5722", bg: "#FBE9E7" },
  { name: "Sales", color: "#4CAF50", bg: "#E8F5E9" },
  { name: "Information Technology", color: "#2196F3", bg: "#E3F2FD" },
  { name: "Legal", color: "#795548", bg: "#EFEBE9" },
  { name: "Research & Development", color: "#607D8B", bg: "#ECEFF1" },
  { name: "Customer Support", color: "#009688", bg: "#E0F2F1" },
  { name: "Product", color: "#3F51B5", bg: "#E8EAF6" },
];

const ACTION_STATUSES = ["Not Done", "In Progress", "Done"];

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const formatDMY = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};
const toInputDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
};
const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};
const errText = (err) => String(err?.message ?? err ?? "Unknown error");

/* Prefers the next instance still ahead — a recurring meeting's first
   instance is often months in the past. */
const getMeetingDate = (meeting) => {
  const dates = (meeting?.instances || [])
    .map((i) => new Date(i.date))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a - b);
  if (dates.length === 0) return null;
  const now = new Date();
  return (dates.find((d) => d >= now) || dates[dates.length - 1]).toISOString();
};
const dueDateColor = (dueDate) => {
  if (!dueDate) return "#8d6e63";
  const diff = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
  if (diff < 0) return "#f44336";
  if (diff <= 3) return "#ff9800";
  if (diff <= 7) return "#ffc107";
  return "#4caf50";
};
const isOverdue = (a) =>
  !!a.dueDate && a.status !== "Done" && a.status !== "completed" && new Date(a.dueDate) < new Date();

const statusBadge = (status) => {
  const map = {
    "Not Done": { bg: "#FFEBEE", color: "#C62828" },
    "In Progress": { bg: "#FFF3E0", color: "#E65100" },
    Done: { bg: "#E8F5E9", color: "#2E7D32" },
  };
  const s = map[status] || map["Not Done"];
  return (
    <span style={{ backgroundColor: s.bg, color: s.color, padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" }}>
      {status || "Not Done"}
    </span>
  );
};

/* ─── Calendar picker used by the date column filters ───────────────────── */
const CalendarPicker = ({ onSelect, onClose, noDateLabel }) => {
  const [current, setCurrent] = useState(new Date());
  const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
  const firstDay = new Date(current.getFullYear(), current.getMonth(), 1).getDay();
  const today = new Date();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <div onClick={(e) => e.stopPropagation()} style={{
      position: "absolute", top: "100%", left: 0, marginTop: "4px", backgroundColor: "white",
      border: "2px solid #e8ddd4", borderRadius: "8px", padding: "14px", zIndex: 400,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)", width: "260px",
      textTransform: "none", letterSpacing: "normal", fontWeight: 400,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <button onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#5d4037" }}>
          <FaChevronLeft size={11} />
        </button>
        <span style={{ fontWeight: 600, color: "#5d4037", fontSize: "13px" }}>
          {months[current.getMonth()]} {current.getFullYear()}
        </span>
        <button onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#5d4037" }}>
          <FaChevronRight size={11} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: "10px", fontWeight: 600, color: "#8d6e63" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(current.getFullYear(), current.getMonth(), day);
          const isToday = date.toDateString() === today.toDateString();
          return (
            <div key={day} onClick={() => { onSelect(formatDMY(date.toISOString())); onClose(); }}
              style={{ textAlign: "center", padding: "5px 2px", cursor: "pointer", borderRadius: "4px",
                backgroundColor: isToday ? "#f0e6d9" : "transparent", color: "#4a352f",
                fontWeight: isToday ? 600 : 400, fontSize: "12px" }}>
              {day}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #e8ddd4", display: "flex", gap: "8px" }}>
        <button onClick={() => { onSelect(noDateLabel); onClose(); }}
          style={{ flex: 1, padding: "4px 8px", backgroundColor: "#f5f5f5", border: "1px solid #e8ddd4", borderRadius: "4px", cursor: "pointer", fontSize: "11px", color: "#4a352f" }}>
          {noDateLabel}
        </button>
        <button onClick={() => { onSelect("all"); onClose(); }}
          style={{ flex: 1, padding: "4px 8px", backgroundColor: "#f5f5f5", border: "1px solid #e8ddd4", borderRadius: "4px", cursor: "pointer", fontSize: "11px", color: "#4a352f" }}>
          Clear
        </button>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Meeting Actions table — inline, matching the Integrated Actions layout:
   header filters, sort arrows, resizable columns, clickable stat chips and
   the archive flow. Writes back into meeting.actions, which is the same array
   /raps-actions reads, so nothing needs syncing between the two pages.
   ════════════════════════════════════════════════════════════════════════ */
const ACTION_COLUMNS = [
  { key: "category", label: "Category", width: 165, sortable: true, filter: "list" },
  { key: "title", label: "Action", width: 250, sortable: true, filter: "list" },
  { key: "assignedTo", label: "By Whom", width: 150, sortable: true, filter: "list" },
  { key: "dueDate", label: "By When", width: 130, sortable: true, filter: "date" },
  { key: "revisedDate", label: "Revised Date", width: 130, sortable: true, filter: "date" },
  { key: "status", label: "Status", width: 130, sortable: true, filter: "list" },
];
const ACTIONS_COL_W = 150;
const EMPTY_ACTION_FILTERS = { category: "all", title: "all", assignedTo: "all", dueDate: "all", revisedDate: "all", status: "all" };

const MeetingActionsTable = ({ meeting, categories, onSaveActions, readOnly }) => {
  const actions = useMemo(() => meeting?.actions || [], [meeting]);

  const [scope, setScope] = useState("active");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ ...EMPTY_ACTION_FILTERS });
  const [openFilter, setOpenFilter] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [widths, setWidths] = useState(Object.fromEntries(ACTION_COLUMNS.map((c) => [c.key, c.width])));
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [customCats, setCustomCats] = useState([]);
  const [showCustomCat, setShowCustomCat] = useState(false);
  const [customCatName, setCustomCatName] = useState("");
  const resizing = useRef(null);

  const meetingCategory = meeting?.category || meeting?.department || "General";
  const meetingDate = getMeetingDate(meeting);
  const participants = meeting?.participants || [];
  const showArchived = scope === "archived";

  const [form, setForm] = useState({
    title: "", description: "", category: meetingCategory,
    assignedTo: "", dueDate: toInputDate(meetingDate), status: "In Progress",
  });

  const allCategories = useMemo(() => {
    const seen = new Map();
    [...(categories || RAPS_CATEGORIES), ...customCats].forEach((c) => seen.set(c.name, c));
    [meetingCategory, ...actions.map((a) => a.category)].forEach((n) => {
      if (n && !seen.has(n)) seen.set(n, { name: n, color: "#607D8B", bg: "#ECEFF1" });
    });
    return Array.from(seen.values());
  }, [categories, customCats, actions, meetingCategory]);

  const catMeta = (name) => allCategories.find((c) => c.name === name) || { name, color: "#757575", bg: "#EEEEEE" };

  const startResize = (e, key) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX;
    const startWidth = widths[key];
    resizing.current = key;
    const onMove = (ev) => setWidths((p) => ({ ...p, [key]: Math.max(90, startWidth + (ev.clientX - startX)) }));
    const onUp = () => {
      resizing.current = null;
      document.body.style.cursor = ""; document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const stats = useMemo(() => {
    const active = actions.filter((a) => !a.archived);
    return {
      active: active.length,
      done: active.filter((a) => a.status === "Done" || a.status === "completed").length,
      overdue: active.filter(isOverdue).length,
      archived: actions.filter((a) => a.archived).length,
    };
  }, [actions]);

  const scopeRows = useMemo(() => {
    if (scope === "archived") return actions.filter((a) => a.archived);
    const active = actions.filter((a) => !a.archived);
    if (scope === "done") return active.filter((a) => a.status === "Done" || a.status === "completed");
    if (scope === "overdue") return active.filter(isOverdue);
    return active;
  }, [actions, scope]);

  const optionsFor = (key) => {
    const set = new Set();
    scopeRows.forEach((a) => {
      let v = "";
      if (key === "category") v = a.category || meetingCategory;
      else if (key === "title") v = a.title || "Untitled";
      else if (key === "assignedTo") v = a.assignedTo || "Unassigned";
      else if (key === "status") v = a.status || "Not Done";
      if (v) set.add(v);
    });
    return ["all", ...Array.from(set).sort()];
  };

  const rows = useMemo(() => {
    let list = [...scopeRows];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((a) =>
        (a.title || "").toLowerCase().includes(q) ||
        (a.description || "").toLowerCase().includes(q) ||
        (a.assignedTo || "").toLowerCase().includes(q));
    }

    list = list.filter((a) => {
      const cat = a.category || meetingCategory;
      if (filters.category !== "all" && cat !== filters.category) return false;
      if (filters.title !== "all" && (a.title || "Untitled") !== filters.title) return false;
      if (filters.assignedTo !== "all" && (a.assignedTo || "Unassigned") !== filters.assignedTo) return false;
      if (filters.status !== "all" && (a.status || "Not Done") !== filters.status) return false;
      if (filters.dueDate !== "all") {
        if (filters.dueDate === "No Date") { if (a.dueDate) return false; }
        else if (formatDMY(a.dueDate) !== filters.dueDate) return false;
      }
      if (filters.revisedDate !== "all") {
        if (filters.revisedDate === "No Revision") { if (a.revisedDate) return false; }
        else if (formatDMY(a.revisedDate) !== filters.revisedDate) return false;
      }
      return true;
    });

    if (sortConfig.key) {
      const get = (a) => {
        switch (sortConfig.key) {
          case "category": return a.category || meetingCategory;
          case "title": return a.title || "";
          case "assignedTo": return a.assignedTo || "";
          case "dueDate": return a.dueDate || "";
          case "revisedDate": return a.revisedDate || "";
          case "status": return a.status || "";
          default: return "";
        }
      };
      list.sort((a, b) => {
        const av = get(a).toString().toLowerCase();
        const bv = get(b).toString().toLowerCase();
        if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
        if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [scopeRows, search, filters, sortConfig, meetingCategory]);

  const activeFilters = Object.values(filters).filter((v) => v !== "all").length + (search.trim() ? 1 : 0);

  /* Switching scope clears the column filters — the dropdown options come from
     the scope, so a value picked under Active is usually absent from Archived
     and would silently empty the table. */
  const selectScope = (next) => {
    setScope((prev) => (prev === next && next !== "active" ? "active" : next));
    setFilters({ ...EMPTY_ACTION_FILTERS });
    setOpenFilter(null);
  };

  const persist = async (next) => { setBusy(true); await onSaveActions(next); setBusy(false); };

  /* Category and due date come from the meeting; By Whom is limited to its
     participants. All three stay editable. */
  const openAdd = () => {
    setEditing(null); setShowCustomCat(false);
    setForm({
      title: "", description: "", category: meetingCategory,
      assignedTo: "", dueDate: toInputDate(meetingDate), status: "In Progress",
    });
    setShowForm(true);
  };

  const openEdit = (action) => {
    setEditing(action); setShowCustomCat(false);
    setForm({
      title: action.title || "", description: action.description || "",
      category: action.category || meetingCategory,
      assignedTo: action.assignedTo || "", dueDate: action.dueDate || "",
      status: action.status || "In Progress",
    });
    setShowForm(true);
  };

  const addCustomCat = () => {
    const name = customCatName.trim();
    if (!name) return;
    if (!allCategories.some((c) => c.name === name)) setCustomCats((p) => [...p, { name, color: "#607D8B", bg: "#ECEFF1" }]);
    setForm((p) => ({ ...p, category: name }));
    setCustomCatName(""); setShowCustomCat(false);
  };

  const submit = async () => {
    if (!form.title.trim()) return;
    if (editing) {
      await persist(actions.map((a) => {
        if (a.id !== editing.id) return a;
        const dueChanged = (a.dueDate || "") !== (form.dueDate || "");
        return {
          ...a, title: form.title.trim(), description: form.description.trim(),
          category: form.category, assignedTo: form.assignedTo, dueDate: form.dueDate,
          status: form.status,
          revisedDate: dueChanged ? new Date().toISOString().split("T")[0] : a.revisedDate || null,
          updatedAt: new Date().toISOString(),
        };
      }));
    } else {
      await persist([...actions, {
        id: generateId(), title: form.title.trim(), description: form.description.trim(),
        category: form.category, assignedTo: form.assignedTo, dueDate: form.dueDate,
        status: form.status, archived: false, meetingId: meeting.id,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), revisedDate: null,
      }]);
    }
    setShowForm(false); setEditing(null);
  };

  const patch = (id, p) => persist(actions.map((a) => (a.id === id ? { ...a, ...p, updatedAt: new Date().toISOString() } : a)));
  const removeAction = async (a) => {
    if (!window.confirm("Delete this action permanently?")) return;
    await persist(actions.filter((x) => x.id !== a.id));
  };

  const th = {
    padding: "10px 12px", textAlign: "left", backgroundColor: "#f0e6d9", color: "#4a352f",
    fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px",
    borderBottom: "2px solid #d7ccc8", borderRight: "1px solid #e0d5c8",
    position: "relative", overflow: "visible",
  };
  const td = {
    padding: "10px 12px", borderBottom: "1px solid #f0e6d9", borderRight: "1px solid #f7f3f0",
    fontSize: "13px", color: "#4a352f", verticalAlign: "middle", overflow: "hidden",
  };
  const iconBtn = (c) => ({ background: "none", border: "none", cursor: "pointer", padding: "4px 5px", borderRadius: "4px", color: c, display: "inline-flex", alignItems: "center" });
  const inp = (bad) => ({ width: "100%", padding: "10px 12px", border: bad ? "2px solid #f44336" : "2px solid #e8ddd4", borderRadius: "6px", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" });
  const lbl = { display: "block", fontSize: "13px", fontWeight: 600, color: "#4a352f", marginBottom: "6px" };
  const totalWidth = ACTION_COLUMNS.reduce((s, c) => s + widths[c.key], 0) + ACTIONS_COL_W;

  const CHIPS = [
    { key: "active", value: stats.active, label: "Active", hint: "All actions not yet archived", icon: <FaTasks size={12} />, bg: "#FFF3E0", color: "#E65100" },
    { key: "done", value: stats.done, label: "Done, not archived", hint: "Completed but still on the active list", icon: <FaCheckCircle size={12} />, bg: "#E8F5E9", color: "#2E7D32" },
    { key: "overdue", value: stats.overdue, label: "Overdue", hint: "Past due and not done", icon: <FaExclamationTriangle size={12} />, bg: "#FFEBEE", color: "#C62828" },
    { key: "archived", value: stats.archived, label: "Archived", hint: "Filed away — still here if you need them", icon: <FaArchive size={12} />, bg: "#ECEFF1", color: "#455A64" },
  ];

  return (
    <div>
      {/* Clickable stat chips */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginBottom: "14px" }}>
        {CHIPS.map((chip) => {
          const on = scope === chip.key;
          return (
            <button key={chip.key} onClick={() => selectScope(chip.key)} title={chip.hint}
              style={{ textAlign: "left", padding: "12px 14px", borderRadius: "8px", cursor: "pointer",
                backgroundColor: chip.bg, border: on ? `2px solid ${chip.color}` : "2px solid transparent",
                boxShadow: on ? `0 2px 8px ${chip.color}33` : "none",
                display: "flex", alignItems: "center", gap: "12px", fontFamily: "inherit", transition: "all 0.15s ease" }}>
              <span style={{ color: chip.color, display: "flex" }}>{chip.icon}</span>
              <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <span style={{ fontSize: "20px", fontWeight: 700, color: chip.color, lineHeight: 1 }}>{chip.value}</span>
                <span style={{ fontSize: "11px", color: "#6d5a4f", marginTop: "3px" }}>{chip.label}</span>
              </span>
              {on && <FaCheckCircle size={11} color={chip.color} style={{ marginLeft: "auto", flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "#8d6e63", backgroundColor: "#f7f3f0", border: "1px solid #e8ddd4", padding: "4px 10px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <FaClipboardList size={10} /> Showing {rows.length} {scope === "active" ? "active" : scope === "done" ? "completed" : scope === "overdue" ? "overdue" : "archived"}
          </span>
          {scope !== "active" && (
            <button onClick={() => selectScope("active")}
              style={{ fontSize: "11px", color: "#7d5a50", background: "none", border: "1px solid #e8ddd4", borderRadius: "12px", padding: "4px 10px", cursor: "pointer" }}>
              Back to all active
            </button>
          )}
          {activeFilters > 0 && (
            <button onClick={() => { setFilters({ ...EMPTY_ACTION_FILTERS }); setSearch(""); setSortConfig({ key: null, direction: "asc" }); }}
              style={{ fontSize: "11px", color: "#7d5a50", background: "none", border: "1px solid #e8ddd4", borderRadius: "12px", padding: "4px 10px", cursor: "pointer" }}>
              Clear {activeFilters} filter{activeFilters > 1 ? "s" : ""}
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "white", border: "2px solid #e8ddd4", borderRadius: "6px", padding: "2px 10px" }}>
            <FaSearch size={12} color="#8d6e63" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search actions..."
              style={{ border: "none", outline: "none", padding: "6px 2px", fontSize: "13px", fontFamily: "inherit", width: "140px", backgroundColor: "transparent" }} />
          </div>
          {!readOnly && !showArchived && (
            <button onClick={openAdd}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", backgroundColor: "#7d5a50", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
              <FaPlus size={12} /> New Action
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", border: "1px solid #e8ddd4", borderRadius: "8px", backgroundColor: "white" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, width: totalWidth, minWidth: "100%", tableLayout: "fixed", fontSize: "13px" }}>
          <thead>
            <tr>
              {ACTION_COLUMNS.map((col) => {
                const isOpen = openFilter === col.key;
                const isFiltered = filters[col.key] !== "all";
                const sorted = sortConfig.key === col.key;
                return (
                  <th key={col.key} style={{ ...th, width: widths[col.key] }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: 0 }}>
                      <span onClick={() => setOpenFilter(isOpen ? null : col.key)} title={`Filter ${col.label}`}
                        style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer",
                          color: isFiltered ? "#0D47A1" : "#4a352f", backgroundColor: isFiltered ? "#E3F2FD" : "transparent",
                          padding: "2px 6px", borderRadius: "4px", flex: 1, minWidth: 0 }}>
                        {col.filter === "date" && <FaCalendarAlt size={9} />}
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{col.label}</span>
                        {isOpen ? <FaChevronUp size={9} /> : <FaChevronDown size={9} />}
                      </span>
                      {col.sortable && (
                        <button onClick={(e) => { e.stopPropagation(); setSortConfig((p) => ({ key: col.key, direction: p.key === col.key && p.direction === "asc" ? "desc" : "asc" })); }}
                          style={iconBtn(sorted ? "#0D47A1" : "#a1887f")} title="Sort">
                          {sorted ? (sortConfig.direction === "asc" ? <FaSortUp size={11} /> : <FaSortDown size={11} />) : <FaSort size={11} />}
                        </button>
                      )}
                    </div>

                    {isOpen && col.filter === "date" && (
                      <CalendarPicker noDateLabel={col.key === "revisedDate" ? "No Revision" : "No Date"}
                        onSelect={(v) => setFilters((p) => ({ ...p, [col.key]: v }))} onClose={() => setOpenFilter(null)} />
                    )}

                    {isOpen && col.filter === "list" && (
                      <div onMouseLeave={() => setOpenFilter(null)} style={{
                        position: "absolute", top: "100%", left: 0, marginTop: "4px", backgroundColor: "white",
                        border: "2px solid #e8ddd4", borderRadius: "6px", minWidth: "190px", maxHeight: "240px",
                        overflowY: "auto", zIndex: 400, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", padding: "4px 0",
                        textTransform: "none", letterSpacing: "normal", fontWeight: 400,
                      }}>
                        {optionsFor(col.key).map((opt) => (
                          <div key={opt} onClick={() => { setFilters((p) => ({ ...p, [col.key]: opt })); setOpenFilter(null); }}
                            style={{ padding: "7px 14px", cursor: "pointer", fontSize: "12px",
                              fontWeight: filters[col.key] === opt ? 600 : 400,
                              backgroundColor: filters[col.key] === opt ? "#E3F2FD" : "white",
                              color: filters[col.key] === opt ? "#0D47A1" : "#4a352f" }}>
                            {opt === "all" ? `All ${col.label}` : opt}
                          </div>
                        ))}
                      </div>
                    )}

                    <div onMouseDown={(e) => startResize(e, col.key)} title="Drag to resize"
                      style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 5 }} />
                  </th>
                );
              })}
              <th style={{ ...th, width: ACTIONS_COL_W, textAlign: "center", borderRight: "none" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={ACTION_COLUMNS.length + 1} style={{ ...td, textAlign: "center", padding: "36px 16px", color: "#8d6e63", borderRight: "none" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    {showArchived ? <FaBoxOpen size={26} color="#d7ccc8" /> : <FaClipboardList size={26} color="#d7ccc8" />}
                    <span style={{ fontWeight: 600, color: "#5d4037" }}>
                      {showArchived ? "No archived actions"
                        : scope === "done" ? "Nothing completed and unarchived"
                        : scope === "overdue" ? "Nothing overdue"
                        : "No actions yet"}
                    </span>
                    <span style={{ fontSize: "12px" }}>
                      {showArchived ? "Completed actions you archive are kept here."
                        : scope === "done" ? "Completed actions sit here until you archive them."
                        : scope === "overdue" ? "Every action is either on time or already done."
                        : "Add an action and it appears in Integrated Actions automatically."}
                    </span>
                  </div>
                </td>
              </tr>
            ) : rows.map((a) => {
              const cat = a.category || meetingCategory;
              const meta = catMeta(cat);
              const over = isOverdue(a);
              return (
                <tr key={a.id}>
                  <td style={{ ...td, width: widths.category }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px",
                      borderRadius: "12px", fontSize: "11px", fontWeight: 500,
                      backgroundColor: meta.bg, color: meta.color, border: `1px solid ${meta.color}40` }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: meta.color }} />
                      {cat}
                    </span>
                  </td>
                  <td style={{ ...td, width: widths.title }}>
                    <div style={{ fontWeight: 500 }}>
                      {a.title}
                      {over && (
                        <span style={{ color: "#f44336", fontSize: "11px", fontWeight: 600, marginLeft: "8px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          <FaExclamationTriangle size={9} /> Overdue
                        </span>
                      )}
                    </div>
                    {a.description && <div style={{ fontSize: "11px", color: "#8d6e63", marginTop: "2px" }}>{a.description}</div>}
                    {a.sourceModule && (
                      <div style={{ fontSize: "10px", color: "#bdbdbd", marginTop: "2px" }}>
                        From {a.sourceModule}{a.sourceKpi ? ` · ${a.sourceKpi}` : ""}
                      </div>
                    )}
                  </td>
                  <td style={{ ...td, width: widths.assignedTo }}>
                    {a.assignedTo || <span style={{ color: "#bdbdbd" }}>Unassigned</span>}
                  </td>
                  <td style={{ ...td, width: widths.dueDate }}>
                    {a.dueDate ? <span style={{ color: dueDateColor(a.dueDate), fontWeight: 500 }}>{formatDMY(a.dueDate)}</span>
                      : <span style={{ color: "#bdbdbd" }}>—</span>}
                  </td>
                  <td style={{ ...td, width: widths.revisedDate }}>
                    {a.revisedDate ? formatDMY(a.revisedDate) : <span style={{ color: "#bdbdbd" }}>—</span>}
                  </td>
                  <td style={{ ...td, width: widths.status }}>{statusBadge(a.status)}</td>
                  <td style={{ ...td, width: ACTIONS_COL_W, textAlign: "center", borderRight: "none" }}>
                    <div style={{ display: "flex", gap: "2px", justifyContent: "center", alignItems: "center" }}>
                      {showArchived ? (
                        <>
                          <button onClick={() => patch(a.id, { archived: false, archivedAt: null })} style={iconBtn("#4CAF50")} title="Restore" disabled={busy}><FaUndo size={13} /></button>
                          <button onClick={() => removeAction(a)} style={iconBtn("#f44336")} title="Delete permanently" disabled={busy}><FaTrash size={13} /></button>
                        </>
                      ) : (
                        <>
                          {/* A completed action offers Archive in place of the
                              tick-box — the tick has nothing left to do. */}
                          {a.status === "Done" ? (
                            <button onClick={() => patch(a.id, { archived: true, archivedAt: new Date().toISOString() })} style={iconBtn("#7d5a50")} title="Archive" disabled={busy}><FaArchive size={14} /></button>
                          ) : (
                            <button onClick={() => patch(a.id, { status: "Done" })} style={iconBtn("#8d6e63")} title="Mark as done" disabled={busy}><FaRegSquare size={15} /></button>
                          )}
                          {!readOnly && (
                            <>
                              <button onClick={() => openEdit(a)} style={iconBtn("#2196F3")} title="Edit" disabled={busy}><FaEdit size={13} /></button>
                              <button onClick={() => removeAction(a)} style={iconBtn("#f44336")} title="Delete" disabled={busy}><FaTrash size={13} /></button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / edit modal */}
      {showForm && (
        <div onClick={() => setShowForm(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1300, padding: "20px" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "white", borderRadius: "12px", width: "100%", maxWidth: "560px", maxHeight: "88vh", overflowY: "auto", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#5d4037", display: "flex", alignItems: "center", gap: "8px" }}>
                {editing ? <FaEdit size={15} /> : <FaPlus size={15} />} {editing ? "Edit Action" : "Add Meeting Action"}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8d6e63" }}><FaTimes size={16} /></button>
            </div>

            <div style={{ backgroundColor: "#f7f3f0", border: "1px solid #e8ddd4", borderRadius: "6px", padding: "10px 12px", marginBottom: "16px", fontSize: "12px", color: "#8d6e63", display: "flex", flexWrap: "wrap", gap: "14px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><FaClipboardList size={10} /> {meeting?.title}</span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><FaCalendarAlt size={10} /> {meetingDate ? formatDMY(meetingDate) : "No date"}</span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><FaUsers size={10} /> {participants.length} participant{participants.length === 1 ? "" : "s"}</span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><FaInfoCircle size={10} /> Category and due date pre-filled from this meeting</span>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={lbl}>Action Title *</label>
              <input type="text" placeholder="What needs to be done?" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} style={inp(!form.title.trim())} />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={lbl}>Description</label>
              <textarea rows="2" placeholder="Add more detail..." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inp(false), resize: "vertical" }} />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={lbl}>
                Category
                {form.category === meetingCategory && <span style={{ fontWeight: 400, color: "#8d6e63", marginLeft: "8px", fontSize: "11px" }}>from meeting</span>}
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "8px", border: "2px solid #e8ddd4", borderRadius: "6px", backgroundColor: "white" }}>
                {allCategories.map((cat) => {
                  const on = form.category === cat.name;
                  return (
                    <div key={cat.name} onClick={() => setForm({ ...form, category: cat.name })}
                      style={{ display: "flex", alignItems: "center", gap: "7px", padding: "6px 12px", borderRadius: "20px",
                        cursor: "pointer", fontSize: "12.5px", backgroundColor: on ? cat.bg : "#f7f3f0",
                        border: on ? `2px solid ${cat.color}` : "2px solid transparent",
                        fontWeight: on ? 600 : 400, color: on ? cat.color : "#4a352f" }}>
                      <span style={{ width: 12, height: 12, borderRadius: "3px", backgroundColor: cat.color }} />
                      {cat.name}
                    </div>
                  );
                })}
                {showCustomCat ? (
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input autoFocus value={customCatName} onChange={(e) => setCustomCatName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomCat()} placeholder="New category"
                      style={{ padding: "6px 10px", border: "2px solid #e8ddd4", borderRadius: "16px", fontSize: "12.5px", fontFamily: "inherit" }} />
                    <button onClick={addCustomCat} style={{ background: "none", border: "none", color: "#4CAF50", cursor: "pointer" }}><FaCheckCircle size={15} /></button>
                    <button onClick={() => setShowCustomCat(false)} style={{ background: "none", border: "none", color: "#8d6e63", cursor: "pointer" }}><FaTimes size={14} /></button>
                  </div>
                ) : (
                  <button onClick={() => setShowCustomCat(true)}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", border: "2px dashed #d7ccc8", background: "none", color: "#7d5a50", cursor: "pointer", fontSize: "12.5px" }}>
                    <FaPlus size={10} /> Add your own
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label style={lbl}>By Whom</label>
                <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  style={{ ...inp(false), backgroundColor: "white", cursor: "pointer" }}>
                  <option value="">Unassigned</option>
                  {participants.map((p, i) => {
                    const name = typeof p === "string" ? p : p.name || p.email || "Participant";
                    return <option key={i} value={name}>{name}</option>;
                  })}
                </select>
                {participants.length === 0 && (
                  <div style={{ fontSize: "11px", color: "#8d6e63", marginTop: "4px" }}>No participants on this meeting yet.</div>
                )}
              </div>
              <div>
                <label style={lbl}>
                  By When
                  {form.dueDate && form.dueDate === toInputDate(meetingDate) && (
                    <span style={{ fontWeight: 400, color: "#8d6e63", marginLeft: "8px", fontSize: "11px" }}>meeting date</span>
                  )}
                </label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={inp(false)} />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={lbl}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={{ ...inp(false), backgroundColor: "white", cursor: "pointer" }}>
                {ACTION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "10px", backgroundColor: "#e6d7c3", color: "#4a352f", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}>Cancel</button>
              <button onClick={submit} disabled={busy || !form.title.trim()}
                style={{ flex: 1, padding: "10px", backgroundColor: "#7d5a50", color: "white", border: "none", borderRadius: "6px", cursor: busy ? "not-allowed" : "pointer", fontWeight: 500, opacity: busy || !form.title.trim() ? 0.6 : 1 }}>
                {busy ? "Saving..." : editing ? "Update Action" : "Add Action"}
              </button>
            </div>

            <p style={{ fontSize: "11px", color: "#8d6e63", marginTop: "14px", marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}>
              <FaInfoCircle size={10} /> This action also appears in Integrated Actions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Inline editable field ─────────────────────────────────────────────── */
const EditableField = ({ icon, label, value, placeholder, onSave, disabled }) => {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value || "");
  useEffect(() => { if (!editing) setTemp(value || ""); }, [value, editing]);

  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "#8d6e63", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>{icon} {label}</span>
        {!editing && !disabled && (
          <button onClick={() => { setTemp(value || ""); setEditing(true); }}
            style={{ background: "none", border: "none", color: "#7d5a50", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", textTransform: "none", letterSpacing: "normal" }}>
            <FaEdit size={11} /> Edit
          </button>
        )}
      </div>
      {editing ? (
        <div>
          <textarea value={temp} onChange={(e) => setTemp(e.target.value)} rows="3" placeholder={placeholder}
            style={{ backgroundColor: "#f7f3f0", padding: "12px 16px", borderRadius: "6px", border: "1px solid #e8ddd4", minHeight: "70px", fontSize: "14px", color: "#4a352f", lineHeight: 1.6, width: "100%", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button onClick={async () => { await onSave(temp); setEditing(false); }}
              style={{ padding: "6px 16px", backgroundColor: "#7d5a50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
              <FaSave size={12} /> Save
            </button>
            <button onClick={() => setEditing(false)}
              style={{ padding: "6px 16px", backgroundColor: "#e6d7c3", color: "#4a352f", border: "none", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
              <FaTimes size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: "#f7f3f0", padding: "12px 16px", borderRadius: "6px", minHeight: "44px", border: "1px solid #e8ddd4", fontSize: "14px", whiteSpace: "pre-wrap", lineHeight: 1.6, color: value ? "#4a352f" : "#bdbdbd", fontStyle: value ? "normal" : "italic" }}>
          {value || placeholder}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Governance Calendar
   ════════════════════════════════════════════════════════════════════════ */
const GovernanceCalendar = ({ activeSection, isInvestorView }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState("Processing...");
  const [notification, setNotification] = useState(null);
  const [showDoubleBookingWarning, setShowDoubleBookingWarning] = useState(false);
  const [pendingMeetingData, setPendingMeetingData] = useState(null);
  const [conflictingMeetingData, setConflictingMeetingData] = useState(null);

  const [activeTab, setActiveTab] = useState("overview");

  const [customCategories, setCustomCategories] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#607D8B");

  const [customDepartments, setCustomDepartments] = useState([]);
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newDepartmentColor, setNewDepartmentColor] = useState("#607D8B");

  /* Upcoming Meetings department filter. "any" matches a meeting carrying at
     least one selected department; "all" requires every one. */
  const [departmentFilter, setDepartmentFilter] = useState([]);
  const [deptFilterMode, setDeptFilterMode] = useState("any");

  const [formData, setFormData] = useState({
    title: "", category: RAPS_CATEGORIES[0].name, departments: [],
    purpose: "", agenda: "", preparations: "", participants: [],
    repeatType: "none", startDate: "", endDate: "", time: "10:00",
  });
  const [errors, setErrors] = useState({});

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "", category: RAPS_CATEGORIES[0].name, departments: [],
    purpose: "", agenda: "", preparations: "", participants: [],
    repeatType: "none", startDate: "", time: "",
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allCategories = useMemo(() => {
    const seen = new Map();
    [...RAPS_CATEGORIES, ...customCategories].forEach((c) => seen.set(c.name, c));
    meetings.forEach((m) => {
      const name = m.category || m.department;
      if (name && !seen.has(name)) seen.set(name, { name, color: m.categoryColor || "#607D8B", bg: `${m.categoryColor || "#607D8B"}20` });
    });
    return Array.from(seen.values());
  }, [customCategories, meetings]);

  const allDepartments = useMemo(() => {
    const seen = new Map();
    [...DEPARTMENT_OPTIONS, ...customDepartments].forEach((d) => seen.set(d.name, d));
    meetings.forEach((m) => (m.departments || []).forEach((n) => {
      if (!seen.has(n)) seen.set(n, { name: n, color: "#607D8B", bg: "#ECEFF1" });
    }));
    return Array.from(seen.values());
  }, [customDepartments, meetings]);

  const getCategoryMeta = (n) => allCategories.find((c) => c.name === n) || { name: n, color: "#757575", bg: "#EEEEEE" };
  const getDepartmentColor = (n) => allDepartments.find((d) => d.name === n)?.color || "#757575";
  const getDepartmentBg = (n) => allDepartments.find((d) => d.name === n)?.bg || "#EEEEEE";

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((u) => setCurrentUser(u || null));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "governanceCalendar", currentUser.uid));
        if (snap.exists()) setMeetings(snap.data().meetings || []);
      } catch (error) { console.error("Error loading meetings:", error); }
    };
    load();
  }, [currentUser]);

  useEffect(() => {
    const meetingId = new URLSearchParams(location.search).get("meeting");
    if (meetingId && meetings.length > 0) {
      const meeting = meetings.find((m) => m.id === meetingId);
      if (meeting) {
        setShowDetailsModal(meeting);
        const d = getMeetingDate(meeting);
        if (d) { setSelectedDate(new Date(d)); setCurrentDate(new Date(d)); }
      }
    }
  }, [location.search, meetings]);

  /* Keeps the open popup in step with the meetings array after any save. */
  useEffect(() => {
    if (!showDetailsModal) return;
    const fresh = meetings.find((m) => m.id === showDetailsModal.id);
    if (fresh && fresh !== showDetailsModal) setShowDetailsModal(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetings]);

  const notify = (type, message, ms = 4000) => {
    setNotification({ type, message: String(message) });
    setTimeout(() => setNotification(null), ms);
  };

  const persistMeetings = async (updated) => {
    setMeetings(updated);
    await setDoc(doc(db, "governanceCalendar", currentUser.uid),
      { meetings: updated, updatedAt: new Date().toISOString(), userId: currentUser.uid }, { merge: true });
  };

  const getMeetingsForDate = (date) => {
    const s = date.toDateString();
    return meetings.filter((m) => m.instances?.some((i) => new Date(i.date).toDateString() === s));
  };

  const meetingDotColors = (m) =>
    !m.departments?.length ? [m.categoryColor || m.departmentColor || "#757575"] : m.departments.map(getDepartmentColor);

  const upcomingMeetings = useMemo(() => {
    const list = [];
    meetings.forEach((meeting) => (meeting.instances || []).forEach((instance) => {
      const date = new Date(instance.date);
      if (date >= today) list.push({ meeting, instance, date });
    }));
    const filtered = departmentFilter.length === 0 ? list : list.filter((row) => {
      const depts = row.meeting.departments || [];
      return deptFilterMode === "all"
        ? departmentFilter.every((d) => depts.includes(d))
        : departmentFilter.some((d) => depts.includes(d));
    });
    return filtered.sort((a, b) => a.date - b.date).slice(0, 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetings, departmentFilter, deptFilterMode]);

  /* Counts are taken from every upcoming meeting, not the filtered list, so a
     department's number doesn't collapse to zero the moment you filter. */
  const upcomingAll = useMemo(() => {
    const list = [];
    meetings.forEach((meeting) => (meeting.instances || []).forEach((instance) => {
      if (new Date(instance.date) >= today) list.push(meeting);
    }));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetings]);

  const toggleDepartmentFilter = (name) =>
    setDepartmentFilter((p) => (p.includes(name) ? p.filter((d) => d !== name) : [...p, name]));

  const generateInstances = (startDate, endDate, repeatType, time) => {
    const instances = [];
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    const maxEnd = new Date(start);
    maxEnd.setFullYear(maxEnd.getFullYear() + 1);
    const actualEnd = end && end < maxEnd ? end : maxEnd;
    const push = (d) => instances.push({ instanceId: generateId(), date: d.toISOString(), time, status: "scheduled" });

    if (repeatType === "none") {
      if (start < today) throw new Error("Cannot schedule meetings on past dates");
      push(start);
      return instances;
    }
    const max = { weekly: 52, monthly: 12, quarterly: 4 };
    let current = new Date(start);
    let i = 0;
    while ((!end || current <= actualEnd) && i < (max[repeatType] || 12)) {
      if (current >= today) push(new Date(current));
      if (repeatType === "weekly") current.setDate(current.getDate() + 7);
      else if (repeatType === "monthly") current.setMonth(current.getMonth() + 1);
      else current.setMonth(current.getMonth() + 3);
      i++;
    }
    return instances;
  };

  const addParticipant = () => setFormData((p) => ({ ...p, participants: [...p.participants, { name: "", email: "" }] }));
  const removeParticipant = (i) => setFormData((p) => ({ ...p, participants: p.participants.filter((_, x) => x !== i) }));
  const updateParticipant = (i, field, value) => setFormData((p) => {
    const list = [...p.participants];
    list[i] = { ...list[i], [field]: value };
    return { ...p, participants: list };
  });

  const toggleDepartment = (n) => setFormData((p) => ({
    ...p, departments: p.departments.includes(n) ? p.departments.filter((d) => d !== n) : [...p.departments, n],
  }));
  const toggleEditDepartment = (n) => setEditFormData((p) => ({
    ...p, departments: (p.departments || []).includes(n) ? p.departments.filter((d) => d !== n) : [...(p.departments || []), n],
  }));

  const handleAddCustomCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (!allCategories.some((c) => c.name === name)) setCustomCategories((p) => [...p, { name, color: newCategoryColor, bg: `${newCategoryColor}20` }]);
    setFormData((p) => ({ ...p, category: name }));
    setNewCategoryName(""); setNewCategoryColor("#607D8B"); setShowAddCategory(false);
  };

  const handleAddCustomDepartment = () => {
    const name = newDepartmentName.trim();
    if (!name) return;
    if (!allDepartments.some((d) => d.name === name)) setCustomDepartments((p) => [...p, { name, color: newDepartmentColor, bg: `${newDepartmentColor}20` }]);
    setNewDepartmentName(""); setNewDepartmentColor("#607D8B"); setShowAddDepartment(false);
  };

  const proceedWithBooking = async () => {
    setLoading(true);
    setLoadingMessage("Booking your meeting...");
    try {
      const catMeta = getCategoryMeta(formData.category);
      let instances;
      try {
        instances = generateInstances(formData.startDate, formData.endDate, formData.repeatType, formData.time);
      } catch (error) {
        setErrors({ startDate: errText(error) });
        setLoading(false);
        return;
      }
      if (instances.length === 0) {
        setErrors({ startDate: "No valid dates found. Please check your date range." });
        setLoading(false);
        return;
      }

      const newMeeting = {
        id: generateId(), title: formData.title,
        category: formData.category, department: formData.category,
        categoryColor: catMeta.color, categoryBg: catMeta.bg,
        departmentColor: catMeta.color, departmentBg: catMeta.bg,
        departments: formData.departments || [],
        purpose: formData.purpose, agenda: formData.agenda, preparations: formData.preparations,
        participants: formData.participants,
        isRecurring: formData.repeatType !== "none",
        recurrencePattern: formData.repeatType !== "none" ? formData.repeatType : null,
        instances,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        highlights: "", lowlights: "", risks: "", headsUp: "", actions: [],
      };

      await persistMeetings([...meetings, newMeeting]);

      const formattedDate = new Date(formData.startDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const isDoubleBooked = !!conflictingMeetingData?.length;

      setFormData({
        title: "", category: RAPS_CATEGORIES[0].name, departments: [],
        purpose: "", agenda: "", preparations: "", participants: [],
        repeatType: "none", startDate: "", endDate: "", time: "10:00",
      });
      setErrors({}); setShowAddModal(false);
      setConflictingMeetingData(null); setPendingMeetingData(null);

      notify(isDoubleBooked ? "warning" : "success",
        `"${newMeeting.title}" ${isDoubleBooked ? "double-booked" : "confirmed"} for ${formattedDate} at ${formData.time}`, 5000);

      let userName = currentUser.displayName || "User";
      try {
        const snap = await getDoc(doc(db, "universalProfiles", currentUser.uid));
        if (snap.exists()) {
          const d = snap.data();
          userName = d.entityOverview?.registeredName || d.contactDetails?.contactName || userName;
        }
      } catch (error) { console.error(error); }

      const content = `Dear ${userName},

Your meeting "${newMeeting.title}" has been added to your calendar.

Meeting Details
------------------------------------
Date: ${formattedDate}
Time: ${formData.time}
Category: ${newMeeting.category}
Departments: ${newMeeting.departments.join(", ") || "None"}
Attendees: ${newMeeting.participants.map((p) => p.name || p.email || "Participant").join(", ") || "None"}

Purpose:
${newMeeting.purpose}

Agenda:
${newMeeting.agenda || "Not specified"}

Preparations (what is needed):
${newMeeting.preparations || "Not specified"}
------------------------------------

Best regards,
BIG Marketplace Team`;

      let userEmail = null;
      try {
        const u = await getDoc(doc(db, "users", currentUser.uid));
        if (u.exists()) userEmail = u.data().email;
      } catch (error) { console.error(error); }

      if (userEmail) {
        try {
          const send = httpsCallable(functions, "sendGovernanceMeetingConfirmation");
          await send({
            to: currentUser.uid, useTestMode: false,
            meetingTitle: newMeeting.title, meetingDate: formattedDate, meetingTime: formData.time,
            department: newMeeting.category, participants: newMeeting.participants,
            purpose: newMeeting.purpose, isRecurring: newMeeting.isRecurring,
            recurrencePattern: newMeeting.recurrencePattern,
            isDoubleBooked, conflictingMeetings: conflictingMeetingData || [],
          });
        } catch (e) { console.error("Confirmation email failed:", e); }
      }

      await addDoc(collection(db, "messages"), {
        to: currentUser.uid, from: "system",
        subject: `Meeting ${isDoubleBooked ? "Double-Booked" : "Confirmed"}: ${newMeeting.title}`,
        content, date: new Date().toISOString(), read: false, type: "inbox",
        meetingId: newMeeting.id, linkTo: "/governance-calendar",
      });
    } catch (error) {
      console.error("Error booking meeting:", error);
      notify("error", `Failed to schedule meeting: ${errText(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) { notify("error", "Please log in to add meetings."); return; }
    const e = {};
    if (!formData.title.trim()) e.title = "Meeting title is required";
    if (!formData.category) e.category = "Category is required";
    if (!formData.purpose.trim()) e.purpose = "Purpose is required";
    if (!formData.startDate) e.startDate = "Start date is required";
    if (!formData.time) e.time = "Time is required";
    if (formData.startDate) {
      const start = new Date(formData.startDate);
      if (start < today) e.startDate = "Cannot schedule meetings on past dates";
      if (formData.endDate && new Date(formData.endDate) < start) e.endDate = "End date cannot be before start date";
    }
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const target = new Date(formData.startDate);
    const conflicts = meetings.filter((m) =>
      m.instances?.some((i) => new Date(i.date).toDateString() === target.toDateString() && i.time === formData.time));

    if (conflicts.length > 0) {
      setPendingMeetingData({
        title: formData.title, category: formData.category,
        categoryColor: getCategoryMeta(formData.category).color,
        time: formData.time, purpose: formData.purpose,
      });
      setConflictingMeetingData(conflicts);
      setShowDoubleBookingWarning(true);
      return;
    }
    await proceedWithBooking();
  };

  const handleEditMeeting = (meeting) => {
    setEditingMeeting(meeting);
    const first = meeting.instances?.[0];
    const d = first ? new Date(first.date) : new Date();
    setEditFormData({
      title: meeting.title || "", category: meeting.category || RAPS_CATEGORIES[0].name,
      departments: meeting.departments || [],
      purpose: meeting.purpose || "", agenda: meeting.agenda || "", preparations: meeting.preparations || "",
      participants: meeting.participants || [],
      repeatType: meeting.recurrencePattern || "none",
      startDate: d.toISOString().split("T")[0], time: first?.time || "10:00",
    });
    setShowEditModal(true);
  };

  const updateEditParticipant = (i, field, value) => {
    const list = [...editFormData.participants];
    list[i] = { ...list[i], [field]: value };
    setEditFormData({ ...editFormData, participants: list });
  };
  const addEditParticipant = () => setEditFormData({ ...editFormData, participants: [...editFormData.participants, { name: "", email: "" }] });
  const removeEditParticipant = (i) => setEditFormData({ ...editFormData, participants: editFormData.participants.filter((_, x) => x !== i) });

  const saveEditedMeeting = async () => {
    if (!editingMeeting || !currentUser) return;
    setLoading(true);
    setLoadingMessage("Saving changes...");
    try {
      const catMeta = getCategoryMeta(editFormData.category);
      const updated = {
        ...editingMeeting,
        title: editFormData.title, category: editFormData.category, department: editFormData.category,
        categoryColor: catMeta.color, categoryBg: catMeta.bg,
        departmentColor: catMeta.color, departmentBg: catMeta.bg,
        departments: editFormData.departments || [],
        purpose: editFormData.purpose, agenda: editFormData.agenda, preparations: editFormData.preparations,
        participants: editFormData.participants,
        isRecurring: editFormData.repeatType !== "none",
        recurrencePattern: editFormData.repeatType !== "none" ? editFormData.repeatType : null,
        updatedAt: new Date().toISOString(),
        instances: [...(editingMeeting.instances || [])],
      };

      const oldDate = editingMeeting.instances?.[0]?.date;
      const oldTime = editingMeeting.instances?.[0]?.time;
      if (updated.instances.length > 0) {
        updated.instances[0] = {
          ...updated.instances[0],
          date: new Date(editFormData.startDate).toISOString(),
          time: editFormData.time,
        };
      }
      const newDate = updated.instances?.[0]?.date;
      const newTime = updated.instances?.[0]?.time;

      const changes = [];
      if (editingMeeting.title !== updated.title) changes.push(`Title changed to "${updated.title}"`);
      if (oldDate !== newDate) changes.push("Date changed");
      if (oldTime !== newTime) changes.push(`Time changed from ${oldTime} to ${newTime}`);
      if (editingMeeting.category !== updated.category) changes.push(`Category changed to ${updated.category}`);
      if (JSON.stringify(editingMeeting.departments) !== JSON.stringify(updated.departments)) changes.push("Departments updated");
      if (JSON.stringify(editingMeeting.participants) !== JSON.stringify(updated.participants)) changes.push("Participants updated");
      if ((editingMeeting.purpose || "") !== (updated.purpose || "")) changes.push("Purpose updated");
      if ((editingMeeting.agenda || "") !== (updated.agenda || "")) changes.push("Agenda updated");
      if ((editingMeeting.preparations || "") !== (updated.preparations || "")) changes.push("Preparations updated");

      if (changes.length === 0) {
        notify("info", "No changes were made.");
        setShowEditModal(false); setEditingMeeting(null); setLoading(false);
        return;
      }

      await persistMeetings(meetings.map((m) => (m.id === editingMeeting.id ? updated : m)));

      const formattedNewDate = newDate
        ? new Date(newDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
        : "TBD";
      const summary = changes.join("; ");

      const recipients = [];
      try {
        const u = await getDoc(doc(db, "users", currentUser.uid));
        if (u.exists() && u.data().email) recipients.push({ email: u.data().email, name: currentUser.displayName || "User", isOrganizer: true });
      } catch (error) { console.error(error); }
      (updated.participants || []).forEach((p) => {
        if (p.email?.trim()) recipients.push({ email: p.email.trim(), name: p.name || "Participant", isOrganizer: false });
      });

      for (const r of recipients) {
        try {
          await addDoc(collection(db, "messages"), {
            to: r.isOrganizer ? currentUser.uid : r.email,
            toName: r.name, from: "system", fromName: "BIG Marketplace",
            subject: `Meeting Updated: ${updated.title}`,
            content: `Dear ${r.name},\n\nThe meeting "${updated.title}" has been updated.\n\nChanges:\n${summary}\n\nBest regards,\nBIG Marketplace Team`,
            date: new Date().toISOString(), read: false, type: "inbox",
            meetingId: updated.id, linkTo: "/governance-calendar",
          });
          const send = httpsCallable(functions, "sendGovernanceMeetingUpdateEmail");
          await send({
            to: r.email, name: r.name, meetingTitle: updated.title, changes: summary,
            meetingDate: formattedNewDate, meetingTime: newTime || "TBD",
            department: updated.category, isOrganizer: r.isOrganizer,
            linkTo: "https://www.bigmarketplace.africa/governance-calendar",
          });
        } catch (error) { console.error(`Notify ${r.email} failed:`, error); }
      }

      notify("success", `"${updated.title}" updated successfully.`);
      setShowEditModal(false); setEditingMeeting(null);
    } catch (error) {
      console.error("Error updating meeting:", error);
      notify("error", `Failed to update meeting: ${errText(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    const meeting = meetings.find((m) => m.id === meetingId);
    if (meeting?.isRecurring) {
      const ok = window.confirm(`"${meeting.title}" is recurring.\n\nThis deletes ALL ${meeting.instances?.length || 0} instances.\n\nAre you sure?`);
      if (!ok) return;
    }
    setLoading(true);
    setLoadingMessage("Deleting meeting...");
    try {
      await persistMeetings(meetings.filter((m) => m.id !== meetingId));
      setShowDeleteConfirm(null); setShowDetailsModal(null);

      if (meeting) {
        const first = meeting.instances?.[0];
        const formattedDate = first
          ? new Date(first.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
          : "TBD";
        try {
          const send = httpsCallable(functions, "sendGovernanceMeetingCancellation");
          await send({
            to: currentUser.uid, meetingTitle: meeting.title,
            meetingDate: formattedDate, meetingTime: first?.time || "TBD",
            department: meeting.category || meeting.department, purpose: meeting.purpose,
            isRecurring: meeting.isRecurring || false, participants: meeting.participants || [],
          });
        } catch (e) { console.error("Cancellation email failed:", e); }

        await addDoc(collection(db, "messages"), {
          to: currentUser.uid, from: "system",
          subject: `Meeting Cancelled: ${meeting.title}`,
          content: `Dear ${currentUser.displayName || "User"},\n\nThe meeting "${meeting.title}" has been cancelled.\n\nOriginally scheduled: ${formattedDate} at ${first?.time || "TBD"}\nCategory: ${meeting.category || meeting.department}\n\nBest regards,\nBIG Marketplace Team`,
          date: new Date().toISOString(), read: false, type: "inbox",
          meetingId: meeting.id, linkTo: "/governance-calendar",
        });
        notify("warning", `"${meeting.title}" has been cancelled.`, 5000);
      }
    } catch (error) {
      console.error("Error deleting meeting:", error);
      notify("error", `Failed to delete meeting: ${errText(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const saveMeetingField = async (meetingId, field, value) => {
    if (!currentUser) return;
    try {
      await persistMeetings(meetings.map((m) => (m.id === meetingId ? { ...m, [field]: value, updatedAt: new Date().toISOString() } : m)));
      notify("success", "Saved.", 2000);
    } catch (error) {
      console.error("Error saving field:", error);
      notify("error", `Failed to save: ${errText(error)}`);
    }
  };

  /* Actions live on the meeting — the same array /raps-actions reads. */
  const saveMeetingActions = async (meetingId, nextActions) => {
    if (!currentUser) return;
    try {
      await persistMeetings(meetings.map((m) => (m.id === meetingId ? { ...m, actions: nextActions, updatedAt: new Date().toISOString() } : m)));
      notify("success", "Actions updated — also visible in Integrated Actions.", 2500);
    } catch (error) {
      console.error("Error saving actions:", error);
      notify("error", `Failed to save the action: ${errText(error)}`);
    }
  };

  const getMonthYear = () => currentDate.toLocaleString("default", { month: "long", year: "numeric" });
  const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => { const d = new Date(); setCurrentDate(d); setSelectedDate(d); };

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const days = [];
    const todayDate = new Date();
    for (let i = 0; i < firstDay; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), -i);
      days.unshift({ date: d, day: d.getDate(), isCurrentMonth: false, isToday: false, meetings: [] });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      days.push({ date: d, day: i, isCurrentMonth: true, isToday: d.toDateString() === todayDate.toDateString(), meetings: getMeetingsForDate(d) });
    }
    for (let i = 1; i <= 42 - days.length; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      days.push({ date: d, day: i, isCurrentMonth: false, isToday: false, meetings: [] });
    }
    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, meetings]);

  const isSelectedDate = (d) => selectedDate && d.toDateString() === selectedDate.toDateString();

  const handleDateClick = (date) => {
    setSelectedDate(date);
    if (!showAddModal && date >= today) setFormData((p) => ({ ...p, startDate: date.toISOString().split("T")[0] }));
  };

  /* The Add Meeting button now opens a modal that actually exists — the old
     file flipped the flag but never rendered anything. */
  const handleOpenAddModal = (date = null) => {
    const target = date instanceof Date ? date : selectedDate || new Date();
    setErrors({});
    setFormData((p) => ({
      ...p,
      startDate: (target >= today ? target : new Date()).toISOString().split("T")[0],
      category: p.category || RAPS_CATEGORIES[0].name,
    }));
    setShowAddModal(true);
  };

  const selectedMeetings = getMeetingsForDate(selectedDate);

  const container = { backgroundColor: "#fdfcfb", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", padding: "20px", maxWidth: "1400px", margin: "0 auto" };
  const addButton = { padding: "10px 20px", backgroundColor: "#7d5a50", color: "white", border: "none", borderRadius: "6px", cursor: isInvestorView ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", opacity: isInvestorView ? 0.6 : 1 };
  const navButton = { padding: "8px 12px", backgroundColor: "#7d5a50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" };
  const todayButton = { padding: "8px 16px", backgroundColor: "#e6d7c3", color: "#4a352f", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 500, fontSize: "13px" };
  const overlay = { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
  const modal = { backgroundColor: "white", borderRadius: "12px", width: "90%", maxWidth: "700px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" };
  const detailsModal = { ...modal, maxWidth: "1050px" };
  const modalHeader = { padding: "20px 24px", borderBottom: "2px solid #e8ddd4", display: "flex", justifyContent: "space-between", alignItems: "center" };
  const modalTitle = { fontSize: "20px", fontWeight: 600, color: "#5d4037", margin: 0 };
  const closeBtn = { background: "none", border: "none", cursor: "pointer", color: "#8d6e63" };
  const modalBody = { padding: "24px" };
  const formGroup = { marginBottom: "20px" };
  const label = { display: "block", marginBottom: "8px", fontWeight: 600, color: "#4a352f", fontSize: "14px" };
  const input = (bad) => ({ width: "100%", padding: "10px 12px", border: bad ? "2px solid #f44336" : "2px solid #e8ddd4", borderRadius: "6px", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" });
  const textarea = (bad) => ({ ...input(bad), resize: "vertical" });
  const select = (bad) => ({ ...input(bad), backgroundColor: "white", cursor: "pointer" });
  const errStyle = { color: "#f44336", fontSize: "12px", marginTop: "4px" };
  const modalFooter = { padding: "16px 24px", borderTop: "2px solid #e8ddd4", display: "flex", justifyContent: "flex-end", gap: "12px", flexWrap: "wrap" };
  const cancelBtn = { padding: "10px 20px", backgroundColor: "#e6d7c3", color: "#4a352f", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "14px" };
  const submitBtn = { padding: "10px 20px", backgroundColor: "#7d5a50", color: "white", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "14px", opacity: loading ? 0.7 : 1 };
  const tabStyle = (a) => ({ padding: "12px 20px", cursor: "pointer", fontSize: "14px", fontWeight: a ? 600 : 500, color: a ? "#7d5a50" : "#8d6e63", borderBottom: a ? "3px solid #7d5a50" : "3px solid transparent", background: "none", border: "none", display: "flex", alignItems: "center", gap: "8px" });
  const detailsLabel = { fontSize: "11px", fontWeight: 600, color: "#8d6e63", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" };

  if (!currentUser) {
    return (
      <div style={container}>
        <div style={{ textAlign: "center", padding: "40px", color: "#5d4037" }}>
          <h2>Please Log In</h2>
          <p>You need to be logged in to access the Governance Calendar.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>

      {notification && (
        <div style={{
          padding: "12px 20px", borderRadius: "8px", marginBottom: "16px",
          backgroundColor: notification.type === "success" ? "#E8F5E9" : notification.type === "warning" ? "#FFF3E0" : notification.type === "error" ? "#FFEBEE" : "#E3F2FD",
          borderLeft: `4px solid ${notification.type === "success" ? "#4CAF50" : notification.type === "warning" ? "#FF9800" : notification.type === "error" ? "#F44336" : "#2196F3"}`,
          color: "#4a352f", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {notification.type === "success" && <FaCheckCircle color="#4CAF50" />}
            {notification.type === "warning" && <FaExclamationTriangle color="#FF9800" />}
            {notification.type === "error" && <FaTimesCircle color="#F44336" />}
            {notification.type === "info" && <FaInfoCircle color="#2196F3" />}
            {notification.message}
          </span>
          <button onClick={() => setNotification(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8d6e63" }}><FaTimes size={14} /></button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap", marginBottom: "20px", paddingBottom: "16px", borderBottom: "2px solid #e8ddd4" }}>
        <div>
          <h1 style={{ color: "#5d4037", fontSize: "28px", fontWeight: 700, margin: 0, marginBottom: "8px", letterSpacing: "-0.5px" }}>Governance Calendar</h1>
          <p style={{ color: "#8d6e63", fontSize: "15px", margin: 0, lineHeight: 1.5 }}>
            Track and manage board meetings, committee sessions, and key governance events in one place.
          </p>
        </div>
        <button onClick={() => handleOpenAddModal(null)} style={addButton} disabled={isInvestorView}>
          <FaPlus size={13} /> Add Meeting
        </button>
      </div>

      {/* Calendar (left) + Upcoming Meetings (right) */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2.1fr) minmax(300px, 1fr)", gap: "20px", alignItems: "start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "2px solid #e8ddd4", flexWrap: "wrap", gap: "10px" }}>
            <button onClick={goToPreviousMonth} style={navButton}><FaChevronLeft size={12} /> Prev</button>
            <span style={{ fontSize: "20px", fontWeight: 600, color: "#5d4037" }}>{getMonthYear()}</span>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={goToToday} style={todayButton}>Today</button>
              <button onClick={goToNextMonth} style={navButton}>Next <FaChevronRight size={12} /></button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "8px" }}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
              <div key={d} style={{ padding: "10px", textAlign: "center", fontWeight: 600, color: "#5d4037", fontSize: "13px" }}>{d}</div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px" }}>
            {calendarDays.map((day, index) => {
              let bg = "#ffffff", color = "#4a352f", weight = "normal";
              if (!day.isCurrentMonth) { bg = "#f5f5f5"; color = "#bdbdbd"; }
              if (isSelectedDate(day.date) && !day.isToday) { bg = "#e6d7c3"; color = "#4a352f"; weight = "bold"; }
              if (day.isToday) { bg = "#7d5a50"; color = "white"; weight = "bold"; }
              return (
                <div key={index} onClick={() => handleDateClick(day.date)}
                  style={{ backgroundColor: bg, color, fontWeight: weight, padding: "10px 6px", textAlign: "center",
                    borderRadius: "6px", cursor: "pointer", border: "1px solid #e8ddd4", minHeight: "76px",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", transition: "all 0.2s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                  <span style={{ fontSize: "14px", marginBottom: "4px" }}>{day.day}</span>
                  {day.meetings?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "2px" }}>
                      {day.meetings.slice(0, 3).map((m, idx) =>
                        meetingDotColors(m).slice(0, 3).map((c, ci) => (
                          <div key={`${idx}-${ci}`} title={`${m.title}${m.departments?.length ? ` — ${m.departments.join(", ")}` : ""}`}
                            style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: c, margin: "1px" }} />
                        ))
                      )}
                      {day.meetings.length > 3 && (
                        <span style={{ fontSize: "10px", color: day.isToday ? "#f0e6d9" : "#8d6e63" }}>+{day.meetings.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Department Color Guide — also filters Upcoming Meetings */}
          <div style={{ backgroundColor: "#f7f3f0", padding: "12px 16px", borderRadius: "6px", marginTop: "18px", border: "1px solid #e8ddd4" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#5d4037", display: "flex", alignItems: "center", gap: "6px" }}>
                <FaLayerGroup size={11} /> Department Color Guide — click to filter Upcoming Meetings
              </span>
              {departmentFilter.length > 0 && (
                <button onClick={() => setDepartmentFilter([])}
                  style={{ fontSize: "11px", color: "#7d5a50", background: "none", border: "1px solid #e8ddd4", borderRadius: "10px", padding: "3px 10px", cursor: "pointer" }}>
                  Clear filter ({departmentFilter.length})
                </button>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {allDepartments.map((dept) => {
                const on = departmentFilter.includes(dept.name);
                return (
                  <button key={dept.name} onClick={() => toggleDepartmentFilter(dept.name)}
                    style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px",
                      color: on ? dept.color : "#4a352f", backgroundColor: on ? dept.bg : "#ffffff",
                      border: `1px solid ${on ? dept.color : "#e8ddd4"}`, borderRadius: "16px",
                      padding: "4px 10px", cursor: "pointer", fontWeight: on ? 600 : 400, fontFamily: "inherit" }}>
                    <span style={{ width: 11, height: 11, borderRadius: "3px", backgroundColor: dept.color }} />
                    {dept.name}
                    {on && <FaCheckCircle size={9} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected date */}
          <div style={{ marginTop: "18px", padding: "15px", backgroundColor: "#f7f3f0", borderRadius: "6px", border: "1px solid #e8ddd4" }}>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#5d4037", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaCalendarAlt size={13} />
              {selectedDate.toLocaleDateString("default", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
            {selectedMeetings.length === 0 ? (
              <div style={{ color: "#8d6e63", fontSize: "14px", fontStyle: "italic" }}>
                No governance meetings scheduled for this date.
                {!isInvestorView && selectedDate >= today && (
                  <button onClick={() => handleOpenAddModal(selectedDate)}
                    style={{ background: "none", border: "none", color: "#7d5a50", cursor: "pointer", textDecoration: "underline", marginLeft: "8px", fontSize: "13px" }}>
                    Schedule one?
                  </button>
                )}
              </div>
            ) : selectedMeetings.map((meeting, idx) => {
              const instance = meeting.instances?.find((i) => new Date(i.date).toDateString() === selectedDate.toDateString());
              const count = meeting.participants?.length || 0;
              const isPast = !meeting.instances?.some((i) => new Date(i.date) >= new Date());
              return (
                <div key={idx} onClick={() => { setActiveTab("overview"); setShowDetailsModal(meeting); }}
                  style={{ padding: "12px", backgroundColor: meeting.categoryBg || "#f7f3f0",
                    borderLeft: `4px solid ${meeting.categoryColor || "#757575"}`, borderRadius: "6px", marginBottom: "8px", cursor: "pointer" }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                    <span>{meeting.title}</span>
                    {!isPast && !isInvestorView && (
                      <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(meeting.id); }} title="Delete meeting"
                        style={{ background: "none", border: "none", color: "#f44336", cursor: "pointer", padding: "4px" }}>
                        <FaTrash size={12} />
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: "11px", color: "#8d6e63", marginTop: "6px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><FaFolderOpen size={10} /> {meeting.category || meeting.department}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><FaClock size={10} /> {instance?.time || "Time TBD"}</span>
                    {count > 0 && <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><FaUsers size={10} /> {count}</span>}
                    {meeting.isRecurring && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <FaSyncAlt size={10} />
                        {meeting.recurrencePattern === "weekly" ? "Weekly" : meeting.recurrencePattern === "monthly" ? "Monthly" : "Quarterly"}
                      </span>
                    )}
                  </div>
                  {meeting.purpose && (
                    <div style={{ fontSize: "12px", marginTop: "6px", color: "#4a352f" }}>
                      {meeting.purpose.length > 110 ? `${meeting.purpose.slice(0, 110)}...` : meeting.purpose}
                    </div>
                  )}
                  {meeting.departments?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                      {meeting.departments.map((d, i) => (
                        <span key={i} style={{ fontSize: "9px", padding: "2px 8px", borderRadius: "10px", backgroundColor: getDepartmentBg(d), color: getDepartmentColor(d), fontWeight: 500, border: `1px solid ${getDepartmentColor(d)}40` }}>
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Meetings, with its own department filter */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e8ddd4", borderRadius: "8px", padding: "16px", position: "sticky", top: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingBottom: "10px", borderBottom: "2px solid #e8ddd4" }}>
            <h3 style={{ margin: 0, fontSize: "16px", color: "#5d4037", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaBell size={13} /> Upcoming Meetings
            </h3>
            <span style={{ fontSize: "11px", color: "#8d6e63", backgroundColor: "#f7f3f0", border: "1px solid #e8ddd4", borderRadius: "10px", padding: "2px 8px" }}>
              {upcomingMeetings.length}
            </span>
          </div>

          <div style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid #e8ddd4" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#8d6e63", textTransform: "uppercase", letterSpacing: "0.4px", display: "flex", alignItems: "center", gap: "5px" }}>
                <FaLayerGroup size={10} /> Filter by department
              </span>
              {departmentFilter.length > 0 && (
                <button onClick={() => setDepartmentFilter([])}
                  style={{ fontSize: "11px", color: "#7d5a50", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Clear
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", maxHeight: "116px", overflowY: "auto" }}>
              {allDepartments.map((dept) => {
                const on = departmentFilter.includes(dept.name);
                const count = upcomingAll.filter((m) => (m.departments || []).includes(dept.name)).length;
                return (
                  <button key={dept.name} onClick={() => toggleDepartmentFilter(dept.name)}
                    title={`${dept.name} — ${count} upcoming`}
                    style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10.5px",
                      color: on ? dept.color : "#4a352f", backgroundColor: on ? dept.bg : "#ffffff",
                      border: `1px solid ${on ? dept.color : "#e8ddd4"}`, borderRadius: "14px",
                      padding: "3px 9px", cursor: "pointer", fontWeight: on ? 600 : 400, fontFamily: "inherit" }}>
                    <span style={{ width: 9, height: 9, borderRadius: "2px", backgroundColor: dept.color, flexShrink: 0 }} />
                    {dept.name}
                    <span style={{ color: "#a1887f", fontWeight: 400 }}>{count}</span>
                    {on && <FaCheckCircle size={8} />}
                  </button>
                );
              })}
            </div>

            {departmentFilter.length > 1 && (
              <div style={{ display: "flex", gap: "6px", marginTop: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "10.5px", color: "#8d6e63" }}>Match:</span>
                {[{ k: "any", l: "Any selected" }, { k: "all", l: "All selected" }].map((m) => (
                  <button key={m.k} onClick={() => setDeptFilterMode(m.k)}
                    style={{ fontSize: "10.5px", padding: "3px 10px", borderRadius: "10px", cursor: "pointer",
                      backgroundColor: deptFilterMode === m.k ? "#7d5a50" : "#f7f3f0",
                      color: deptFilterMode === m.k ? "white" : "#4a352f",
                      border: "1px solid #e8ddd4", fontWeight: deptFilterMode === m.k ? 600 : 400, fontFamily: "inherit" }}>
                    {m.l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ maxHeight: "560px", overflowY: "auto", paddingRight: "4px" }}>
            {upcomingMeetings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 10px", color: "#8d6e63" }}>
                <FaCalendarAlt size={24} color="#d7ccc8" />
                <p style={{ fontSize: "13px", marginTop: "10px", marginBottom: 0 }}>
                  {departmentFilter.length > 0 ? "No upcoming meetings for the selected departments." : "No upcoming meetings scheduled."}
                </p>
              </div>
            ) : upcomingMeetings.map(({ meeting, instance, date }) => {
              const daysAway = Math.ceil((date - new Date().setHours(0, 0, 0, 0)) / 86400000);
              return (
                <div key={instance.instanceId || `${meeting.id}-${instance.date}`}
                  onClick={() => { setActiveTab("overview"); setShowDetailsModal(meeting); }}
                  style={{ display: "flex", gap: "10px", padding: "10px", borderRadius: "8px", marginBottom: "8px",
                    cursor: "pointer", border: "1px solid #e8ddd4", backgroundColor: "#fdfcfb",
                    borderLeft: `4px solid ${meeting.categoryColor || "#757575"}` }}>
                  <div style={{ textAlign: "center", minWidth: "44px" }}>
                    <div style={{ fontSize: "10px", color: "#8d6e63", textTransform: "uppercase" }}>{date.toLocaleString("default", { month: "short" })}</div>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "#5d4037", lineHeight: 1 }}>{date.getDate()}</div>
                    <div style={{ fontSize: "9px", color: "#a1887f" }}>{date.toLocaleString("default", { weekday: "short" })}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#4a352f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {meeting.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "#8d6e63", marginTop: "3px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><FaClock size={9} /> {instance.time || "TBD"}</span>
                      <span style={{ color: daysAway === 0 ? "#f44336" : "#a1887f", fontWeight: daysAway === 0 ? 600 : 400 }}>
                        {daysAway === 0 ? "Today" : daysAway === 1 ? "Tomorrow" : `in ${daysAway} days`}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "5px" }}>
                      <span style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "9px", backgroundColor: meeting.categoryBg || "#f7f3f0", color: meeting.categoryColor || "#5d4037", border: `1px solid ${meeting.categoryColor || "#e8ddd4"}40` }}>
                        {meeting.category || meeting.department}
                      </span>
                      {(meeting.departments || []).slice(0, 2).map((d, i) => (
                        <span key={i} style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "9px", backgroundColor: getDepartmentBg(d), color: getDepartmentColor(d), border: `1px solid ${getDepartmentColor(d)}40` }}>{d}</span>
                      ))}
                      {(meeting.departments || []).length > 2 && (
                        <span style={{ fontSize: "9px", color: "#a1887f" }}>+{meeting.departments.length - 2}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ backgroundColor: "#f7f3f0", padding: "20px", borderRadius: "6px", marginTop: "20px" }}>
        <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <FaChartLine size={13} /> Governance Calendar KPIs
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "15px" }}>
          {[
            { value: meetings.length, label: "Total Meetings" },
            { value: meetings.filter((m) => m.isRecurring).length, label: "Recurring Meetings" },
            { value: [...new Set(meetings.flatMap((m) => m.departments || []))].length, label: "Active Departments" },
            { value: meetings.reduce((s, m) => s + (m.actions || []).filter((a) => !a.archived).length, 0), label: "Open Actions" },
          ].map((k) => (
            <div key={k.label} style={{ backgroundColor: "#fdfcfb", padding: "15px", borderRadius: "4px", border: "2px solid #e8ddd4", textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#5d4037" }}>{k.value}</div>
              <div style={{ fontSize: "12px", color: "#8d6e63" }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAILS MODAL */}
      {showDetailsModal && (
        <div style={overlay} onClick={() => setShowDetailsModal(null)}>
          <div style={detailsModal} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <div>
                <h3 style={modalTitle}>{showDetailsModal.title}</h3>
                <div style={{ fontSize: "13px", color: "#8d6e63", marginTop: "6px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><FaFolderOpen size={11} /> {showDetailsModal.category || showDetailsModal.department}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <FaCalendarAlt size={11} />
                    {getMeetingDate(showDetailsModal)
                      ? new Date(getMeetingDate(showDetailsModal)).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
                      : "No date"}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><FaClock size={11} /> {showDetailsModal.instances?.[0]?.time || "Time TBD"}</span>
                </div>
              </div>
              <button onClick={() => setShowDetailsModal(null)} style={closeBtn}><FaTimes size={18} /></button>
            </div>

            <div style={{ display: "flex", borderBottom: "2px solid #e8ddd4", padding: "0 24px", gap: "4px", flexWrap: "wrap" }}>
              <button style={tabStyle(activeTab === "overview")} onClick={() => setActiveTab("overview")}><FaClipboardList size={13} /> Meeting Overview</button>
              <button style={tabStyle(activeTab === "performance")} onClick={() => setActiveTab("performance")}><FaChartLine size={13} /> Performance Overview</button>
              <button style={tabStyle(activeTab === "actions")} onClick={() => setActiveTab("actions")}><FaTasks size={13} /> Meeting Actions</button>
            </div>

            <div style={{ padding: "24px", maxHeight: "62vh", overflowY: "auto" }}>
              {activeTab === "overview" && (
                <div>
                  <div style={{ width: "100%", height: "4px", backgroundColor: showDetailsModal.categoryColor || "#757575", borderRadius: "2px", marginBottom: "18px" }} />
                  <div style={{ marginBottom: "22px" }}>
                    <div style={detailsLabel}><FaInfoCircle size={11} /> Meeting Information</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#8d6e63" }}>Category</div>
                        <div style={{ fontSize: "14px", color: "#4a352f", fontWeight: 500 }}>{showDetailsModal.category || showDetailsModal.department}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#8d6e63" }}>Departments</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                          {showDetailsModal.departments?.length ? showDetailsModal.departments.map((d, i) => (
                            <span key={i} style={{ fontSize: "11px", padding: "2px 10px", borderRadius: "12px", backgroundColor: getDepartmentBg(d), color: getDepartmentColor(d), fontWeight: 500, border: `1px solid ${getDepartmentColor(d)}40` }}>{d}</span>
                          )) : <span style={{ color: "#8d6e63", fontSize: "13px" }}>None specified</span>}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#8d6e63" }}>Frequency</div>
                        <div style={{ fontSize: "14px", color: "#4a352f", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                          <FaSyncAlt size={11} color="#8d6e63" />
                          {showDetailsModal.isRecurring
                            ? showDetailsModal.recurrencePattern === "weekly" ? "Weekly"
                              : showDetailsModal.recurrencePattern === "monthly" ? "Monthly"
                              : showDetailsModal.recurrencePattern === "quarterly" ? "Quarterly" : "Custom"
                            : "One-time"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#8d6e63" }}>Location</div>
                        <div style={{ fontSize: "14px", color: "#4a352f", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                          <FaMapMarkerAlt size={11} color="#8d6e63" /> {showDetailsModal.location || "Virtual"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: "22px" }}>
                    <div style={detailsLabel}><FaUsers size={11} /> Participants</div>
                    {showDetailsModal.participants?.length ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {showDetailsModal.participants.map((p, i) => (
                          <span key={i} style={{ backgroundColor: "#f7f3f0", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", color: "#5d4037", border: "1px solid #e8ddd4" }}>
                            {p.name || p.email || "Participant"}{p.email && p.name ? ` (${p.email})` : ""}
                          </span>
                        ))}
                      </div>
                    ) : <div style={{ fontSize: "14px", color: "#8d6e63" }}>No participants specified</div>}
                  </div>

                  <div style={{ borderTop: "2px solid #e8ddd4", paddingTop: "18px" }}>
                    <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#5d4037", display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaFileAlt size={13} /> Meeting Details
                    </h4>
                    <EditableField icon={<FaBullseye size={11} />} label="Purpose" value={showDetailsModal.purpose}
                      placeholder="What is the goal of this meeting?" disabled={isInvestorView}
                      onSave={(v) => saveMeetingField(showDetailsModal.id, "purpose", v)} />
                    <EditableField icon={<FaClipboardList size={11} />} label="Agenda" value={showDetailsModal.agenda}
                      placeholder="List the agenda items to be covered." disabled={isInvestorView}
                      onSave={(v) => saveMeetingField(showDetailsModal.id, "agenda", v)} />
                    <EditableField icon={<FaFolderOpen size={11} />} label="Preparations (What is needed)" value={showDetailsModal.preparations}
                      placeholder="Documents, data, or people needed before this meeting." disabled={isInvestorView}
                      onSave={(v) => saveMeetingField(showDetailsModal.id, "preparations", v)} />
                  </div>
                </div>
              )}

              {activeTab === "performance" && (
                <div>
                  <div style={{ width: "100%", height: "4px", backgroundColor: showDetailsModal.categoryColor || "#757575", borderRadius: "2px", marginBottom: "18px" }} />
                  <EditableField icon={<FaRegStar size={11} />} label="Highlights" value={showDetailsModal.highlights}
                    placeholder="What went well? Record the wins from this meeting." disabled={isInvestorView}
                    onSave={(v) => saveMeetingField(showDetailsModal.id, "highlights", v)} />
                  <EditableField icon={<FaExclamationTriangle size={11} />} label="Lowlights" value={showDetailsModal.lowlights}
                    placeholder="What did not go well? Record the setbacks raised." disabled={isInvestorView}
                    onSave={(v) => saveMeetingField(showDetailsModal.id, "lowlights", v)} />
                  <EditableField icon={<FaShieldAlt size={11} />} label="Risks" value={showDetailsModal.risks}
                    placeholder="Risks identified, their likely impact, and who owns them." disabled={isInvestorView}
                    onSave={(v) => saveMeetingField(showDetailsModal.id, "risks", v)} />
                  <EditableField icon={<FaBell size={11} />} label="Heads-up" value={showDetailsModal.headsUp}
                    placeholder="Anything the team should know ahead of the next session." disabled={isInvestorView}
                    onSave={(v) => saveMeetingField(showDetailsModal.id, "headsUp", v)} />
                </div>
              )}

              {activeTab === "actions" && (
                <div>
                  <div style={{ width: "100%", height: "4px", backgroundColor: showDetailsModal.categoryColor || "#757575", borderRadius: "2px", marginBottom: "18px" }} />
                  <MeetingActionsTable
                    meeting={showDetailsModal}
                    categories={allCategories}
                    readOnly={isInvestorView}
                    onSaveActions={(next) => saveMeetingActions(showDetailsModal.id, next)}
                  />
                  <button onClick={() => { const id = showDetailsModal.id; setShowDetailsModal(null); navigate(`/raps-actions?meeting=${id}`); }}
                    style={{ width: "100%", marginTop: "16px", padding: "10px", backgroundColor: "#7d5a50", color: "white",
                      border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 500,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <FaExternalLinkAlt size={12} /> Open in Integrated Actions (RAPS)
                  </button>
                </div>
              )}
            </div>

            <div style={modalFooter}>
              {(() => {
                const d = getMeetingDate(showDetailsModal);
                const isPast = d ? new Date(d) < new Date() : false;
                return (
                  <>
                    {!isPast && !isInvestorView && (
                      <>
                        <button onClick={() => { const m = showDetailsModal; setShowDetailsModal(null); handleEditMeeting(m); }}
                          style={{ padding: "8px 16px", backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <FaEdit size={12} /> Edit Meeting
                        </button>
                        <button onClick={() => { const id = showDetailsModal.id; setShowDetailsModal(null); setShowDeleteConfirm(id); }}
                          style={{ padding: "8px 16px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <FaTrash size={12} /> Delete Meeting
                        </button>
                      </>
                    )}
                    <button onClick={() => { const id = showDetailsModal.id; setShowDetailsModal(null); navigate(`/raps-overview?meeting=${id}`); }}
                      style={{ padding: "8px 16px", backgroundColor: "#e6d7c3", color: "#4a352f", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <FaClipboardList size={12} /> View Full Overview
                    </button>
                    <button onClick={() => setShowDetailsModal(null)} style={cancelBtn}>Close</button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ADD MEETING MODAL */}
      {showAddModal && (
        <div style={overlay} onClick={() => setShowAddModal(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <h3 style={{ ...modalTitle, display: "flex", alignItems: "center", gap: "8px" }}><FaPlus size={15} /> Add Meeting</h3>
              <button onClick={() => setShowAddModal(false)} style={closeBtn}><FaTimes size={18} /></button>
            </div>

            <div style={modalBody}>
              <div style={formGroup}>
                <label style={label}>Meeting Title *</label>
                <input type="text" placeholder="e.g. Q4 Board Meeting, Strategy Review" value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={input(!!errors.title)} />
                {errors.title && <div style={errStyle}>{errors.title}</div>}
              </div>

              <div style={formGroup}>
                <label style={label}>Category *</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "8px", border: errors.category ? "2px solid #f44336" : "2px solid #e8ddd4", borderRadius: "6px", backgroundColor: "white" }}>
                  {allCategories.map((cat) => {
                    const on = formData.category === cat.name;
                    return (
                      <div key={cat.name} onClick={() => setFormData({ ...formData, category: cat.name })}
                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 13px", cursor: "pointer", borderRadius: "20px",
                          backgroundColor: on ? cat.bg : "#f7f3f0", border: on ? `2px solid ${cat.color}` : "2px solid transparent",
                          fontWeight: on ? 600 : 400, color: on ? cat.color : "#4a352f", fontSize: "13px" }}>
                        <span style={{ width: 14, height: 14, borderRadius: "4px", backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    );
                  })}
                  {showAddCategory ? (
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <input autoFocus type="text" placeholder="New category" value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddCustomCategory()}
                        style={{ padding: "6px 10px", border: "2px solid #e8ddd4", borderRadius: "16px", fontSize: "13px", fontFamily: "inherit" }} />
                      <input type="color" value={newCategoryColor} onChange={(e) => setNewCategoryColor(e.target.value)}
                        style={{ width: "32px", height: "28px", border: "1px solid #e8ddd4", borderRadius: "4px", cursor: "pointer", padding: 0 }} />
                      <button onClick={handleAddCustomCategory} style={{ background: "none", border: "none", color: "#4CAF50", cursor: "pointer" }}><FaCheckCircle size={15} /></button>
                      <button onClick={() => setShowAddCategory(false)} style={{ background: "none", border: "none", color: "#8d6e63", cursor: "pointer" }}><FaTimes size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddCategory(true)}
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 13px", borderRadius: "20px", border: "2px dashed #d7ccc8", background: "none", color: "#7d5a50", cursor: "pointer", fontSize: "13px" }}>
                      <FaPlus size={10} /> Add your own
                    </button>
                  )}
                </div>
                {errors.category && <div style={errStyle}>{errors.category}</div>}
              </div>

              <div style={formGroup}>
                <label style={label}>Departments</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "8px", border: "2px solid #e8ddd4", borderRadius: "6px", backgroundColor: "white" }}>
                  {allDepartments.map((dept) => {
                    const on = formData.departments.includes(dept.name);
                    return (
                      <div key={dept.name} onClick={() => toggleDepartment(dept.name)}
                        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "13px",
                          backgroundColor: on ? dept.bg : "#f7f3f0", border: on ? `2px solid ${dept.color}` : "2px solid transparent",
                          fontWeight: on ? 600 : 400, color: on ? dept.color : "#4a352f" }}>
                        <span style={{ width: 13, height: 13, borderRadius: "3px", backgroundColor: dept.color }} />
                        {dept.name}{on && <FaCheckCircle size={10} />}
                      </div>
                    );
                  })}
                  {showAddDepartment ? (
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <input autoFocus type="text" placeholder="New department" value={newDepartmentName}
                        onChange={(e) => setNewDepartmentName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddCustomDepartment()}
                        style={{ padding: "6px 10px", border: "2px solid #e8ddd4", borderRadius: "16px", fontSize: "13px", fontFamily: "inherit" }} />
                      <input type="color" value={newDepartmentColor} onChange={(e) => setNewDepartmentColor(e.target.value)}
                        style={{ width: "32px", height: "28px", border: "1px solid #e8ddd4", borderRadius: "4px", cursor: "pointer", padding: 0 }} />
                      <button onClick={handleAddCustomDepartment} style={{ background: "none", border: "none", color: "#4CAF50", cursor: "pointer" }}><FaCheckCircle size={15} /></button>
                      <button onClick={() => setShowAddDepartment(false)} style={{ background: "none", border: "none", color: "#8d6e63", cursor: "pointer" }}><FaTimes size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddDepartment(true)}
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", border: "2px dashed #d7ccc8", background: "none", color: "#7d5a50", cursor: "pointer", fontSize: "13px" }}>
                      <FaPlus size={10} /> Add department
                    </button>
                  )}
                </div>
              </div>

              <div style={formGroup}>
                <label style={label}>Purpose of Meeting *</label>
                <textarea rows="3" placeholder="What is the goal of this meeting?" value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} style={textarea(!!errors.purpose)} />
                {errors.purpose && <div style={errStyle}>{errors.purpose}</div>}
              </div>

              <div style={formGroup}>
                <label style={label}>Agenda</label>
                <textarea rows="3" placeholder="List the agenda items to be covered." value={formData.agenda}
                  onChange={(e) => setFormData({ ...formData, agenda: e.target.value })} style={textarea(false)} />
              </div>

              <div style={formGroup}>
                <label style={label}>Preparations (What is needed)</label>
                <textarea rows="2" placeholder="Documents, data, or people needed before this meeting." value={formData.preparations}
                  onChange={(e) => setFormData({ ...formData, preparations: e.target.value })} style={textarea(false)} />
              </div>

              <div style={formGroup}>
                <label style={label}>Participants</label>
                {formData.participants.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input type="text" placeholder="Full Name" value={p.name || ""} onChange={(e) => updateParticipant(i, "name", e.target.value)} style={{ flex: 1, ...input(false) }} />
                    <input type="email" placeholder="Email" value={p.email || ""} onChange={(e) => updateParticipant(i, "email", e.target.value)} style={{ flex: 1, ...input(false) }} />
                    <button type="button" onClick={() => removeParticipant(i)}
                      style={{ padding: "8px 12px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                      <FaTimes size={12} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addParticipant}
                  style={{ padding: "8px 16px", backgroundColor: "#e6d7c3", color: "#4a352f", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaPlus size={11} /> Add Participant
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div style={formGroup}>
                  <label style={label}>Start Date *</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} style={input(!!errors.startDate)} />
                  {errors.startDate && <div style={errStyle}>{errors.startDate}</div>}
                </div>
                <div style={formGroup}>
                  <label style={label}>Time *</label>
                  <input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} style={input(!!errors.time)} />
                  {errors.time && <div style={errStyle}>{errors.time}</div>}
                </div>
              </div>

              <div style={formGroup}>
                <label style={label}>Repeat Frequency</label>
                <select value={formData.repeatType} onChange={(e) => setFormData({ ...formData, repeatType: e.target.value })} style={select(false)}>
                  <option value="none">One-time meeting</option>
                  <option value="weekly">Weekly (every 7 days)</option>
                  <option value="monthly">Monthly (same date each month)</option>
                  <option value="quarterly">Quarterly (every 3 months)</option>
                </select>
                <div style={{ fontSize: "11px", color: "#8d6e63", marginTop: "4px", fontStyle: "italic" }}>
                  Recurring meetings are generated for up to one year ahead.
                </div>
              </div>

              {formData.repeatType !== "none" && (
                <div style={formGroup}>
                  <label style={label}>End Date (optional)</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} style={input(!!errors.endDate)} />
                  {errors.endDate && <div style={errStyle}>{errors.endDate}</div>}
                </div>
              )}
            </div>

            <div style={modalFooter}>
              <button onClick={() => setShowAddModal(false)} style={cancelBtn}>Cancel</button>
              <button onClick={handleSubmit} disabled={loading} style={submitBtn}>{loading ? "Saving..." : "Schedule Meeting"}</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MEETING MODAL */}
      {showEditModal && editingMeeting && (
        <div style={overlay} onClick={() => setShowEditModal(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <h3 style={{ ...modalTitle, display: "flex", alignItems: "center", gap: "8px" }}><FaEdit size={15} /> Edit Meeting</h3>
              <button onClick={() => setShowEditModal(false)} style={closeBtn}><FaTimes size={18} /></button>
            </div>

            <div style={modalBody}>
              <div style={formGroup}>
                <label style={label}>Meeting Title *</label>
                <input type="text" value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} style={input(false)} />
              </div>

              <div style={formGroup}>
                <label style={label}>Category *</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "8px", border: "2px solid #e8ddd4", borderRadius: "6px", backgroundColor: "white" }}>
                  {allCategories.map((cat) => {
                    const on = editFormData.category === cat.name;
                    return (
                      <div key={cat.name} onClick={() => setEditFormData({ ...editFormData, category: cat.name })}
                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 13px", cursor: "pointer", borderRadius: "20px", fontSize: "13px",
                          backgroundColor: on ? cat.bg : "#f7f3f0", border: on ? `2px solid ${cat.color}` : "2px solid transparent",
                          fontWeight: on ? 600 : 400, color: on ? cat.color : "#4a352f" }}>
                        <span style={{ width: 14, height: 14, borderRadius: "4px", backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={formGroup}>
                <label style={label}>Departments</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "8px", border: "2px solid #e8ddd4", borderRadius: "6px", backgroundColor: "white" }}>
                  {allDepartments.map((dept) => {
                    const on = editFormData.departments?.includes(dept.name);
                    return (
                      <div key={dept.name} onClick={() => toggleEditDepartment(dept.name)}
                        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "13px",
                          backgroundColor: on ? dept.bg : "#f7f3f0", border: on ? `2px solid ${dept.color}` : "2px solid transparent",
                          fontWeight: on ? 600 : 400, color: on ? dept.color : "#4a352f" }}>
                        <span style={{ width: 13, height: 13, borderRadius: "3px", backgroundColor: dept.color }} />
                        {dept.name}{on && <FaCheckCircle size={10} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={formGroup}>
                <label style={label}>Purpose of Meeting *</label>
                <textarea rows="3" value={editFormData.purpose} onChange={(e) => setEditFormData({ ...editFormData, purpose: e.target.value })} style={textarea(false)} />
              </div>
              <div style={formGroup}>
                <label style={label}>Agenda</label>
                <textarea rows="3" value={editFormData.agenda} onChange={(e) => setEditFormData({ ...editFormData, agenda: e.target.value })} style={textarea(false)} />
              </div>
              <div style={formGroup}>
                <label style={label}>Preparations (What is needed)</label>
                <textarea rows="2" value={editFormData.preparations} onChange={(e) => setEditFormData({ ...editFormData, preparations: e.target.value })} style={textarea(false)} />
              </div>

              <div style={formGroup}>
                <label style={label}>Participants</label>
                {editFormData.participants.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input type="text" placeholder="Full Name" value={p.name || ""} onChange={(e) => updateEditParticipant(i, "name", e.target.value)} style={{ flex: 1, ...input(false) }} />
                    <input type="email" placeholder="Email" value={p.email || ""} onChange={(e) => updateEditParticipant(i, "email", e.target.value)} style={{ flex: 1, ...input(false) }} />
                    <button type="button" onClick={() => removeEditParticipant(i)}
                      style={{ padding: "8px 12px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                      <FaTimes size={12} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addEditParticipant}
                  style={{ padding: "8px 16px", backgroundColor: "#e6d7c3", color: "#4a352f", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaPlus size={11} /> Add Participant
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div style={formGroup}>
                  <label style={label}>Date *</label>
                  <input type="date" value={editFormData.startDate} onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })} style={input(false)} />
                </div>
                <div style={formGroup}>
                  <label style={label}>Time *</label>
                  <input type="time" value={editFormData.time} onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })} style={input(false)} />
                </div>
              </div>

              <div style={formGroup}>
                <label style={label}>Repeat Frequency</label>
                <select value={editFormData.repeatType} onChange={(e) => setEditFormData({ ...editFormData, repeatType: e.target.value })} style={select(false)}>
                  <option value="none">One-time meeting</option>
                  <option value="weekly">Weekly (every 7 days)</option>
                  <option value="monthly">Monthly (same date each month)</option>
                  <option value="quarterly">Quarterly (every 3 months)</option>
                </select>
              </div>
            </div>

            <div style={modalFooter}>
              <button onClick={() => setShowEditModal(false)} style={cancelBtn}>Cancel</button>
              <button onClick={saveEditedMeeting} disabled={loading} style={submitBtn}>{loading ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div style={{ ...overlay, zIndex: 1100 }} onClick={() => setShowDeleteConfirm(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "white", borderRadius: "12px", width: "90%", maxWidth: "420px", padding: "24px", textAlign: "center" }}>
            <FaExclamationTriangle size={26} color="#f44336" />
            <div style={{ fontSize: "18px", fontWeight: 600, color: "#5d4037", margin: "12px 0" }}>Delete Meeting</div>
            <div style={{ fontSize: "14px", color: "#4a352f", marginBottom: "20px" }}>
              Are you sure you want to delete this meeting? This action cannot be undone.
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={cancelBtn}>Cancel</button>
              <button onClick={() => handleDeleteMeeting(showDeleteConfirm)}
                style={{ padding: "10px 20px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Double booking warning */}
      {showDoubleBookingWarning && (
        <div style={{ ...overlay, zIndex: 1100 }} onClick={() => setShowDoubleBookingWarning(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <h3 style={{ ...modalTitle, display: "flex", alignItems: "center", gap: "8px" }}>
                <FaExclamationTriangle size={16} color="#FF9800" /> Double Booking Warning
              </h3>
              <button onClick={() => setShowDoubleBookingWarning(false)} style={closeBtn}><FaTimes size={18} /></button>
            </div>
            <div style={modalBody}>
              <div style={{ backgroundColor: "#FFF3E0", padding: "16px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #FF9800" }}>
                <p style={{ margin: 0, color: "#E65100", fontWeight: 500 }}>
                  You already have {conflictingMeetingData?.length || 0} meeting{conflictingMeetingData?.length > 1 ? "s" : ""} scheduled at this time.
                </p>
              </div>
              <p style={{ fontWeight: 600, color: "#5d4037", marginBottom: "8px" }}>Existing:</p>
              {conflictingMeetingData?.map((m, i) => (
                <div key={i} style={{ padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "6px", borderLeft: `4px solid ${m.categoryColor || "#757575"}`, marginBottom: "8px" }}>
                  <div><strong>{m.title}</strong></div>
                  <div style={{ fontSize: "13px", color: "#6d5a4f" }}>{m.category || m.department} • {m.instances?.[0]?.time || "TBD"}</div>
                </div>
              ))}
              <p style={{ fontWeight: 600, color: "#5d4037", margin: "16px 0 8px" }}>New:</p>
              <div style={{ padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "6px", borderLeft: `4px solid ${pendingMeetingData?.categoryColor || "#757575"}` }}>
                <div><strong>{pendingMeetingData?.title}</strong></div>
                <div style={{ fontSize: "13px", color: "#6d5a4f" }}>{pendingMeetingData?.category} • {pendingMeetingData?.time}</div>
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                <button onClick={() => { setShowDoubleBookingWarning(false); proceedWithBooking(); }}
                  style={{ flex: 1, padding: "12px", backgroundColor: "#f00a0a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}>
                  Yes, Double-Book
                </button>
                <button onClick={() => { setShowDoubleBookingWarning(false); setConflictingMeetingData(null); setPendingMeetingData(null); setLoading(false); }}
                  style={{ flex: 1, padding: "12px", backgroundColor: "#e6d7c3", color: "#4a352f", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}>
                  No, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)" }}>
          <div style={{ backgroundColor: "white", padding: "32px 40px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", border: "4px solid #f0e6d9", borderTop: "4px solid #7d5a50", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#4a352f", fontSize: "16px", fontWeight: 500, margin: 0 }}>{loadingMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GovernanceCalendar;