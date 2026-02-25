import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FileExplorer } from './shared/FileExplorer';
import { FileUploader } from './shared/FileUploader';
import { DocGovernanceChecklist } from './structure/DocGovChecklist';
import { PRODUCT_STRUCTURE } from './structure/productPlatformStructure';
import {
  uploadFile,
  deleteFile,
  loadContent,
  loadAllContent
} from './services/product';
import { loadDocChecklist, saveDocChecklist } from './services/docGovChecklist';
import { useAuth } from '../../smses/hooks/useAuth';
import { AlertCircle, ClipboardList } from 'lucide-react';

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

const CHECKLIST_PATH_KEY = '5_Documentation & Governance Checklist';

const ProductPlatform = () => {
  const { user, loading: authLoading } = useAuth();

  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedPath, setSelectedPath]       = useState(null);
  const [selectedItem, setSelectedItem]       = useState(null);
  const [currentContent, setCurrentContent]   = useState(null);
  const [contentStatus, setContentStatus]     = useState({});
  const [isUploading, setIsUploading]         = useState(false);
  const [isLoading, setIsLoading]             = useState(true);

  const [checklistItems, setChecklistItems]       = useState([]);
  const [isSavingChecklist, setIsSavingChecklist] = useState(false);
  const debouncedSaveRef = useRef(null);

  const isChecklistSelected = selectedPath?.join(' > ') === CHECKLIST_PATH_KEY;

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    const boot = async () => {
      try {
        setIsLoading(true);
        const [allContent, items] = await Promise.all([loadAllContent(), loadDocChecklist()]);
        const status = {};
        Object.keys(allContent).forEach(k => { status[k] = true; });
        setContentStatus(status);
        setChecklistItems(items);
      } catch (err) {
        console.error('Boot error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    boot();
  }, [user]);

  useEffect(() => {
    debouncedSaveRef.current = debounce(async (items) => {
      if (!user) return;
      try {
        setIsSavingChecklist(true);
        await saveDocChecklist(items);
      } catch (err) {
        console.error('Checklist save error:', err);
      } finally {
        setIsSavingChecklist(false);
      }
    }, 1500);
  }, [user]);

  const persistChecklist = useCallback((items) => {
    debouncedSaveRef.current?.(items);
  }, []);

  const handleUpdateChecklistItem = useCallback((idx, field, value) => {
    setChecklistItems(prev => {
      const updated = prev.map((item, i) => i === idx ? { ...item, [field]: value } : item);
      persistChecklist(updated);
      return updated;
    });
  }, [persistChecklist]);

  const handleAddChecklistItem = useCallback((section) => {
    const newItem = { id: '', section, task: '', category: 'Other', owner: '', priority: 'Medium', status: 'Not Started', deliverable: '', notes: '' };
    setChecklistItems(prev => {
      const lastIdx = prev.reduce((last, item, i) => item.section === section ? i : last, -1);
      const updated = [...prev];
      updated.splice(lastIdx + 1, 0, newItem);
      persistChecklist(updated);
      return updated;
    });
  }, [persistChecklist]);

  const handleDeleteChecklistItem = useCallback((idx) => {
    if (!window.confirm('Delete this checklist row?')) return;
    setChecklistItems(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      persistChecklist(updated);
      return updated;
    });
  }, [persistChecklist]);

  useEffect(() => {
    if (!selectedPath || !user || isChecklistSelected) { setCurrentContent(null); return; }
    loadContent(selectedPath)
      .then(setCurrentContent)
      .catch(() => setCurrentContent(null));
  }, [selectedPath, user, isChecklistSelected]);

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
      // FIX: always call uploadFile directly — it handles appending internally
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

        {isChecklistSelected ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={18} color="#a67c52" />
                <span style={{ fontSize: 15, fontWeight: 600, color: '#4a352f' }}>
                  5_Documentation &amp; Governance Checklist
                </span>
              </div>
              <button
                onClick={handleCloseEditor}
                style={{ padding: '6px 16px', background: 'transparent', color: '#4a352f', border: '1px solid #e6d7c3', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
              >
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: selectedPath ? '350px 1fr' : '1fr',
            gap: 20,
            height: 'calc(100vh - 160px)'
          }}>
            <FileExplorer
              structure={PRODUCT_STRUCTURE}
              expandedFolders={expandedFolders}
              selectedPath={selectedPath}
              onToggleFolder={handleToggleFolder}
              onSelectItem={handleSelectItem}
              contentStatus={contentStatus}
            />

            {selectedPath && selectedItem && !isChecklistSelected && (
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: 8, border: '1px solid #e6d7c3' }}>
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <AlertCircle size={48} color="#c8b6a6" style={{ marginBottom: 16 }} />
                  <h3 style={{ color: '#4a352f', marginBottom: 8 }}>No Section Selected</h3>
                  <p style={{ color: '#666', margin: 0 }}>Select a section from the explorer to begin</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ProductPlatform;