import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Plus, Trash2, Save, X, RefreshCw } from 'lucide-react';
import {
  QA_COLUMNS, DASHBOARD_OPTIONS, CATEGORY_OPTIONS, STATUS_OPTIONS,
  ACTION_STATUS_OPTIONS, TEST_TYPE_OPTIONS, ASSIGNEE_OPTIONS,
  STATUS_COLORS, ACTION_COLORS, DASHBOARD_COLORS
} from './qaTableData';

// ─── Category colour map ──────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  'Security':          '#f59e0b',
  'Unit Tests':        '#3b82f6',
  'Integration Tests': '#8b5cf6',
  'E2E Tests':         '#ec4899',
  'Performance Tests': '#10b981',
  'Test Data':         '#06b6d4',
};

// ─── Shared select style – extra right padding so arrow never clips text ──────
const SELECT_STYLE = {
  padding: '6px 28px 6px 10px',
  border: '1px solid #e6d7c3',
  borderRadius: 6,
  fontSize: 12,
  outline: 'none',
  appearance: 'auto',
  cursor: 'pointer',
  background: '#fff',
  maxWidth: 120,
};

// ─── Badge ───────────────────────────────────────────────────────────────────
const Badge = ({ label, bg, text = '#fff' }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
    background: bg || '#6b7280', color: text,
    whiteSpace: 'nowrap',
  }}>
    {label || '—'}
  </span>
);

// ─── Editable Cell ────────────────────────────────────────────────────────────
const QACell = memo(({ col, value, isEditing, onSave, onCancel }) => {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value, isEditing]);

  // ── Read-only display ──
  if (!isEditing) {
    if (col.type === 'status') {
      const c = STATUS_COLORS[value] || { bg: '#6b7280', text: '#fff' };
      return <Badge label={value} bg={c.bg} text={c.text} />;
    }
    if (col.type === 'action') {
      const c = ACTION_COLORS[value] || { bg: '#6b7280', text: '#fff' };
      return <Badge label={value} bg={c.bg} text={c.text} />;
    }
    if (col.id === 'dashboard') {
      if (!value) return <span style={{ color: '#aaa', fontSize: 12 }}>—</span>;
      return <Badge label={value} bg={DASHBOARD_COLORS[value] || '#6b7280'} />;
    }
    if (col.id === 'category') {
      if (!value) return <span style={{ color: '#aaa', fontSize: 12 }}>—</span>;
      return <Badge label={value} bg={CATEGORY_COLORS[value] || '#6b7280'} />;
    }
    if (col.type === 'date') {
      if (!value) return <span style={{ color: '#aaa', fontSize: 12 }}>—</span>;
      try {
        return <span style={{ fontSize: 12 }}>{new Date(value).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}</span>;
      } catch { return <span style={{ fontSize: 12 }}>{value}</span>; }
    }
    return <span style={{ fontSize: 13 }}>{value || <span style={{ color: '#aaa' }}>—</span>}</span>;
  }

  // ── Editing mode ──
  const opts = col.id === 'status'       ? STATUS_OPTIONS
              : col.id === 'actionStatus' ? ACTION_STATUS_OPTIONS
              : col.id === 'testType'     ? TEST_TYPE_OPTIONS
              : col.id === 'dashboard'    ? DASHBOARD_OPTIONS
              : col.id === 'category'     ? CATEGORY_OPTIONS
              : col.id === 'assignedTo'   ? ASSIGNEE_OPTIONS
              : null;

  const cellInputStyle = {
    padding: '4px 6px',
    border: '1px solid #c8b6a6',
    borderRadius: 4,
    fontSize: 12,
    outline: 'none',
    background: '#fff',
    minWidth: 80,
    maxWidth: 120,
  };

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 100,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: '#fff',
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        padding: '3px 4px',
        whiteSpace: 'nowrap',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {opts ? (
        <select
          value={draft || ''}
          onChange={(e) => setDraft(e.target.value)}
          style={{ ...cellInputStyle, paddingRight: 24 }}
          autoFocus
        >
          <option value="">—</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : col.type === 'date' ? (
        <input
          type="date"
          value={draft || ''}
          onChange={(e) => setDraft(e.target.value)}
          style={cellInputStyle}
          autoFocus
        />
      ) : (
        <input
          type="text"
          value={draft || ''}
          onChange={(e) => setDraft(e.target.value)}
          style={cellInputStyle}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave(draft);
            if (e.key === 'Escape') onCancel();
          }}
        />
      )}

      {/* Save – onMouseDown fires before the blur/click cascade that triggers adjacent cells */}
      <button
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onSave(draft); }}
        style={{ background: '#10b981', border: 'none', borderRadius: 4, padding: '4px 7px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', flexShrink: 0 }}
        title="Save (Enter)"
      >
        <Save size={12} />
      </button>

      {/* Cancel */}
      <button
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onCancel(); }}
        style={{ background: '#6b7280', border: 'none', borderRadius: 4, padding: '4px 7px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', flexShrink: 0 }}
        title="Cancel (Esc)"
      >
        <X size={12} />
      </button>
    </div>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
