import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { FileExplorer } from './shared/FileExplorer';
import { FileUploader } from './shared/FileUploader';
import { CreateItemDialog } from './shared/CreateItemDialog';
import { useCustomStructure } from './shared/useCustomStructure';
import { findItemAtPath } from './structure/growthStructure';
import { DocGovernanceChecklist } from './structure/DocGovChecklist';
import { QAMasterTable } from './structure/qaMasterTable';
import { PRODUCT_STRUCTURE } from './structure/productPlatformStructure';
import { TECH_STRUCTURE } from './structure/techArchStructure';
import { QA_STRUCTURE } from './structure/qaStructure';
import {
  uploadFile as uploadProductFile,
  deleteFile as deleteProductFile,
  loadContent as loadProductContent,
  loadAllContent as loadAllProductContent,
  deleteContent as deleteProductContent,
  loadUserStructure,
  saveUserStructure
} from './services/product';
import {
  uploadFile as uploadTechFile,
  deleteFile as deleteTechFile,
  loadContent as loadTechContent,
  loadAllContent as loadAllTechContent,
  deleteContent as deleteTechContent
} from './services/tech';
import {
  uploadFile as uploadQAFile,
  deleteFile as deleteQAFile,
  loadContent as loadQAContent,
  loadAllContent as loadAllQAContent,
  deleteContent as deleteQAContent
} from './services/qa';
import { loadDocChecklist, saveDocChecklist } from './services/docGovChecklist';
import { loadQATable, saveQATable } from './services/qaMasterTable';
import { addNotification } from './services/notifications';
import { useAuth } from '../../smses/hooks/useAuth';
import { AlertCircle, ClipboardList, CheckCircle, X } from 'lucide-react';
import AddTaskModal from './structure/AddTaskModal';

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

const CHECKLIST_PATH_KEY = '5_Documentation & Governance Checklist';
const TECH_PREFIX        = '2_Technical Architecture';
const QA_PREFIX          = '3_QA & Testing';
const QA_TABLE_PATH_KEY  = '3_QA & Testing > QA Master Table';

