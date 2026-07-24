import React, { useState, useCallback, useEffect } from 'react';
import { FileUploader } from './shared/FileUploader';
import { ADMIN_STRUCTURE } from './structure/adminGovStructure';
import { FileExplorer } from './shared/FileExplorer';
import { CreateItemDialog } from './shared/CreateItemDialog';
import { useCustomStructure } from './shared/useCustomStructure';
import { findItemAtPath } from './structure/growthStructure';
import {
  uploadFile,
  deleteFile,
  loadContent,
  loadAllContent,
  loadUserStructure,
  saveUserStructure,
  deleteContent,
  renameContent,
  renameFile
} from './services/governance';
import { useAuth } from '../../smses/hooks/useAuth';
import {
  AlertCircle
} from 'lucide-react';

const AdminGovernance = () => {
  const { user, loading: authLoading } = useAuth();
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedPath, setSelectedPath] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentContent, setCurrentContent] = useState(null);
  const [contentStatus, setContentStatus] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Custom structure (folders/file entries created on the frontend)
  const {
    mergedStructure,
    createDialog,
    existingNamesAtParent,
    openCreateDialog,
    closeCreateDialog,
    createItem,
    deleteItem,
    renameItem,
  } = useCustomStructure({
    user,
    staticStructure: ADMIN_STRUCTURE,
    loadUserStructure,
    saveUserStructure,
    deleteContent,
    renameContent,
  });

  // Keep selectedItem in sync with the merged structure
  useEffect(() => {
    if (!selectedPath) { setSelectedItem(null); return; }
    const item = findItemAtPath(mergedStructure, selectedPath);
    if (!item || item.type === 'folder') {
      setSelectedPath(null); setSelectedItem(null); setCurrentContent(null);
      return;
    }
    setSelectedItem(item);
  }, [mergedStructure, selectedPath]);

  // No longer needed: iconComponents

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    const loadAllData = async () => {
      try {
        setIsLoading(true);
        const allContent = await loadAllContent();
        const status = {};
        Object.keys(allContent).forEach(pathKey => { status[pathKey] = true; });
        setContentStatus(status);
      } catch (error) {
        console.error('Error loading content:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAllData();
  }, [user]);

  useEffect(() => {
    if (!selectedPath || !user) { setCurrentContent(null); return; }
    const loadData = async () => {
      try {
        const content = await loadContent(selectedPath);
        setCurrentContent(content);
      } catch (error) {
        console.error('Error loading content:', error);
        setCurrentContent(null);
      }
    };
    loadData();
  }, [selectedPath, user]);

  const handleToggleFolder = useCallback((name) => {
    setExpandedFolders(prev => ({ ...prev, [name]: !prev[name] }));
  }, []);

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
      const updatedContent = await loadContent(selectedPath);
      setCurrentContent(updatedContent);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [selectedPath, user]);

  const handleDeleteFile = useCallback(async (fileIndex) => {
    if (!selectedPath || !user) return;
    try {
      await deleteFile(selectedPath, fileIndex);
      const updatedContent = await loadContent(selectedPath);
      setCurrentContent(updatedContent);
      if (!updatedContent || !updatedContent.files || updatedContent.files.length === 0) {
        const pathKey = selectedPath.join(' > ');
        setContentStatus(prev => { const newStatus = { ...prev }; delete newStatus[pathKey]; return newStatus; });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file. Please try again.');
    }
  }, [selectedPath, user]);

  const handleCloseEditor = useCallback(() => {
    setSelectedPath(null);
    setSelectedItem(null);
    setCurrentContent(null);
  }, []);

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
        setSelectedPath(null); setSelectedItem(null); setCurrentContent(null);
      }
    }
  }, [deleteItem, selectedPath]);

  const handleRenameItem = useCallback(async (path, newName) => {
    const result = await renameItem(path, newName);
    if (!result?.handled) return;

    setContentStatus(prev => {
      const n = { ...prev };
      const oldKey = result.oldPath.join(' > ');
      const newKey = result.newPath.join(' > ');

      Object.keys(n).forEach(key => {
        if (key === oldKey) {
          n[newKey] = n[oldKey];
          delete n[oldKey];
        } else if (key.startsWith(oldKey + ' > ')) {
          const suffix = key.substring(oldKey.length);
          n[newKey + suffix] = n[key];
          delete n[key];
        }
      });
      return n;
    });

    setExpandedFolders(prev => {
      const n = { ...prev };
      const oldKey = result.oldPath.join(' > ');
      const newKey = result.newPath.join(' > ');

      Object.keys(n).forEach(key => {
        if (key === oldKey) {
          n[newKey] = n[oldKey];
          delete n[oldKey];
        } else if (key.startsWith(oldKey + ' > ')) {
          const suffix = key.substring(oldKey.length);
          n[newKey + suffix] = n[key];
          delete n[key];
        }
      });
      return n;
    });

    if (selectedPath) {
      const selKey = selectedPath.join(' > ');
      const oldKey = result.oldPath.join(' > ');
      if (selKey === oldKey) {
        setSelectedPath(result.newPath);
      } else if (selKey.startsWith(oldKey + ' > ')) {
        const suffix = selKey.substring(oldKey.length);
        setSelectedPath([...result.newPath, ...suffix.split(' > ').filter(Boolean)]);
      }
    }
  }, [renameItem, selectedPath]);

  const handleRenameFile = useCallback(async (fileIndex, newName) => {
    if (!selectedPath || !user) return;
    try {
      await renameFile(selectedPath, fileIndex, newName);
      const updatedContent = await loadContent(selectedPath);
      setCurrentContent(updatedContent);
    } catch (error) {
      console.error('Error renaming file:', error);
      alert('Failed to rename file. Please try again.');
    }
  }, [selectedPath, user]);

  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #f0e6d9', borderTopColor: '#a67c52', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#4a352f' }}>{authLoading ? 'Authenticating...' : 'Loading admin...'}</p>
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
          <p style={{ color: '#666' }}>Please log in to access Admin & Governance.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{
        padding: 24,
        minHeight: '100vh'
      }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{
            fontSize: 24,
            color: 'var(--text-brown)',
            margin: 0,
            fontWeight: 600
          }}>
            ADMIN & GOVERNANCE
          </h2>
          <p style={{
            fontSize: 14,
            color: '#666',
            margin: '4px 0 0 0'
          }}>
            Board, equity, risk, and compliance documentation
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedPath ? '350px 1fr' : '1fr',
          gap: 20,
          height: 'calc(100vh - 160px)'
        }}>
          {/* File Explorer */}
          <FileExplorer
            structure={mergedStructure}
            expandedFolders={expandedFolders}
            selectedPath={selectedPath}
            onToggleFolder={handleToggleFolder}
            onSelectItem={handleSelectItem}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onRenameItem={handleRenameItem}
            contentStatus={contentStatus}
          />

          {/* Content Editor */}
          {selectedPath && selectedItem && (
            <FileUploader
              path={selectedPath}
              itemConfig={selectedItem}
              content={currentContent}
              onUpload={handleUploadFile}
              onDelete={handleDeleteFile}
              onRenameFile={handleRenameFile}
              onClose={handleCloseEditor}
              isUploading={isUploading}
            />
          )}

          {/* Empty state */}
          {!selectedPath && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'white',
              borderRadius: 8,
              border: '1px solid var(--medium-brown)'
            }}>
              <div style={{ textAlign: 'center', padding: 40 }}>
                <AlertCircle size={48} color="var(--accent-brown)" style={{ marginBottom: 16 }} className='mx-auto' />
                <h3 style={{ color: 'var(--text-brown)', marginBottom: 8 }}>No Item Selected</h3>
                <p style={{ color: '#666', margin: 0 }}>
                  Select a file or folder from the explorer to begin
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateItemDialog
        open={createDialog.open}
        parentPath={createDialog.parentPath}
        existingNames={existingNamesAtParent}
        onClose={closeCreateDialog}
        onCreate={handleCreateItem}
      />
    </>
  );
};

export default AdminGovernance;