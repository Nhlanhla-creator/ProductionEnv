import React, { useState, useCallback, useEffect } from 'react';
import { FileExplorer } from './shared/FileExplorer';
import { FileUploader } from './shared/FileUploader';
import { PILOTS_STRUCTURE } from './structure/pilotsStructure';
import {
  uploadFile,
  addFileToCollection,
  deleteFile,
  loadContent,
  loadAllContent
} from './services/pilots';
import { useAuth } from '../../smses/hooks/useAuth';
import { AlertCircle } from 'lucide-react';

const PilotsCaseStudies = () => {
  const { user, loading: authLoading } = useAuth();
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedPath, setSelectedPath] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentContent, setCurrentContent] = useState(null);
  const [contentStatus, setContentStatus] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadAllData = async () => {
      try {
        setIsLoading(true);
        const allContent = await loadAllContent();
        const status = {};
        Object.keys(allContent).forEach(pathKey => {
          status[pathKey] = true;
        });
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
    if (!selectedPath || !user) {
      setCurrentContent(null);
      return;
    }

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

  const handleToggleFolder = useCallback((path) => {
    const pathKey = path.join(" > ");
    const folderIsExpanded = expandedFolders[pathKey];
    const folderLevel = path.length - 1;
    const newExpandedFolders = {};

    if (!folderIsExpanded) {
      Object.keys(expandedFolders).forEach((expandedPathKey) => {
        const expandedPath = expandedPathKey.split(" > ");
        const expandedPathLevel = expandedPath.length - 1;
        if (expandedPathLevel !== folderLevel) {
          newExpandedFolders[expandedPathKey] = true;
        }
      });
      newExpandedFolders[pathKey] = true;
    } else {
      Object.keys(expandedFolders).forEach((expandedPathKey) => {
        if (expandedPathKey !== pathKey) {
          newExpandedFolders[expandedPathKey] = true;
        }
      });
    }

    setExpandedFolders(newExpandedFolders);
  }, [expandedFolders]);

  const handleSelectItem = useCallback((path, item) => {
    setSelectedPath(path);
    setSelectedItem(item);
  }, []);

  const handleUploadFile = useCallback(async (file) => {
    if (!selectedPath || !user) return;

    try {
      setIsUploading(true);
      
      if (currentContent && currentContent.files && currentContent.files.length > 0) {
        await addFileToCollection(selectedPath, file);
      } else {
        await uploadFile(selectedPath, file);
      }

      const pathKey = selectedPath.join(' > ');
      setContentStatus(prev => ({
        ...prev,
        [pathKey]: true
      }));

      const updatedContent = await loadContent(selectedPath);
      setCurrentContent(updatedContent);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [selectedPath, currentContent, user]);

  const handleDeleteFile = useCallback(async (fileIndex) => {
    if (!selectedPath || !user) return;

    try {
      await deleteFile(selectedPath, fileIndex);
      const updatedContent = await loadContent(selectedPath);
      setCurrentContent(updatedContent);

      if (!updatedContent || !updatedContent.files || updatedContent.files.length === 0) {
        const pathKey = selectedPath.join(' > ');
        setContentStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[pathKey];
          return newStatus;
        });
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

  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',}}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '4px solid var(--pale-brown)', borderTopColor: 'var(--primary-brown)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-brown)' }}>{authLoading ? 'Authenticating...' : 'Loading pilots...'}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',}}>
        <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 8, border: '1px solid var(--medium-brown)' }}>
          <AlertCircle size={48} color="var(--accent-brown)" style={{ marginBottom: 16 }} />
          <h2 style={{ color: 'var(--text-brown)', marginBottom: 8 }}>Authentication Required</h2>
          <p style={{ color: '#666' }}>Please log in to access Pilots & Case Studies.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        :root { --light-brown: #f5f0e1; --medium-brown: #e6d7c3; --accent-brown: #c8b6a6; --primary-brown: #a67c52; --dark-brown: #7d5a50; --text-brown: #4a352f; --background-brown: #faf7f2; --pale-brown: #f0e6d9; }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ padding: 24, minHeight: '100vh' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, color: 'var(--text-brown)', margin: 0, fontWeight: 600 }}>PILOTS & CASE STUDIES</h2>
          <p style={{ fontSize: 14, color: '#666', margin: '4px 0 0 0' }}>Pilot programs, results, testimonials, and success stories</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedPath ? '350px 1fr' : '1fr', gap: 20, height: 'calc(100vh - 160px)' }}>
          <FileExplorer structure={PILOTS_STRUCTURE} expandedFolders={expandedFolders} selectedPath={selectedPath} onToggleFolder={handleToggleFolder} onSelectItem={handleSelectItem} contentStatus={contentStatus} />
          {selectedPath && selectedItem && <FileUploader path={selectedPath} itemConfig={selectedItem} content={currentContent} onUpload={handleUploadFile} onDelete={handleDeleteFile} onClose={handleCloseEditor} isUploading={isUploading} />}
          {!selectedPath && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: 8, border: '1px solid var(--medium-brown)' }}>
              <div style={{ textAlign: 'center', padding: 40 }}>
                <AlertCircle size={48} color="var(--accent-brown)" style={{ marginBottom: 16 }} />
                <h3 style={{ color: 'var(--text-brown)', marginBottom: 8 }}>No Section Selected</h3>
                <p style={{ color: '#666', margin: 0 }}>Select a pilot section from the explorer to begin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PilotsCaseStudies;