import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, Trash2, Save, Download, Upload, Search, Edit2, Check, X, FileText, ArrowDownAz, RefreshCw, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const DEFAULT_COLUMNS = [
  "Funder Name",
  "Funder Type",
  "Type",
  "Status",
  "Webpage",
  "Address",
  "Contact Number",
  "Email Address",
  "Sector Focus",
  "Target Group",
  "Funder Stage",
  "Funding Type",
  "Funding Limit",
  "Funding Criteria",
  "Funding Range",
  "Description",
  "Application Window",
  "Application Form Link",
  "Application Instructions",
  "Application Deadlines",
  "Notes",
  "Contact Person",
  "Position/Designation",
  "Contact Email",
  "Alternative Contact"
];

// Helper to get initial mock data based on the section path
const getInitialMockData = (path) => {
  const lastSegment = path[path.length - 1] || '';
  if (lastSegment.toLowerCase().includes('corporate')) {
    return {
      columns: [...DEFAULT_COLUMNS],
      rows: [
        {
          "Funder Name": "Anglo American ESD (Zimele)",
          "Funder Type": "Corporate ESD",
          "Type": "Equity / Grant",
          "Status": "Active",
          "Webpage": "https://www.angloamerican.co.za/our-difference/zimele",
          "Address": "55 Marshall Street, Johannesburg",
          "Contact Number": "011 638 9111",
          "Email Address": "zimele@angloamerican.com",
          "Sector Focus": "Mining Services, Agriculture, Manufacturing, Tech",
          "Target Group": "BEE Compliant SMEs, Youth, Women Entrepreneurs",
          "Funder Stage": "Growth, Early Stage",
          "Funding Type": "Debt, Equity, Grants",
          "Funding Limit": "R5,000,000",
          "Funding Criteria": "51% Black owned, viable business plan, operational integration",
          "Funding Range": "R100k - R5m",
          "Description": " Anglo American Zimele hubs provide funding and mentoring to small businesses in South Africa.",
          "Application Window": "Open all year",
          "Application Form Link": "https://www.angloamerican.co.za/our-difference/zimele/apply",
          "Notes": "Strong ESD alignment needed.",
          "Contact Person": "Lerato Nkosi",
          "Position/Designation": "ESD Investment Specialist"
        },
        {
          "Funder Name": "SAB Kickstart",
          "Funder Type": "Corporate ESD",
          "Type": "Grant & Mentorship",
          "Status": "Closed",
          "Webpage": "https://www.sabkickstart.co.za",
          "Address": "65 Park Lane, Sandton, Johannesburg",
          "Contact Number": "011 881 8111",
          "Email Address": "kickstart@sab.co.za",
          "Sector Focus": "General, Manufacturing, Retail, Agriculture",
          "Target Group": "Youth Entrepreneurs (18-35)",
          "Funder Stage": "Startup, Early Stage",
          "Funding Type": "Grants",
          "Funding Limit": "R250,000",
          "Funding Criteria": "Youth-owned business, operational for at least 12 months",
          "Funding Range": "R50k - R250k",
          "Description": "KickStart is SAB's flagship youth entrepreneurship program supporting startups.",
          "Application Window": "Annually (usually May-June)",
          "Notes": "Great program for early-stage youth startups."
        }
      ]
    };
  } else if (lastSegment.toLowerCase().includes('gov')) {
    return {
      columns: [...DEFAULT_COLUMNS],
      rows: [
        {
          "Funder Name": "SEDA (Small Enterprise Development Agency)",
          "Funder Type": "Government Agency",
          "Type": "Grant / Business Support",
          "Status": "Active",
          "Webpage": "http://www.seda.org.za",
          "Address": "The Fields, Office Block B, 1066 Burnett Street, Hatfield, Pretoria",
          "Contact Number": "012 441 1000",
          "Email Address": "info@seda.org.za",
          "Sector Focus": "All Sectors, Agriculture, Tourism, Construction",
          "Target Group": "Micro and Small Enterprises",
          "Funder Stage": "All Stages",
          "Funding Type": "Grants, Non-financial Support",
          "Funding Limit": "R1,000,000",
          "Funding Criteria": "Registered business, tax clearance, business plan",
          "Funding Range": "R50k - R1m",
          "Description": "SEDA provides non-financial support, business development and grants for equipment.",
          "Application Window": "Open all year",
          "Notes": "Usually requires visiting a local branch or applying through an advisor."
        },
        {
          "Funder Name": "National Empowerment Fund (NEF)",
          "Funder Type": "Development Finance Institution",
          "Type": "Loan / Equity",
          "Status": "Active",
          "Webpage": "https://www.nefcorp.co.za",
          "Address": "NEF West Block, 187 Rivonia Road, Morningside, Johannesburg",
          "Contact Number": "011 305 8000",
          "Email Address": "applications@nefcorp.co.za",
          "Sector Focus": "Manufacturing, Agro-processing, Franchising, Construction",
          "Target Group": "Black-owned and managed businesses (51%+)",
          "Funder Stage": "Start-up, Expansion, Franchise",
          "Funding Type": "Loans, Equity",
          "Funding Limit": "R75,000,000",
          "Funding Criteria": "Active black management, commercial viability, job creation",
          "Funding Range": "R250k - R75m",
          "Description": "The NEF promotes and facilitates black economic participation by providing financial and non-financial support.",
          "Application Window": "Open all year",
          "Notes": "Very thorough due diligence. High requirements but substantial funding capacity."
        }
      ]
    };
  } else {
    return {
      columns: ["Funder Name", "Funder Type", "Type", "Status", "Notes"],
      rows: [
        { "Funder Name": "Sample Funder", "Funder Type": "Strategic Partner", "Type": "MOU", "Status": "Active", "Notes": "Initial sample entry" }
      ]
    };
  }
};

