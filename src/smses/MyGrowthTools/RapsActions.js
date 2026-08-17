import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
  FaSearch, FaPlus, FaEdit, FaTrash, FaChevronDown, FaChevronUp,
  FaChevronLeft, FaChevronRight, FaCalendarAlt, FaSort, FaSortUp, FaSortDown,
  FaArchive, FaBoxOpen, FaUndo, FaRegSquare, FaCheckCircle, FaExclamationTriangle,
  FaTimes, FaTimesCircle, FaInfoCircle, FaClipboardList, FaExternalLinkAlt,
  FaUsers, FaLayerGroup, FaArrowLeft, FaTasks,
} from "react-icons/fa";

/* ─── Categories — same vocabulary as the Governance Calendar ───────────── */
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
const formatDMY = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const toInputDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
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

/* ─── Calendar picker for the date column filters ───────────────────────── */
const CalendarPicker = ({ onSelect, onClose, noDateLabel }) => {
  const [current, setCurrent] = useState(new Date());
  const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
  const firstDay = new Date(current.getFullYear(), current.getMonth(), 1).getDay();
  const today = new Date();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <div onClick={(e) => e.stopPropagation()} style={{
      position: "absolute", top: "100%", left: 0, marginTop: "4px", backgroundColor: "white",
      border: "2px solid #e8ddd4", borderRadius: "8px", padding: "14px", zIndex: 300,
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

/* ─── Columns ───────────────────────────────────────────────────────────── */
const COLUMNS = [
  { key: "category", label: "Category", width: 180, sortable: true, filter: "list" },
  { key: "meeting", label: "Meeting", width: 200, sortable: true, filter: "list" },
  { key: "title", label: "Action", width: 260, sortable: true, filter: "list" },
  { key: "assignedTo", label: "By Whom", width: 150, sortable: true, filter: "list" },
  { key: "dueDate", label: "By When", width: 130, sortable: true, filter: "date" },
  { key: "revisedDate", label: "Revised Date", width: 130, sortable: true, filter: "date" },
  { key: "status", label: "Status", width: 130, sortable: true, filter: "list" },
];
const ACTIONS_WIDTH = 150;
const MIN_WIDTH = 90;

const EMPTY_FILTERS = {
  category: "all", meeting: "all", title: "all",
  assignedTo: "all", dueDate: "all", revisedDate: "all", status: "all",
};

const RapsActions = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /* One of: "active" | "done" | "overdue" | "archived".
     Driven by the stat chips, which are buttons rather than labels — the
     numbers are the fastest way into the rows they describe. */
  const [scope, setScope] = useState("active");

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [openFilter, setOpenFilter] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [widths, setWidths] = useState(Object.fromEntries(COLUMNS.map((c) => [c.key, c.width])));
  const resizing = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [customCategories, setCustomCategories] = useState([]);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");

  /* One field, `action`, maps onto the stored `title` — the Action column on
     this page. Any description an action already carries (context attached
     when it was raised from a KPI, say) is preserved untouched on edit. */
  const [form, setForm] = useState({
    meetingId: "", action: "", category: "",
    assignedTo: "", dueDate: "", status: "In Progress",
  });

  const filterMeetingId = useMemo(
    () => new URLSearchParams(location.search).get("meeting"),
    [location.search]
  );

  const notify = (type, message, ms = 3500) => {
    setNotification({ type, message: String(message) });
    setTimeout(() => setNotification(null), ms);
  };

  /* ─── Auth + load ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((u) => setCurrentUser(u || null));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "governanceCalendar", currentUser.uid));
        setMeetings(snap.exists() ? snap.data().meetings || [] : []);
      } catch (error) {
        console.error("Error loading meetings:", error);
        notify("error", `Failed to load actions: ${errText(error)}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  const saveMeetings = async (updated) => {
    try {
      await setDoc(
        doc(db, "governanceCalendar", currentUser.uid),
        { meetings: updated, updatedAt: new Date().toISOString(), userId: currentUser.uid },
        { merge: true }
      );
      setMeetings(updated);
      return true;
    } catch (error) {
      console.error("Error saving:", error);
      notify("error", `Failed to save changes: ${errText(error)}`);
      return false;
    }
  };

  /* ─── Categories ──────────────────────────────────────────────────────── */
  const allCategories = useMemo(() => {
    const seen = new Map();
    [...RAPS_CATEGORIES, ...customCategories].forEach((c) => seen.set(c.name, c));
    meetings.forEach((m) => {
      [m.category, ...(m.actions || []).map((a) => a.category)].forEach((name) => {
        if (name && !seen.has(name)) seen.set(name, { name, color: "#607D8B", bg: "#ECEFF1" });
      });
    });
    return Array.from(seen.values());
  }, [customCategories, meetings]);

  const categoryMeta = (name) =>
    allCategories.find((c) => c.name === name) || { name, color: "#757575", bg: "#EEEEEE" };

  /* ─── Rows ────────────────────────────────────────────────────────────── */
  const allRows = useMemo(() => {
    const rows = [];
    const scoped = filterMeetingId ? meetings.filter((m) => m.id === filterMeetingId) : meetings;
    scoped.forEach((meeting) => {
      (meeting.actions || []).forEach((action) => {
        rows.push({
          ...action,
          category: action.category || meeting.category || meeting.department || "General",
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          meetingDate: getMeetingDate(meeting),
          meetingParticipants: meeting.participants || [],
        });
      });
    });
    return rows;
  }, [meetings, filterMeetingId]);

  /* The four numbers the chips show — computed once, so the chip and the
     table can never disagree about what they mean. */
  const stats = useMemo(() => {
    const active = allRows.filter((r) => !r.archived);
    return {
      active: active.length,
      done: active.filter((r) => r.status === "Done" || r.status === "completed").length,
      overdue: active.filter(isOverdue).length,
      archived: allRows.filter((r) => r.archived).length,
    };
  }, [allRows]);

  const showArchived = scope === "archived";

  const scopeRows = useMemo(() => {
    if (scope === "archived") return allRows.filter((r) => r.archived);
    const active = allRows.filter((r) => !r.archived);
    if (scope === "done") return active.filter((r) => r.status === "Done" || r.status === "completed");
    if (scope === "overdue") return active.filter(isOverdue);
    return active;
  }, [allRows, scope]);

  const optionsFor = (key) => {
    const values = new Set();
    scopeRows.forEach((r) => {
      let v = "";
      if (key === "category") v = r.category;
      else if (key === "meeting") v = r.meetingTitle || "Untitled meeting";
      else if (key === "title") v = r.title || "Untitled";
      else if (key === "assignedTo") v = r.assignedTo || "Unassigned";
      else if (key === "status") v = r.status || "Not Done";
      if (v) values.add(v);
    });
    return ["all", ...Array.from(values).sort()];
  };

  const rows = useMemo(() => {
    let list = [...scopeRows];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (r) =>
          (r.title || "").toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q) ||
          (r.assignedTo || "").toLowerCase().includes(q) ||
          (r.meetingTitle || "").toLowerCase().includes(q) ||
          (r.category || "").toLowerCase().includes(q)
      );
    }

    list = list.filter((r) => {
      if (filters.category !== "all" && r.category !== filters.category) return false;
      if (filters.meeting !== "all" && (r.meetingTitle || "Untitled meeting") !== filters.meeting) return false;
      if (filters.title !== "all" && (r.title || "Untitled") !== filters.title) return false;
      if (filters.assignedTo !== "all" && (r.assignedTo || "Unassigned") !== filters.assignedTo) return false;
      if (filters.status !== "all" && (r.status || "Not Done") !== filters.status) return false;
      if (filters.dueDate !== "all") {
        if (filters.dueDate === "No Date") { if (r.dueDate) return false; }
        else if (formatDMY(r.dueDate) !== filters.dueDate) return false;
      }
      if (filters.revisedDate !== "all") {
        if (filters.revisedDate === "No Revision") { if (r.revisedDate) return false; }
        else if (formatDMY(r.revisedDate) !== filters.revisedDate) return false;
      }
      return true;
    });

    if (sortConfig.key) {
      const get = (r) => {
        switch (sortConfig.key) {
          case "category": return r.category || "";
          case "meeting": return r.meetingTitle || "";
          case "title": return r.title || "";
          case "assignedTo": return r.assignedTo || "";
          case "dueDate": return r.dueDate || "";
          case "revisedDate": return r.revisedDate || "";
          case "status": return r.status || "";
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
  }, [scopeRows, searchTerm, filters, sortConfig]);

  const activeFilterCount =
    Object.values(filters).filter((v) => v !== "all").length + (searchTerm.trim() ? 1 : 0);

  /* ─── Resize ──────────────────────────────────────────────────────────── */
  const startResize = (e, key) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = widths[key];
    resizing.current = key;
    const onMove = (ev) =>
      setWidths((p) => ({ ...p, [key]: Math.max(MIN_WIDTH, startWidth + (ev.clientX - startX)) }));
    const onUp = () => {
      resizing.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const toggleSort = (key) =>
    setSortConfig((p) => ({ key, direction: p.key === key && p.direction === "asc" ? "desc" : "asc" }));

  const clearAll = () => {
    setFilters({ ...EMPTY_FILTERS });
    setSearchTerm("");
    setSortConfig({ key: null, direction: "asc" });
  };

  /* Changing scope clears the column filters — options are drawn from the
     scope, so a filter picked under Active is usually meaningless under
     Archived and would silently empty the table. */
  const selectScope = (next) => {
    setScope((prev) => (prev === next && next !== "active" ? "active" : next));
    setFilters({ ...EMPTY_FILTERS });
    setOpenFilter(null);
  };

  /* ─── Meeting-driven defaults ─────────────────────────────────────────────
     Picking a meeting fills in what the meeting already knows: its category,
     its date as the due date, its participants as the By Whom list. Only
     untouched fields are overwritten, so changing the meeting after typing a
     due date doesn't discard it. */
  const applyMeetingDefaults = (meetingId, prev, { force = false } = {}) => {
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting) return { ...prev, meetingId };

    const meetingCategory = meeting.category || meeting.department || "General";
    const meetingDate = toInputDate(getMeetingDate(meeting));
    const prevMeeting = meetings.find((m) => m.id === prev.meetingId);
    const prevCategory = prevMeeting ? prevMeeting.category || prevMeeting.department || "General" : "";
    const prevDate = prevMeeting ? toInputDate(getMeetingDate(prevMeeting)) : "";
    const names = (meeting.participants || []).map((p) =>
      typeof p === "string" ? p : p.name || p.email || ""
    );

    return {
      ...prev,
      meetingId,
      category: force || !prev.category || prev.category === prevCategory ? meetingCategory : prev.category,
      dueDate: force || !prev.dueDate || prev.dueDate === prevDate ? meetingDate : prev.dueDate,
      assignedTo: names.includes(prev.assignedTo) ? prev.assignedTo : "",
    };
  };

  const selectedMeeting = useMemo(
    () => meetings.find((m) => m.id === form.meetingId) || null,
    [meetings, form.meetingId]
  );

  const openAdd = () => {
    if (meetings.length === 0) {
      notify("warning", "No meetings found. Create a meeting first.");
      return;
    }
    const initialId =
      filterMeetingId && meetings.some((m) => m.id === filterMeetingId) ? filterMeetingId : meetings[0].id;
    setEditing(null);
    setShowCustomCategory(false);
    setForm(applyMeetingDefaults(initialId, {
      meetingId: "", action: "", category: "",
      assignedTo: "", dueDate: "", status: "In Progress",
    }, { force: true }));
    setShowModal(true);
  };

  const openEdit = (row) => {
    setEditing({ meetingId: row.meetingId, action: row });
    setShowCustomCategory(false);
    setForm({
      meetingId: row.meetingId, action: row.title || "",
      category: row.category, assignedTo: row.assignedTo || "",
      dueDate: row.dueDate || "", status: row.status || "In Progress",
    });
    setShowModal(true);
  };

  const addCustomCategory = () => {
    const name = customCategoryName.trim();
    if (!name) return;
    if (!allCategories.some((c) => c.name === name)) {
      setCustomCategories((p) => [...p, { name, color: "#607D8B", bg: "#ECEFF1" }]);
    }
    setForm((p) => ({ ...p, category: name }));
    setCustomCategoryName("");
    setShowCustomCategory(false);
  };

  /* ─── Save ────────────────────────────────────────────────────────────── */
  const submit = async () => {
    if (!form.meetingId || !form.action.trim()) {
      notify("error", "Please select a meeting and write the action.");
      return;
    }
    setSubmitting(true);
    let updated;

    if (editing) {
      const moved = editing.meetingId !== form.meetingId;
      const patched = (action) => {
        const dueChanged = (action.dueDate || "") !== (form.dueDate || "");
        return {
          ...action,
          // `description` is left exactly as it was — context attached at
          // source is not the user's to lose by editing the wording here.
          title: form.action.trim(),
          category: form.category, assignedTo: form.assignedTo,
          dueDate: form.dueDate, status: form.status,
          revisedDate: dueChanged ? new Date().toISOString().split("T")[0] : action.revisedDate || null,
          updatedAt: new Date().toISOString(),
        };
      };

      if (moved) {
        // Lift it out of the old meeting and append to the new, keeping its id
        // and history intact.
        const original = (meetings.find((m) => m.id === editing.meetingId)?.actions || [])
          .find((a) => a.id === editing.action.id);
        const carried = patched(original || editing.action);
        updated = meetings.map((m) => {
          if (m.id === editing.meetingId) {
            return { ...m, actions: (m.actions || []).filter((a) => a.id !== editing.action.id) };
          }
          if (m.id === form.meetingId) {
            return { ...m, actions: [...(m.actions || []), { ...carried, meetingId: m.id }] };
          }
          return m;
        });
      } else {
        updated = meetings.map((m) =>
          m.id !== form.meetingId ? m
            : { ...m, actions: (m.actions || []).map((a) => (a.id === editing.action.id ? patched(a) : a)) }
        );
      }
    } else {
      const newAction = {
        id: generateId(), title: form.action.trim(), description: "",
        category: form.category, assignedTo: form.assignedTo, dueDate: form.dueDate,
        status: form.status, archived: false, meetingId: form.meetingId,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), revisedDate: null,
      };
      updated = meetings.map((m) =>
        m.id === form.meetingId ? { ...m, actions: [...(m.actions || []), newAction] } : m
      );
    }

    const ok = await saveMeetings(updated);
    if (ok) {
      notify("success", editing ? "Action updated." : "Action added.");
      setShowModal(false);
      setEditing(null);
    }
    setSubmitting(false);
  };

  const patchAction = async (row, patch) =>
    saveMeetings(meetings.map((m) =>
      m.id !== row.meetingId ? m
        : { ...m, actions: (m.actions || []).map((a) => (a.id === row.id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a)) }
    ));

  const markDone = async (row) => {
    const ok = await patchAction(row, { status: row.status === "Done" ? "In Progress" : "Done" });
    if (ok && row.status !== "Done") notify("success", "Marked as done — you can now archive it.");
  };

  const archive = async (row) => {
    const ok = await patchAction(row, { archived: true, archivedAt: new Date().toISOString() });
    if (ok) notify("success", "Action archived.");
  };

  const restore = async (row) => {
    const ok = await patchAction(row, { archived: false, archivedAt: null });
    if (ok) notify("success", "Action restored to active actions.");
  };

  const remove = async (row) => {
    if (!window.confirm("Delete this action permanently?")) return;
    const ok = await saveMeetings(meetings.map((m) =>
      m.id !== row.meetingId ? m : { ...m, actions: (m.actions || []).filter((a) => a.id !== row.id) }
    ));
    if (ok) notify("warning", "Action deleted.");
  };

  /* ─── Styles ──────────────────────────────────────────────────────────── */
  const container = { padding: "32px", maxWidth: "1400px", margin: "0 auto", backgroundColor: "#fdfcfb", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" };
  const th = {
    padding: "11px 14px", textAlign: "left", backgroundColor: "#f0e6d9", color: "#4a352f",
    fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px",
    borderBottom: "2px solid #d7ccc8", borderRight: "1px solid #e0d5c8", position: "relative", overflow: "visible",
  };
  const td = {
    padding: "11px 14px", borderBottom: "1px solid #f0e6d9", borderRight: "1px solid #f7f3f0",
    fontSize: "13px", color: "#4a352f", verticalAlign: "middle", overflow: "hidden",
  };
  const iconBtn = (color) => ({ background: "none", border: "none", cursor: "pointer", padding: "4px 5px", borderRadius: "4px", color, display: "inline-flex", alignItems: "center" });
  const btnPrimary = { padding: "9px 18px", backgroundColor: "#7d5a50", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "8px" };
  const btnGhost = { padding: "9px 16px", backgroundColor: "#e6d7c3", color: "#4a352f", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500, fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "8px" };
  const input = (bad) => ({ width: "100%", padding: "10px 12px", border: bad ? "2px solid #f44336" : "2px solid #e8ddd4", borderRadius: "6px", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" });
  const fieldLabel = { display: "block", fontSize: "13px", fontWeight: 600, color: "#4a352f", marginBottom: "6px" };

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

  const totalWidth = COLUMNS.reduce((s, c) => s + widths[c.key], 0) + ACTIONS_WIDTH;

  /* Each chip is a button into its own slice of the data. */
  const STAT_CHIPS = [
    { key: "active", value: stats.active, label: "Active", hint: "All actions not yet archived", icon: <FaTasks size={12} />, bg: "#FFF3E0", color: "#E65100" },
    { key: "done", value: stats.done, label: "Done, not archived", hint: "Completed but still on the active list", icon: <FaCheckCircle size={12} />, bg: "#E8F5E9", color: "#2E7D32" },
    { key: "overdue", value: stats.overdue, label: "Overdue", hint: "Past their due date and not done", icon: <FaExclamationTriangle size={12} />, bg: "#FFEBEE", color: "#C62828" },
    { key: "archived", value: stats.archived, label: "Archived", hint: "Filed away — still here if you need them", icon: <FaArchive size={12} />, bg: "#ECEFF1", color: "#455A64" },
  ];

  if (loading) {
    return (
      <div style={container}>
        <div style={{ textAlign: "center", padding: "40px", color: "#8d6e63" }}>Loading actions...</div>
      </div>
    );
  }

  return (
    <div style={container}>
      {/* Notification */}
      {notification && (
        <div style={{
          padding: "12px 16px", borderRadius: "8px", marginBottom: "16px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          backgroundColor: notification.type === "success" ? "#E8F5E9" : notification.type === "warning" ? "#FFF3E0" : notification.type === "error" ? "#FFEBEE" : "#E3F2FD",
          borderLeft: `4px solid ${notification.type === "success" ? "#4CAF50" : notification.type === "warning" ? "#FF9800" : notification.type === "error" ? "#F44336" : "#2196F3"}`,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px", color: "#4a352f", fontSize: "14px" }}>
            {notification.type === "success" && <FaCheckCircle color="#4CAF50" size={14} />}
            {notification.type === "warning" && <FaExclamationTriangle color="#FF9800" size={14} />}
            {notification.type === "error" && <FaTimesCircle color="#F44336" size={14} />}
            {notification.type === "info" && <FaInfoCircle color="#2196F3" size={14} />}
            {notification.message}
          </span>
          <button onClick={() => setNotification(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8d6e63" }}>
            <FaTimes size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap", marginBottom: "18px", paddingBottom: "18px", borderBottom: "2px solid #e8ddd4" }}>
        <div>
          <h1 style={{ color: "#5d4037", fontSize: "28px", fontWeight: 700, margin: 0 }}>Integrated Actions</h1>
          <p style={{ color: "#8d6e63", fontSize: "15px", margin: "4px 0 0 0" }}>
            Every action from every governance meeting, in one place.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "white", border: "2px solid #e8ddd4", borderRadius: "6px", padding: "2px 12px" }}>
            <FaSearch size={13} color="#8d6e63" />
            <input type="text" placeholder="Search actions..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: "none", outline: "none", padding: "8px 2px", fontSize: "14px", fontFamily: "inherit", width: "180px", backgroundColor: "transparent" }} />
          </div>
          {!showArchived && <button onClick={openAdd} style={btnPrimary}><FaPlus size={12} /> New Action</button>}
        </div>
      </div>

      {/* Stat chips — clickable filters, not labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
        {STAT_CHIPS.map((chip) => {
          const active = scope === chip.key;
          return (
            <button key={chip.key} onClick={() => selectScope(chip.key)} title={chip.hint}
              style={{
                textAlign: "left", padding: "14px 16px", borderRadius: "8px", cursor: "pointer",
                backgroundColor: chip.bg,
                border: active ? `2px solid ${chip.color}` : "2px solid transparent",
                boxShadow: active ? `0 2px 8px ${chip.color}33` : "0 1px 2px rgba(0,0,0,0.05)",
                display: "flex", alignItems: "center", gap: "14px", fontFamily: "inherit",
                transition: "all 0.15s ease",
              }}>
              <span style={{ color: chip.color, display: "flex" }}>{chip.icon}</span>
              <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <span style={{ fontSize: "24px", fontWeight: 700, color: chip.color, lineHeight: 1 }}>{chip.value}</span>
                <span style={{ fontSize: "11.5px", color: "#6d5a4f", marginTop: "4px" }}>{chip.label}</span>
              </span>
              {active && <FaCheckCircle size={12} color={chip.color} style={{ marginLeft: "auto", flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>

      {/* Scope + filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#8d6e63", backgroundColor: "#f7f3f0", border: "1px solid #e8ddd4", borderRadius: "12px", padding: "4px 12px" }}>
          <FaClipboardList size={11} />
          Showing {rows.length} {scope === "active" ? "active" : scope === "done" ? "completed" : scope === "overdue" ? "overdue" : "archived"} action{rows.length === 1 ? "" : "s"}
        </span>

        {scope !== "active" && (
          <button onClick={() => selectScope("active")}
            style={{ fontSize: "12px", color: "#7d5a50", background: "none", border: "1px solid #e8ddd4", borderRadius: "12px", padding: "4px 12px", cursor: "pointer" }}>
            Back to all active
          </button>
        )}

        {filterMeetingId && (
          <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#0D47A1", backgroundColor: "#E3F2FD", border: "1px solid #90CAF9", borderRadius: "12px", padding: "4px 12px" }}>
            <FaLayerGroup size={11} /> Scoped to one meeting
            <button onClick={() => navigate("/raps-actions")}
              style={{ background: "white", border: "1px solid #90CAF9", borderRadius: "10px", padding: "1px 9px", cursor: "pointer", fontSize: "11px", color: "#0D47A1", fontWeight: 600 }}>
              View all
            </button>
          </span>
        )}

        {activeFilterCount > 0 && (
          <button onClick={clearAll}
            style={{ fontSize: "12px", color: "#7d5a50", background: "none", border: "1px solid #e8ddd4", borderRadius: "12px", padding: "4px 12px", cursor: "pointer" }}>
            Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", border: "1px solid #e8ddd4", borderRadius: "8px", backgroundColor: "white" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, width: totalWidth, minWidth: "100%", tableLayout: "fixed", fontSize: "13px" }}>
          <thead>
            <tr>
              {COLUMNS.map((col) => {
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
                        <button onClick={(e) => { e.stopPropagation(); toggleSort(col.key); }}
                          style={iconBtn(sorted ? "#0D47A1" : "#a1887f")} title="Sort">
                          {sorted ? (sortConfig.direction === "asc" ? <FaSortUp size={11} /> : <FaSortDown size={11} />) : <FaSort size={11} />}
                        </button>
                      )}
                    </div>

                    {isOpen && col.filter === "date" && (
                      <CalendarPicker noDateLabel={col.key === "revisedDate" ? "No Revision" : "No Date"}
                        onSelect={(v) => setFilters((p) => ({ ...p, [col.key]: v }))}
                        onClose={() => setOpenFilter(null)} />
                    )}

                    {isOpen && col.filter === "list" && (
                      <div onMouseLeave={() => setOpenFilter(null)} style={{
                        position: "absolute", top: "100%", left: 0, marginTop: "4px", backgroundColor: "white",
                        border: "2px solid #e8ddd4", borderRadius: "6px", minWidth: "200px", maxHeight: "260px",
                        overflowY: "auto", zIndex: 300, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", padding: "4px 0",
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
              <th style={{ ...th, width: ACTIONS_WIDTH, textAlign: "center", borderRight: "none" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} style={{ ...td, textAlign: "center", padding: "50px 16px", color: "#8d6e63", borderRight: "none" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                    {showArchived ? <FaBoxOpen size={28} color="#d7ccc8" /> : <FaClipboardList size={28} color="#d7ccc8" />}
                    <span style={{ fontWeight: 600, color: "#5d4037" }}>
                      {showArchived ? "No archived actions"
                        : scope === "done" ? "Nothing completed and unarchived"
                        : scope === "overdue" ? "Nothing overdue"
                        : meetings.length === 0 ? "No meetings yet" : "No actions found"}
                    </span>
                    <span style={{ fontSize: "12px" }}>
                      {showArchived ? "Completed actions you archive are kept here."
                        : scope === "done" ? "Completed actions appear here until you archive them."
                        : scope === "overdue" ? "Every action is either on time or already done."
                        : meetings.length === 0 ? "Create a meeting in the Governance Calendar to start adding actions."
                        : activeFilterCount > 0 ? "No actions match your current filters."
                        : "Add your first action to get started."}
                    </span>
                  </div>
                </td>
              </tr>
            ) : rows.map((row) => {
              const meta = categoryMeta(row.category);
              const overdue = isOverdue(row);
              return (
                <tr key={row.id}>
                  <td style={{ ...td, width: widths.category }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px",
                      borderRadius: "12px", fontSize: "11px", fontWeight: 500,
                      backgroundColor: meta.bg, color: meta.color, border: `1px solid ${meta.color}40` }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: meta.color }} />
                      {row.category}
                    </span>
                  </td>

                  <td style={{ ...td, width: widths.meeting, cursor: "pointer" }}
                    onClick={() => navigate(`/governance-calendar?meeting=${row.meetingId}`)} title="Open this meeting">
                    <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                      {row.meetingTitle}<FaExternalLinkAlt size={9} color="#bdbdbd" />
                    </div>
                    <div style={{ fontSize: "11px", color: "#8d6e63" }}>
                      {row.meetingDate ? formatDMY(row.meetingDate) : "No date"}
                    </div>
                  </td>

                  <td style={{ ...td, width: widths.title }}>
                    <div style={{ fontWeight: 500 }}>
                      {row.title}
                      {overdue && (
                        <span style={{ color: "#f44336", fontSize: "11px", fontWeight: 600, marginLeft: "8px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          <FaExclamationTriangle size={9} /> Overdue
                        </span>
                      )}
                    </div>
                    {/* Context attached where the action was raised. */}
                    {row.description && <div style={{ fontSize: "11px", color: "#8d6e63", marginTop: "2px" }}>{row.description}</div>}
                    {row.sourceModule && (
                      <div style={{ fontSize: "10px", color: "#bdbdbd", marginTop: "2px" }}>
                        From {row.sourceModule}{row.sourceKpi ? ` · ${row.sourceKpi}` : ""}
                      </div>
                    )}
                  </td>

                  <td style={{ ...td, width: widths.assignedTo }}>
                    {row.assignedTo || <span style={{ color: "#bdbdbd" }}>Unassigned</span>}
                  </td>

                  <td style={{ ...td, width: widths.dueDate }}>
                    {row.dueDate ? <span style={{ color: dueDateColor(row.dueDate), fontWeight: 500 }}>{formatDMY(row.dueDate)}</span>
                      : <span style={{ color: "#bdbdbd" }}>—</span>}
                  </td>

                  <td style={{ ...td, width: widths.revisedDate }}>
                    {row.revisedDate ? formatDMY(row.revisedDate) : <span style={{ color: "#bdbdbd" }}>—</span>}
                  </td>

                  <td style={{ ...td, width: widths.status }}>{statusBadge(row.status)}</td>

                  <td style={{ ...td, width: ACTIONS_WIDTH, textAlign: "center", borderRight: "none" }}>
                    <div style={{ display: "flex", gap: "2px", justifyContent: "center", alignItems: "center" }}>
                      {showArchived ? (
                        <>
                          <button onClick={() => restore(row)} style={iconBtn("#4CAF50")} title="Restore to active actions"><FaUndo size={13} /></button>
                          <button onClick={() => remove(row)} style={iconBtn("#f44336")} title="Delete permanently"><FaTrash size={13} /></button>
                        </>
                      ) : (
                        <>
                          {/* A completed action offers Archive in place of the
                              tick-box — the tick has nothing left to do. */}
                          {row.status === "Done" ? (
                            <button onClick={() => archive(row)} style={iconBtn("#7d5a50")} title="Archive this completed action"><FaArchive size={14} /></button>
                          ) : (
                            <button onClick={() => markDone(row)} style={iconBtn("#8d6e63")} title="Mark as done"><FaRegSquare size={15} /></button>
                          )}
                          <button onClick={() => openEdit(row)} style={iconBtn("#2196F3")} title="Edit"><FaEdit size={13} /></button>
                          <button onClick={() => remove(row)} style={iconBtn("#f44336")} title="Delete"><FaTrash size={13} /></button>
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
      {showModal && (
        <div onClick={() => setShowModal(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: "white", borderRadius: "12px", width: "100%", maxWidth: "560px", maxHeight: "88vh", overflowY: "auto", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#5d4037", display: "flex", alignItems: "center", gap: "8px" }}>
                {editing ? <FaEdit size={15} /> : <FaPlus size={15} />} {editing ? "Edit Action" : "Add New Action"}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8d6e63" }}>
                <FaTimes size={16} />
              </button>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={fieldLabel}>Meeting *</label>
              <select value={form.meetingId}
                onChange={(e) => setForm((p) => applyMeetingDefaults(e.target.value, p))}
                style={{ ...input(!form.meetingId), backgroundColor: "white", cursor: "pointer" }}>
                <option value="">Select a meeting...</option>
                {meetings.map((m) => {
                  const d = getMeetingDate(m);
                  return (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.category || m.department || "Uncategorized"}){d ? ` — ${formatDMY(d)}` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* What the meeting supplied, stated rather than hidden */}
            {selectedMeeting && (
              <div style={{ backgroundColor: "#f7f3f0", border: "1px solid #e8ddd4", borderRadius: "6px", padding: "10px 12px", marginBottom: "16px", fontSize: "12px", color: "#8d6e63", display: "flex", flexWrap: "wrap", gap: "14px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <FaCalendarAlt size={10} /> {getMeetingDate(selectedMeeting) ? formatDMY(getMeetingDate(selectedMeeting)) : "No date"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <FaUsers size={10} /> {(selectedMeeting.participants || []).length} participant{(selectedMeeting.participants || []).length === 1 ? "" : "s"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <FaInfoCircle size={10} /> Category and due date pre-filled from this meeting
                </span>
              </div>
            )}

            {/* One field. It is the Action column on this page. */}
            <div style={{ marginBottom: "14px" }}>
              <label style={fieldLabel}>Action *</label>
              <textarea rows="3" placeholder="What needs to be done, by the time it is due?" value={form.action}
                onChange={(e) => setForm({ ...form, action: e.target.value })}
                style={{ ...input(!form.action.trim()), resize: "vertical" }} />
              <p style={{ fontSize: "11px", color: "#8d6e63", margin: "6px 0 0", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                <FaInfoCircle size={10} style={{ marginTop: "2px", flexShrink: 0 }} />
                This is the wording that appears in the Action column.
              </p>
            </div>

            {/* Context carried from wherever the action was raised — shown,
                not editable, so editing the wording can't discard it. */}
            {editing?.action?.description && (
              <div style={{ backgroundColor: "#f7f3f0", border: "1px solid #e8ddd4", borderRadius: "6px", padding: "10px 12px", marginBottom: "14px", fontSize: "12px", color: "#8d6e63", lineHeight: 1.6 }}>
                <strong style={{ color: "#4a352f" }}>Attached context: </strong>{editing.action.description}
              </div>
            )}

            <div style={{ marginBottom: "14px" }}>
              <label style={fieldLabel}>
                Category
                {selectedMeeting && form.category === (selectedMeeting.category || selectedMeeting.department || "General") && (
                  <span style={{ fontWeight: 400, color: "#8d6e63", marginLeft: "8px", fontSize: "11px" }}>from meeting</span>
                )}
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
                {showCustomCategory ? (
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input autoFocus type="text" placeholder="New category" value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomCategory()}
                      style={{ padding: "6px 10px", border: "2px solid #e8ddd4", borderRadius: "16px", fontSize: "12.5px", fontFamily: "inherit" }} />
                    <button onClick={addCustomCategory} style={{ background: "none", border: "none", color: "#4CAF50", cursor: "pointer" }}><FaCheckCircle size={15} /></button>
                    <button onClick={() => setShowCustomCategory(false)} style={{ background: "none", border: "none", color: "#8d6e63", cursor: "pointer" }}><FaTimes size={14} /></button>
                  </div>
                ) : (
                  <button onClick={() => setShowCustomCategory(true)}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", border: "2px dashed #d7ccc8", background: "none", color: "#7d5a50", cursor: "pointer", fontSize: "12.5px" }}>
                    <FaPlus size={10} /> Add your own
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label style={fieldLabel}>By Whom</label>
                <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  style={{ ...input(false), backgroundColor: "white", cursor: "pointer" }}>
                  <option value="">Unassigned</option>
                  {(selectedMeeting?.participants || []).map((p, i) => {
                    const name = typeof p === "string" ? p : p.name || p.email || "Participant";
                    return <option key={i} value={name}>{name}</option>;
                  })}
                </select>
                {selectedMeeting && (selectedMeeting.participants || []).length === 0 && (
                  <div style={{ fontSize: "11px", color: "#8d6e63", marginTop: "4px" }}>
                    This meeting has no participants — add them on the meeting to assign owners.
                  </div>
                )}
              </div>
              <div>
                <label style={fieldLabel}>
                  By When
                  {selectedMeeting && form.dueDate && form.dueDate === toInputDate(getMeetingDate(selectedMeeting)) && (
                    <span style={{ fontWeight: 400, color: "#8d6e63", marginLeft: "8px", fontSize: "11px" }}>meeting date</span>
                  )}
                </label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={input(false)} />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={fieldLabel}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={{ ...input(false), backgroundColor: "white", cursor: "pointer" }}>
                {ACTION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowModal(false)} style={{ ...btnGhost, flex: 1, justifyContent: "center" }}>Cancel</button>
              <button onClick={submit} disabled={submitting || !form.action.trim() || !form.meetingId}
                style={{ ...btnPrimary, flex: 1, justifyContent: "center", opacity: submitting || !form.action.trim() || !form.meetingId ? 0.6 : 1 }}>
                {submitting ? "Saving..." : editing ? "Update Action" : "Add Action"}
              </button>
            </div>

            <p style={{ fontSize: "11px", color: "#8d6e63", marginTop: "14px", marginBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}>
              <FaInfoCircle size={10} /> This action also appears in the meeting's Meeting Actions tab.
            </p>
          </div>
        </div>
      )}

      <button onClick={() => navigate("/governance-calendar")}
        style={{ background: "none", border: "none", color: "#7d5a50", fontSize: "14px", fontWeight: 500, marginTop: "20px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", padding: 0 }}>
        <FaArrowLeft size={12} /> Back to Calendar
      </button>
    </div>
  );
};

export default RapsActions;