import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Plus,
  Trash2,
  Download,
  Upload,
  Search,
  Edit2,
  Check,
  X,
  FileText,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  RotateCcw
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Smart number / currency parser for sorting
const parseSortableNumber = (val) => {
  if (typeof val === 'number') return val;
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (trimmed === '') return null;

  let clean = trimmed.replace(/^[R$€£]\s*/i, '').replace(/,/g, '').trim();
  let multiplier = 1;
  if (clean.toLowerCase().endsWith('k')) {
    multiplier = 1000;
    clean = clean.slice(0, -1).trim();
  } else if (clean.toLowerCase().endsWith('m')) {
    multiplier = 1000000;
    clean = clean.slice(0, -1).trim();
  } else if (clean.toLowerCase().endsWith('b')) {
    multiplier = 1000000000;
    clean = clean.slice(0, -1).trim();
  } else if (clean.endsWith('%')) {
    clean = clean.slice(0, -1).trim();
  }

  if (/^-?\d+(\.\d+)?$/.test(clean)) {
    const num = parseFloat(clean);
    if (!isNaN(num)) return num * multiplier;
  }
  return null;
};

// Spreadsheet Cell Component
const SpreadsheetCell = React.memo(({ value, onChange }) => {
  const [localVal, setLocalVal] = useState(value ?? '');

  useEffect(() => {
    setLocalVal(value ?? '');
  }, [value]);

  const handleBlur = () => {
    if (localVal !== (value ?? '')) {
      onChange(localVal);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  return (
    <input
      type="text"
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        outline: 'none',
        padding: '8px 10px',
        fontSize: '13px',
        color: 'var(--text-brown)',
        background: 'transparent',
        fontFamily: 'inherit',
        boxSizing: 'border-box'
      }}
    />
  );
});