const ProductPlatform = () => {
  const { user, loading: authLoading } = useAuth();

  // ── Shared navigation state ───────────────────────────────────────────────
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedPath, setSelectedPath]       = useState(null);
  const [selectedItem, setSelectedItem]       = useState(null);
  const [isLoading, setIsLoading]             = useState(true);

  // ── Per-service content state ─────────────────────────────────────────────
  const [productContent, setProductContent]   = useState(null);
  const [techContent, setTechContent]         = useState(null);
  const [qaFileContent, setQaFileContent]     = useState(null);
  const [contentStatus, setContentStatus]     = useState({});
  const [isUploading, setIsUploading]         = useState(false);

  // ── Checklist state ───────────────────────────────────────────────────────
  const [checklistItems, setChecklistItems]       = useState([]);
  const [isSavingChecklist, setIsSavingChecklist] = useState(false);

  // ── QA table state ────────────────────────────────────────────────────────
  const [qaTasks, setQaTasks]     = useState([]);
  const [isSavingQA, setIsSavingQA] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const debouncedChecklistRef = useRef(null);
  const debouncedQARef        = useRef(null);
  const selectedPathRef       = useRef(null);

  // Full static structure (Product + Tech overlay + QA overlay). User-custom
  // additions are merged into this by the hook below.
  const fullStaticStructure = useMemo(() => ({
    ...PRODUCT_STRUCTURE,
    '2_Technical Architecture': {
      type: 'folder',
      icon: 'server',
      items: TECH_STRUCTURE,
    },
    '3_QA & Testing': {
      type: 'folder',
      icon: 'check-circle',
      items: {
        'QA Master Table': { type: 'qa-table', icon: 'table' },
        ...QA_STRUCTURE,
      },
    },
  }), []);

  // Route deleteContent to the right service based on the path prefix
  // (matches the routing already used by upload/delete file handlers below).
  const routedDeleteContent = useCallback(async (path) => {
    const key = path.join(' > ');
    if (key.startsWith(TECH_PREFIX + ' > ')) {
      return deleteTechContent(path.slice(1));
    }
    if (key.startsWith(QA_PREFIX + ' > ') && key !== QA_TABLE_PATH_KEY) {
      return deleteQAContent(path.slice(1));
    }
    return deleteProductContent(path);
  }, []);

  // Custom structure (folders/file entries created on the frontend)
  const {
    mergedStructure,
    createDialog,
    existingNamesAtParent,
    openCreateDialog,
    closeCreateDialog,
    createItem,
    deleteItem,
  } = useCustomStructure({
    user,
    staticStructure: fullStaticStructure,
    loadUserStructure,
    saveUserStructure,
    deleteContent: routedDeleteContent,
  });

  // Keep selectedItem in sync with the merged structure so newly created
  // entries stay valid and stale selections are cleared.
  useEffect(() => {
    if (!selectedPath) { setSelectedItem(null); return; }
    const item = findItemAtPath(mergedStructure, selectedPath);
    if (!item || item.type === 'folder') {
      selectedPathRef.current = null;
      setSelectedPath(null); setSelectedItem(null);
      setProductContent(null); setTechContent(null); setQaFileContent(null);
      return;
    }
    setSelectedItem(item);
  }, [mergedStructure, selectedPath]);

  // ── Derived flags ─────────────────────────────────────────────────────────
  const pathKey             = selectedPath?.join(' > ') ?? '';
  const isChecklistSelected = pathKey === CHECKLIST_PATH_KEY;
  const isQATableSelected   = pathKey === QA_TABLE_PATH_KEY;
  const isTechSection       = pathKey.startsWith(TECH_PREFIX + ' > ');
  const isQAFileSection     = pathKey.startsWith(QA_PREFIX + ' > ') && !isQATableSelected;

  // Current content for active section
  const currentContent = isTechSection ? techContent : isQAFileSection ? qaFileContent : productContent;

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    const boot = async () => {
      try {
        setIsLoading(true);
        const [allProduct, allTech, allQA, checkItems, qaTbl] = await Promise.all([
          loadAllProductContent(),
          loadAllTechContent(),
          loadAllQAContent(),
          loadDocChecklist(),
          loadQATable(),
        ]);

        // Merge all content status — prefix Tech and QA paths to match merged structure keys
        const status = {};
        Object.keys(allProduct).forEach(k => { status[k] = true; });
        Object.keys(allTech).forEach(k => { status[`${TECH_PREFIX} > ${k}`] = true; });
        Object.keys(allQA).forEach(k => { status[`${QA_PREFIX} > ${k}`] = true; });
        setContentStatus(status);
        setChecklistItems(checkItems);
        setQaTasks(qaTbl);
      } catch (err) {
        console.error('Boot error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    boot();
  }, [user]);

  // ── Debounced savers ──────────────────────────────────────────────────────
  useEffect(() => {
    debouncedChecklistRef.current = debounce(async (items) => {
      if (!user) return;
      try { setIsSavingChecklist(true); await saveDocChecklist(items); }
      catch (err) { console.error('Checklist save error:', err); }
      finally { setIsSavingChecklist(false); }
    }, 1500);
    debouncedQARef.current = debounce(async (tasks) => {
      if (!user) return;
      try { setIsSavingQA(true); await saveQATable(tasks); }
      catch (err) { console.error('QA table save error:', err); }
      finally { setIsSavingQA(false); }
    }, 1500);
  }, [user]);

  // ── Load content when selection changes ───────────────────────────────────
  useEffect(() => {
    if (!selectedPath || !user || isChecklistSelected || isQATableSelected) {
      setProductContent(null); setTechContent(null); setQaFileContent(null);
      return;
    }
    const load = async () => {
      try {
        if (isTechSection) {
          // Strip "2_Technical Architecture" prefix — service only knows its own paths
          const subPath = selectedPath.slice(1);
          setTechContent(await loadTechContent(subPath));
        } else if (isQAFileSection) {
          const subPath = selectedPath.slice(1);
          setQaFileContent(await loadQAContent(subPath));
        } else {
          setProductContent(await loadProductContent(selectedPath));
        }
      } catch (err) {
        console.error('Load content error:', err);
      }
    };
    load();
  }, [selectedPath, user, isChecklistSelected, isQATableSelected, isTechSection, isQAFileSection]);

  // ── Navigation handlers ───────────────────────────────────────────────────
  const handleToggleFolder = useCallback((path) => {
    const key    = path.join(' > ');
    const isOpen = expandedFolders[key];
    const level  = path.length - 1;
    const next   = {};
    if (!isOpen) {
      Object.keys(expandedFolders).forEach(k => {
        if (k.split(' > ').length - 1 !== level) next[k] = true;
      });
      next[key] = true;
    } else {
      Object.keys(expandedFolders).forEach(k => { if (k !== key) next[k] = true; });
    }
    setExpandedFolders(next);
  }, [expandedFolders]);

  const handleSelectItem = useCallback((path, item) => {
    selectedPathRef.current = path;
    setSelectedPath(path);
    setSelectedItem(item);
  }, []);

  const handleCloseEditor = useCallback(() => {
    selectedPathRef.current = null;
    setSelectedPath(null);
    setSelectedItem(null);
    setProductContent(null);
    setTechContent(null);
    setQaFileContent(null);
  }, []);

  // ── Upload / Delete ───────────────────────────────────────────────────────
  const handleUploadFile = useCallback(async (file) => {
    const currentPath = selectedPathRef.current;
    if (!currentPath || !user) return;
    const key    = currentPath.join(' > ');
    const isTech = key.startsWith(TECH_PREFIX + ' > ');
    const isQA   = key.startsWith(QA_PREFIX + ' > ') && key !== QA_TABLE_PATH_KEY;

    try {
      setIsUploading(true);
      if (isTech) {
        const subPath = currentPath.slice(1);
        await uploadTechFile(subPath, file);
        setTechContent(await loadTechContent(subPath));
        setContentStatus(prev => ({ ...prev, [key]: true }));
      } else if (isQA) {
        const subPath = currentPath.slice(1);
        await uploadQAFile(subPath, file);
        setQaFileContent(await loadQAContent(subPath));
        setContentStatus(prev => ({ ...prev, [key]: true }));
      } else {
        await uploadProductFile(currentPath, file);
        setProductContent(await loadProductContent(currentPath));
        setContentStatus(prev => ({ ...prev, [key]: true }));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [user]);

  const handleDeleteFile = useCallback(async (fileIndex) => {
    const currentPath = selectedPathRef.current;
    if (!currentPath || !user) return;
    const key    = currentPath.join(' > ');
    const isTech = key.startsWith(TECH_PREFIX + ' > ');
    const isQA   = key.startsWith(QA_PREFIX + ' > ') && key !== QA_TABLE_PATH_KEY;

    try {
      if (isTech) {
        const subPath = currentPath.slice(1);
        await deleteTechFile(subPath, fileIndex);
        const updated = await loadTechContent(subPath);
        setTechContent(updated);
        if (!updated?.files?.length) setContentStatus(prev => { const n = {...prev}; delete n[key]; return n; });
      } else if (isQA) {
        const subPath = currentPath.slice(1);
        await deleteQAFile(subPath, fileIndex);
        const updated = await loadQAContent(subPath);
        setQaFileContent(updated);
        if (!updated?.files?.length) setContentStatus(prev => { const n = {...prev}; delete n[key]; return n; });
      } else {
        await deleteProductFile(currentPath, fileIndex);
        const updated = await loadProductContent(currentPath);
        setProductContent(updated);
        if (!updated?.files?.length) setContentStatus(prev => { const n = {...prev}; delete n[key]; return n; });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete file. Please try again.');
    }
  }, [user]);

  // ── Checklist handlers ────────────────────────────────────────────────────
  const handleUpdateChecklistItem = useCallback((idx, field, value) => {
    setChecklistItems(prev => {
      const updated = prev.map((item, i) => i === idx ? { ...item, [field]: value } : item);
      debouncedChecklistRef.current?.(updated);
      return updated;
    });
  }, []);

  const handleAddChecklistItem = useCallback((section) => {
    const newItem = { id: '', section, task: '', category: 'Other', owner: '', priority: 'Medium', status: 'Not Started', deliverable: '', notes: '' };
    setChecklistItems(prev => {
      const lastIdx = prev.reduce((last, item, i) => item.section === section ? i : last, -1);
      const updated = [...prev];
      updated.splice(lastIdx + 1, 0, newItem);
      debouncedChecklistRef.current?.(updated);
      return updated;
    });
  }, []);

  const handleDeleteChecklistItem = useCallback((idx) => {
    if (!window.confirm('Delete this checklist row?')) return;
    setChecklistItems(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      debouncedChecklistRef.current?.(updated);
      return updated;
    });
  }, []);

  // ── QA table handlers ─────────────────────────────────────────────────────
  const persistQATasks = useCallback((tasks) => {
    debouncedQARef.current?.(tasks);
  }, []);

  const clearNewQAFlags = useCallback(() => {
    setQaTasks(prev => {
      const hasAnyNew = prev.some(t => t._new);
      if (!hasAnyNew) return prev;
      const updated = prev.map(t => t._new ? { ...t, _new: false } : t);
      persistQATasks(updated);
      return updated;
    });
  }, [persistQATasks]);

  // Activity dot - track _new entries from sprints for QA Master Table
  const activityDots = useMemo(() => {
    const hasNew = qaTasks.some(t => t._new === true);
    if (!hasNew) return new Set();
    return new Set(['3_QA & Testing > QA Master Table']);
  }, [qaTasks]);

  // Clear new QA flags when the user views the QA Master Table
  useEffect(() => {
    if (isQATableSelected) {
      clearNewQAFlags();
    }
  }, [isQATableSelected, clearNewQAFlags]);

  const handleUpdateTask = useCallback((rowIdx, colId, value) => {
    setQaTasks(prev => {
      const oldTask = prev[rowIdx];
      const updated = prev.map((t, i) => i === rowIdx ? { ...t, [colId]: value } : t);

      // Fire notification when status changes from dash/empty to Pass or Fail
      if (colId === 'status' && oldTask) {
        const oldStatus = oldTask.status || '—';
        if ((oldStatus === '—' || oldStatus === '') && (value === 'Pass' || value === 'Fail')) {
          const assignee = oldTask.assignedTo || 'Unassigned';
          addNotification({
            type: 'qa_status_change',
            message: `QA task "${oldTask.taskName || oldTask.taskId}" marked as ${value}`,
            taskOwner: assignee,
            sprintName: oldTask.section || '',
            taskName: oldTask.taskName || oldTask.taskId || '',
            qaStatus: value,
            dashboard: oldTask.dashboard || '',
            sourceSprintId: oldTask._sourceSprintId ? String(oldTask._sourceSprintId) : '',
            sourceTaskId: oldTask._sourceTaskId ? String(oldTask._sourceTaskId) : '',
          }).catch(err => console.error('Failed to send QA status notification:', err));
        }
      }

      debouncedQARef.current?.(updated);
      return updated;
    });
  }, []);

  const handleAddTask = useCallback((taskData) => {
    if (!taskData) return;
    setQaTasks(prev => {
      const updated = [...prev, taskData];
      debouncedQARef.current?.(updated);
      return updated;
    });
    setToast({ type: 'success', message: 'Task added successfully' });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleDeleteTask = useCallback((rowIdx) => {
    if (!window.confirm('Delete this test row?')) return;
    setQaTasks(prev => {
      const updated = prev.filter((_, i) => i !== rowIdx);
      debouncedQARef.current?.(updated);
      return updated;
    });
  }, []);

  // ── Custom structure handlers ───────────────────────────────────
  const handleAddItem = openCreateDialog;

  const handleCreateItem = useCallback(async (input) => {
    const result = await createItem(input);
    if (result?.parentPath?.length > 0) {
      const k = result.parentPath.join(' > ');
      setExpandedFolders(prev => ({ ...prev, [k]: true }));
    }
  }, [createItem]);

  const handleDeleteItem = useCallback(async (path, item) => {
    const result = await deleteItem(path, item);
    if (!result?.handled) return;
    setContentStatus(prev => {
      const n = { ...prev };
      for (const fp of result.deletedFilePaths) delete n[fp.join(' > ')];
      return n;
    });
    if (selectedPath) {
      const selKey = selectedPath.join(' > ');
      const baseKey = result.basePath.join(' > ');
      if (selKey === baseKey || selKey.startsWith(baseKey + ' > ')) {
        selectedPathRef.current = null;
        setSelectedPath(null); setSelectedItem(null);
        setProductContent(null); setTechContent(null); setQaFileContent(null);
      }
    }
  }, [deleteItem, selectedPath]);

  // ── Loading / auth guards ─────────────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #f0e6d9', borderTopColor: '#a67c52', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#4a352f' }}>{authLoading ? 'Authenticating...' : 'Loading Platform & Product...'}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 8, border: '1px solid #e6d7c3' }}>
          <AlertCircle size={48} color="#c8b6a6" style={{ marginBottom: 16 }} />
          <h2 style={{ color: '#4a352f', marginBottom: 8 }}>Authentication Required</h2>
          <p style={{ color: '#666' }}>Please log in to access Platform & Product.</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        :root {
          --light-brown: #f5f0e1; --medium-brown: #e6d7c3;
          --accent-brown: #c8b6a6; --primary-brown: #a67c52;
          --dark-brown: #7d5a50; --text-brown: #4a352f;
          --background-brown: #faf7f2; --pale-brown: #f0e6d9;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ padding: 24, minHeight: '100vh' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, color: '#4a352f', margin: 0, fontWeight: 600 }}>PLATFORM &amp; PRODUCT</h2>
          <p style={{ fontSize: 14, color: '#666', margin: '4px 0 0' }}>
            Product modules, technical architecture, QA, customer support, and governance
          </p>
        </div>

        {/* ── Checklist: full-width ── */}
        {isChecklistSelected ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={18} color="#a67c52" />
                <span style={{ fontSize: 15, fontWeight: 600, color: '#4a352f' }}>Documentation &amp; Governance Checklist</span>
              </div>
              <button onClick={handleCloseEditor} style={{ padding: '6px 16px', background: 'transparent', color: '#4a352f', border: '1px solid #e6d7c3', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                ← Back
              </button>
            </div>
            <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e6d7c3', padding: 24 }}>
              <DocGovernanceChecklist
                items={checklistItems}
                onUpdateItem={handleUpdateChecklistItem}
                onAddItem={handleAddChecklistItem}
                onDeleteItem={handleDeleteChecklistItem}
                isSaving={isSavingChecklist}
              />
            </div>
          </div>

        ) : (
          <div>
            {/* ── Two-column: explorer + file panel ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: (selectedPath && !isQATableSelected) ? '350px 1fr' : '1fr',
              gap: 20,
              height: isQATableSelected ? 'auto' : 'calc(100vh - 160px)',
            }}>
              {/* File explorer — always visible */}
              <FileExplorer
                structure={mergedStructure}
                expandedFolders={expandedFolders}
                selectedPath={selectedPath}
                onToggleFolder={handleToggleFolder}
                onSelectItem={handleSelectItem}
                onAddItem={handleAddItem}
                onDeleteItem={handleDeleteItem}
                contentStatus={contentStatus}
                activityDots={activityDots}
              />

              {/* File uploader — right panel */}
              {selectedPath && selectedItem && !isQATableSelected && (
                <FileUploader
                  path={selectedPath}
                  itemConfig={selectedItem}
                  content={currentContent}
                  onUpload={handleUploadFile}
                  onDelete={handleDeleteFile}
                  onClose={handleCloseEditor}
                  isUploading={isUploading}
                />
              )}

              {/* Empty state */}
              {!selectedPath && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: 8, border: '1px solid #e6d7c3' }}>
                  <div style={{ textAlign: 'center', padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <AlertCircle size={48} color="#c8b6a6" style={{ marginBottom: 16 }} />
                    <h3 style={{ color: '#4a352f', marginBottom: 8 }}>No Section Selected</h3>
                    <p style={{ color: '#666', margin: 0 }}>Select a section from the explorer to begin</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── QA Master Table: below the file tree ── */}
            {isQATableSelected && (
              <div style={{ marginTop: 20, background: 'white', borderRadius: 8, border: '1px solid #e6d7c3', padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, color: '#4a352f', margin: 0, fontWeight: 600 }}>QA Master Table</h3>
                    <p style={{ fontSize: 13, color: '#888', margin: '2px 0 0' }}>Master test tracking table</p>
                  </div>
                  <button onClick={handleCloseEditor} style={{ padding: '6px 16px', background: 'transparent', color: '#4a352f', border: '1px solid #e6d7c3', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                    ✕ Close
                  </button>
                </div>
                <QAMasterTable
                  tasks={qaTasks}
                  onUpdateTask={handleUpdateTask}
                  onAddTask={handleOpenModal}
                  onDeleteTask={handleDeleteTask}
                  isSaving={isSavingQA}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <CreateItemDialog
        open={createDialog.open}
        parentPath={createDialog.parentPath}
        existingNames={existingNamesAtParent}
        onClose={closeCreateDialog}
        onCreate={handleCreateItem}
      />

      <AddTaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddTask={handleAddTask}
        existingTasks={qaTasks}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            padding: '12px 16px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 2000,
            backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default ProductPlatform;