export const QAMasterTable = ({ tasks, onUpdateTask, onAddTask, onDeleteTask, isSaving }) => {
  const [editingCell, setEditingCell]         = useState(null);
  const [filterStatus, setFilterStatus]       = useState('All');
  const [filterDashboard, setFilterDashboard] = useState('All');
  const [filterCategory, setFilterCategory]   = useState('All');
  const [search, setSearch]                   = useState('');

  const handleEdit   = useCallback((rowIdx, colId) => setEditingCell(`${rowIdx}-${colId}`), []);
  const handleSave   = useCallback((rowIdx, colId, val) => { onUpdateTask(rowIdx, colId, val); setEditingCell(null); }, [onUpdateTask]);
  const handleCancel = useCallback(() => setEditingCell(null), []);

  // ── Filtering ──
  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'All'    && t.status    !== filterStatus)    return false;
    if (filterDashboard !== 'All' && t.dashboard !== filterDashboard) return false;
    if (filterCategory !== 'All'  && t.category  !== filterCategory)  return false;
    if (search && !Object.values(t).some(v => String(v).toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  // ── Stats ──
  const passCount = tasks.filter(t => t.status === 'Pass').length;
  const failCount = tasks.filter(t => t.status === 'Fail').length;
  const nsCount   = tasks.filter(t => t.status === 'Not started').length;

  return (
    <div style={{ marginBottom: 32 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#4a352f' }}>Master QA Table</h3>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge label={`✓ Pass: ${passCount}`}      bg={STATUS_COLORS['Pass'].bg} />
            <Badge label={`✗ Fail: ${failCount}`}      bg={STATUS_COLORS['Fail'].bg} />
            <Badge label={`○ Pending: ${nsCount}`}     bg={STATUS_COLORS['Not started'].bg} />
            {isSaving && (
              <span style={{ fontSize: 12, color: '#a67c52', display: 'flex', alignItems: 'center', gap: 4 }}>
                <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Saving…
              </span>
            )}
          </div>
        </div>

        {/* ── Filter / action bar ── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Search */}
          <input
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #e6d7c3', borderRadius: 6, fontSize: 12, outline: 'none', minWidth: 150, background: '#fff', maxWidth: 10485760 }}
          />

          {/* Status filter */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={SELECT_STYLE}>
            <option value="All">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Dashboard filter */}
          <select value={filterDashboard} onChange={e => setFilterDashboard(e.target.value)} style={SELECT_STYLE}>
            <option value="All">All Dashboards</option>
            {DASHBOARD_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Category filter */}
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={SELECT_STYLE}>
            <option value="All">All Categories</option>
            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Add row */}
          <button
            onClick={onAddTask}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#a67c52', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', maxWidth: 10485760 }}
          >
            <Plus size={14} /> Add Row
          </button>
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {(filterStatus !== 'All' || filterDashboard !== 'All' || filterCategory !== 'All') && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {filterStatus !== 'All' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: STATUS_COLORS[filterStatus]?.bg || '#6b7280', color: '#fff' }}>
              Status: {filterStatus}
              <button onMouseDown={() => setFilterStatus('All')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
            </span>
          )}
          {filterDashboard !== 'All' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: DASHBOARD_COLORS[filterDashboard] || '#6b7280', color: '#fff' }}>
              Dashboard: {filterDashboard}
              <button onMouseDown={() => setFilterDashboard('All')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
            </span>
          )}
          {filterCategory !== 'All' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: CATEGORY_COLORS[filterCategory] || '#6b7280', color: '#fff' }}>
              Category: {filterCategory}
              <button onMouseDown={() => setFilterCategory('All')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
            </span>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto', border: '1px solid #e6d7c3', borderRadius: 8 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13, tableLayout: 'auto' }}>
          <thead>
            <tr style={{ background: '#f0e6d9', borderBottom: '2px solid #e6d7c3' }}>
              {QA_COLUMNS.map(col => (
                <th key={col.id} style={{
                  padding: '10px 12px', textAlign: 'left', fontWeight: 700,
                  color: '#4a352f', whiteSpace: 'nowrap', fontSize: 12,
                  borderRight: '1px solid #e6d7c3', minWidth: col.width,
                  maxWidth: 120,
                }}>
                  {col.label}
                </th>
              ))}
              <th style={{ padding: '10px 12px', color: '#4a352f', fontSize: 12, minWidth: 52, maxWidth: 52 }}>Del</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={QA_COLUMNS.length + 1} style={{ textAlign: 'center', padding: 32, color: '#aaa', fontSize: 13 }}>
                  No tasks match the current filters.
                </td>
              </tr>
            )}
            {filteredTasks.map((task, displayIdx) => {
              const trueIdx = tasks.indexOf(task);
              return (
                <tr
                  key={trueIdx}
                  style={{ borderBottom: '1px solid #f0e6d9', background: displayIdx % 2 === 0 ? '#fff' : '#faf7f2' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f0e1'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = displayIdx % 2 === 0 ? '#fff' : '#faf7f2'; }}
                >
                  {QA_COLUMNS.map(col => {
                    const cellKey   = `${trueIdx}-${col.id}`;
                    const isEditing = editingCell === cellKey;
                    return (
                      <td
                        key={col.id}
                        style={{
                          padding: '8px 12px',
                          borderRight: '1px solid #f0e6d9',
                          verticalAlign: 'middle',
                          cursor: col.editable ? 'pointer' : 'default',
                          // allow the floating edit widget to overflow without clipping
                          overflow: isEditing ? 'visible' : 'hidden',
                          position: 'relative',
                        }}
                        onClick={() => col.editable && !isEditing && handleEdit(trueIdx, col.id)}
                      >
                        <QACell
                          col={col}
                          value={task[col.id]}
                          isEditing={isEditing}
                          onSave={(val) => handleSave(trueIdx, col.id, val)}
                          onCancel={handleCancel}
                        />
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <button
                      onClick={() => onDeleteTask(trueIdx)}
                      title="Delete row"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 4 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ margin: '6px 0 0', fontSize: 11, color: '#aaa' }}>
        Showing {filteredTasks.length} of {tasks.length} tasks · Click any cell to edit · Enter to save · Esc to cancel
      </p>
    </div>
  );
};