// Spreadsheet Cell Component
const SpreadsheetCell = React.memo(({ value, onChange }) => {
  const [localVal, setLocalVal] = useState(value || '');

  useEffect(() => {
    setLocalVal(value || '');
  }, [value]);

  const handleBlur = () => {
    if (localVal !== value) {
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
        fontFamily: 'inherit'
      }}
    />
  );
});

export const SpreadsheetEditor = ({ path, itemConfig, content, onSave, onClose }) => {
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingHeaderIdx, setEditingHeaderIdx] = useState(null);
  const [headerEditVal, setHeaderEditVal] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef(null);

  // Initialize table data from database content, or populate defaults
  useEffect(() => {
    if (content?.tableData && content.tableData.columns && content.tableData.rows) {
      setColumns(content.tableData.columns);
      setRows(content.tableData.rows);
    } else {
      const mock = getInitialMockData(path);
      setColumns(mock.columns);
      setRows(mock.rows);
    }
    setHasChanges(false);
  }, [content, path]);

  // Debounced auto-save triggers whenever hasChanges is true
  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await onSave({ columns, rows });
        setHasChanges(false);
      } catch (err) {
        console.error("Auto-save failed", err);
      } finally {
        setIsSaving(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [hasChanges, columns, rows, onSave]);

  const handleCellChange = useCallback((rowIdx, colName, newVal) => {
    setRows(prev => {
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

  const handleDeleteRow = (rowIdx) => {
    if (window.confirm("Are you sure you want to delete this row?")) {
      setRows(prev => prev.filter((_, i) => i !== rowIdx));
      setHasChanges(true);
    }
  };

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
      setHasChanges(true);
    }
  };

  const handleStartHeaderEdit = (idx, name) => {
    setEditingHeaderIdx(idx);
    setHeaderEditVal(name);
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
    setEditingHeaderIdx(null);
    setHasChanges(true);
  };

  const handleExport = () => {
    // Generate spreadsheet sheet
    const ws = XLSX.utils.json_to_sheet(rows, { header: columns });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Database");
    
    // Write spreadsheet
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
        
        // Parse rows
        const jsonRows = XLSX.utils.sheet_to_json(sheet);
        if (jsonRows.length === 0) {
          alert("The uploaded spreadsheet contains no data.");
          return;
        }

        // Collect all columns
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
        setHasChanges(true);
        alert(`Successfully imported ${importedRows.length} rows and ${importedColumns.length} columns!`);
      } catch (err) {
        console.error("Failed to parse imported spreadsheet", err);
        alert("Failed to parse file. Please upload a valid Excel or CSV spreadsheet.");
      }
    };
    reader.readAsBinaryString(file);
    
    // Clear input
    e.target.value = '';
  };

  const handleClearTable = () => {
    if (window.confirm("Are you sure you want to clear the entire table? This will delete all rows and columns.")) {
      setColumns([]);
      setRows([]);
      setHasChanges(true);
    }
  };

  // Filter rows based on search query
  const filteredRows = useMemo(() => {
    if (!searchQuery) return rows;
    const query = searchQuery.toLowerCase().trim();
    return rows.filter(row => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(query)
      );
    });
  }, [rows, searchQuery]);

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
          {/* Unsaved / Saved Status */}
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
        background: '#fff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 450 }}>
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
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
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

      {/* Spreadsheet grid */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        background: '#faf7f2',
        position: 'relative'
      }}>
        {columns.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', padding: 20 }}>
            <AlertCircle size={40} style={{ marginBottom: 12, color: 'var(--accent-brown)' }} />
            <p style={{ fontSize: 14, margin: 0 }}>This table has no columns. Add columns or import an Excel file to get started.</p>
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
                {/* Index / Control header */}
                <th style={{
                  width: 50,
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
                  zIndex: 2
                }}>
                  #
                </th>

                {/* Column Headers */}
                {columns.map((col, idx) => (
                  <th
                    key={col}
                    style={{
                      width: 180,
                      padding: '6px 8px',
                      background: '#f0e6d9',
                      borderRight: '1px solid #e6d7c3',
                      borderBottom: '1px solid #e6d7c3',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#4a352f',
                      verticalAlign: 'middle',
                      position: 'relative',
                      userSelect: 'none'
                    }}
                  >
                    {editingHeaderIdx === idx ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="text"
                          value={headerEditVal}
                          onChange={(e) => setHeaderEditVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveHeaderEdit(idx);
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
                          onClick={() => handleSaveHeaderEdit(idx)}
                          style={{ background: '#10b981', border: 'none', borderRadius: 4, padding: 3, cursor: 'pointer', color: 'white', display: 'flex' }}
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => setEditingHeaderIdx(null)}
                          style={{ background: '#ef4444', border: 'none', borderRadius: 4, padding: 3, cursor: 'pointer', color: 'white', display: 'flex' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', group: 'true' }}>
                        <span
                          onDoubleClick={() => handleStartHeaderEdit(idx, col)}
                          title="Double-click to rename"
                          style={{ cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 6, color: '#4a352f' }}
                        >
                          {col}
                        </span>
                        
                        <div style={{ display: 'flex', gap: 2 }}>
                          <button
                            onClick={() => handleStartHeaderEdit(idx, col)}
                            title="Rename Column"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--primary-brown)',
                              cursor: 'pointer',
                              padding: 2,
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            onClick={() => handleDeleteColumn(col)}
                            title="Delete Column"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: 2,
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: 24, color: '#999', fontSize: 13, background: 'white' }}>
                    No rows match your search query.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, rowIdx) => {
                  const trueIdx = rows.indexOf(row);
                  return (
                    <tr
                      key={trueIdx}
                      style={{
                        borderBottom: '1px solid var(--pale-brown)',
                        background: rowIdx % 2 === 0 ? '#fff' : 'var(--background-brown)'
                      }}
                    >
                      {/* Left index & delete row control */}
                      <td style={{
                        padding: '6px 8px',
                        background: 'var(--pale-brown)',
                        borderRight: '1px solid var(--medium-brown)',
                        textAlign: 'center',
                        fontSize: 12,
                        color: 'var(--text-brown)',
                        fontWeight: 500,
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                      }}>
                        <span>{trueIdx + 1}</span>
                        <button
                          onClick={() => handleDeleteRow(trueIdx)}
                          title="Delete Row"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                            padding: 2,
                            borderRadius: 4,
                            marginLeft: 4,
                            opacity: 0.7
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>

                      {/* Cells */}
                      {columns.map(col => (
                        <td
                          key={col}
                          style={{
                            borderRight: '1px solid var(--medium-brown)',
                            padding: 0,
                            height: 36,
                            verticalAlign: 'middle',
                            background: 'transparent'
                          }}
                        >
                          <SpreadsheetCell
                            value={row[col]}
                            onChange={(val) => handleCellChange(trueIdx, col, val)}
                          />
                        </td>
                      ))}
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
        color: '#666'
      }}>
        <div>
          Showing {filteredRows.length} of {rows.length} rows · {columns.length} columns
        </div>
        <div>
          Double-click column header to rename · Click cell to edit · Changes auto-save
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetEditor;
