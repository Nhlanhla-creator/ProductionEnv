import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { FileExplorer } from './shared/FileExplorer';
import { FileUploader } from './shared/FileUploader';
import { QA_STRUCTURE } from './structure/qaStructure';
import {
  uploadFile,
  deleteFile,
  loadContent,
  loadAllContent
} from './services/qa';
import { useAuth } from '../../smses/hooks/useAuth';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { QAMasterTable } from './structure/qaMasterTable';
import { loadQATable, saveQATable } from './services/qaMasterTable';
import { addNotification } from './services/notifications';
import AddTaskModal from './structure/AddTaskModal';

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

const QATesting = () => {
  const { user, loading: authLoading } = useAuth();

  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedPath, setSelectedPath]       = useState(null);
  const [selectedItem, setSelectedItem]       = useState(null);
  const [currentContent, setCurrentContent]   = useState(null);
  const [contentStatus, setContentStatus]     = useState({});
  const [isUploading, setIsUploading]         = useState(false);
  const [isLoading, setIsLoading]             = useState(true);

  const [qaTasks, setQaTasks]   = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const debouncedSaveRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    const boot = async () => {
      try {
        setIsLoading(true);
        const [allContent, tasks] = await Promise.all([loadAllContent(), loadQATable()]);
        const status = {};
        Object.keys(allContent).forEach(k => { status[k] = true; });
        setContentStatus(status);
        setQaTasks(tasks);
      } catch (err) {
        console.error('Boot error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    boot();
  }, [user]);

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

      persistTasks(updated);
      return updated;
    });
  }, [persistTasks]);

  const handleAddTask = useCallback((taskData) => {
    if (!taskData) return;
    setQaTasks(prev => {
      const updated = [...prev, taskData];
      persistTasks(updated);
      return updated;
    });
    setToast({ type: 'success', message: 'Task added successfully' });
    setTimeout(() => setToast(null), 3000);
  }, [persistTasks]);

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
      persistTasks(updated);
      return updated;
    });
  }, [persistTasks]);

  // ── Activity dot — track _new entries from sprints ──
  const activityDots = useMemo(() => {
    const hasNew = qaTasks.some(t => t._new === true);
    if (!hasNew) return new Set();
    // The QA Master Table is not a FileExplorer entry in QA_STRUCTURE;
    // we use a synthetic key that the component can check
    return new Set(['__qa_master_table__']);
  }, [qaTasks]);

  // Clear _new flags on all tasks (called when user views QA Master Table)
  const clearNewFlags = useCallback(() => {
    setQaTasks(prev => {
      const hasAnyNew = prev.some(t => t._new);
      if (!hasAnyNew) return prev;
      const updated = prev.map(t => t._new ? { ...t, _new: false } : t);
      persistTasks(updated);
      return updated;
    });
  }, [persistTasks]);

  useEffect(() => {
    if (!selectedPath || !user) { setCurrentContent(null); return; }
    loadContent(selectedPath)
      .then(setCurrentContent)
      .catch(() => setCurrentContent(null));
  }, [selectedPath, user]);

  const handleToggleFolder = useCallback((path) => {
    const pathKey = path.join(' > ');
    const isOpen  = expandedFolders[pathKey];
    const level   = path.length - 1;
    const next    = {};
    if (!isOpen) {
      Object.keys(expandedFolders).forEach(k => {
        if (k.split(' > ').length - 1 !== level) next[k] = true;
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
      await uploadFile(selectedPath, file);
      const pathKey = selectedPath.join(' > ');
      setContentStatus(prev => ({ ...prev, [pathKey]: true }));
      setCurrentContent(await loadContent(selectedPath));
    } catch (err) {
      console.error(err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [selectedPath, user]);

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
        @keyframes qaActivityPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ padding: 24, minHeight: '100vh' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, color: '#4a352f', margin: 0, fontWeight: 600 }}>QA &amp; TESTING</h2>
          <p style={{ fontSize: 14, color: '#666', margin: '4px 0 0' }}>
            Master test table, documentation, reports, and datasets
          </p>
        </div>

        <div
          style={{ background: '#fff', borderRadius: 8, border: '1px solid #e6d7c3', padding: 20, marginBottom: 28, position: 'relative' }}
          onClick={clearNewFlags}
        >
          {activityDots.has('__qa_master_table__') && (
            <div
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 600,
                color: '#92400e',
                zIndex: 10,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#f59e0b',
                  animation: 'qaActivityPulse 1.5s ease-in-out infinite',
                }}
              />
              New tasks from Sprint
            </div>
          )}
          <QAMasterTable
            tasks={qaTasks}
            onUpdateTask={handleUpdateTask}
            onAddTask={handleOpenModal}
            onDeleteTask={handleDeleteTask}
            isSaving={isSaving}
          />
        </div>

        <AddTaskModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onAddTask={handleAddTask}
          existingTasks={qaTasks}
        />

        <div style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, color: '#4a352f', margin: 0, fontWeight: 600 }}>Test Documents &amp; Files</h3>
          <p style={{ fontSize: 13, color: '#888', margin: '2px 0 0' }}>Upload test reports, scripts, and datasets below</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedPath ? '350px 1fr' : '1fr',
          gap: 20,
          minHeight: 300
        }}>
          <FileExplorer
            structure={QA_STRUCTURE}
            expandedFolders={expandedFolders}
            selectedPath={selectedPath}
            onToggleFolder={handleToggleFolder}
            onSelectItem={handleSelectItem}
            contentStatus={contentStatus}
            activityDots={activityDots}
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

export default QATesting;
