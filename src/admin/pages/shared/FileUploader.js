// growth-components/FileUploader.jsx
import React, { useCallback, useState } from 'react';
import { Upload, File, X, Download, Trash2, FileText, Image } from 'lucide-react';

const FileIcon = ({ mimeType, size = 24 }) => {
  if (mimeType?.startsWith('image/')) {
    return <Image size={size} color="var(--primary-brown)" />;
  }
  return <FileText size={size} color="var(--accent-brown)" />;
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
  onClose,
  isUploading 
}) => {
  const [dragActive, setDragActive] = useState(false);
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
      overflow: 'hidden'
    }}>
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

      {/* Content */}
      <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? 'var(--primary-brown)' : 'var(--medium-brown)'}`,
            borderRadius: 8,
            padding: 40,
            textAlign: 'center',
            background: dragActive ? 'var(--pale-brown)' : 'var(--background-brown)',
            marginBottom: 20,
            transition: 'all 0.2s'
          }}
        >
          <Upload 
            size={48} 
            color={dragActive ? 'var(--primary-brown)' : 'var(--accent-brown)'} 
            style={{ marginBottom: 16 }}
          />
          <p style={{ 
            margin: 0, 
            fontSize: 14, 
            color: 'var(--text-brown)',
            marginBottom: 8
          }}>
            Drag and drop your file here, or
          </p>
          <label style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: 'var(--primary-brown)',
            color: 'white',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500
          }}>
            Browse Files
            <input
              type="file"
              accept={itemConfig?.accept}
              onChange={handleChange}
              style={{ display: 'none' }}
            />
          </label>
          {itemConfig?.accept && (
            <p style={{ 
              margin: '12px 0 0 0', 
              fontSize: 12, 
              color: '#999'
            }}>
              Accepted formats: {itemConfig.accept}
            </p>
          )}
          {isUploading && (
            <p style={{ 
              margin: '12px 0 0 0', 
              fontSize: 13, 
              color: 'var(--primary-brown)',
              fontWeight: 500
            }}>
              Uploading...
            </p>
          )}
        </div>

        {/* Uploaded Files */}
        {files.length > 0 && (
          <div>
            <h4 style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: 'var(--text-brown)',
              marginBottom: 12
            }}>
              Uploaded Files ({files.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {files.map((file, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    background: 'var(--background-brown)',
                    border: '1px solid var(--medium-brown)',
                    borderRadius: 6
                  }}
                >
                  <FileIcon mimeType={file.mimeType} size={20} />
                  
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

                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '6px 10px',
                      background: 'var(--primary-brown)',
                      color: 'white !important',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Download size={14} color='white' />
                    <span style={{ color: 'white' }}>Download</span>
                  </a>

                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this file?')) {
                        onDelete(index);
                      }
                    }}
                    style={{
                      padding: '6px 10px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};