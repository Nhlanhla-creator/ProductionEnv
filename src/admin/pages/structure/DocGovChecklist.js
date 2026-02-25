import React, { useState, useCallback, useMemo } from "react";
import {
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import {
  SECTION_COLORS,
  SECTION_BADGE_COLORS,
} from "./docGovChecklistData";

const STATUS_OPTIONS = ["Not Started", "In Progress", "Done", "Blocked"];
const PRIORITY_OPTIONS = ["High", "Medium", "Low"];
const CATEGORY_OPTIONS = [
  "Architecture",
  "Database",
  "Deployment",
  "Payments",
  "Governance",
  "Security",
  "Ops",
  "Other",
];

const STATUS_COLORS = {
  "Not Started": { bg: "#f3f4f6", color: "#6b7280" },
  "In Progress": { bg: "#fef9c3", color: "#a16207" },
  Done: { bg: "#dcfce7", color: "#15803d" },
  Blocked: { bg: "#fee2e2", color: "#b91c1c" },
};

const PRIORITY_COLORS = {
  High: { bg: "#fee2e2", color: "#b91c1c" },
  Medium: { bg: "#fef9c3", color: "#a16207" },
  Low: { bg: "#f0fdf4", color: "#15803d" },
};

const pill = (map, val) => {
  const c = map[val] || { bg: "#f3f4f6", color: "#374151" };
  return (
    <span
      style={{
        background: c.bg,
        color: c.color,
        borderRadius: 20,
        padding: "2px 10px",
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {val}
    </span>
  );
};

// Inline editable cell
const EditCell = ({ value, onChange, type = "text", options, style = {} }) => {
  const [editing, setEditing] = useState(false);

  if (type === "select") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: 13,
          color: "#374151",
          width: "100%",
          fontFamily: "inherit",
          ...style,
        }}
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    );
  }

  return editing ? (
    <input
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => setEditing(false)}
      style={{
        border: "1px solid #a67c52",
        borderRadius: 4,
        padding: "2px 6px",
        fontSize: 13,
        width: "100%",
        fontFamily: "inherit",
        ...style,
      }}
    />
  ) : (
    <span
      onClick={() => setEditing(true)}
      style={{
        cursor: "text",
        fontSize: 13,
        color: "#374151",
        display: "block",
        minHeight: 20,
        ...style,
      }}
    >
      {value || <span style={{ color: "#ccc" }}>—</span>}
    </span>
  );
};

