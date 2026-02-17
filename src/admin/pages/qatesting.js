import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FileExplorer } from './shared/FileExplorer';
import { FileUploader } from './shared/FileUploader';
import { QA_STRUCTURE } from './structure/qaStructure';
import {
  uploadFile,
  addFileToCollection,
  deleteFile,
  loadContent,
  loadAllContent
} from './services/qa';
import { useAuth } from '../../smses/hooks/useAuth';
import { AlertCircle } from 'lucide-react';
import { QAMasterTable } from './structure/qaMasterTable';
import { loadQATable, saveQATable } from './services/qaMasterTable';

// ─── tiny debounce util ───────────────────────────────────────────────────────
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

const QATesting = () => {
  const { user, loading: authLoading } = useAuth();

  // ── File explorer state ──
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedPath, setSelectedPath]       = useState(null);
  const [selectedItem, setSelectedItem]       = useState(null);
  const [currentContent, setCurrentContent]   = useState(null);
  const [contentStatus, setContentStatus]     = useState({});
  const [isUploading, setIsUploading]         = useState(false);
  const [isLoading, setIsLoading]             = useState(true);

  // ── QA table state ──
  const [qaTasks, setQaTasks]   = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // debounced save ref
  const debouncedSaveRef = useRef(null);

  // ── Bootstrap: load file-explorer content + QA table ──
  useEffect(() => {
    if (!user) { setIsLoading(false); return; }

    const boot = async () => {
      try {
        setIsLoading(true);
        // file explorer status
        const allContent = await loadAllContent();
        const status = {};
        Object.keys(allContent).forEach(k => { status[k] = true; });
        setContentStatus(status);
        // QA table
        const tasks = await loadQATable();
        setQaTasks(tasks);
      } catch (err) {
        console.error('Boot error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    boot();
  }, [user]);

  // ── Debounced Firebase save ──
  useEffect(() => {
    debouncedSaveRef.current = debounce(async (tasks) => {
      if (!user) return;
      try {
        setIsSaving(true);
        await saveQATable(tasks);
      } catch (err) {
        console.error('Save error:', err);
      } finally {
        setIsSaving(false);
      }
    }, 1500);
  }, [user]);

  const persistTasks = useCallback((tasks) => {
    debouncedSaveRef.current?.(tasks);
  }, []);

  // ── QA Table handlers ──
  const handleUpdateTask = useCallback((rowIdx, colId, value) => {
    setQaTasks(prev => {
      const updated = prev.map((t, i) => i === rowIdx ? { ...t, [colId]: value } : t);
      persistTasks(updated);
      return updated;
    });
  }, [persistTasks]);

  const handleAddTask = useCallback(() => {
    const newTask = {
      taskId:       '',
      category:     '',
      dashboard:    '',
      section:      '',
      taskName:     '',
      status:       'Not started',
      dueDate:      '',
      testedWhen:   '',
      assignedTo:   '',
      testType:     '',
      actionStatus: 'Not started',
    };
    setQaTasks(prev => {
      const updated = [...prev, newTask];
      persistTasks(updated);
      return updated;
    });
  }, [persistTasks]);

  const handleDeleteTask = useCallback((rowIdx) => {
    if (!window.confirm('Delete this test row?')) return;
    setQaTasks(prev => {
      const updated = prev.filter((_, i) => i !== rowIdx);
      persistTasks(updated);
      return updated;
    });
  }, [persistTasks]);

  // ── File explorer handlers ──
  useEffect(() => {
    if (!selectedPath || !user) { setCurrentContent(null); return; }
    loadContent(selectedPath)
      .then(setCurrentContent)
      .catch(() => setCurrentContent(null));
  }, [selectedPath, user]);

  const handleToggleFolder = useCallback((path) => {
    const pathKey = path.join(' > ');
    const folderIsExpanded = expandedFolders[pathKey];
    const folderLevel = path.length - 1;
    const next = {};
    if (!folderIsExpanded) {
      Object.keys(expandedFolders).forEach(k => {
        if (k.split(' > ').length - 1 !== folderLevel) next[k] = true;
      });
      next[pathKey] = true;
    } else {
      Object.keys(expandedFolders).forEach(k => { if (k !== pathKey) next[k] = true; });
    }
    setExpandedFolders(next);
  }, [expandedFolders]);

  const handleSelectItem = useCallback((path, item) => {
    setSelectedPath(path);
    setSelectedItem(item);
  }, []);

  const handleUploadFile = useCallback(async (file) => {
    if (!selectedPath || !user) return;
    try {
      setIsUploading(true);
      if (currentContent?.files?.length > 0) {
        await addFileToCollection(selectedPath, file);
      } else {
        await uploadFile(selectedPath, file);
      }
      const pathKey = selectedPath.join(' > ');
      setContentStatus(prev => ({ ...prev, [pathKey]: true }));
      setCurrentContent(await loadContent(selectedPath));
    } catch (err) {
      console.error(err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [selectedPath, currentContent, user]);

  const handleDeleteFile = useCallback(async (fileIndex) => {
    if (!selectedPath || !user) return;
    try {
      await deleteFile(selectedPath, fileIndex);
      const updated = await loadContent(selectedPath);
      setCurrentContent(updated);
      if (!updated?.files?.length) {
        const pathKey = selectedPath.join(' > ');
        setContentStatus(prev => { const n = { ...prev }; delete n[pathKey]; return n; });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete file. Please try again.');
    }
  }, [selectedPath, user]);

  const handleCloseEditor = useCallback(() => {
    setSelectedPath(null);
    setSelectedItem(null);
    setCurrentContent(null);
  }, []);

  // ── Loading / auth guards ──
  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #f0e6d9', borderTopColor: '#a67c52', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#4a352f' }}>{authLoading ? 'Authenticating...' : 'Loading QA & Testing...'}</p>
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
          <p style={{ color: '#666' }}>Please log in to access QA & Testing.</p>
        </div>
      </div>
    );
  }

  // ── Render ──
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

        {/* ── Page header ── */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, color: '#4a352f', margin: 0, fontWeight: 600 }}>QA & TESTING</h2>
          <p style={{ fontSize: 14, color: '#666', margin: '4px 0 0 0' }}>
            Master test table, documentation, reports, and datasets
          </p>
        </div>

        {/* ── Master QA Table (full width, always shown) ── */}
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e6d7c3', padding: 20, marginBottom: 28 }}>
          <QAMasterTable
            tasks={qaTasks}
            onUpdateTask={handleUpdateTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            isSaving={isSaving}
          />
        </div>

        {/* ── File Explorer section header ── */}
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, color: '#4a352f', margin: 0, fontWeight: 600 }}>Test Documents & Files</h3>
          <p style={{ fontSize: 13, color: '#888', margin: '2px 0 0 0' }}>Upload test reports, scripts, and datasets below</p>
        </div>

        {/* ── File Explorer + Uploader ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedPath ? '350px 1fr' : '1fr',
          gap: 20,
          minHeight: 300,
        }}>
          <FileExplorer
            structure={QA_STRUCTURE}
            expandedFolders={expandedFolders}
            selectedPath={selectedPath}
            onToggleFolder={handleToggleFolder}
            onSelectItem={handleSelectItem}
            contentStatus={contentStatus}
          />

          {selectedPath && selectedItem && (
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

          {!selectedPath && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: 8, border: '1px solid #e6d7c3', minHeight: 180 }}>
              <div style={{ textAlign: 'center', padding: 40 }}>
                <AlertCircle size={40} color="#c8b6a6" style={{ marginBottom: 12 }} />
                <h3 style={{ color: '#4a352f', marginBottom: 6, fontSize: 15 }}>No Test Selected</h3>
                <p style={{ color: '#888', margin: 0, fontSize: 13 }}>Select a test category from the explorer to upload files</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default QATesting;