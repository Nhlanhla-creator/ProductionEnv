import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import "./ProductApplication.css";


const FileUpload = ({
  label,
  required,
  accept,
  multiple,
  onChange,
  maxSize = 5, // in MB
  error,
  helperText
}) => {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (newFiles) => {
    const validFiles = [];
    const invalidFiles = [];
    
    Array.from(newFiles).forEach(file => {
      if (file.size <= maxSize * 1024 * 1024) { // Convert MB to bytes
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      alert(`Files exceed ${maxSize}MB: ${invalidFiles.join(', ')}`);
    }

    const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;
    setFiles(updatedFiles);
    if (onChange) {
      onChange(updatedFiles);
    }
  };

  const removeFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
    if (onChange) {
      onChange(updatedFiles);
    }
  };

  return (
    <div 
      className={`file-upload ${dragActive ? 'drag-active' : ''} ${error ? 'error' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      style={{ maxWidth: '240px', marginBottom: '0.5rem' }}
    >
      <label className="file-upload-label" style={{ 
        fontSize: '0.6875rem', 
        marginBottom: '0.25rem',
        display: 'block',
        fontWeight: '500'
      }}>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>
      
      <div className="file-upload-container">
        <div className="file-upload-area" style={{ minHeight: '38px' }}>
          <input
            type="file"
            id="file-upload-input"
            className="file-upload-input"
            accept={accept}
            multiple={multiple}
            onChange={handleChange}
            style={{ display: 'none' }}
          />
          <label 
            htmlFor="file-upload-input" 
            className="file-upload-dropzone"
            style={{
              padding: '0.375rem',
              minHeight: '38px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px dashed #D2B48C',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div className="upload-icon" style={{ 
              width: '0.875rem', 
              height: '0.875rem',
              marginBottom: '0.125rem'
            }}>
              <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%', fill: '#A0522D' }}>
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </div>
            <p style={{ 
              fontSize: '0.625rem', 
              margin: '0',
              color: '#8B4513',
              lineHeight: '1.1'
            }}>
              Drop or click
            </p>
            <p 
              className="file-upload-hint" 
              style={{ 
                fontSize: '0.5rem',
                margin: '0.125rem 0 0 0',
                color: '#A0522D'
              }}
            >
              Max: {maxSize}MB
            </p>
          </label>
        </div>

        {files.length > 0 && (
          <div className="file-list" style={{ marginTop: '0.375rem' }}>
            <p style={{
              fontSize: '0.625rem',
              fontWeight: '500',
              color: '#8B4513',
              marginBottom: '0.25rem'
            }}>
              Files ({files.length}):
            </p>
            {files.map((file, index) => (
              <div 
                key={index} 
                className="file-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#F5F5DC',
                  padding: '0.25rem 0.375rem',
                  borderRadius: '4px',
                  fontSize: '0.625rem',
                  marginBottom: '0.1875rem'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  minWidth: 0,
                  flex: 1
                }}>
                  <span 
                    className="file-name"
                    style={{
                      color: '#8B4513',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginRight: '0.25rem'
                    }}
                  >
                    {file.name}
                  </span>
                  <span 
                    className="file-size"
                    style={{
                      color: '#A0522D',
                      fontSize: '0.5rem',
                      flexShrink: 0
                    }}
                  >
                    ({(file.size / 1024 / 1024).toFixed(1)}MB)
                  </span>
                </div>
                <button 
                  type="button" 
                  className="file-remove" 
                  onClick={() => removeFile(index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#A0522D',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '0 0.125rem',
                    marginLeft: '0.25rem',
                    flexShrink: 0,
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {helperText && (
        <div 
          className={`helper-text ${error ? 'error-text' : ''}`}
          style={{
            fontSize: '0.5625rem',
            marginTop: '0.25rem',
            color: error ? '#EF4444' : '#A0522D'
          }}
        >
          {helperText}
        </div>
      )}
    </div>
  );
};

FileUpload.propTypes = {
  label: PropTypes.string.isRequired,
  required: PropTypes.bool,
  accept: PropTypes.string,
  multiple: PropTypes.bool,
  onChange: PropTypes.func,
  maxSize: PropTypes.number,
  error: PropTypes.bool,
  helperText: PropTypes.string
};

FileUpload.defaultProps = {
  accept: '*/*',
  multiple: false
};

export default FileUpload;