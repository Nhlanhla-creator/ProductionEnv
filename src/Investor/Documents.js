"use client"

import { useEffect, useState } from "react"
import { getAuth } from "firebase/auth"
import { getDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db } from "../firebaseConfig"
import { FileText, ExternalLink, Upload, Filter, ChevronDown } from "lucide-react"
import get from "lodash.get"
import { onAuthStateChanged } from "firebase/auth"
import { getFunctions, httpsCallable } from "firebase/functions"

const functions = getFunctions()

const DOCUMENT_PATHS = {
  "Company Logo": "formData.entityOverview.companyLogo",
  "Fund Leader ID": "formData.documentUpload.idOffund",
  "Fund Mandate": "formData.documentUpload.fundMandate",
  "Registration Docs": "formData.documentUpload.registrationDocs",
}

const DOCUMENTS = Object.keys(DOCUMENT_PATHS).sort((a, b) => a.localeCompare(b))

const checkSubmittedDocs = (documents, data) => {
  return documents.filter((label) => {
    const path = DOCUMENT_PATHS[label]
    return !!get(data, path)
  })
}

const getDocumentURL = (label, data) => {
  return get(data, DOCUMENT_PATHS[label])
}

const getDocumentUpdatedAt = (label, data) => {
  const path = DOCUMENT_PATHS[label]
  const parts = path.split(".")
  const timestampPath = parts.length === 1 ? `${parts[0]}UpdatedAt` : `${parts.slice(0, -1).join(".")}.UpdatedAt`
  return get(data, timestampPath)
}

