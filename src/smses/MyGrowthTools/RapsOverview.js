"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
  FaUsers, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaClipboardList,
  FaArrowRight, FaArrowLeft, FaExclamationTriangle, FaCheckCircle,
  FaEdit, FaSave, FaTimes, FaTimesCircle, FaInfoCircle, FaSyncAlt,
  FaFolderOpen, FaFileAlt, FaBullseye, FaChartLine, FaSearch, FaTasks,
  FaPlus, FaTrash, FaSort, FaSortUp, FaSortDown, FaChevronDown, FaChevronUp,
  FaChevronLeft, FaChevronRight, FaArchive, FaBoxOpen, FaUndo, FaRegSquare,
  FaExternalLinkAlt,
} from "react-icons/fa";

/* ─── Categories — the same vocabulary as the calendar and Integrated
   Actions. "Overall Company Health" is gone; "General" is the catch-all. ── */
const RAPS_CATEGORIES = [
  { name: "Strategy & Execution", color: "#2196F3", bg: "#E3F2FD" },
  { name: "Financial Performance", color: "#FF9800", bg: "#FFF3E0" },
  { name: "Operational Performance", color: "#9C27B0", bg: "#F3E5F5" },
  { name: "People", color: "#FF5722", bg: "#FBE9E7" },
  { name: "ESG Impact", color: "#8BC34A", bg: "#F1F8E9" },
  { name: "Marketing & Sales", color: "#E91E63", bg: "#FCE4EC" },
  { name: "General", color: "#607D8B", bg: "#ECEFF1" },
];

const ACTION_STATUSES = ["Not Done", "In Progress", "Done"];

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const formatDMY = (d) => {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  return `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}/${x.getFullYear()}`;
};
const toInputDate = (d) => {
  if (!d) return "";
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? "" : x.toISOString().split("T")[0];
};
const generateId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

/* Anything caught is flattened before it can reach state — an Error object
   rendered as a React child throws "Objects are not valid as a React child". */
const errText = (e) => String(e?.message ?? e ?? "Unknown error");

/* Prefers the next instance still ahead — a recurring meeting's first
   instance is often months in the past. */
const getMeetingDate = (meeting) => {
  const dates = (meeting?.instances || [])
    .map((i) => new Date(i.date))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a - b);
  if (!dates.length) return null;
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

/* ════════════════════════════════════════════════════════════════════════════
   Looking Back / Looking Forward.

   Two bands, each with a vertical spine, a brown caption block, a chevron and
   a white content box. Stored as plain text, rendered one bullet per line.
   ════════════════════════════════════════════════════════════════════════ */
const KMS_BANDS = [
  {
    id: "back", spine: "Looking Back", border: "#5d4037", spineBg: "#5d4037", capBg: "#8d6e63",
    rows: [
      { field: "highlights", caption: "Highlights", sub: "\u201cWinners\u201d", placeholder: "What went well this period? One win per line." },
      { field: "lowlights", caption: "Lowlights", sub: "\u201cLosers\u201d", placeholder: "What did not go well? One setback per line." },
    ],
  },
  {
    id: "forward", spine: "Looking Forward", border: "#b0a29b", spineBg: "#9e9e9e", capBg: "#5d4037",
    rows: [
      { field: "opportunities", caption: "Opportunities", sub: "", placeholder: "What could we take advantage of? One opportunity per line." },
      { field: "priorities", caption: "Priorities for next Period", sub: "", placeholder: "What must happen before the next meeting? One priority per line." },
    ],
  },
];

