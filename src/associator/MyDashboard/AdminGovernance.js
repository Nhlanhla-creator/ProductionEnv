import React, { useState, useCallback, useEffect } from 'react';
import { FileExplorer } from './shared/FileExplorer';
import { FileUploader } from './shared/FileUploader';
import { ADMIN_GOV_STRUCTURE } from './structure/adminGovStructure';
import { AlertCircle } from 'lucide-react';

// Placeholder data for frontend only
const placeholderContent = {};

const AdminGovernance = () => {
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedPath, setSelectedPath] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentContent, setCurrentContent] = useState(null);
  const [contentStatus, setContentStatus] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Simulate loading
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, []);

  const handleToggleFolder = useCallback((path) => {
    const pathKey = path.join(" > ");
    setExpandedFolders(prev => ({ ...prev, [pathKey]: !prev[pathKey] }));
  }, []);

  const handleSelectItem = useCallback((path, item) => {
    setSelectedPath(path);
    setSelectedItem(item);
    // Simulate loading content
    setCurrentContent({ files: [] });
  }, []);

  const handleUploadFile = useCallback(async (file) => {
    if (!selectedPath) return;
    setIsUploading(true);
    setTimeout(() => {
      const pathKey = selectedPath.join(' > ');
      setContentStatus(prev => ({ ...prev, [pathKey]: true }));
      setIsUploading(false);
      alert(`File "${file.name}" uploaded successfully to Association Governance!`);
    }, 1000);
  }, [selectedPath]);

  const handleDeleteFile = useCallback(async (fileIndex) => {
    if (!selectedPath) return;
    setTimeout(() => {
      alert(`File deleted successfully from Association Governance!`);
    }, 500);
  }, [selectedPath]);

  const handleCloseEditor = useCallback(() => {
    setSelectedPath(null);
    setSelectedItem(null);
    setCurrentContent(null);
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #f0e6d9', borderTopColor: '#a67c52', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#4a352f' }}>Loading Association Governance...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        :root { --light-brown: #f5f0e1; --medium-brown: #e6d7c3; --accent-brown: #c8b6a6; --primary-brown: #a67c52; --dark-brown: #7d5a50; --text-brown: #4a352f; --background-brown: #faf7f2; --pale-brown: #f0e6d9; }
      `}</style>

      <div style={{ padding: 24, minHeight: '100vh' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, color: 'var(--text-brown)', margin: 0, fontWeight: 600 }}>ASSOCIATION ADMIN & GOVERNANCE</h2>
          <p style={{ fontSize: 14, color: '#666', margin: '4px 0 0 0' }}>Board, equity, risk, and compliance documentation</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedPath ? '350px 1fr' : '1fr', gap: 20, height: 'calc(100vh - 160px)' }}>
          <FileExplorer
            structure={ADMIN_GOV_STRUCTURE}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: 8, border: '1px solid var(--medium-brown)' }}>
              <div style={{ textAlign: 'center', padding: 40 }}>
                <AlertCircle size={48} color="var(--accent-brown)" style={{ marginBottom: 16 }} />
                <h3 style={{ color: 'var(--text-brown)', marginBottom: 8 }}>No Item Selected</h3>
                <p style={{ color: '#666', margin: 0 }}>Select a file or folder from the explorer to begin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminGovernance;