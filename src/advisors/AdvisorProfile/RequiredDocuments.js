"use client"
import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Upload, FileText, Loader2 } from "lucide-react"

import { Info } from "lucide-react"
import styles from "./AdvisorProfile.module.css"
import { db, auth } from "../../firebaseConfig"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { documentsList } from "./documentsconfig" // Import from config file

export default function RequiredDocuments({ data = {}, updateData }) {
  const [formData, setFormData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [uploadStatus, setUploadStatus] = useState({})
  const [uploadingFiles, setUploadingFiles] = useState({})

  // Load data from Firebase when component mounts
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setIsLoading(true)
        const userId = auth.currentUser?.uid

        if (!userId) {
          setIsLoading(false)
          return
        }

        // Load from the advisorProfiles collection
        const docRef = doc(db, "advisorProfiles", userId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const profileData = docSnap.data()

          // Collect all document fields from different sections using the correct paths
          const documentsData = {}

          // Map documents based on their actual data paths for advisor profiles
          if (profileData.requiredDocuments?.idPassport) {
            documentsData.idPassport = profileData.requiredDocuments.idPassport
          }
          if (profileData.requiredDocuments?.cvResume) {
            documentsData.cvResume = profileData.requiredDocuments.cvResume
          }
          if (profileData.requiredDocuments?.certifications) {
            documentsData.certifications = profileData.requiredDocuments.certifications
          }
          if (profileData.requiredDocuments?.referenceLetters) {
            documentsData.referenceLetters = profileData.requiredDocuments.referenceLetters
          }

          setFormData(documentsData)
          updateData(documentsData)

          // Update upload status
          const status = {}
          documentsList.forEach(doc => {
            const files = documentsData[doc.id] || []
            status[doc.id] = files.length > 0 ? 'success' : 'pending'
          })
          setUploadStatus(status)

        } else {
          // Initialize with passed data
          setFormData(data)
          const status = {}
          documentsList.forEach(doc => {
            const files = data[doc.id] || []
            status[doc.id] = files.length > 0 ? 'success' : 'pending'
          })
          setUploadStatus(status)
        }
      } catch (error) {
        console.error("Error loading documents:", error)
        setFormData(data)
      } finally {
        setIsLoading(false)
      }
    }

    loadDocuments()
  }, [])

  // Sync formData with external data prop
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setFormData(data)
      const status = {}
      documentsList.forEach(doc => {
        const files = data[doc.id] || []
        status[doc.id] = files.length > 0 ? 'success' : 'pending'
      })
      setUploadStatus(status)
    }
  }, [data])

  const handleFileChange = async (documentId, files) => {
    // Set uploading state
    setUploadingFiles(prev => ({ ...prev, [documentId]: true }))

    try {
      const updatedData = { ...formData, [documentId]: files }
      setFormData(updatedData)

      // Call updateData and wait for it to complete
      await updateData(updatedData)

      // Update status after successful upload
      setUploadStatus(prev => ({
        ...prev,
        [documentId]: files.length > 0 ? 'success' : 'pending'
      }))

      // Add a small delay to show the upload completed
      setTimeout(() => {
        setUploadingFiles(prev => ({ ...prev, [documentId]: false }))
      }, 1000)

    } catch (error) {
      console.error("Error uploading file:", error)
      setUploadingFiles(prev => ({ ...prev, [documentId]: false }))
      // Optionally show an error message
    }
  }

  const getStatusBadge = (documentId, document) => {
    const isUploading = uploadingFiles[documentId]
    const files = formData[documentId] || []
    
    if (isUploading) {
      return (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 8px",
          borderRadius: "16px",
          fontSize: "11px",
          fontWeight: "600",
          backgroundColor: "#e3f2fd",
          color: "#1976d2"
        }}>
          <Loader2 style={{ width: "12px", height: "12px" }} className="animate-spin" />
          Uploading
        </span>
      )
    }
    
    if (files.length > 0) {
      return (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 8px",
          borderRadius: "16px",
          fontSize: "11px",
          fontWeight: "600",
          backgroundColor: "#e8f5e8",
          color: "#2e7d32"
        }}>
          <CheckCircle style={{ width: "12px", height: "12px" }} />
          Uploaded
        </span>
      )
    } else {
      return (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 8px",
          borderRadius: "16px",
          fontSize: "11px",
          fontWeight: "600",
          backgroundColor: document.required ? "#ffebee" : "#e3f2fd",
          color: document.required ? "#c62828" : "#1976d2"
        }}>
          <XCircle style={{ width: "12px", height: "12px" }} />
          {document.required ? "Required" : "Optional"}
        </span>
      )
    }
  }

  const handleDeleteFile = async (documentId, fileIndex) => {
    const currentFiles = formData[documentId] || []
    const updatedFiles = currentFiles.filter((_, index) => index !== fileIndex)
    
    // Update local state
    const updatedData = { ...formData, [documentId]: updatedFiles }
    setFormData(updatedData)
    await updateData(updatedData)
    
    // Update upload status
    setUploadStatus(prev => ({
      ...prev,
      [documentId]: updatedFiles.length > 0 ? 'success' : 'pending'
    }))
  }

  const getProgressStats = () => {
    const required = documentsList.filter(doc => doc.required)
    const optional = documentsList.filter(doc => !doc.required)

    const requiredUploaded = required.filter(doc => {
      const files = formData[doc.id] || []
      return files.length > 0
    }).length

    const optionalUploaded = optional.filter(doc => {
      const files = formData[doc.id] || []
      return files.length > 0
    }).length

    return {
      required: { uploaded: requiredUploaded, total: required.length },
      optional: { uploaded: optionalUploaded, total: optional.length }
    }
  }

  const stats = getProgressStats()

  if (isLoading) {
    return (
      <div style={{ 
        padding: "20px",
        backgroundColor: "#faf8f6",
        borderRadius: "12px"
      }}>
        <h2 style={{ 
          fontSize: "24px", 
          fontWeight: "bold", 
          color: "#8b4513", 
          marginBottom: "24px" 
        }}>Advisor Documents Upload</h2>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "12px" 
        }}>
          <Loader2 style={{ 
            width: "24px", 
            height: "24px", 
            color: "#8d6e63" 
          }} className="animate-spin" />
          <p style={{ color: "#6d4c41" }}>Loading your documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: "20px",
      backgroundColor: "#faf8f6",
      borderRadius: "12px"
    }}>
      <h2 style={{ 
        fontSize: "28px", 
        fontWeight: "bold", 
        color: "#5d4037", 
        marginBottom: "16px",
        textAlign: "center"
      }}>Required Documents Upload</h2>

      {/* Updated Guidelines Section */}
      <div style={{
        backgroundColor: "#f5f2f0",
        border: "2px solid #d7ccc8",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "30px"
      }}>
        <h3 style={{
          fontSize: "18px",
          fontWeight: "600",
          color: "#5d4037",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          📋 Advisor Verification Documents
        </h3>
        <p style={{
          color: "#6d4c41",
          lineHeight: "1.6",
          marginBottom: "20px"
        }}>
          Upload the required documents to complete your advisor profile verification. These documents help establish your credentials and professional background for SMEs seeking advisory support.
        </p>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px"
        }}>
          <div style={{
            backgroundColor: "#efebe9",
            padding: "16px",
            borderRadius: "8px",
            borderLeft: "4px solid #4caf50"
          }}>
            <h4 style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#2e7d32",
              marginBottom: "12px"
            }}>✅ Accepted File Formats</h4>
            <ul style={{
              margin: "0",
              paddingLeft: "20px",
              color: "#5d4037",
              fontSize: "14px",
              lineHeight: "1.5"
            }}>
              <li style={{ marginBottom: "4px" }}><strong>PDF</strong> (.pdf) – Preferred format for all official documents</li>
              <li style={{ marginBottom: "4px" }}><strong>Word Documents</strong> (.doc, .docx) – For editable text documents</li>
              <li style={{ marginBottom: "4px" }}><strong>Image Files</strong> (.jpg, .jpeg, .png) – For scanned certificates or documents</li>
            </ul>
          </div>
          
          <div style={{
            backgroundColor: "#efebe9",
            padding: "16px",
            borderRadius: "8px",
            borderLeft: "4px solid #ff9800"
          }}>
            <h4 style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#f57c00",
              marginBottom: "12px"
            }}>⚠️ File Size Limit</h4>
            <ul style={{
              margin: "0",
              paddingLeft: "20px",
              color: "#5d4037",
              fontSize: "14px",
              lineHeight: "1.5"
            }}>
              <li>Maximum upload size: <strong>10 MB per file</strong></li>
            </ul>
          </div>
          
          <div style={{
            backgroundColor: "#efebe9",
            padding: "16px",
            borderRadius: "8px",
            borderLeft: "4px solid #f44336"
          }}>
            <h4 style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#c62828",
              marginBottom: "12px"
            }}>🚫 Unsupported Formats</h4>
            <ul style={{
              margin: "0",
              paddingLeft: "20px",
              color: "#5d4037",
              fontSize: "14px",
              lineHeight: "1.5"
            }}>
              <li style={{ marginBottom: "4px" }}>No ZIP/RAR folders, executable files (.exe), or Google Docs/Drive links</li>
              <li style={{ marginBottom: "4px" }}>Please download and upload original files directly (no screenshots or photos of screens)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        overflow: "hidden"
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse"
        }}>
          <thead>
            <tr style={{
              backgroundColor: "#8d6e63",
              color: "white",
              height: "40px"
            }}>
              <th style={{
                padding: "8px",
                textAlign: "center",
                fontWeight: "600",
                fontSize: "11px",
                borderBottom: "2px solid #6d4c41",
                width: "15%"
              }}>STATUS</th>
              <th style={{
                padding: "8px",
                textAlign: "left",
                fontWeight: "600",
                fontSize: "11px",
                borderBottom: "2px solid #6d4c41",
                width: "25%"
              }}>DOCUMENT NAME</th>
              <th style={{
                padding: "8px",
                textAlign: "left",
                fontWeight: "600",
                fontSize: "11px",
                borderBottom: "2px solid #6d4c41",
                width: "40%"
              }}>DESCRIPTION</th>
              <th style={{
                padding: "8px",
                textAlign: "center",
                fontWeight: "600",
                fontSize: "11px",
                borderBottom: "2px solid #6d4c41",
                width: "20%"
              }}>UPLOAD & MANAGE</th>
            </tr>
          </thead>
          <tbody>
            {documentsList.map((document, index) => (
              <tr key={document.id} style={{
                backgroundColor: index % 2 === 0 ? "#faf8f6" : "#f5f2f0",
                borderBottom: "1px solid #e8d8cf",
                transition: "background-color 0.2s",
                height: "50px"
              }}
              onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = "#efebe9"}
              onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = index % 2 === 0 ? "#faf8f6" : "#f5f2f0"}
              >
                <td style={{
                  padding: "6px 8px",
                  textAlign: "center",
                  verticalAlign: "middle"
                }}>
                  {getStatusBadge(document.id, document)}
                </td>
                <td style={{
                  padding: "6px 8px",
                  verticalAlign: "middle"
                }}>
                  <div style={{
                    fontWeight: "500",
                    color: "#5d4037",
                    fontSize: "12px",
                    lineHeight: "1.2"
                  }}>
                    {document.label}
                  </div>
                </td>
                <td style={{
                  padding: "6px 8px",
                  verticalAlign: "middle"
                }}>
                  <div style={{
                    color: "#6d4c41",
                    fontSize: "11px",
                    lineHeight: "1.2"
                  }}>
                    {document.description}
                  </div>
                </td>
                <td style={{
                  padding: "6px 8px",
                  textAlign: "center",
                  verticalAlign: "middle"
                }}>
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    {/* Upload button */}
                    <label style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 8px",
                      backgroundColor: "#8d6e63",
                      color: "white",
                      borderRadius: "6px",
                      fontSize: "10px",
                      fontWeight: "500",
                      cursor: "pointer",
                      border: "none"
                    }}>
                      <Upload style={{ width: "12px", height: "12px" }} />
                      Upload
                      <input
                        type="file"
                        accept={document.accept}
                        multiple={document.multiple}
                        onChange={(e) => handleFileChange(document.id, Array.from(e.target.files))}
                        style={{ display: "none" }}
                      />
                    </label>
                    
                    {/* Uploaded files list */}
                    {(formData[document.id] || []).length > 0 && (
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        marginTop: "4px"
                      }}>
                        {(Array.isArray(formData[document.id]) ? formData[document.id] : [formData[document.id]])
  .filter(Boolean)
  .map((file, fileIndex) => (

                          <div key={fileIndex} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "2px 4px",
                            backgroundColor: "#efebe9",
                            borderRadius: "4px",
                            fontSize: "9px",
                            color: "#5d4037"
                          }}>
                            <FileText style={{ width: "10px", height: "10px" }} />
                            <span style={{ 
                              maxWidth: "80px", 
                              overflow: "hidden", 
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}>
                              {file.name || `File ${fileIndex + 1}`}
                            </span>
                            <button
                              onClick={() => handleDeleteFile(document.id, fileIndex)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#c62828",
                                cursor: "pointer",
                                padding: "0",
                                display: "flex",
                                alignItems: "center"
                              }}
                              title="Delete file"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div style={{
        marginTop: "30px",
        padding: "20px",
        backgroundColor: "#efebe9",
        borderRadius: "8px",
        borderLeft: "4px solid #8d6e63"
      }}>
        <h4 style={{
          fontSize: "16px",
          fontWeight: "600",
          color: "#5d4037",
          marginBottom: "8px"
        }}>Upload Summary</h4>
        <p style={{
          color: "#6d4c41",
          fontSize: "14px",
          lineHeight: "1.5",
          margin: "0"
        }}>
          You have uploaded <strong>{stats.required.uploaded} out of {stats.required.total}</strong> required documents 
          and <strong>{stats.optional.uploaded} out of {stats.optional.total}</strong> optional documents. 
          {stats.required.uploaded === stats.required.total 
            ? " ✅ All required documents are complete!" 
            : ` Please upload the remaining ${stats.required.total - stats.required.uploaded} required document(s).`
          }
        </p>
      </div>
    </div>
  )
}