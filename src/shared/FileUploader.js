import React, { useState } from 'react';
import { Upload, X, FileText, Trash2, Download, Eye, CheckCircle, AlertCircle } from 'lucide-react';

const FileUploader = ({
  path,
  itemConfig,
  content,
  onUpload,
  onDelete,
  onClose,
  isUploading = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState(null);

  const pathDisplay = path ? path.join(" > ") : "";

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
    
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      onUpload(selectedFile);
      setSelectedFile(null);
      setTimeout(() => setUploadProgress(0), 1000);
    }, 2000);
  };

  const handlePreview = (file, index) => {
    setPreviewFile({ ...file, index });
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    switch(ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      default: return '📎';
    }
  };

  return (
    <>
      <div style={{
        background: 'white',
        borderRadius: 12,
        border: '1px solid var(--medium-brown)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: 16,
          borderBottom: '1px solid var(--pale-brown)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--light-brown)',
        }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-brown)', margin: 0 }}>
              {itemConfig?.name || 'File Manager'}
            </h3>
            <p style={{ fontSize: 11, color: '#666', margin: '4px 0 0 0' }}>{pathDisplay}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-brown)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {/* File List */}
          {content?.files && content.files.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-brown)', marginBottom: 12 }}>Uploaded Files</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {content.files.map((file, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      background: 'var(--light-brown)',
                      borderRadius: 8,
                      border: '1px solid var(--pale-brown)',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{getFileIcon(file.name)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-brown)' }}>{file.name}</div>
                      <div style={{ fontSize: 10, color: '#666' }}>{formatFileSize(file.size)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handlePreview(file, index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 4,
                          borderRadius: 4,
                          color: 'var(--primary-brown)',
                        }}
                        title="Preview"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 4,
                          borderRadius: 4,
                          color: '#c62828',
                        }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-brown)', marginBottom: 12 }}>Upload New File</h4>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? 'var(--primary-brown)' : 'var(--pale-brown)'}`,
                borderRadius: 8,
                padding: 24,
                textAlign: 'center',
                background: dragActive ? 'var(--light-brown)' : 'white',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
            >
              <Upload size={32} color="var(--accent-brown)" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 12, color: 'var(--text-brown)', marginBottom: 8 }}>
                Drag & drop a file here, or click to select
              </p>
              <p style={{ fontSize: 10, color: '#666' }}>
                Supports: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB)
              </p>
              <input
                type="file"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="file-upload-input"
              />
              <label
                htmlFor="file-upload-input"
                style={{
                  display: 'inline-block',
                  marginTop: 12,
                  padding: '6px 16px',
                  background: 'var(--primary-brown)',
                  color: 'white',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                Select File
              </label>
            </div>

            {/* Selected File Preview */}
            {selectedFile && (
              <div style={{
                marginTop: 16,
                padding: 12,
                background: 'var(--light-brown)',
                borderRadius: 8,
                border: '1px solid var(--primary-brown)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={16} color="var(--primary-brown)" />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-brown)' }}>{selectedFile.name}</span>
                    <span style={{ fontSize: 10, color: '#666' }}>({formatFileSize(selectedFile.size)})</span>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c62828' }}
                  >
                    <X size={14} />
                  </button>
                </div>
                
                {/* Upload Progress */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ background: 'var(--pale-brown)', height: 4, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${uploadProgress}%`, background: 'var(--primary-brown)', height: 4, transition: 'width 0.3s ease' }} />
                    </div>
                    <p style={{ fontSize: 10, color: '#666', marginTop: 4 }}>Uploading... {uploadProgress}%</p>
                  </div>
                )}
                
                {uploadProgress === 100 && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={12} color="#2e7d32" />
                    <span style={{ fontSize: 11, color: '#2e7d32' }}>Upload complete!</span>
                  </div>
                )}

                {uploadProgress === 0 && (
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    style={{
                      marginTop: 12,
                      padding: '6px 16px',
                      background: 'var(--primary-brown)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    Upload File
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Empty State */}
          {(!content?.files || content.files.length === 0) && !selectedFile && (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
              <FileText size={48} color="var(--accent-brown)" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 12 }}>No files uploaded yet</p>
              <p style={{ fontSize: 11 }}>Upload a file to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closePreview}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              width: '90%',
              maxWidth: 600,
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: 16,
              borderBottom: '1px solid var(--pale-brown)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-brown)', margin: 0 }}>File Preview</h3>
                <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0 0' }}>{previewFile.name}</p>
              </div>
              <button onClick={closePreview} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: 24, textAlign: 'center', flex: 1, overflowY: 'auto' }}>
              <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>{getFileIcon(previewFile.name)}</span>
              <p style={{ fontSize: 13, color: 'var(--text-brown)' }}>{previewFile.name}</p>
              <p style={{ fontSize: 11, color: '#666' }}>{formatFileSize(previewFile.size)}</p>
              <p style={{ fontSize: 11, color: '#666', marginTop: 16 }}>Preview not available for this file type</p>
              <p style={{ fontSize: 11, color: 'var(--primary-brown)' }}>Download the file to view its contents</p>
            </div>
            <div style={{ padding: 16, borderTop: '1px solid var(--pale-brown)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={closePreview}
                style={{
                  padding: '8px 16px',
                  background: 'var(--primary-brown)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { FileUploader };