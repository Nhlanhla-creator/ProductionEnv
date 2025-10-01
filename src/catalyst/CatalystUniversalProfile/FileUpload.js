'use client'

import { useState } from "react"
import { Upload, X, FileText } from "lucide-react"
import styles from "./SupportUniversalProfile.module.css";

export default function FileUpload({
  label,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  multiple = false,
  required = false,
  onChange,
  value = [],
}) {
  const [files, setFiles] = useState(value)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || [])
    const newFiles = [...files, ...selectedFiles]
    setFiles(newFiles)
    if (onChange) onChange(newFiles)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    const newFiles = [...files, ...droppedFiles]
    setFiles(newFiles)
    if (onChange) onChange(newFiles)
  }

  const removeFile = (index) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
    if (onChange) onChange(newFiles)
  }

  return (
    <div className="mb-4">
      <label className={`block text-sm font-medium text-brown-700 mb-1`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div
        className={`${
          styles.fileUploadContainer
        } border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragging ? "border-brown-500 bg-brown-50" : "border-brown-300 hover:border-brown-500"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`file-upload-${label}`).click()}
      >
        <input
          id={`file-upload-${label}`}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
        />
        <Upload className="mx-auto h-8 w-8 text-brown-400" />
        <p className="mt-1 text-sm text-brown-600">Drag and drop files here, or click to select files</p>
        <p className="text-xs text-brown-500 mt-1">
          Accepted formats: {accept.replace(/\./g, "").replace(/,/g, ", ")}
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-medium text-brown-700 mb-1">Uploaded files:</p>
          <ul className="space-y-1">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-brown-50 p-2 rounded">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-brown-500 mr-2" />
                  <span className="text-sm text-brown-700 truncate max-w-xs">{file.name || `File ${index + 1}`}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  className="text-brown-500 hover:text-brown-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
