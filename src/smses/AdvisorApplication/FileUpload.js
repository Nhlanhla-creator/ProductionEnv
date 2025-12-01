"use client"

import { useState, useEffect } from "react"
import { Upload, X, FileText, Loader2 } from "lucide-react"

export default function FileUpload({
  label,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  multiple = false,
  required = false,
  onChange,
  value = [],
  isUploading = false,
}) {
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)

  // Sync with parent value prop with proper array checking
  useEffect(() => {
    setFiles(Array.isArray(value) ? value : [])
  }, [value])

  const handleFileChange = async (e) => {
    if (isUploading) return // Prevent uploads while processing
    
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    const currentFiles = Array.isArray(files) ? files : []
    const newFiles = multiple ? [...currentFiles, ...selectedFiles] : selectedFiles
    setFiles(newFiles)
    
    if (onChange) {
      try {
        await onChange(newFiles)
      } catch (error) {
        console.error("Error uploading files:", error)
        // Revert files on error
        setFiles(currentFiles)
      }
    }

    // Clear the input to allow re-selecting the same file
    e.target.value = ""
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!isUploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (isUploading) return // Prevent uploads while processing

    const droppedFiles = Array.from(e.dataTransfer.files || [])
    if (droppedFiles.length === 0) return

    const currentFiles = Array.isArray(files) ? files : []
    const newFiles = multiple ? [...currentFiles, ...droppedFiles] : droppedFiles
    setFiles(newFiles)
    
    if (onChange) {
      try {
        await onChange(newFiles)
      } catch (error) {
        console.error("Error uploading files:", error)
        // Revert files on error
        setFiles(currentFiles)
      }
    }
  }

  const removeFile = async (index) => {
    if (isUploading) return // Prevent removal while uploading
    
    const currentFiles = Array.isArray(files) ? files : []
    const newFiles = [...currentFiles]
    newFiles.splice(index, 1)
    setFiles(newFiles)
    
    if (onChange) {
      try {
        await onChange(newFiles)
      } catch (error) {
        console.error("Error updating files:", error)
        // Revert on error
        setFiles(currentFiles)
      }
    }
  }

  const styles = {
    container: {
      marginBottom: '0.5rem',
      maxWidth: '240px',
      width: '100%'
    },
    label: {
      display: 'block',
      fontSize: '0.6875rem',
      fontWeight: '500',
      color: '#8B4513',
      marginBottom: '0.25rem'
    },
    required: {
      color: '#EF4444'
    },
    dropZone: {
      border: `1.5px dashed ${isDragging ? '#8B4513' : '#D2B48C'}`,
      borderRadius: '6px',
      padding: '0.375rem',
      textAlign: 'center',
      cursor: isUploading ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease',
      backgroundColor: isDragging ? '#F5F5DC' : isUploading ? '#F8F8F8' : 'transparent',
      minHeight: '38px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      opacity: isUploading ? 0.6 : 1
    },
    dropZoneHover: {
      borderColor: '#8B4513'
    },
    hiddenInput: {
      display: 'none'
    },
    uploadIcon: {
      width: '0.875rem',
      height: '0.875rem',
      color: '#A0522D',
      marginBottom: '0.125rem'
    },
    loadingIcon: {
      width: '0.875rem',
      height: '0.875rem',
      color: '#8B4513',
      marginBottom: '0.125rem',
      animation: 'spin 1s linear infinite'
    },
    dragText: {
      marginTop: '0',
      fontSize: '0.625rem',
      color: '#8B4513',
      lineHeight: '1.1'
    },
    formatText: {
      fontSize: '0.5rem',
      color: '#A0522D',
      marginTop: '0.125rem'
    },
    filesContainer: {
      marginTop: '0.375rem'
    },
    filesLabel: {
      fontSize: '0.625rem',
      fontWeight: '500',
      color: '#8B4513',
      marginBottom: '0.25rem'
    },
    filesList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.1875rem'
    },
    fileItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#F5F5DC',
      padding: '0.25rem 0.375rem',
      borderRadius: '4px',
      fontSize: '0.625rem',
      opacity: isUploading ? 0.6 : 1
    },
    fileInfo: {
      display: 'flex',
      alignItems: 'center',
      minWidth: 0
    },
    fileIcon: {
      width: '0.75rem',
      height: '0.75rem',
      color: '#A0522D',
      marginRight: '0.25rem',
      flexShrink: 0
    },
    fileName: {
      color: '#8B4513',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      maxWidth: '8rem'
    },
    removeButton: {
      color: '#A0522D',
      cursor: isUploading ? 'not-allowed' : 'pointer',
      padding: '0.0625rem',
      borderRadius: '2px',
      transition: 'color 0.2s ease',
      flexShrink: 0,
      opacity: isUploading ? 0.5 : 1,
      background: 'none',
      border: 'none'
    },
    removeIcon: {
      width: '0.75rem',
      height: '0.75rem'
    }
  }

  const clickHandler = () => {
    if (!isUploading) {
      document.getElementById(`file-upload-${label || 'default'}`).click()
    }
  }

  // Ensure files is always an array before mapping
  const filesToDisplay = Array.isArray(files) ? files : []

  return (
    <div style={styles.container}>
      {label && (
        <label style={styles.label}>
          {label} {required && <span style={styles.required}>*</span>}
        </label>
      )}

      <div
        style={{
          ...styles.dropZone,
          ...(isDragging && !isUploading ? {} : {}),
          ':hover': !isUploading ? styles.dropZoneHover : {}
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={clickHandler}
        onMouseEnter={(e) => {
          if (!isDragging && !isUploading) {
            e.target.style.borderColor = '#8B4513'
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging && !isUploading) {
            e.target.style.borderColor = '#D2B48C'
          }
        }}
      >
        <input
          id={`file-upload-${label || 'default'}`}
          type="file"
          style={styles.hiddenInput}
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={isUploading}
        />
        
        {isUploading ? (
          <>
            <Loader2 style={styles.loadingIcon} className="animate-spin" />
            <p style={styles.dragText}>Uploading...</p>
          </>
        ) : (
          <>
            <Upload style={styles.uploadIcon} />
            <p style={styles.dragText}>Drop or click</p>
            <p style={styles.formatText}>{accept.replace(/\./g, "").replace(/,/g, ", ")}</p>
          </>
        )}
      </div>

      {filesToDisplay.length > 0 && (
        <div style={styles.filesContainer}>
          <p style={styles.filesLabel}>Files ({filesToDisplay.length}):</p>
          <div style={styles.filesList}>
            {filesToDisplay.map((file, index) => (
              <div key={index} style={styles.fileItem}>
                <div style={styles.fileInfo}>
                  <FileText style={styles.fileIcon} />
                  <span style={styles.fileName}>{file.name || `File ${index + 1}`}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  style={styles.removeButton}
                  disabled={isUploading}
                  onMouseEnter={(e) => {
                    if (!isUploading) {
                      e.target.style.color = '#8B4513'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isUploading) {
                      e.target.style.color = '#A0522D'
                    }
                  }}
                >
                  <X style={styles.removeIcon} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}