// One section group
const SectionGroup = ({ section, rows, onUpdate, onDelete, onAddRow }) => {
  const [collapsed, setCollapsed] = useState(false);
  const bg = SECTION_COLORS[section] || "rgba(166,124,82,0.08)";
  const badge = SECTION_BADGE_COLORS[section] || "#a67c52";
  const done = rows.filter((r) => r.status === "Done").length;
  const pct = rows.length ? Math.round((done / rows.length) * 100) : 0;

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Section header */}
      <div
        onClick={() => setCollapsed((p) => !p)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          padding: "8px 12px",
          background: bg,
          borderRadius: 8,
          marginBottom: collapsed ? 0 : 8,
          userSelect: "none",
          border: `1px solid ${badge}30`,
        }}
      >
        {collapsed ? (
          <ChevronRight size={16} color={badge} />
        ) : (
          <ChevronDown size={16} color={badge} />
        )}
        <span style={{ fontWeight: 700, fontSize: 14, color: badge }}>
          {section}
        </span>
        <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>
          {rows.length} items
        </span>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 80,
              height: 6,
              background: "#e5e7eb",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: badge,
                borderRadius: 4,
                transition: "width 0.3s",
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: badge, fontWeight: 600 }}>
            {pct}%
          </span>
        </div>
      </div>

      {!collapsed && (
        <>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr
                style={{
                  background: "#faf7f2",
                  borderBottom: "2px solid #e6d7c3",
                }}
              >
                {[
                  "ID",
                  "Task",
                  "Category",
                  "Owner",
                  "Priority",
                  "Status",
                  "Deliverable",
                  "Notes",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "7px 10px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#4a352f",
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={row.id + idx}
                  style={{
                    borderBottom: "1px solid #f0e6d9",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#faf7f2")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td
                    style={{
                      padding: "6px 10px",
                      color: "#888",
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <EditCell
                      value={row.id}
                      onChange={(v) => onUpdate(row._idx, "id", v)}
                    />
                  </td>
                  <td
                    style={{
                      padding: "6px 10px",
                      minWidth: 260,
                      maxWidth: 380,
                    }}
                  >
                    <EditCell
                      value={row.task}
                      onChange={(v) => onUpdate(row._idx, "task", v)}
                    />
                  </td>
                  <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>
                    <EditCell
                      type="select"
                      value={row.category}
                      options={CATEGORY_OPTIONS}
                      onChange={(v) => onUpdate(row._idx, "category", v)}
                    />
                  </td>
                  <td style={{ padding: "6px 10px" }}>
                    <EditCell
                      value={row.owner}
                      onChange={(v) => onUpdate(row._idx, "owner", v)}
                    />
                  </td>
                  <td style={{ padding: "6px 10px" }}>
                    <select
                      value={row.priority}
                      onChange={(e) =>
                        onUpdate(row._idx, "priority", e.target.value)
                      }
                      style={{
                        border: "none",
                        background:
                          PRIORITY_COLORS[row.priority]?.bg || "#f3f4f6",
                        color:
                          PRIORITY_COLORS[row.priority]?.color || "#374151",
                        borderRadius: 20,
                        padding: "2px 8px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {PRIORITY_OPTIONS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "6px 10px" }}>
                    <select
                      value={row.status}
                      onChange={(e) =>
                        onUpdate(row._idx, "status", e.target.value)
                      }
                      style={{
                        border: "none",
                        background: STATUS_COLORS[row.status]?.bg || "#f3f4f6",
                        color: STATUS_COLORS[row.status]?.color || "#374151",
                        borderRadius: 20,
                        padding: "2px 8px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "6px 10px" }}>
                    <EditCell
                      value={row.deliverable}
                      onChange={(v) => onUpdate(row._idx, "deliverable", v)}
                    />
                  </td>
                  <td style={{ padding: "6px 10px", minWidth: 140 }}>
                    <EditCell
                      value={row.notes}
                      onChange={(v) => onUpdate(row._idx, "notes", v)}
                    />
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <button
                      onClick={() => onDelete(row._idx)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 4,
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        color: "#ef4444",
                      }}
                      title="Delete row"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => onAddRow(section)}
            style={{
              marginTop: 6,
              marginLeft: 4,
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: `1px dashed ${badge}`,
              color: badge,
              borderRadius: 6,
              padding: "5px 14px",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            <Plus size={14} /> Add row
          </button>
        </>
      )}
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────
export const DocGovernanceChecklist = ({
  items,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
  isSaving,
}) => {
  const sections = useMemo(() => {
    const map = {};
    items.forEach((item, idx) => {
      const sec = item.section || "Uncategorised";
      if (!map[sec]) map[sec] = [];
      map[sec].push({ ...item, _idx: idx });
    });
    return map;
  }, [items]);

  const totalDone = items.filter((i) => i.status === "Done").length;
  const totalPct = items.length
    ? Math.round((totalDone / items.length) * 100)
    : 0;

  return (
    <div>
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: "#4a352f",
            }}
          >
            Documentation & Governance Checklist
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>
            {totalDone} / {items.length} tasks complete &nbsp;·&nbsp;
            <span style={{ fontWeight: 600, color: "#a67c52" }}>
              {totalPct}%
            </span>
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isSaving && (
            <span
              style={{
                fontSize: 12,
                color: "#a67c52",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Save size={13} /> Saving…
            </span>
          )}
        </div>
      </div>

      {/* Overall progress bar */}
      <div
        style={{
          width: "100%",
          height: 8,
          background: "#e6d7c3",
          borderRadius: 6,
          marginBottom: 28,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${totalPct}%`,
            height: "100%",
            background: "#a67c52",
            borderRadius: 6,
            transition: "width 0.4s",
          }}
        />
      </div>

      {/* Scrollable table area */}
      <div style={{ overflowX: "auto" }}>
        {Object.entries(sections).map(([section, rows]) => (
          <SectionGroup
            key={section}
            section={section}
            rows={rows}
            onUpdate={onUpdateItem}
            onDelete={onDeleteItem}
            onAddRow={onAddItem}
          />
        ))}
      </div>

      {items.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#888" }}>
          <AlertCircle
            size={40}
            style={{ marginBottom: 12, color: "#c8b6a6" }}
          />
          <p>No checklist items yet. Add your first row.</p>
        </div>
      )}
    </div>
  );
};
