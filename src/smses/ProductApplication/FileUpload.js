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
      alert(`The following files exceed ${maxSize}MB and were not uploaded: ${invalidFiles.join(', ')}`);
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
    >
      <label className="file-upload-label">
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>
      
      <div className="file-upload-container">
        <div className="file-upload-area">
          <input
            type="file"
            id="file-upload-input"
            className="file-upload-input"
            accept={accept}
            multiple={multiple}
            onChange={handleChange}
          />
          <label htmlFor="file-upload-input" className="file-upload-dropzone">
            <div className="upload-icon">
              <svg viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </div>
            <p>Drag & drop files here or click to browse</p>
            <p className="file-upload-hint">Max file size: {maxSize}MB</p>
          </label>
        </div>

        {files.length > 0 && (
          <div className="file-list">
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <span className="file-name">{file.name}</span>
                <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)}MB)</span>
                <button 
                  type="button" 
                  className="file-remove" 
                  onClick={() => removeFile(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {helperText && (
        <div className={`helper-text ${error ? 'error-text' : ''}`}>
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