const Documents = () => {
  const [profileData, setProfileData] = useState({})
  const [submittedDocuments, setSubmittedDocuments] = useState([])
  const [filter, setFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isOverlayVisible, setIsOverlayVisible] = useState(false)
  const [validationResults, setValidationResults] = useState({})
  const [showStatusFilter, setShowStatusFilter] = useState(false)

  // Handle click outside for status filter
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatusFilter && !event.target.closest('th')) {
        setShowStatusFilter(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showStatusFilter])

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "MyuniversalProfiles", user.uid)
          const docSnap = await getDoc(docRef)
          if (!docSnap.exists()) return

          const data = docSnap.data()
          setProfileData(data)
          const submitted = checkSubmittedDocs(DOCUMENTS, data)
          setSubmittedDocuments(submitted)
        } catch (err) {
          console.error("Failed to load user documents:", err)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const getRegisteredName = async () => {
    const user = getAuth().currentUser
    if (!user) return null

    try {
      const profileRef = doc(db, "MyuniversalProfiles", user.uid)
      const profileSnap = await getDoc(profileRef)
      if (profileSnap.exists()) {
        const data = profileSnap.data()
        return data.entityOverview?.registeredName || data.fundName || ""
      }
    } catch (error) {
      console.error("Error fetching registered name:", error)
    }
    return null
  }

  const validateDocumentWithAI = async (docLabel, file, registeredName) => {
    try {
      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result.split(',')[1])
      })

      const validateMyDocument = httpsCallable(functions, 'validateMyDocument')

      const result = await validateMyDocument({
        documentLabel: docLabel,
        base64File: base64Data,
        mimeType: file.type,
        registeredName: registeredName,
      })

      return result.data.validationResult
    } catch (error) {
      console.error("AI validation failed:", error)
      throw new Error("Network error - please check your connection and try again")
    }
  }

  const handleFileUpload = async (docLabel, file) => {
    const auth = getAuth()
    const user = auth.currentUser
    if (!user || !file) return

    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.svg', '.doc', '.docx']
    const fileExtension = file.name.toLowerCase().split('.').pop()
    
    if (!allowedTypes.includes(`.${fileExtension}`)) {
      setValidationResults(prev => ({
        ...prev,
        [docLabel]: {
          isValid: false,
          status: "rejected",
          message: `Invalid file type. Please upload PDF, Word, or Image files.`,
          warnings: []
        }
      }))
      alert(`Invalid file type. Please upload PDF, Word, or Image files.`)
      return
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setValidationResults(prev => ({
        ...prev,
        [docLabel]: {
          isValid: false,
          status: "rejected",
          message: `File size exceeds 10MB limit. Please upload a smaller file.`,
          warnings: []
        }
      }))
      alert(`File size exceeds 10MB limit. Please upload a smaller file.`)
      return
    }

    setIsUploading(true)
    setIsOverlayVisible(true)

    try {
      const registeredName = await getRegisteredName()
      const validationResult = await validateDocumentWithAI(docLabel, file, registeredName)
      
      setValidationResults(prev => ({
        ...prev,
        [docLabel]: validationResult
      }))

      const storage = getStorage()
      const timestamp = Date.now()
      const filePath = `MyuniversalProfiles/documents/${user.uid}/${docLabel.replace(/\s+/g, '_')}_${timestamp}.${fileExtension}`
      const storageRef = ref(storage, filePath)

      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      const profileRef = doc(db, "MyuniversalProfiles", user.uid)
      const path = DOCUMENT_PATHS[docLabel]

      const timestampPath = (() => {
        const parts = path.split(".")
        if (parts.length === 1) return `${parts[0]}UpdatedAt`
        parts.pop()
        return `${parts.join(".")}.UpdatedAt`
      })()

      await updateDoc(profileRef, {
        [path]: downloadURL,
        [timestampPath]: serverTimestamp(),
      })

      setSubmittedDocuments((prev) => Array.from(new Set([...prev, docLabel])))

      const updatedProfileSnap = await getDoc(profileRef)
      if (updatedProfileSnap.exists()) {
        setProfileData(updatedProfileSnap.data())
      }

      if (validationResult.message && validationResult.message !== "Document verified") {
        alert(`${docLabel} uploaded: ${validationResult.message}`)
      } else {
        alert(`${docLabel} uploaded successfully.`)
      }
    } catch (error) {
      console.error("Upload failed:", error)
      alert(error.message || "Upload failed. Please try again.")
    } finally {
      setIsUploading(false)
      setTimeout(() => {
        setIsOverlayVisible(false)
      }, 300)
    }
  }

  const getDocumentStatus = (docLabel) => {
    const url = getDocumentURL(docLabel, profileData)
    const validation = validationResults[docLabel]
    
    if (!url) return "pending"
    
    if (validation) {
      if (validation.status === "verified" || validation.status === "verified:not_audited") return "verified"
      if (validation.status === "expired") return "expired"
      if (validation.status === "rejected" || validation.status === "wrong_type" || validation.status === "name_mismatch" || validation.status === "incomplete") {
        return "rejected"
      }
    }
    
    return "uploaded"
  }

  const getStatusBadge = (docLabel) => {
    const status = getDocumentStatus(docLabel)
    
    const styles = {
      pending: { backgroundColor: "#fff3e0", color: "#ef6c00", text: "Pending" },
      uploaded: { backgroundColor: "#e3f2fd", color: "#0d47a1", text: "Uploaded" },
      verified: { backgroundColor: "#e8f5e8", color: "#2e7d32", text: "Verified" },
      expired: { backgroundColor: "#fff3e0", color: "#c62828", text: "Expired" },
      rejected: { backgroundColor: "#ffebee", color: "#c62828", text: "Rejected" }
    }
    
    const style = styles[status] || styles.pending
    
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: "600",
          backgroundColor: style.backgroundColor,
          color: style.color,
        }}
      >
        {style.text}
      </span>
    )
  }

  const renderDocumentLink = (label) => {
    const url = getDocumentURL(label, profileData)
    if (!url)
      return (
        <span
          style={{
            color: "#8d6e63",
            fontSize: "12px",
            fontStyle: "italic",
          }}
        >
          No document uploaded
        </span>
      )
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "#5d4037",
          textDecoration: "none",
          fontSize: "12px",
          fontWeight: "500",
          padding: "4px 0",
          borderBottom: "1px solid #5d4037",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.color = "#8d6e63"
          e.target.style.borderBottomColor = "#8d6e63"
        }}
        onMouseLeave={(e) => {
          e.target.style.color = "#5d4037"
          e.target.style.borderBottomColor = "#5d4037"
        }}
      >
        <FileText size={14} />
        <span>View Document</span>
        <ExternalLink size={12} />
      </a>
    )
  }

  const filteredDocuments = DOCUMENTS.filter((doc) => {
    const status = getDocumentStatus(doc)
    const matchFilter =
      filter === "all" ||
      (filter === "submitted" && status !== "pending") ||
      (filter === "pending" && status === "pending")
    
    const matchStatusFilter =
      statusFilter === "all" || status === statusFilter
    
    const matchSearch = doc.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchFilter && matchStatusFilter && matchSearch
  })

  if (!getAuth().currentUser && !loading) {
    return <div className="empty-state">Please sign in to view documents.</div>
  }

  return (
    <>
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        html {
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }
        body {
          touch-action: manipulation;
          min-width: 100vw;
          overflow-x: hidden;
        }
        
        @media (max-width: 1200px) {
          .documents-container {
            padding-left: 24px !important;
            padding-right: 24px !important;
          }
        }
        
        @media (max-width: 1024px) {
          .documents-container {
            margin-left: 0 !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
          
          .sidebar-space {
            display: none;
          }
          
          .document-controls {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
          
          .search-box {
            width: 100% !important;
          }
        }
        
        @media (max-width: 768px) {
          .documents-container {
            padding: 16px !important;
          }
          
          .documents-table-container {
            overflow-x: auto;
          }
          
          .documents-table {
            min-width: 700px;
          }
        }
        
        @media (max-width: 480px) {
          .documents-header {
            padding: 20px !important;
          }
          
          .documents-header h1 {
            font-size: 1.75rem !important;
          }
          
          .documents-header p {
            font-size: 1rem !important;
          }
        }
      `}</style>

      <div
        className="documents-container"
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          minHeight: "100vh",
          backgroundColor: "#faf8f6",
          padding: "20px",
          transition: "padding 0.3s ease",
          width: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <div
          className="sidebar-space"
          style={{
            width: "280px",
            height: "100vh",
            position: "fixed",
            left: "0",
            top: "0",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            width: "100%",
            maxWidth: "1400px",
            margin: "0 auto",
          }}
        >
          {/* Header */}
          <div
            className="documents-header"
            style={{
              marginBottom: "32px",
              padding: "32px",
              background: "linear-gradient(135deg, #f5f2f0 0%, #faf8f6 100%)",
              borderRadius: "16px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              border: "2px solid #d7ccc8",
            }}
          >
            <h1
              style={{
                fontSize: "2.5rem",
                fontWeight: "700",
                color: "#5d4037",
                margin: "0 0 8px 0",
                letterSpacing: "-0.025em",
              }}
            >
              Investor Profile Documents
            </h1>
            <p
              style={{
                fontSize: "1.125rem",
                color: "#6d4c41",
                margin: "0",
                fontWeight: "400",
              }}
            >
              Track all your submitted documents in one place
            </p>
          </div>

          {/* Controls Section */}
          <div
            className="document-controls"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "32px",
              padding: "20px 24px",
              backgroundColor: "#f5f2f0",
              borderRadius: "12px",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
              border: "1px solid #d7ccc8",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["all", "submitted", "pending"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  style={{
                    padding: "10px 20px",
                    border: filter === type ? "2px solid #8d6e63" : "2px solid #d7ccc8",
                    backgroundColor: filter === type ? "#8d6e63" : "#faf8f6",
                    color: filter === type ? "white" : "#6d4c41",
                    borderRadius: "8px",
                    fontWeight: "500",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    minWidth: "100px",
                  }}
                  onMouseEnter={(e) => {
                    if (filter !== type) {
                      e.target.style.backgroundColor = "#efebe9"
                      e.target.style.borderColor = "#a67c52"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filter !== type) {
                      e.target.style.backgroundColor = "#faf8f6"
                      e.target.style.borderColor = "#d7ccc8"
                    }
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            
            <input
              className="search-box"
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "12px 16px",
                border: "2px solid #d7ccc8",
                borderRadius: "8px",
                fontSize: "0.875rem",
                backgroundColor: "#faf8f6",
                color: "#5d4037",
                minWidth: "200px",
                width: "280px",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#8d6e63"
                e.target.style.boxShadow = "0 0 0 3px rgba(141, 110, 99, 0.1)"
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d7ccc8"
                e.target.style.boxShadow = "none"
              }}
            />
          </div>

          {/* Documents Table */}
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 32px",
                backgroundColor: "#f5f2f0",
                borderRadius: "16px",
                border: "2px dashed #d7ccc8",
                color: "#6d4c41",
                fontSize: "1.125rem",
                fontWeight: "500",
                width: "100%",
              }}
            >
              Loading documents...
            </div>
          ) : (
            <div
              className="documents-table-container"
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                overflow: "hidden",
                border: "1px solid #d7ccc8",
                width: "100%",
                overflowX: "auto",
              }}
            >
              <table
                className="documents-table"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "800px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#8d6e63",
                      color: "white",
                      height: "50px",
                    }}
                  >
                    <th
                      style={{
                        padding: "16px 20px",
                        textAlign: "left",
                        fontWeight: "600",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        borderBottom: "2px solid #6d4c41",
                        width: "25%",
                      }}
                    >
                      Document Name
                    </th>
                    <th
                      style={{
                        padding: "16px 20px",
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        borderBottom: "2px solid #6d4c41",
                        width: "20%",
                      }}
                    >
                      Uploaded Document
                    </th>
                    <th
                      style={{
                        padding: "16px 20px",
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        borderBottom: "2px solid #6d4c41",
                        width: "15%",
                      }}
                    >
                      Last Updated
                    </th>
                    <th
                      style={{
                        padding: "16px 20px",
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        borderBottom: "2px solid #6d4c41",
                        width: "15%",
                      }}
                    >
                      Notes
                    </th>
                    <th
                      style={{
                        padding: "16px 20px",
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        borderBottom: "2px solid #6d4c41",
                        width: "10%",
                        position: "relative"
                      }}
                    >
                      <div 
                        style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          gap: "8px",
                          cursor: "pointer",
                          position: "relative"
                        }}
                        onClick={() => setShowStatusFilter(!showStatusFilter)}
                      >
                        Status
                        <Filter size={14} />
                        
                        {showStatusFilter && (
                          <div
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: "50%",
                              transform: "translateX(-50%)",
                              backgroundColor: "white",
                              border: "1px solid #d7ccc8",
                              borderRadius: "8px",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                              zIndex: 9999,
                              minWidth: "180px",
                              marginTop: "8px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                padding: "8px 12px",
                                backgroundColor: "#f5f2f0",
                                borderBottom: "1px solid #d7ccc8",
                                fontSize: "12px",
                                fontWeight: "600",
                                color: "#5d4037",
                              }}
                            >
                              Filter by Status
                            </div>
                            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                              {["all", "pending", "uploaded", "verified", "expired", "rejected"].map((status) => {
                                const statusLabels = {
                                  all: "All",
                                  pending: "Pending",
                                  uploaded: "Uploaded",
                                  verified: "Verified",
                                  expired: "Expired",
                                  rejected: "Rejected",
                                }
                                return (
                                  <button
                                    key={status}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setStatusFilter(status)
                                      setShowStatusFilter(false)
                                    }}
                                    style={{
                                      display: "block",
                                      width: "100%",
                                      padding: "10px 16px",
                                      textAlign: "left",
                                      border: "none",
                                      backgroundColor: statusFilter === status ? "#efebe9" : "white",
                                      color: "#5d4037",
                                      fontSize: "13px",
                                      cursor: "pointer",
                                      borderBottom: "1px solid #f5f2f0",
                                    }}
                                    onMouseEnter={(e) => (e.target.style.backgroundColor = statusFilter === status ? "#efebe9" : "#faf8f6")}
                                    onMouseLeave={(e) => (e.target.style.backgroundColor = statusFilter === status ? "#efebe9" : "white")}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                      <span>{statusLabels[status]}</span>
                                      {statusFilter === status && (
                                        <span style={{ color: "#8d6e63", fontSize: "12px" }}>✓</span>
                                      )}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </th>
                    <th
                      style={{
                        padding: "16px 20px",
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        borderBottom: "2px solid #6d4c41",
                        width: "15%",
                      }}
                    >
                      Actions
                    </th>
                   </tr>
                </thead>
                <tbody>
                  {filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "60px 20px", color: "#6d4c41", fontSize: "14px" }}>
                        No documents found
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map((doc, index) => {
                      const updatedAt = getDocumentUpdatedAt(doc, profileData)
                      const validation = validationResults[doc]
                      const url = getDocumentURL(doc, profileData)

                      return (
                        <tr
                          key={doc}
                          style={{
                            backgroundColor: index % 2 === 0 ? "white" : "#faf8f6",
                            borderBottom: "1px solid #e8d8cf",
                            transition: "background-color 0.2s ease",
                            height: "60px",
                          }}
                          onMouseEnter={(e) => (e.target.closest("tr").style.backgroundColor = "#efebe9")}
                          onMouseLeave={(e) =>
                            (e.target.closest("tr").style.backgroundColor = index % 2 === 0 ? "white" : "#faf8f6")
                          }
                        >
                          <td
                            style={{
                              padding: "16px 20px",
                              fontSize: "14px",
                              color: "#5d4037",
                              fontWeight: "600",
                              verticalAlign: "middle",
                            }}
                          >
                            {doc}
                          </td>
                          <td
                            style={{
                              padding: "16px 20px",
                              textAlign: "center",
                              verticalAlign: "middle",
                              backgroundColor: "transparent",
                            }}
                          >
                            {renderDocumentLink(doc)}
                          </td>
                          <td
                            style={{
                              padding: "16px 20px",
                              fontSize: "13px",
                              color: "#6d4c41",
                              textAlign: "center",
                              verticalAlign: "middle",
                              backgroundColor: "transparent",
                            }}
                          >
                            {updatedAt?.seconds ? new Date(updatedAt.seconds * 1000).toLocaleDateString() : "-"}
                          </td>
                          <td
                            style={{
                              padding: "16px 20px",
                              fontSize: "12px",
                              color: "#6d4c41",
                              textAlign: "center",
                              verticalAlign: "middle",
                              backgroundColor: "transparent",
                            }}
                          >
                            {validation?.message || (url ? "Document uploaded" : "No document uploaded")}
                          </td>
                          <td
                            style={{
                              padding: "16px 20px",
                              textAlign: "center",
                              verticalAlign: "middle",
                              backgroundColor: "transparent",
                            }}
                          >
                            {getStatusBadge(doc)}
                          </td>
                          <td
                            style={{
                              padding: "16px 20px",
                              textAlign: "center",
                              verticalAlign: "middle",
                              backgroundColor: "transparent",
                            }}
                          >
                            <label
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 16px",
                                backgroundColor: "#a67c52",
                                color: "white",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: "600",
                                cursor: isUploading ? "not-allowed" : "pointer",
                                transition: "all 0.2s ease",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                opacity: isUploading ? 0.7 : 1,
                              }}
                              onMouseEnter={(e) => {
                                if (!isUploading) {
                                  e.target.style.backgroundColor = "#8d6e63"
                                  e.target.style.transform = "translateY(-1px)"
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isUploading) {
                                  e.target.style.backgroundColor = "#a67c52"
                                  e.target.style.transform = "translateY(0)"
                                }
                              }}
                            >
                              {isUploading ? (
                                <>
                                  <div
                                    style={{
                                      width: "12px",
                                      height: "12px",
                                      border: "2px solid transparent",
                                      borderTop: "2px solid white",
                                      borderRadius: "50%",
                                      animation: "spin 1s linear infinite",
                                    }}
                                  />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload size={12} />
                                  {getDocumentURL(doc, profileData) ? "Update" : "Upload"}
                                </>
                              )}
                              <input
                                type="file"
                                style={{ display: "none" }}
                                onChange={(e) => handleFileUpload(doc, e.target.files[0])}
                                disabled={isUploading}
                                accept=".pdf,.jpg,.jpeg,.png,.svg,.doc,.docx"
                              />
                            </label>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Upload Overlay */}
      {isOverlayVisible && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            backdropFilter: "blur(4px)",
            opacity: isUploading ? 1 : 0,
            transition: "opacity 0.3s ease-in-out",
            pointerEvents: isUploading ? "auto" : "none",
          }}
        >
          <div
            style={{
              backgroundColor: "#f5f5f5",
              padding: "40px 60px",
              borderRadius: "12px",
              textAlign: "center",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              border: "1px solid #ddd",
              transform: isUploading ? "scale(1)" : "scale(0.9)",
              transition: "all 0.3s ease-in-out",
              opacity: isUploading ? 1 : 0,
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                border: "4px solid #e0e0e0",
                borderTop: "4px solid #a67c52",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px auto",
              }}
            />
            <p
              style={{
                margin: 0,
                color: "#5d4037",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              Uploading Document...
            </p>
            <p
              style={{
                margin: "10px 0 0 0",
                color: "#8d6e63",
                fontSize: "12px",
                fontStyle: "italic",
              }}
            >
              Please wait while we validate your file
            </p>
          </div>
        </div>
      )}
    </>
  )
}

export default Documents