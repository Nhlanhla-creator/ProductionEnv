// growth-components/FileUploader.jsx
import React, { useCallback, useState } from 'react';
import { Upload, File, X, Download, Trash2, FileText, Image, Eye, Edit2, Grid, List, Plus, MoreVertical } from 'lucide-react';

const FileIcon = ({ mimeType, name, size = 24 }) => {
  const ext = name?.split('.').pop()?.toLowerCase();
  
  if (mimeType?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
    return <Image size={size} color="#8a5a44" />;
  }
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return <FileText size={size} color="#d90429" />;
  }
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
    return <FileText size={size} color="#2b9348" />;
  }
  if (ext === 'docx' || ext === 'doc') {
    return <FileText size={size} color="#0077b6" />;
  }
  if (ext === 'pptx' || ext === 'ppt') {
    return <FileText size={size} color="#e85d04" />;
  }
  return <FileText size={size} color="#6d597a" />;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const FileUploader = ({ 
  path, 
  itemConfig,
  content, 
  onUpload, 
  onDelete,
  onRenameFile,
  onClose,
  isUploading 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [renamingIndex, setRenamingIndex] = useState(null);
  const [renamingName, setRenamingName] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [activeMenuIndex, setActiveMenuIndex] = useState(null);
  
  const files = content?.files || [];

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = useCallback((e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, []);

  const handleFiles = (fileList) => {
    const file = fileList[0];
    
    // Check file size if maxSize is specified
    if (itemConfig?.maxSize && file.size > itemConfig.maxSize) {
      const maxSizeMB = Math.round(itemConfig.maxSize / (1024 * 1024));
      const fileSizeMB = Math.round(file.size / (1024 * 1024) * 100) / 100;
      alert(`File size (${fileSizeMB}MB) exceeds the maximum allowed size (${maxSizeMB}MB). Please choose a smaller file.`);
      return;
    }
    
    // Check file type if accept is specified
    if (itemConfig?.accept) {
      const acceptedTypes = itemConfig.accept.split(',').map(t => t.trim());
      const fileExt = '.' + file.name.split('.').pop();
      const isAccepted = acceptedTypes.some(type => 
        type === fileExt || file.type.startsWith(type.replace('*', ''))
      );
      
      if (!isAccepted) {
        alert(`Please upload a file with one of these formats: ${itemConfig.accept}`);
        return;
      }
    }

    onUpload(file);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'white',
      borderRadius: 8,
      border: '1px solid var(--medium-brown)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Invisible backdrop to dismiss popup menu on click outside */}
      {activeMenuIndex !== null && (
        <div 
          onClick={() => setActiveMenuIndex(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            background: 'transparent'
          }}
        />
      )}

      <style>{`
        .file-item-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          height: 160px;
          border: 1px solid var(--medium-brown);
          border-radius: 8px;
          background: white;
          padding: 12px;
          box-sizing: border-box;
          transition: all 0.2s ease;
          text-align: center;
        }
        .file-item-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border-color: var(--primary-brown) !important;
        }
        .file-item-row {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: var(--background-brown);
          border: 1px solid var(--medium-brown);
          border-radius: 6px;
          transition: all 0.15s ease;
        }
        .file-item-row:hover {
          border-color: var(--primary-brown);
          background: var(--pale-brown);
        }
        .menu-item-hover:hover {
          background-color: var(--pale-brown) !important;
        }
        .three-dots-btn {
          opacity: 0.5;
          transition: opacity 0.15s ease;
        }
        .file-item-card:hover .three-dots-btn,
        .file-item-row:hover .three-dots-btn {
          opacity: 1;
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--pale-brown)',
        borderBottom: '1px solid var(--medium-brown)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <File size={18} color="var(--primary-brown)" />
          <div>
            <h3 style={{ 
              margin: 0, 
              fontSize: 16, 
              fontWeight: 600,
              color: 'var(--text-brown)'
            }}>
              {path[path.length - 1]}
            </h3>
            {itemConfig?.description && (
              <p style={{ 
                margin: 0, 
                fontSize: 12, 
                color: '#666',
                marginTop: 2
              }}>
                {itemConfig.description}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Toggle between Grid and List View */}
          <div style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.05)',
            padding: 3,
            borderRadius: 6,
            border: '1px solid var(--medium-brown)'
          }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
              title="Grid View"
            >
              <Grid size={16} color={viewMode === 'grid' ? 'var(--primary-brown)' : '#666'} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
              title="List View"
            >
              <List size={16} color={viewMode === 'list' ? 'var(--primary-brown)' : '#666'} />
            </button>
          </div>

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

      {/* Content Body acts as Dropzone */}
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{ 
          flex: 1, 
          padding: 20, 
          overflow: 'auto',
          background: dragActive ? 'var(--pale-brown)' : 'white',
          border: dragActive ? '2px dashed var(--primary-brown)' : 'none',
          boxSizing: 'border-box',
          transition: 'all 0.15s'
        }}
      >
        {isUploading && (
          <div style={{
            background: 'var(--pale-brown)',
            border: '1px solid var(--primary-brown)',
            borderRadius: 6,
            padding: '10px 14px',
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--primary-brown)',
            textAlign: 'center'
          }}>
            Uploading file... Please wait.
          </div>
        )}

        {viewMode === 'grid' ? (
          /* Grid View Layout */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 16,
            padding: 4
          }}>
            {/* Boxed Plus Uploader Card */}
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 160,
              border: '2px dashed var(--medium-brown)',
              borderRadius: 8,
              background: 'var(--background-brown)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              padding: 12,
              textAlign: 'center',
              boxSizing: 'border-box'
            }}>
              <Plus size={32} color="var(--primary-brown)" style={{ marginBottom: 12 }} />
              <span style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-brown)'
              }}>
                Upload File
              </span>
              <input
                type="file"
                accept={itemConfig?.accept}
                onChange={handleChange}
                style={{ display: 'none' }}
              />
            </label>

            {/* Grid File Cards */}
            {files.map((file, index) => (
              <div 
                key={index} 
                className="file-item-card"
                style={{
                  zIndex: activeMenuIndex === index ? 1000 : 'auto'
                }}
                onDoubleClick={() => {
                  if (renamingIndex !== index) {
                    setPreviewFile(file);
                  }
                }}
              >
                {renamingIndex === index ? (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 4,
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary-brown)' }}>Rename File</div>
                    <input
                      type="text"
                      value={renamingName}
                      onChange={(e) => setRenamingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const trimmed = renamingName.trim();
                          if (trimmed) {
                            onRenameFile(index, trimmed);
                            setRenamingIndex(null);
                          } else {
                            alert('File name cannot be empty.');
                          }
                        }
                        if (e.key === 'Escape') setRenamingIndex(null);
                      }}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        border: '1px solid var(--primary-brown)',
                        borderRadius: 4,
                        fontSize: 12,
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => {
                          const trimmed = renamingName.trim();
                          if (trimmed) {
                            onRenameFile(index, trimmed);
                            setRenamingIndex(null);
                          } else {
                            alert('File name cannot be empty.');
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '4px',
                          background: 'var(--primary-brown)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 11
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setRenamingIndex(null)}
                        style={{
                          flex: 1,
                          padding: '4px',
                          background: 'white',
                          border: '1px solid var(--medium-brown)',
                          color: 'var(--text-brown)',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 11
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuIndex(activeMenuIndex === index ? null : index);
                      }}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-brown)',
                        padding: 4,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                      }}
                      className="three-dots-btn"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Pop-up dropdown menu */}
                    {activeMenuIndex === index && (
                      <div style={{
                        position: 'absolute',
                        top: 32,
                        right: 8,
                        background: 'white',
                        border: '1px solid var(--medium-brown)',
                        borderRadius: 6,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                        padding: '4px 0',
                        zIndex: 1000,
                        minWidth: 120,
                        textAlign: 'left'
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuIndex(null);
                            setPreviewFile(file);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: 13,
                            color: 'var(--text-brown)',
                            textAlign: 'left'
                          }}
                          className="menu-item-hover"
                        >
                          <Eye size={14} /> View
                        </button>
                        
                        {onRenameFile && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuIndex(null);
                              setRenamingIndex(index);
                              const extIndex = file.name.lastIndexOf('.');
                              const nameWithoutExt = extIndex > 0 ? file.name.substring(0, extIndex) : file.name;
                              setRenamingName(nameWithoutExt);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              width: '100%',
                              background: 'transparent',
                              border: 'none',
                              padding: '8px 12px',
                              cursor: 'pointer',
                              fontSize: 13,
                              color: 'var(--text-brown)',
                              textAlign: 'left'
                            }}
                            className="menu-item-hover"
                          >
                            <Edit2 size={14} /> Rename
                          </button>
                        )}
                        
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          onClick={() => setActiveMenuIndex(null)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: 13,
                            color: 'var(--text-brown)',
                            textDecoration: 'none',
                            boxSizing: 'border-box'
                          }}
                          className="menu-item-hover"
                        >
                          <Download size={14} /> Download
                        </a>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuIndex(null);
                            if (window.confirm('Are you sure you want to delete this file?')) {
                              onDelete(index);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: 13,
                            color: '#ef4444',
                            textAlign: 'left'
                          }}
                          className="menu-item-hover"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}

                    <div style={{ margin: "12px auto" }}>
                      <FileIcon mimeType={file.mimeType} name={file.name} size={40} />
                    </div>
                    
                    <div style={{ width: '100%', padding: '0 4px', boxSizing: 'border-box' }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'var(--text-brown)',
                        lineHeight: '1.3',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        wordBreak: 'break-all',
                        textAlign: 'center'
                      }} title={file.name}>
                        {file.name}
                      </span>
                      <div style={{
                        fontSize: 10,
                        color: '#888',
                        marginTop: 4,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* List View Layout */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Dashed List Uploader Row */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 16px',
              border: '2px dashed var(--medium-brown)',
              borderRadius: 6,
              background: 'var(--background-brown)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center'
            }}>
              <Plus size={16} color="var(--primary-brown)" />
              <span style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-brown)'
              }}>
                Upload File
              </span>
              <input
                type="file"
                accept={itemConfig?.accept}
                onChange={handleChange}
                style={{ display: 'none' }}
              />
            </label>

            {/* List Rows */}
            {files.map((file, index) => (
              <div 
                key={index} 
                className="file-item-row"
                style={{
                  zIndex: activeMenuIndex === index ? 1000 : 'auto'
                }}
                onDoubleClick={() => {
                  if (renamingIndex !== index) {
                    setPreviewFile(file);
                  }
                }}
              >
                {renamingIndex === index ? (
                  <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={renamingName}
                      onChange={(e) => setRenamingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const trimmed = renamingName.trim();
                          if (trimmed) {
                            onRenameFile(index, trimmed);
                            setRenamingIndex(null);
                          } else {
                            alert('File name cannot be empty.');
                          }
                        }
                        if (e.key === 'Escape') setRenamingIndex(null);
                      }}
                      autoFocus
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        border: '1px solid var(--primary-brown)',
                        borderRadius: 4,
                        fontSize: 14
                      }}
                    />
                    <button
                      onClick={() => {
                        const trimmed = renamingName.trim();
                        if (trimmed) {
                          onRenameFile(index, trimmed);
                          setRenamingIndex(null);
                        } else {
                          alert('File name cannot be empty.');
                        }
                      }}
                      style={{
                        padding: '6px 10px',
                        background: 'var(--primary-brown)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setRenamingIndex(null)}
                      style={{
                        padding: '6px 10px',
                        background: 'white',
                        border: '1px solid var(--medium-brown)',
                        color: 'var(--text-brown)',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <FileIcon mimeType={file.mimeType} name={file.name} size={20} />
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--text-brown)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {file.name}
                      </p>
                      <p style={{ 
                        margin: 0, 
                        fontSize: 12,
                        color: '#666',
                        marginTop: 2
                      }}>
                        {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuIndex(activeMenuIndex === index ? null : index);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-brown)',
                          padding: 6,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        className="three-dots-btn"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {/* Popup menu dropdown (list view) */}
                      {activeMenuIndex === index && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          background: 'white',
                          border: '1px solid var(--medium-brown)',
                          borderRadius: 6,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                          padding: '4px 0',
                          zIndex: 1000,
                          minWidth: 120,
                          textAlign: 'left'
                        }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuIndex(null);
                              setPreviewFile(file);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              width: '100%',
                              background: 'transparent',
                              border: 'none',
                              padding: '8px 12px',
                              cursor: 'pointer',
                              fontSize: 13,
                              color: 'var(--text-brown)',
                              textAlign: 'left'
                            }}
                            className="menu-item-hover"
                          >
                            <Eye size={14} /> View
                          </button>
                          
                          {onRenameFile && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuIndex(null);
                                setRenamingIndex(index);
                                const extIndex = file.name.lastIndexOf('.');
                                const nameWithoutExt = extIndex > 0 ? file.name.substring(0, extIndex) : file.name;
                                setRenamingName(nameWithoutExt);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: 13,
                                color: 'var(--text-brown)',
                                textAlign: 'left'
                              }}
                              className="menu-item-hover"
                            >
                              <Edit2 size={14} /> Rename
                            </button>
                          )}
                          
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            onClick={() => setActiveMenuIndex(null)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              width: '100%',
                              background: 'transparent',
                              border: 'none',
                              padding: '8px 12px',
                              cursor: 'pointer',
                              fontSize: 13,
                              color: 'var(--text-brown)',
                              textDecoration: 'none',
                              boxSizing: 'border-box'
                            }}
                            className="menu-item-hover"
                          >
                            <Download size={14} /> Download
                          </a>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuIndex(null);
                              if (window.confirm('Are you sure you want to delete this file?')) {
                                onDelete(index);
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              width: '100%',
                              background: 'transparent',
                              border: 'none',
                              padding: '8px 12px',
                              cursor: 'pointer',
                              fontSize: 13,
                              color: '#ef4444',
                              textAlign: 'left'
                            }}
                            className="menu-item-hover"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {files.length === 0 && !isUploading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: '#888',
            fontSize: 14 
          }}>
            No files uploaded yet. Drag files here or click "Upload File" to add files.
          </div>
        )}
      </div>

      {/* Preview Modal Overlay */}
      {previewFile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            width: '90%',
            height: '90%',
            maxWidth: '1200px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--medium-brown)',
              background: 'var(--pale-brown)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-brown)' }}>
                Viewing: {previewFile.name}
              </h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setPreviewFile(null)}
                  style={{
                    padding: '6px 12px',
                    background: 'white',
                    border: '1px solid var(--medium-brown)',
                    color: 'var(--text-brown)',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <X size={14} /> Close
                </button>
              </div>
            </div>
            
            {/* Modal Body / Viewer */}
            <div style={{ flex: 1, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {(() => {
                const mime = previewFile.mimeType?.toLowerCase() || '';
                const url = previewFile.url;
                const ext = previewFile.name.split('.').pop()?.toLowerCase();
                
                if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
                  return (
                    <img
                      src={url}
                      alt={previewFile.name}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 4 }}
                    />
                  );
                }
                
                if (mime === 'application/pdf' || ext === 'pdf') {
                  return (
                    <iframe
                      src={url}
                      title={previewFile.name}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  );
                }
                
                if (['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(ext)) {
                  const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
                  return (
                    <iframe
                      src={officeUrl}
                      title={previewFile.name}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  );
                }
                
                if (['txt', 'csv', 'json', 'md'].includes(ext)) {
                  return (
                    <iframe
                      src={url}
                      title={previewFile.name}
                      style={{ width: '100%', height: '100%', border: 'none', background: 'white' }}
                    />
                  );
                }

                return (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <p style={{ fontSize: 16, color: '#666', marginBottom: 16 }}>
                      Direct preview not available for this file type.
                    </p>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '10px 20px',
                        background: 'var(--primary-brown)',
                        color: 'white',
                        borderRadius: 6,
                        textDecoration: 'none',
                        display: 'inline-block'
                      }}
                    >
                      Open in New Tab
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};