const KmsOverview = ({ meeting, onSave, disabled }) => {
  const [editing, setEditing] = useState(null);
  const [temp, setTemp] = useState("");

  const bullets = (value) => (value || "").split("\n").map((l) => l.trim()).filter(Boolean);

  return (
    <div>
      {KMS_BANDS.map((band) => (
        <div key={band.id} style={{
          display: "flex", gap: "10px", padding: "12px",
          border: `3px solid ${band.border}`, borderRadius: "14px",
          marginBottom: "18px", backgroundColor: "#ffffff",
        }}>
          <div style={{
            backgroundColor: band.spineBg, borderRadius: "8px", color: "white",
            fontWeight: 700, fontSize: "13px", letterSpacing: "0.6px",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "10px 4px", minWidth: "38px", flexShrink: 0,
            writingMode: "vertical-rl", transform: "rotate(180deg)",
          }}>
            {band.spine}
          </div>

          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
            {band.rows.map((row) => {
              const value = meeting?.[row.field] || "";
              const isEditing = editing === row.field;
              const lines = bullets(value);

              return (
                <div key={row.field} style={{ display: "flex", alignItems: "stretch" }}>
                  <div style={{
                    backgroundColor: band.capBg, color: "white", borderRadius: "10px",
                    padding: "14px 12px", width: "150px", flexShrink: 0,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    textAlign: "center", fontWeight: 700, fontSize: "13px", lineHeight: 1.35,
                  }}>
                    <span>{row.caption}</span>
                    {row.sub && <span style={{ fontWeight: 600 }}>{row.sub}</span>}
                  </div>

                  <div style={{
                    width: "22px", flexShrink: 0, alignSelf: "stretch",
                    backgroundColor: band.capBg,
                    clipPath: "polygon(0 0, 100% 50%, 0 100%)",
                    marginLeft: "-2px", marginRight: "8px",
                  }} />

                  <div style={{
                    flex: 1, minWidth: 0, backgroundColor: "#ffffff",
                    border: `2px solid ${band.border}`, borderRadius: "10px",
                    padding: "12px 14px", minHeight: "78px",
                    display: "flex", flexDirection: "column", justifyContent: "center",
                  }}>
                    {isEditing ? (
                      <div>
                        <textarea autoFocus rows="4" value={temp}
                          onChange={(e) => setTemp(e.target.value)} placeholder={row.placeholder}
                          style={{
                            width: "100%", backgroundColor: "#ffffff", border: "1px solid #e8ddd4",
                            borderRadius: "6px", padding: "10px 12px", fontSize: "13.5px",
                            color: "#4a352f", lineHeight: 1.6, fontFamily: "inherit",
                            resize: "vertical", boxSizing: "border-box", outline: "none",
                          }} />
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px", alignItems: "center" }}>
                          <button onClick={async () => { await onSave(row.field, temp); setEditing(null); }}
                            style={{ padding: "6px 14px", backgroundColor: "#7d5a50", color: "white", border: "none",
                              borderRadius: "5px", cursor: "pointer", fontSize: "12.5px", fontWeight: 600,
                              display: "flex", alignItems: "center", gap: "6px" }}>
                            <FaSave size={11} /> Save
                          </button>
                          <button onClick={() => setEditing(null)}
                            style={{ padding: "6px 14px", backgroundColor: "#efeae7", color: "#4a352f", border: "none",
                              borderRadius: "5px", cursor: "pointer", fontSize: "12.5px",
                              display: "flex", alignItems: "center", gap: "6px" }}>
                            <FaTimes size={11} /> Cancel
                          </button>
                          <span style={{ fontSize: "11.5px", color: "#8d6e63" }}>One point per line</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "flex-start" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {lines.length ? (
                            <ul style={{ margin: 0, paddingLeft: "16px", color: "#4a352f", fontSize: "13.5px", lineHeight: 1.7 }}>
                              {lines.map((l, i) => <li key={i}>{l}</li>)}
                            </ul>
                          ) : (
                            <span style={{ color: "#bdbdbd", fontSize: "13px", fontStyle: "italic" }}>{row.placeholder}</span>
                          )}
                        </div>
                        {!disabled && (
                          <button onClick={() => { setTemp(value); setEditing(row.field); }} title={`Edit ${row.caption}`}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#8d6e63", padding: "2px 4px", flexShrink: 0 }}>
                            <FaEdit size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─── Calendar picker for the action date filters ───────────────────────── */
const CalendarPicker = ({ onSelect, onClose, noDateLabel }) => {
  const [current, setCurrent] = useState(new Date());
  const days = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
  const first = new Date(current.getFullYear(), current.getMonth(), 1).getDay();
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
          style={{ background: "none", border: "none", cursor: "pointer", color: "#5d4037" }}><FaChevronLeft size={11} /></button>
        <span style={{ fontWeight: 600, color: "#5d4037", fontSize: "13px" }}>
          {months[current.getMonth()]} {current.getFullYear()}
        </span>
        <button onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#5d4037" }}><FaChevronRight size={11} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: "10px", fontWeight: 600, color: "#8d6e63" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {Array.from({ length: first }, (_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const date = new Date(current.getFullYear(), current.getMonth(), day);
          const isToday = date.toDateString() === today.toDateString();
          return (
            <div key={day} onClick={() => { onSelect(formatDMY(date.toISOString())); onClose(); }}
              style={{ textAlign: "center", padding: "5px 2px", cursor: "pointer", borderRadius: "4px",
                backgroundColor: isToday ? "#f0e6d9" : "transparent", color: "#4a352f",
                fontWeight: isToday ? 600 : 400, fontSize: "12px" }}>{day}</div>
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

/* ─── Meeting Actions table (matches Integrated Actions) ────────────────── */
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

  /* One field, `action`, maps onto the stored `title` — the Action column
     here and on Integrated Actions. Any `description` an action already
     carries (context attached when it was raised from a KPI, say) is shown
     read-only and preserved verbatim. */
  const [form, setForm] = useState({
    action: "", category: meetingCategory,
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
  const catMeta = (n) => allCategories.find((c) => c.name === n) || { name: n, color: "#757575", bg: "#EEEEEE" };

  const startResize = (e, key) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX, startWidth = widths[key];
    resizing.current = key;
    const onMove = (ev) => setWidths((p) => ({ ...p, [key]: Math.max(90, startWidth + (ev.clientX - startX)) }));
    const onUp = () => {
      resizing.current = null;
      document.body.style.cursor = ""; document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp);
    };
    document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
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
        const av = get(a).toString().toLowerCase(), bv = get(b).toString().toLowerCase();
        if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
        if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [scopeRows, search, filters, sortConfig, meetingCategory]);

  const activeFilters = Object.values(filters).filter((v) => v !== "all").length + (search.trim() ? 1 : 0);

  /* Switching scope clears the column filters — the options come from the
     scope, so a value picked under Active is usually absent from Archived. */
  const selectScope = (next) => {
    setScope((prev) => (prev === next && next !== "active" ? "active" : next));
    setFilters({ ...EMPTY_ACTION_FILTERS });
    setOpenFilter(null);
  };

  const persist = async (next) => { setBusy(true); await onSaveActions(next); setBusy(false); };

  const openAdd = () => {
    setEditing(null); setShowCustomCat(false);
    setForm({ action: "", category: meetingCategory, assignedTo: "", dueDate: toInputDate(meetingDate), status: "In Progress" });
    setShowForm(true);
  };
  const openEdit = (a) => {
    setEditing(a); setShowCustomCat(false);
    setForm({ action: a.title || "", category: a.category || meetingCategory,
      assignedTo: a.assignedTo || "", dueDate: a.dueDate || "", status: a.status || "In Progress" });
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
    if (!form.action.trim()) return;
    if (editing) {
      await persist(actions.map((a) => {
        if (a.id !== editing.id) return a;
        const dueChanged = (a.dueDate || "") !== (form.dueDate || "");
        // `description` is left exactly as it was — context attached at
        // source is not the user's to lose by editing the wording here.
        return { ...a, title: form.action.trim(),
          category: form.category, assignedTo: form.assignedTo, dueDate: form.dueDate, status: form.status,
          revisedDate: dueChanged ? new Date().toISOString().split("T")[0] : a.revisedDate || null,
          updatedAt: new Date().toISOString() };
      }));
    } else {
      await persist([...actions, {
        id: generateId(), title: form.action.trim(), description: "",
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

  const th = { padding: "10px 12px", textAlign: "left", backgroundColor: "#f0e6d9", color: "#4a352f",
    fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px",
    borderBottom: "2px solid #d7ccc8", borderRight: "1px solid #e0d5c8", position: "relative", overflow: "visible" };
  const td = { padding: "10px 12px", borderBottom: "1px solid #f0e6d9", borderRight: "1px solid #f7f3f0",
    fontSize: "13px", color: "#4a352f", verticalAlign: "middle", overflow: "hidden" };
  const iconBtn = (c) => ({ background: "none", border: "none", cursor: "pointer", padding: "4px 5px", borderRadius: "4px", color: c, display: "inline-flex", alignItems: "center" });
  const inp = (bad) => ({ width: "100%", padding: "10px 12px", border: bad ? "2px solid #f44336" : "2px solid #e8ddd4", borderRadius: "6px", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box", backgroundColor: "white" });
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginBottom: "14px" }}>
        {CHIPS.map((chip) => {
          const on = scope === chip.key;
          return (
            <button key={chip.key} onClick={() => selectScope(chip.key)} title={chip.hint}
              style={{ textAlign: "left", padding: "12px 14px", borderRadius: "8px", cursor: "pointer",
                backgroundColor: chip.bg, border: on ? `2px solid ${chip.color}` : "2px solid transparent",
                boxShadow: on ? `0 2px 8px ${chip.color}33` : "none",
                display: "flex", alignItems: "center", gap: "12px", fontFamily: "inherit" }}>
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "#8d6e63", backgroundColor: "#f7f3f0", border: "1px solid #e8ddd4", padding: "4px 10px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <FaClipboardList size={10} /> Showing {rows.length} {scope === "active" ? "active" : scope === "done" ? "completed" : scope === "overdue" ? "overdue" : "archived"}
          </span>
          {scope !== "active" && (
            <button onClick={() => selectScope("active")} style={{ fontSize: "11px", color: "#7d5a50", background: "none", border: "1px solid #e8ddd4", borderRadius: "12px", padding: "4px 10px", cursor: "pointer" }}>
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
            <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", backgroundColor: "#7d5a50", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
              <FaPlus size={12} /> New Action
            </button>
          )}
        </div>
      </div>

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
                        textTransform: "none", letterSpacing: "normal", fontWeight: 400 }}>
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
                      {showArchived ? "No archived actions" : scope === "done" ? "Nothing completed and unarchived"
                        : scope === "overdue" ? "Nothing overdue" : "No actions yet"}
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
                    {/* Context attached where the action was raised. */}
                    {a.description && <div style={{ fontSize: "11px", color: "#8d6e63", marginTop: "2px" }}>{a.description}</div>}
                    {a.sourceModule && (
                      <div style={{ fontSize: "10px", color: "#bdbdbd", marginTop: "2px" }}>
                        From {a.sourceModule}{a.sourceKpi ? ` · ${a.sourceKpi}` : ""}
                      </div>
                    )}
                  </td>
                  <td style={{ ...td, width: widths.assignedTo }}>{a.assignedTo || <span style={{ color: "#bdbdbd" }}>Unassigned</span>}</td>
                  <td style={{ ...td, width: widths.dueDate }}>
                    {a.dueDate ? <span style={{ color: dueDateColor(a.dueDate), fontWeight: 500 }}>{formatDMY(a.dueDate)}</span> : <span style={{ color: "#bdbdbd" }}>—</span>}
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

            {/* One field. It is the Action column, here and in Integrated Actions. */}
            <div style={{ marginBottom: "14px" }}>
              <label style={lbl}>Action *</label>
              <textarea rows="3" placeholder="What needs to be done, by the time it is due?" value={form.action}
                onChange={(e) => setForm({ ...form, action: e.target.value })}
                style={{ ...inp(!form.action.trim()), resize: "vertical" }} />
              <p style={{ fontSize: "11px", color: "#8d6e63", margin: "6px 0 0", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                <FaInfoCircle size={10} style={{ marginTop: "2px", flexShrink: 0 }} />
                This is the wording that appears in the Action column.
              </p>
            </div>

            {/* Context carried from wherever the action was raised — shown,
                not editable, so editing the wording can't discard it. */}
            {editing?.description && (
              <div style={{ backgroundColor: "#f7f3f0", border: "1px solid #e8ddd4", borderRadius: "6px", padding: "10px 12px", marginBottom: "14px", fontSize: "12px", color: "#8d6e63", lineHeight: 1.6 }}>
                <strong style={{ color: "#4a352f" }}>Attached context: </strong>{editing.description}
              </div>
            )}

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
                <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} style={{ ...inp(false), cursor: "pointer" }}>
                  <option value="">Unassigned</option>
                  {participants.map((p, i) => {
                    const name = typeof p === "string" ? p : p.name || p.email || "Participant";
                    return <option key={i} value={name}>{name}</option>;
                  })}
                </select>
                {participants.length === 0 && <div style={{ fontSize: "11px", color: "#8d6e63", marginTop: "4px" }}>No participants on this meeting yet.</div>}
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
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ ...inp(false), cursor: "pointer" }}>
                {ACTION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "10px", backgroundColor: "#e6d7c3", color: "#4a352f", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}>Cancel</button>
              <button onClick={submit} disabled={busy || !form.action.trim()}
                style={{ flex: 1, padding: "10px", backgroundColor: "#7d5a50", color: "white", border: "none", borderRadius: "6px", cursor: busy ? "not-allowed" : "pointer", fontWeight: 500, opacity: busy || !form.action.trim() ? 0.6 : 1 }}>
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

/* ─── Inline editable field — white content box ─────────────────────────── */
const EditableField = ({ icon, label, value, placeholder, onSave, disabled }) => {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value || "");
  useEffect(() => { if (!editing) setTemp(value || ""); }, [value, editing]);

  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "#8d6e63", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
          <textarea value={temp} onChange={(e) => setTemp(e.target.value)} rows="4" placeholder={placeholder}
            style={{ backgroundColor: "#ffffff", padding: "12px 16px", borderRadius: "6px", border: "1px solid #e8ddd4",
              minHeight: "80px", fontSize: "14px", color: "#4a352f", lineHeight: 1.6, width: "100%",
              fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", outline: "none" }} />
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
        <div style={{ backgroundColor: "#ffffff", padding: "12px 16px", borderRadius: "6px", minHeight: "44px",
          border: "1px solid #e8ddd4", fontSize: "14px", whiteSpace: "pre-wrap", lineHeight: 1.6,
          color: value ? "#4a352f" : "#bdbdbd", fontStyle: value ? "normal" : "italic" }}>
          {value || placeholder}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Full Overview
   ════════════════════════════════════════════════════════════════════════ */
const RapsOverview = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState([]);
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const meetingId = useMemo(
    () => new URLSearchParams(location.search).get("meeting"),
    [location.search]
  );

  const notify = (type, message, ms = 3000) => {
    setNotification({ type, message: String(message) });
    setTimeout(() => setNotification(null), ms);
  };

  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged((u) => setCurrentUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    if (!meetingId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "governanceCalendar", currentUser.uid));
        const list = snap.exists() ? snap.data().meetings || [] : [];
        setMeetings(list);
        setMeeting(list.find((m) => m.id === meetingId) || null);
      } catch (error) {
        console.error("Error loading meeting:", error);
        notify("error", `Failed to load meeting: ${errText(error)}`);
      } finally { setLoading(false); }
    })();
  }, [currentUser, meetingId]);

  const persist = async (updatedMeetings) => {
    setMeetings(updatedMeetings);
    setMeeting(updatedMeetings.find((m) => m.id === meetingId) || null);
    await setDoc(doc(db, "governanceCalendar", currentUser.uid),
      { meetings: updatedMeetings, updatedAt: new Date().toISOString(), userId: currentUser.uid }, { merge: true });
  };

  const saveField = async (field, value) => {
    try {
      await persist(meetings.map((m) => (m.id === meetingId ? { ...m, [field]: value, updatedAt: new Date().toISOString() } : m)));
      notify("success", "Saved.", 2000);
    } catch (error) {
      console.error("Error saving field:", error);
      notify("error", `Failed to save: ${errText(error)}`);
    }
  };

  /* Actions live on the meeting — the same array /raps-actions reads and the
     calendar popup edits, so there is nothing to sync between them. */
  const saveActions = async (nextActions) => {
    try {
      await persist(meetings.map((m) => (m.id === meetingId ? { ...m, actions: nextActions, updatedAt: new Date().toISOString() } : m)));
      notify("success", "Actions updated — also visible in Integrated Actions.", 2500);
    } catch (error) {
      console.error("Error saving actions:", error);
      notify("error", `Failed to save the action: ${errText(error)}`);
    }
  };

  const getStatus = () => {
    const date = getMeetingDate(meeting);
    if (!date) return { label: "Unknown", color: "#757575" };
    const d = new Date(date);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return { label: "Today", color: "#FF9800" };
    if (d > today) return { label: "Upcoming", color: "#4CAF50" };
    return { label: "Past", color: "#9E9E9E" };
  };

  const container = { padding: "40px", maxWidth: "1200px", margin: "0 auto", marginTop: "5px", backgroundColor: "#fdfcfb", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" };
  const card = { backgroundColor: "white", borderRadius: "8px", border: "1px solid #e8ddd4", padding: "22px", marginBottom: "18px" };
  const cardTitle = { fontSize: "13px", fontWeight: 600, color: "#8d6e63", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" };
  const chip = { display: "inline-block", padding: "4px 12px", backgroundColor: "#ffffff", borderRadius: "16px", fontSize: "13px", color: "#4a352f", margin: "4px 4px 0 0", border: "1px solid #e8ddd4" };
  const tabStyle = (a) => ({ padding: "12px 22px", cursor: "pointer", fontSize: "14px", fontWeight: a ? 600 : 500, color: a ? "#7d5a50" : "#8d6e63", borderBottom: a ? "3px solid #7d5a50" : "3px solid transparent", background: "none", border: "none", display: "flex", alignItems: "center", gap: "8px" });
  const quickBtn = { padding: "9px 16px", backgroundColor: "#ffffff", border: "1px solid #e8ddd4", borderRadius: "6px", cursor: "pointer", fontSize: "13px", color: "#4a352f", display: "inline-flex", alignItems: "center", gap: "7px" };

  if (loading) {
    return <div style={container}><div style={{ textAlign: "center", padding: "40px", color: "#8d6e63" }}>Loading meeting details...</div></div>;
  }

  if (!meetingId) {
    return (
      <div style={container}>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <FaCalendarAlt size={40} color="#d7ccc8" />
          <h2 style={{ color: "#5d4037", marginTop: "16px" }}>No Meeting Selected</h2>
          <p style={{ color: "#8d6e63" }}>Please select a meeting from the Governance Calendar.</p>
          <button onClick={() => navigate("/governance-calendar")} style={quickBtn}><FaArrowLeft size={11} /> Back to Calendar</button>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div style={container}>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <FaSearch size={36} color="#d7ccc8" />
          <h2 style={{ color: "#5d4037", marginTop: "16px" }}>Meeting Not Found</h2>
          <p style={{ color: "#8d6e63" }}>The meeting you're looking for doesn't exist.</p>
          <button onClick={() => navigate("/governance-calendar")} style={quickBtn}><FaArrowLeft size={11} /> Back to Calendar</button>
        </div>
      </div>
    );
  }

  const status = getStatus();
  const date = getMeetingDate(meeting);
  const instance = meeting.instances?.[0];

  return (
    <div style={container}>
      {notification && (
        <div style={{
          padding: "12px 16px", borderRadius: "8px", marginBottom: "16px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          backgroundColor: notification.type === "error" ? "#FFEBEE" : "#E8F5E9",
          borderLeft: `4px solid ${notification.type === "error" ? "#F44336" : "#4CAF50"}`,
        }}>
          <span style={{ color: "#4a352f", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            {notification.type === "error" ? <FaTimesCircle color="#F44336" size={14} /> : <FaCheckCircle color="#4CAF50" size={14} />}
            {notification.message}
          </span>
          <button onClick={() => setNotification(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8d6e63" }}>
            <FaTimes size={14} />
          </button>
        </div>
      )}

      <div style={{ marginBottom: "22px", paddingBottom: "18px", borderBottom: "2px solid #e8ddd4" }}>
        <button onClick={() => navigate("/governance-calendar")}
          style={{ padding: 0, background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "#7d5a50", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
          <FaArrowLeft size={12} /> Back to Calendar
        </button>
        <h1 style={{ color: "#5d4037", fontSize: "26px", fontWeight: 700, margin: 0 }}>{meeting.title}</h1>
        <div style={{ color: "#8d6e63", fontSize: "14px", marginTop: "8px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><FaFolderOpen size={11} /> {meeting.category || meeting.department}</span>
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><FaCalendarAlt size={11} /> {date ? formatDMY(date) : "No date"}</span>
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><FaClock size={11} /> {instance?.time || "TBD"}</span>
          <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, backgroundColor: `${status.color}20`, color: status.color }}>
            {status.label}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "2px solid #e8ddd4", gap: "4px", marginBottom: "22px", flexWrap: "wrap" }}>
        <button style={tabStyle(activeTab === "overview")} onClick={() => setActiveTab("overview")}>
          <FaClipboardList size={13} /> Meeting Overview
        </button>
        <button style={tabStyle(activeTab === "performance")} onClick={() => setActiveTab("performance")}>
          <FaChartLine size={13} /> Performance Overview
        </button>
        <button style={tabStyle(activeTab === "actions")} onClick={() => setActiveTab("actions")}>
          <FaTasks size={13} /> Meeting Actions
        </button>
      </div>

      {activeTab === "overview" && (
        <>
          <div style={card}>
            <div style={cardTitle}><FaInfoCircle size={12} /> Meeting Information</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#8d6e63", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <FaCalendarAlt size={10} /> Date
                </div>
                <div style={{ fontSize: "15px", color: "#4a352f", fontWeight: 500, marginTop: "4px" }}>
                  {date ? new Date(date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "TBD"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#8d6e63", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <FaClock size={10} /> Time
                </div>
                <div style={{ fontSize: "15px", color: "#4a352f", fontWeight: 500, marginTop: "4px" }}>{instance?.time || "TBD"}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#8d6e63", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <FaMapMarkerAlt size={10} /> Location
                </div>
                <div style={{ fontSize: "15px", color: "#4a352f", fontWeight: 500, marginTop: "4px" }}>{meeting.location || "Virtual"}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#8d6e63", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <FaSyncAlt size={10} /> Frequency
                </div>
                <div style={{ fontSize: "15px", color: "#4a352f", fontWeight: 500, marginTop: "4px" }}>
                  {meeting.isRecurring
                    ? meeting.recurrencePattern === "weekly" ? "Weekly"
                      : meeting.recurrencePattern === "monthly" ? "Monthly"
                      : meeting.recurrencePattern === "quarterly" ? "Quarterly" : "Custom"
                    : "One-time"}
                </div>
              </div>
            </div>

            {meeting.departments?.length > 0 && (
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e8ddd4" }}>
                <div style={{ fontSize: "11px", color: "#8d6e63", textTransform: "uppercase", letterSpacing: "0.5px" }}>Departments</div>
                <div style={{ marginTop: "6px" }}>
                  {meeting.departments.map((d, i) => <span key={i} style={chip}>{d}</span>)}
                </div>
              </div>
            )}

            {meeting.participants?.length > 0 && (
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e8ddd4" }}>
                <div style={{ fontSize: "11px", color: "#8d6e63", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <FaUsers size={10} /> Participants
                </div>
                <div style={{ marginTop: "6px" }}>
                  {meeting.participants.map((p, i) => (
                    <span key={i} style={chip}>{typeof p === "string" ? p : p.name || p.email || "Participant"}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={card}>
            <div style={cardTitle}><FaFileAlt size={12} /> Meeting Details</div>
            <EditableField icon={<FaBullseye size={11} />} label="Purpose" value={meeting.purpose}
              placeholder="What is the goal of this meeting?" onSave={(v) => saveField("purpose", v)} />
            <EditableField icon={<FaClipboardList size={11} />} label="Agenda" value={meeting.agenda}
              placeholder="List the agenda items to be covered." onSave={(v) => saveField("agenda", v)} />
            <EditableField icon={<FaFolderOpen size={11} />} label="Preparations (What is needed)" value={meeting.preparations}
              placeholder="Documents, data, or people needed before this meeting." onSave={(v) => saveField("preparations", v)} />
          </div>
        </>
      )}

      {activeTab === "performance" && (
        <KmsOverview meeting={meeting} onSave={(field, value) => saveField(field, value)} />
      )}

      {activeTab === "actions" && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ ...cardTitle, marginBottom: 0 }}><FaTasks size={12} /> Meeting Actions</div>
            <button onClick={() => navigate(`/raps-actions?meeting=${meeting.id}`)}
              style={{ background: "none", border: "none", color: "#7d5a50", cursor: "pointer", fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", gap: "5px" }}>
              Open in Integrated Actions <FaArrowRight size={11} />
            </button>
          </div>

          <MeetingActionsTable meeting={meeting} categories={RAPS_CATEGORIES} onSaveActions={saveActions} />

          <button onClick={() => navigate(`/raps-actions?meeting=${meeting.id}`)}
            style={{ width: "100%", marginTop: "16px", padding: "10px", backgroundColor: "#7d5a50", color: "white",
              border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 500,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <FaExternalLinkAlt size={12} /> Open in Integrated Actions (RAPS)
          </button>
        </div>
      )}

      <div style={{ ...card, border: "2px solid #e8ddd4" }}>
        <div style={cardTitle}>Quick Actions</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <button onClick={() => navigate("/governance-calendar")} style={quickBtn}><FaCalendarAlt size={12} /> Open Calendar</button>
          <button onClick={() => navigate(`/raps-actions?meeting=${meeting.id}`)} style={quickBtn}><FaClipboardList size={12} /> Manage Actions</button>
          <button onClick={() => navigate(`/governance-calendar?meeting=${meeting.id}&edit=true`)} style={quickBtn}><FaEdit size={12} /> Edit Meeting</button>
        </div>
      </div>
    </div>
  );
};

export default RapsOverview;