export const SpreadsheetEditor = ({ path, itemConfig, content, onSave, onClose }) => {
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [columnWidths, setColumnWidths] = useState({});
  const [hiddenColumns, setHiddenColumns] = useState(() => new Set());
  const [sortConfig, setSortConfig] = useState({ column: null, direction: null });
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [columnSearchQuery, setColumnSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingHeaderIdx, setEditingHeaderIdx] = useState(null);
  const [headerEditVal, setHeaderEditVal] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeResizingCol, setActiveResizingCol] = useState(null);

  const fileInputRef = useRef(null);
  const columnsMenuRef = useRef(null);
  const resizingColRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(180);

  // Initialize table data from database content (mock data helper removed)
  useEffect(() => {
    if (content?.tableData && Array.isArray(content.tableData.columns)) {
      setColumns(content.tableData.columns);
      setRows(Array.isArray(content.tableData.rows) ? content.tableData.rows : []);
      if (content.tableData.columnWidths && typeof content.tableData.columnWidths === 'object') {
        setColumnWidths(content.tableData.columnWidths);
      }
    } else {
      setColumns([]);
      setRows([]);
    }
    setHiddenColumns(new Set());
    setSortConfig({ column: null, direction: null });
    setHasChanges(false);
  }, [content]);

  // Close columns dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (columnsMenuRef.current && !columnsMenuRef.current.contains(e.target)) {
        setShowColumnsMenu(false);
      }
    };
    if (showColumnsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnsMenu]);

  // Debounced auto-save triggers whenever hasChanges is true
  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await onSave({ columns, rows, columnWidths });
        setHasChanges(false);
      } catch (err) {
        console.error("Auto-save failed", err);
      } finally {
        setIsSaving(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [hasChanges, columns, rows, columnWidths, onSave]);

  // Cell editing bound to row identity (safe during sort/filter)
  const handleCellChange = useCallback((rowObj, colName, newVal) => {
    setRows(prev => {
      const rowIdx = prev.indexOf(rowObj);
      if (rowIdx === -1) return prev;
      const updated = [...prev];
      updated[rowIdx] = {
        ...updated[rowIdx],
        [colName]: newVal
      };
      return updated;
    });
    setHasChanges(true);
  }, []);

  const handleAddRow = () => {
    setRows(prev => {
      const newRow = {};
      columns.forEach(col => {
        newRow[col] = '';
      });
      return [...prev, newRow];
    });
    setHasChanges(true);
  };

  const handleDeleteRow = useCallback((rowObj) => {
    if (window.confirm("Are you sure you want to delete this row?")) {
      setRows(prev => prev.filter(r => r !== rowObj));
      setHasChanges(true);
    }
  }, []);

  const handleAddColumn = () => {
    const colName = prompt("Enter new column name:");
    if (!colName) return;
    const cleanName = colName.trim();
    if (cleanName === '') return;
    if (columns.includes(cleanName)) {
      alert("A column with that name already exists!");
      return;
    }

    setColumns(prev => [...prev, cleanName]);
    setRows(prev => prev.map(row => ({
      ...row,
      [cleanName]: ''
    })));
    setHasChanges(true);
  };

  const handleDeleteColumn = (colName) => {
    if (window.confirm(`Are you sure you want to delete column "${colName}"? All data in this column will be lost.`)) {
      setColumns(prev => prev.filter(col => col !== colName));
      setRows(prev => prev.map(row => {
        const updated = { ...row };
        delete updated[colName];
        return updated;
      }));
      setHiddenColumns(prev => {
        const next = new Set(prev);
        next.delete(colName);
        return next;
      });
      setColumnWidths(prev => {
        const next = { ...prev };
        delete next[colName];
        return next;
      });
      if (sortConfig.column === colName) {
        setSortConfig({ column: null, direction: null });
      }
      setHasChanges(true);
    }
  };

  const handleStartHeaderEdit = (idx, name) => {
    setEditingHeaderIdx(idx);
    setHeaderEditVal(name);
  };

  const handleMoveColumn = (idx, direction) => {
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= columns.length) return;

    setColumns(prev => {
      const nextCols = [...prev];
      const temp = nextCols[idx];
      nextCols[idx] = nextCols[targetIdx];
      nextCols[targetIdx] = temp;
      return nextCols;
    });
    setHasChanges(true);
  };

  const handleSaveHeaderEdit = (idx) => {
    const oldName = columns[idx];
    const newName = headerEditVal.trim();
    if (newName === '' || oldName === newName) {
      setEditingHeaderIdx(null);
      return;
    }
    if (columns.includes(newName)) {
      alert("A column with that name already exists!");
      return;
    }

    setColumns(prev => prev.map((col, i) => i === idx ? newName : col));
    setRows(prev => prev.map(row => {
      const updated = { ...row };
      updated[newName] = updated[oldName] || '';
      delete updated[oldName];
      return updated;
    }));
    setHiddenColumns(prev => {
      if (!prev.has(oldName)) return prev;
      const next = new Set(prev);
      next.delete(oldName);
      next.add(newName);
      return next;
    });
    setColumnWidths(prev => {
      if (!prev[oldName]) return prev;
      const next = { ...prev, [newName]: prev[oldName] };
      delete next[oldName];
      return next;
    });
    if (sortConfig.column === oldName) {
      setSortConfig(prev => ({ ...prev, column: newName }));
    }
    setEditingHeaderIdx(null);
    setHasChanges(true);
  };

  // --- Column Visibility (Hide / Show) ---
  const toggleColumnVisibility = (colName) => {
    setHiddenColumns(prev => {
      const next = new Set(prev);
      if (next.has(colName)) {
        next.delete(colName);
      } else {
        if (columns.length - next.size <= 1) {
          alert("You must keep at least one column visible.");
          return prev;
        }
        next.add(colName);
      }
      return next;
    });
  };

  const showAllColumns = () => {
    setHiddenColumns(new Set());
  };

  const hideAllColumns = () => {
    if (columns.length === 0) return;
    // Keep first column visible
    const next = new Set(columns.slice(1));
    setHiddenColumns(next);
  };

  const visibleColumns = useMemo(() => {
    return columns.filter(col => !hiddenColumns.has(col));
  }, [columns, hiddenColumns]);

  // --- Column Resizing (Shrink / Expand) ---
  const handleResizeStart = useCallback((e, colName) => {
    e.preventDefault();
    e.stopPropagation();
    resizingColRef.current = colName;
    setActiveResizingCol(colName);
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths[colName] || 180;

    const handleMouseMove = (moveEvent) => {
      if (!resizingColRef.current) return;
      const deltaX = moveEvent.clientX - startXRef.current;
      const newWidth = Math.max(60, startWidthRef.current + deltaX);
      setColumnWidths(prev => ({
        ...prev,
        [resizingColRef.current]: newWidth
      }));
    };

    const handleMouseUp = () => {
      resizingColRef.current = null;
      setActiveResizingCol(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setHasChanges(true);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [columnWidths]);

  const handleShrinkColumn = (colName) => {
    setColumnWidths(prev => {
      const current = prev[colName] || 180;
      const next = Math.max(60, current - 30);
      return { ...prev, [colName]: next };
    });
    setHasChanges(true);
  };

  const handleExpandColumn = (colName) => {
    setColumnWidths(prev => {
      const current = prev[colName] || 180;
      const next = Math.min(800, current + 30);
      return { ...prev, [colName]: next };
    });
    setHasChanges(true);
  };

  const handleResetColumnWidth = (colName) => {
    setColumnWidths(prev => {
      const next = { ...prev };
      delete next[colName];
      return next;
    });
    setHasChanges(true);
  };

  // --- Column Ordering (Ascending / Descending) ---
  const handleToggleSort = (colName) => {
    setSortConfig(prev => {
      if (prev.column === colName) {
        if (prev.direction === 'asc') return { column: colName, direction: 'desc' };
        if (prev.direction === 'desc') return { column: null, direction: null };
        return { column: colName, direction: 'asc' };
      }
      return { column: colName, direction: 'asc' };
    });
  };

  const clearSort = () => {
    setSortConfig({ column: null, direction: null });
  };

  // Search filter
  const searchedRows = useMemo(() => {
    if (!searchQuery) return rows;
    const query = searchQuery.toLowerCase().trim();
    return rows.filter(row => {
      return Object.values(row).some(val =>
        String(val ?? '').toLowerCase().includes(query)
      );
    });
  }, [rows, searchQuery]);

  // Sort rows
  const displayRows = useMemo(() => {
    if (!sortConfig.column || !sortConfig.direction) return searchedRows;
    const { column, direction } = sortConfig;
    return [...searchedRows].sort((a, b) => {
      const valA = a[column];
      const valB = b[column];

      const emptyA = valA === undefined || valA === null || String(valA).trim() === '';
      const emptyB = valB === undefined || valB === null || String(valB).trim() === '';
      if (emptyA && emptyB) return 0;
      if (emptyA) return 1;
      if (emptyB) return -1;

      // Numeric sorting
      const numA = parseSortableNumber(valA);
      const numB = parseSortableNumber(valB);
      if (numA !== null && numB !== null) {
        return direction === 'asc' ? numA - numB : numB - numA;
      }

      // Date sorting
      const dateA = Date.parse(valA);
      const dateB = Date.parse(valB);
      if (!isNaN(dateA) && !isNaN(dateB) && typeof valA === 'string' && valA.includes('-')) {
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // String sorting
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return direction === 'asc'
        ? strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' })
        : strB.localeCompare(strA, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [searchedRows, sortConfig]);

  // Filter columns for columns menu search
  const filteredColumnsForMenu = useMemo(() => {
    if (!columnSearchQuery) return columns;
    const q = columnSearchQuery.toLowerCase().trim();
    return columns.filter(c => c.toLowerCase().includes(q));
  }, [columns, columnSearchQuery]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(rows, { header: columns });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Database");

    const fileName = `${path[path.length - 1].replace(/\s+/g, '_')}_Database.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonRows = XLSX.utils.sheet_to_json(sheet);
        if (jsonRows.length === 0) {
          alert("The uploaded spreadsheet contains no data.");
          return;
        }

        const newCols = new Set();
        jsonRows.forEach(row => {
          Object.keys(row).forEach(k => newCols.add(k));
        });

        const importedColumns = Array.from(newCols);
        const importedRows = jsonRows.map(row => {
          const cleanRow = {};
          importedColumns.forEach(col => {
            cleanRow[col] = row[col] !== undefined ? String(row[col]) : '';
          });
          return cleanRow;
        });

        setColumns(importedColumns);
        setRows(importedRows);
        setHiddenColumns(new Set());
        setSortConfig({ column: null, direction: null });
        setHasChanges(true);
        alert(`Successfully imported ${importedRows.length} rows and ${importedColumns.length} columns!`);
      } catch (err) {
        console.error("Failed to parse imported spreadsheet", err);
        alert("Failed to parse file. Please upload a valid Excel or CSV spreadsheet.");
      }
    };
    reader.readAsBinaryString(file);

    e.target.value = '';
  };

  const handleClearTable = () => {
    if (window.confirm("Are you sure you want to clear the entire table? This will delete all rows and columns.")) {
      setColumns([]);
      setRows([]);
      setHiddenColumns(new Set());
      setColumnWidths({});
      setSortConfig({ column: null, direction: null });
      setHasChanges(true);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'white',
      borderRadius: 8,
      border: '1px solid var(--medium-brown)',
      overflow: 'hidden'
    }}>
      {/* Header Bar */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--pale-brown)',
        borderBottom: '1px solid var(--medium-brown)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FileText size={18} color="var(--primary-brown)" />
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-brown)' }}>
              {path[path.length - 1]}
            </h3>
            {itemConfig?.description && (
              <p style={{ margin: 0, fontSize: 12, color: '#666', marginTop: 2 }}>
                {itemConfig.description}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Status Indicator */}
          <div style={{ marginRight: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            {isSaving ? (
              <span style={{ fontSize: 12, color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Auto-saving...
              </span>
            ) : hasChanges ? (
              <span style={{ fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={13} /> Unsaved changes
              </span>
            ) : (
              <span style={{ fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Check size={13} /> Saved to Database
              </span>
            )}
          </div>

          <button
            onClick={handleExport}
            title="Export to Excel"
            style={{
              padding: '8px 12px',
              background: 'white',
              color: 'var(--text-brown)',
              border: '1px solid var(--medium-brown)',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Upload size={14} /> Export
          </button>

          <button
            onClick={handleImportClick}
            title="Import from Excel/CSV"
            style={{
              padding: '8px 12px',
              background: 'white',
              color: 'var(--text-brown)',
              border: '1px solid var(--medium-brown)',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Download size={14} /> Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
          />

          <button
            onClick={handleClearTable}
            title="Clear Table"
            style={{
              padding: '8px 12px',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fee2e2',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Trash2 size={14} /> Clear
          </button>

          <button
            onClick={onClose}
            title="Close editor"
            style={{
              padding: '8px 12px',
              background: 'transparent',
              color: 'var(--text-brown)',
              border: '1px solid var(--medium-brown)',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Toolbar / Actions Bar */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--medium-brown)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff',
        flexWrap: 'wrap',
        gap: 10
      }}>
        {/* Search Input & Active Filter Tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 280, maxWidth: 520 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input
              type="text"
              placeholder="Search table rows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 32px',
                border: '1px solid var(--medium-brown)',
                borderRadius: 6,
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#999',
                  padding: 2
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Active Sort Tag */}
          {sortConfig.column && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              background: 'var(--pale-brown)',
              border: '1px solid var(--medium-brown)',
              borderRadius: 4,
              fontSize: 11,
              whiteSpace: 'nowrap',
              color: 'var(--primary-brown)',
              fontWeight: 500
            }}>
              <span>Sorted: <strong>{sortConfig.column}</strong> ({sortConfig.direction === 'asc' ? 'A→Z' : 'Z→A'})</span>
              <button
                onClick={clearSort}
                title="Clear sort"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--primary-brown)' }}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Hidden Columns Tag */}
          {hiddenColumns.size > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              background: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: 4,
              fontSize: 11,
              whiteSpace: 'nowrap',
              color: '#b45309',
              fontWeight: 500
            }}>
              <EyeOff size={11} />
              <span>{hiddenColumns.size} hidden</span>
              <button
                onClick={showAllColumns}
                title="Show all hidden columns"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0 2px',
                  color: '#b45309',
                  fontWeight: 600,
                  textDecoration: 'underline'
                }}
              >
                Show all
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Columns Visibility Dropdown */}
          <div style={{ position: 'relative' }} ref={columnsMenuRef}>
            <button
              onClick={() => setShowColumnsMenu(prev => !prev)}
              title="Hide / Show Columns"
              style={{
                padding: '6px 12px',
                background: hiddenColumns.size > 0 ? '#fffbeb' : 'white',
                color: hiddenColumns.size > 0 ? '#b45309' : 'var(--text-brown)',
                border: hiddenColumns.size > 0 ? '1px solid #fde68a' : '1px solid var(--medium-brown)',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <SlidersHorizontal size={13} />
              <span>Columns</span>
              {columns.length > 0 && (
                <span style={{
                  background: hiddenColumns.size > 0 ? '#f59e0b' : 'var(--pale-brown)',
                  color: hiddenColumns.size > 0 ? 'white' : 'var(--text-brown)',
                  fontSize: 10,
                  padding: '1px 5px',
                  borderRadius: 10,
                  fontWeight: 600
                }}>
                  {visibleColumns.length}/{columns.length}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {showColumnsMenu && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                width: 260,
                background: 'white',
                borderRadius: 8,
                border: '1px solid var(--medium-brown)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                zIndex: 50,
                padding: 10
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--pale-brown)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-brown)' }}>Toggle Columns</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={showAllColumns}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-brown)', cursor: 'pointer', fontSize: 11, padding: 0, textDecoration: 'underline' }}
                    >
                      Show All
                    </button>
                    <button
                      onClick={hideAllColumns}
                      style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 11, padding: 0, textDecoration: 'underline' }}
                    >
                      Hide All
                    </button>
                  </div>
                </div>

                {columns.length > 6 && (
                  <div style={{ marginBottom: 8 }}>
                    <input
                      type="text"
                      placeholder="Search columns..."
                      value={columnSearchQuery}
                      onChange={(e) => setColumnSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        border: '1px solid var(--medium-brown)',
                        borderRadius: 4,
                        fontSize: 11,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                )}

                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filteredColumnsForMenu.length === 0 ? (
                    <div style={{ fontSize: 11, color: '#999', padding: 8, textAlign: 'center' }}>No columns found</div>
                  ) : (
                    filteredColumnsForMenu.map(col => {
                      const isVisible = !hiddenColumns.has(col);
                      return (
                        <label
                          key={col}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '4px 6px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                            color: 'var(--text-brown)',
                            userSelect: 'none',
                            background: isVisible ? 'transparent' : '#f9f9f9'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => toggleColumnVisibility(col)}
                            style={{ cursor: 'pointer', accentColor: 'var(--primary-brown)' }}
                          />
                          <span style={{
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: isVisible ? 'var(--text-brown)' : '#999'
                          }}>
                            {col}
                          </span>
                          {isVisible ? <Eye size={12} color="#10b981" /> : <EyeOff size={12} color="#999" />}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleAddRow}
            style={{
              padding: '6px 12px',
              background: 'var(--pale-brown)',
              color: 'var(--text-brown)',
              border: '1px solid var(--medium-brown)',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Plus size={14} /> Add Row
          </button>

          <button
            onClick={handleAddColumn}
            style={{
              padding: '6px 12px',
              background: 'var(--primary-brown)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Plus size={14} /> Add Column
          </button>
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        background: '#faf7f2',
        position: 'relative'
      }}>
        {columns.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#666',
            padding: 40,
            textAlign: 'center'
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--pale-brown)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}>
              <FileText size={28} color="var(--primary-brown)" />
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: 16, color: 'var(--text-brown)', fontWeight: 600 }}>
              Empty Table
            </h4>
            <p style={{ margin: '0 0 20px 0', fontSize: 13, color: '#777', maxWidth: 360 }}>
              This table doesn't have any columns or rows yet. Add columns manually or import an Excel/CSV spreadsheet to get started.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleAddColumn}
                style={{
                  padding: '8px 16px',
                  background: 'var(--primary-brown)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Plus size={14} /> Add Column
              </button>
              <button
                onClick={handleImportClick}
                style={{
                  padding: '8px 16px',
                  background: 'white',
                  color: 'var(--text-brown)',
                  border: '1px solid var(--medium-brown)',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Download size={14} /> Import Spreadsheet
              </button>
            </div>
          </div>
        ) : visibleColumns.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', padding: 20 }}>
            <EyeOff size={36} style={{ marginBottom: 12, color: 'var(--accent-brown)' }} />
            <p style={{ fontSize: 14, margin: '0 0 12px 0' }}>All columns are currently hidden.</p>
            <button
              onClick={showAllColumns}
              style={{
                padding: '6px 14px',
                background: 'var(--primary-brown)',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Show All Columns
            </button>
          </div>
        ) : (
          <table style={{
            borderCollapse: 'collapse',
            width: 'max-content',
            minWidth: '100%',
            background: 'white',
            tableLayout: 'fixed'
          }}>
            <thead>
              <tr style={{ background: '#f0e6d9', borderBottom: '2px solid #e6d7c3' }}>
                {/* Index Column */}
                <th style={{
                  width: 54,
                  minWidth: 54,
                  maxWidth: 54,
                  padding: '8px',
                  background: '#f0e6d9',
                  borderRight: '1px solid #e6d7c3',
                  borderBottom: '1px solid #e6d7c3',
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#4a352f',
                  position: 'sticky',
                  left: 0,
                  zIndex: 4,
                  boxSizing: 'border-box'
                }}>
                  #
                </th>

                {/* Column Headers */}
                {visibleColumns.map((col) => {
                  const trueColIdx = columns.indexOf(col);
                  const isEditing = editingHeaderIdx === trueColIdx;
                  const currentWidth = columnWidths[col] || 180;
                  const isSorted = sortConfig.column === col;

                  return (
                    <th
                      key={col}
                      style={{
                        width: currentWidth,
                        minWidth: currentWidth,
                        maxWidth: currentWidth,
                        padding: '6px 8px',
                        background: isSorted ? '#e8dcce' : '#f0e6d9',
                        borderRight: '1px solid #e6d7c3',
                        borderBottom: '1px solid #e6d7c3',
                        textAlign: 'left',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#4a352f',
                        verticalAlign: 'middle',
                        position: 'relative',
                        userSelect: 'none',
                        boxSizing: 'border-box',
                        transition: activeResizingCol === col ? 'none' : 'width 0.1s ease'
                      }}
                    >
                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="text"
                            value={headerEditVal}
                            onChange={(e) => setHeaderEditVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveHeaderEdit(trueColIdx);
                              if (e.key === 'Escape') setEditingHeaderIdx(null);
                            }}
                            autoFocus
                            style={{
                              width: '100%',
                              fontSize: 12,
                              padding: '2px 4px',
                              border: '1px solid var(--primary-brown)',
                              outline: 'none',
                              borderRadius: 4
                            }}
                          />
                          <button
                            onClick={() => handleSaveHeaderEdit(trueColIdx)}
                            title="Save Rename"
                            style={{ background: '#10b981', border: 'none', borderRadius: 4, padding: 3, cursor: 'pointer', color: 'white', display: 'flex' }}
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => setEditingHeaderIdx(null)}
                            title="Cancel"
                            style={{ background: '#ef4444', border: 'none', borderRadius: 4, padding: 3, cursor: 'pointer', color: 'white', display: 'flex' }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                          {/* Column Title & Sort Button */}
                          <div
                            onClick={() => handleToggleSort(col)}
                            title="Click to sort (Ascending / Descending / Clear) · Double-click to rename"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleStartHeaderEdit(trueColIdx, col);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              cursor: 'pointer',
                              flex: 1,
                              overflow: 'hidden',
                              minWidth: 0
                            }}
                          >
                            <span style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: isSorted ? 'var(--primary-brown)' : '#4a352f',
                              fontWeight: isSorted ? 700 : 600
                            }}>
                              {col}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                              {isSorted ? (
                                sortConfig.direction === 'asc' ? (
                                  <ArrowUp size={13} color="var(--primary-brown)" />
                                ) : (
                                  <ArrowDown size={13} color="var(--primary-brown)" />
                                )
                              ) : (
                                <ArrowUpDown size={11} color="#999" style={{ opacity: 0.5 }} />
                              )}
                            </div>
                          </div>

                          {/* Column Controls */}
                          <div style={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
                            {/* Shrink column */}
                            <button
                              onClick={() => handleShrinkColumn(col)}
                              title="Shrink column width (-30px)"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#777',
                                cursor: 'pointer',
                                padding: 2,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Minimize2 size={10} />
                            </button>

                            {/* Expand column */}
                            <button
                              onClick={() => handleExpandColumn(col)}
                              title="Expand column width (+30px)"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#777',
                                cursor: 'pointer',
                                padding: 2,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Maximize2 size={10} />
                            </button>

                            {/* Hide column */}
                            <button
                              onClick={() => toggleColumnVisibility(col)}
                              title="Hide column"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#777',
                                cursor: 'pointer',
                                padding: 2,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <EyeOff size={11} />
                            </button>

                            {/* Move Left */}
                            {trueColIdx > 0 && (
                              <button
                                onClick={() => handleMoveColumn(trueColIdx, 'left')}
                                title="Move Left"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-brown)',
                                  cursor: 'pointer',
                                  padding: 2,
                                  borderRadius: 3,
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <ArrowLeft size={11} />
                              </button>
                            )}

                            {/* Move Right */}
                            {trueColIdx < columns.length - 1 && (
                              <button
                                onClick={() => handleMoveColumn(trueColIdx, 'right')}
                                title="Move Right"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-brown)',
                                  cursor: 'pointer',
                                  padding: 2,
                                  borderRadius: 3,
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <ArrowRight size={11} />
                              </button>
                            )}

                            {/* Rename */}
                            <button
                              onClick={() => handleStartHeaderEdit(trueColIdx, col)}
                              title="Rename Column"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--primary-brown)',
                                cursor: 'pointer',
                                padding: 2,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Edit2 size={11} />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteColumn(col)}
                              title="Delete Column"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: 2,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Draggable Resize Handle */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, col)}
                        onDoubleClick={() => handleResetColumnWidth(col)}
                        title="Drag to shrink or expand column width · Double-click to reset"
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          bottom: 0,
                          width: 8,
                          cursor: 'col-resize',
                          zIndex: 3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <div style={{
                          width: 2,
                          height: '60%',
                          background: activeResizingCol === col ? 'var(--primary-brown)' : '#c7b6a1',
                          borderRadius: 1
                        }} />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} style={{ textAlign: 'center', padding: 24, color: '#999', fontSize: 13, background: 'white' }}>
                    {searchQuery ? "No rows match your search query." : "This table has no rows. Click '+ Add Row' to add your first row."}
                  </td>
                </tr>
              ) : (
                displayRows.map((row, rowIdx) => {
                  const originalIndex = rows.indexOf(row);
                  return (
                    <tr
                      key={originalIndex >= 0 ? originalIndex : rowIdx}
                      style={{
                        borderBottom: '1px solid var(--pale-brown)',
                        background: rowIdx % 2 === 0 ? '#fff' : 'var(--background-brown)'
                      }}
                    >
                      {/* Left Index & Delete row button */}
                      <td style={{
                        width: 54,
                        minWidth: 54,
                        maxWidth: 54,
                        padding: '6px 8px',
                        background: 'var(--pale-brown)',
                        borderRight: '1px solid var(--medium-brown)',
                        textAlign: 'center',
                        fontSize: 12,
                        color: 'var(--text-brown)',
                        fontWeight: 500,
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                        boxSizing: 'border-box'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <span>{originalIndex + 1}</span>
                          <button
                            onClick={() => handleDeleteRow(row)}
                            title="Delete Row"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444',
                              padding: 2,
                              borderRadius: 4,
                              opacity: 0.7
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>

                      {/* Cells */}
                      {visibleColumns.map(col => {
                        const cellWidth = columnWidths[col] || 180;
                        return (
                          <td
                            key={col}
                            style={{
                              width: cellWidth,
                              minWidth: cellWidth,
                              maxWidth: cellWidth,
                              borderRight: '1px solid var(--medium-brown)',
                              padding: 0,
                              height: 36,
                              verticalAlign: 'middle',
                              background: 'transparent',
                              boxSizing: 'border-box',
                              overflow: 'hidden'
                            }}
                          >
                            <SpreadsheetCell
                              value={row[col]}
                              onChange={(val) => handleCellChange(row, col, val)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Info */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid var(--medium-brown)',
        background: 'var(--pale-brown)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 11,
        color: '#666',
        flexWrap: 'wrap',
        gap: 8
      }}>
        <div>
          Showing {displayRows.length} of {rows.length} rows · {visibleColumns.length} of {columns.length} columns visible
          {hiddenColumns.size > 0 && ` (${hiddenColumns.size} hidden)`}
          {sortConfig.column && ` · Ordered by ${sortConfig.column} (${sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'})`}
        </div>
        <div>
          Drag column edge to resize · Click column header to order · Double-click to rename · Auto-saves
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetEditor;
