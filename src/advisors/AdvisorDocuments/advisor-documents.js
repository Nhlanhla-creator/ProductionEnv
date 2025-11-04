"use client"
import { useEffect, useState } from "react"
import { getAuth } from "firebase/auth"
import { getDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage"
import { db } from "../../firebaseConfig"
import { FileText, ExternalLink, Upload, Loader2, Trash, Trash2 } from "lucide-react"
import get from "lodash.get"
import { onAuthStateChanged } from "firebase/auth"
import { documentsList } from "../AdvisorProfile/documentsconfig"

const MyDocuments = () => {
  const [profileData, setProfileData] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [uploadingFiles, setUploadingFiles] = useState({})
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Sort documents alphabetically by label
  const sortedDocuments = [...documentsList].sort((a, b) => a.label.localeCompare(b.label))

  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
    }

    // Check initial state
    checkSidebarState()

    // Watch for changes
    const observer = new MutationObserver(checkSidebarState)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setLoading(true)
          const profileRef = doc(db, "advisorProfiles", user.uid)
          const profileSnap = await getDoc(profileRef)
          if (profileSnap.exists()) {
            setProfileData(profileSnap.data())
          }
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

  const handleFileUpload = async (docLabel, files) => {
    const user = getAuth().currentUser
    if (!user || !files || files.length === 0) return

    const docConfig = sortedDocuments.find((doc) => doc.label === docLabel)
    if (!docConfig) return

    const documentId = docConfig.id
    const isMultiple = docConfig.multiple
    const storage = getStorage()
    const docRef = doc(db, "advisorProfiles", user.uid)

    setUploadingFiles((prev) => ({ ...prev, [documentId]: true }))

    try {
      // Delete old files if not multiple
      const existingFiles = get(profileData, docConfig.dataPath, [])
      if (!isMultiple && existingFiles.length > 0) {
        for (const file of existingFiles) {
          if (file.path) {
            const oldFileRef = ref(storage, file.path)
            await deleteObject(oldFileRef).catch((err) => console.warn("Failed to delete old file:", err))
          }
        }
      }

      // Upload new files
      const uploadedFiles = []
      for (const file of files) {
        const filePath = `advisorProfile/${user.uid}/requiredDocuments/${documentId}/${file.name}`
        const fileRef = ref(storage, filePath)
        await uploadBytes(fileRef, file)
        const downloadURL = await getDownloadURL(fileRef)
        uploadedFiles.push({
          name: file.name,
          url: downloadURL,
          path: filePath,
          uploadedAt: new Date().toISOString(),
        })
      }

      const finalFiles = isMultiple ? [...existingFiles, ...uploadedFiles] : [uploadedFiles[0]]

      await updateDoc(docRef, {
        [docConfig.dataPath]: finalFiles,
        [`${docConfig.dataPath}UpdatedAt`]: serverTimestamp(),
      })

      const updatedSnap = await getDoc(docRef)
      if (updatedSnap.exists()) setProfileData(updatedSnap.data())
    } catch (err) {
      console.error("Upload failed:", err)
      alert("Upload failed. Please try again.")
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [documentId]: false }))
    }
  }
const handleDeleteFile = async (docLabel, fileIndex) => {
  const user = getAuth().currentUser
  if (!user) return

  const docConfig = sortedDocuments.find((doc) => doc.label === docLabel)
  if (!docConfig) return

  const documentId = docConfig.id
  const storage = getStorage()
  const docRef = doc(db, "advisorProfiles", user.uid)

  if (!window.confirm("Are you sure you want to delete this file?")) return

  setUploadingFiles((prev) => ({ ...prev, [documentId]: true }))

  try {
    const { listAll } = await import("firebase/storage")
    
    const existingFiles = get(profileData, docConfig.dataPath, [])
    const fileToDelete = existingFiles[fileIndex]

    let totalDeleted = 0
    const foldersToCheck = [
      `advisorProfile/${user.uid}/requiredDocuments/${documentId}`,
      `advisorProfile/${user.uid}/full/requiredDocuments/${documentId}`
    ]

    // Scan and delete from all folder locations
    for (const folderPath of foldersToCheck) {
      try {
        console.log("Checking folder:", folderPath)
        const folderRef = ref(storage, folderPath)
        const fileList = await listAll(folderRef)
        
        console.log(`Found ${fileList.items.length} file(s) in ${folderPath}`)
        
        // Delete all files in the folder
        for (const itemRef of fileList.items) {
          try {
            console.log("Deleting file:", itemRef.name, "Full path:", itemRef.fullPath)
            await deleteObject(itemRef)
            console.log("✓ Successfully deleted:", itemRef.fullPath)
            totalDeleted++
          } catch (deleteErr) {
            console.error("✗ Failed to delete:", itemRef.fullPath, deleteErr)
          }
        }
      } catch (listErr) {
        console.log("Folder not found or empty:", folderPath, listErr.code)
      }
    }

    // Also try URL-based deletion as backup
    if (fileToDelete?.url) {
      try {
        const url = new URL(fileToDelete.url)
        const encodedPath = url.pathname.split('/o/')[1]?.split('?')[0]
        if (encodedPath) {
          const path = decodeURIComponent(encodedPath)
          try {
            const fileRef = ref(storage, path)
            await deleteObject(fileRef)
            console.log(`✓ Deleted using URL path:`, path)
            totalDeleted++
          } catch (err) {
            if (err.code !== 'storage/object-not-found') {
              console.log(`Note: File not found at URL path:`, path)
            }
          }
        }
      } catch (urlError) {
        console.error("URL parse error:", urlError)
      }
    }

    // Remove from Firestore array
    const updatedFiles = existingFiles.filter((_, index) => index !== fileIndex)

    const updatePath = docConfig.dataPath.replace('formData.', '')
    
    await updateDoc(docRef, {
      [`formData.${updatePath}`]: updatedFiles,
      [`formData.${updatePath}UpdatedAt`]: serverTimestamp(),
    })

    const updatedSnap = await getDoc(docRef)
    if (updatedSnap.exists()) setProfileData(updatedSnap.data())
    
    console.log(`Total files deleted from storage: ${totalDeleted}`)
    
    if (totalDeleted > 0) {
      alert(`File deleted successfully! (${totalDeleted} file(s) removed from storage)`)
    } else {
      alert("File reference removed from database. No files found in storage.")
    }
  } catch (err) {
    console.error("Delete failed:", err)
    alert("Delete failed: " + err.message)
  } finally {
    setUploadingFiles((prev) => ({ ...prev, [documentId]: false }))
  }
}
const handleDeleteAllFiles = async (docLabel) => {
  const user = getAuth().currentUser
  if (!user) return

  const docConfig = sortedDocuments.find((doc) => doc.label === docLabel)
  if (!docConfig) return

  const documentId = docConfig.id
  const storage = getStorage()
  const docRef = doc(db, "advisorProfiles", user.uid)

  const existingFiles = get(profileData, docConfig.dataPath, [])
  
  if (!window.confirm(`Are you sure you want to delete all files for ${docLabel}? This will remove all files from storage.`)) return

  setUploadingFiles((prev) => ({ ...prev, [documentId]: true }))

  try {
    // Import listAll to get all files in the folder
    const { listAll } = await import("firebase/storage")
    
    let totalDeleted = 0
    let filesFound = 0
    const foldersToCheck = [
      `advisorProfile/${user.uid}/requiredDocuments/${documentId}`,
      `advisorProfile/${user.uid}/full/requiredDocuments/${documentId}`
    ]

    // Delete from all possible folder locations
    for (const folderPath of foldersToCheck) {
      try {
        console.log("Checking folder:", folderPath)
        const folderRef = ref(storage, folderPath)
        const fileList = await listAll(folderRef)
        
        filesFound += fileList.items.length
        console.log(`Found ${fileList.items.length} file(s) in ${folderPath}`)
        
        // Delete each file in the folder
        for (const itemRef of fileList.items) {
          try {
            console.log("Deleting file:", itemRef.name, "Full path:", itemRef.fullPath)
            await deleteObject(itemRef)
            console.log("✓ Successfully deleted:", itemRef.fullPath)
            totalDeleted++
          } catch (deleteErr) {
            console.error("✗ Failed to delete:", itemRef.fullPath, deleteErr)
          }
        }
      } catch (listErr) {
        // Folder doesn't exist or is empty - this is normal
        console.log("Folder not found or empty:", folderPath, listErr.code)
      }
    }

    // Also try to delete individual files using URL paths from database as backup
    for (let fileIndex = 0; fileIndex < existingFiles.length; fileIndex++) {
      const file = existingFiles[fileIndex]
      
      if (file?.url) {
        try {
          const url = new URL(file.url)
          const encodedPath = url.pathname.split('/o/')[1]?.split('?')[0]
          if (encodedPath) {
            const path = decodeURIComponent(encodedPath)
            try {
              const fileRef = ref(storage, path)
              await deleteObject(fileRef)
              console.log(`✓ Deleted using URL path:`, path)
              totalDeleted++
            } catch (err) {
              // File already deleted or doesn't exist
              if (err.code !== 'storage/object-not-found') {
                console.log(`Note: File not found at URL path (may already be deleted):`, path)
              }
            }
          }
        } catch (urlError) {
          console.error(`File ${fileIndex} - URL parse error:`, urlError)
        }
      }
    }

    // Update Firestore - remove all files
    const updatePath = docConfig.dataPath.replace('formData.', '')
    
    await updateDoc(docRef, {
      [`formData.${updatePath}`]: [],
      [`formData.${updatePath}UpdatedAt`]: serverTimestamp(),
    })

    const updatedSnap = await getDoc(docRef)
    if (updatedSnap.exists()) setProfileData(updatedSnap.data())
    
    console.log(`Total files found: ${filesFound}, Total deleted: ${totalDeleted}`)
    
    if (totalDeleted > 0) {
      alert(`Successfully deleted ${totalDeleted} file(s) from storage and removed all references from database!`)
    } else if (filesFound === 0) {
      alert(`No files found in storage. References have been removed from database.`)
    } else {
      alert(`Attempted to delete ${filesFound} file(s). ${totalDeleted} were successfully deleted. References removed from database.`)
    }
  } catch (err) {
    console.error("Delete all failed:", err)
    alert("Delete all failed: " + err.message)
  } finally {
    setUploadingFiles((prev) => ({ ...prev, [documentId]: false }))
  }
}

  const getDocumentFiles = (docLabel) => {
    const docConfig = sortedDocuments.find((doc) => doc.label === docLabel)
    if (!docConfig) return []
    const data = get(profileData, docConfig.dataPath, [])
    return Array.isArray(data) ? data : data ? [data] : []
  }

  const getStatusBadge = (docLabel) => {
    const docConfig = sortedDocuments.find((doc) => doc.label === docLabel)
    if (!docConfig) return null
    const documentId = docConfig.id

    const isUploading = uploadingFiles[documentId]
    const files = getDocumentFiles(docLabel)
    const isUploaded = files.length > 0

    if (isUploading) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 8px",
            borderRadius: "16px",
            fontSize: "11px",
            fontWeight: "600",
            backgroundColor: "#e3f2fd",
            color: "#1976d2",
          }}
        >
          <Loader2 style={{ width: "12px", height: "12px" }} className="animate-spin" /> Uploading
        </span>
      )
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: "600",
          backgroundColor: isUploaded ? "#e8f5e8" : "#ffebee",
          color: isUploaded ? "#2e7d32" : "#c62828",
        }}
      >
        {isUploaded ? "Uploaded" : "Pending"}
      </span>
    )
  }

  const renderDocumentLink = (docLabel) => {
    const files = getDocumentFiles(docLabel)
    if (files.length === 0) {
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
    }

    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <a
          href={files[0].url}
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
            e.currentTarget.style.color = "#8d6e63"
            e.currentTarget.style.borderBottomColor = "#8d6e63"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#5d4037"
            e.currentTarget.style.borderBottomColor = "#5d4037"
          }}
        >
          <FileText size={14} />
          <span>View Document</span>
          <ExternalLink size={12} />
        </a>
      </div>
    )
  }

  const filteredDocuments = sortedDocuments
    .map((doc) => doc.label)
    .filter((label) => {
      const files = getDocumentFiles(label)
      const matchesSearch = label.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter =
        filter === "all" || (filter === "submitted" && files.length > 0) || (filter === "pending" && files.length === 0)
      return matchesSearch && matchesFilter
    })

  const getContainerStyles = () => ({
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    minHeight: "100vh",
    backgroundColor: "#faf8f6",
    padding: `70px 20px 20px ${isSidebarCollapsed ? "100px" : "280px"}`,
    margin: "0",
    width: "100%",
    boxSizing: "border-box",
    overflowX: "hidden",
    transition: "padding 0.3s ease",
  })

  if (!getAuth().currentUser && !loading) {
    return (
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
        }}
      >
        Please sign in to view documents.
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        html {
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }
        body {
          touch-action: manipulation;
          min-width: 100vw;
          overflow-x: hidden;
        }
        
        /* Responsive adjustments */
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

      <div className="documents-container" style={getContainerStyles()}>
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
              Advisor Documents
            </h1>
            <p
              style={{
                fontSize: "1.125rem",
                color: "#6d4c41",
                margin: "0",
                fontWeight: "400",
              }}
            >
              Manage your essential advisor documents
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
                      e.currentTarget.style.backgroundColor = "#efebe9"
                      e.currentTarget.style.borderColor = "#a67c52"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filter !== type) {
                      e.currentTarget.style.backgroundColor = "#faf8f6"
                      e.currentTarget.style.borderColor = "#d7ccc8"
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
                e.currentTarget.style.borderColor = "#8d6e63"
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(141, 110, 99, 0.1)"
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#d7ccc8"
                e.currentTarget.style.boxShadow = "none"
              }}
            />
          </div>

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
              <Loader2 size={24} className="animate-spin" style={{ color: "#8d6e63", marginBottom: "16px" }} />
              <p>Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
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
              No documents found
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
                      Status
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
                        width: "25%",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((docLabel, index) => {
                    const docConfig = sortedDocuments.find((doc) => doc.label === docLabel)
                    const files = getDocumentFiles(docLabel)
                    const updatedAtPath = `${docConfig.dataPath}UpdatedAt`
                    const updatedAt = get(profileData, updatedAtPath)

                    return (
                      <tr
                        key={docLabel}
                        style={{
                          backgroundColor: index % 2 === 0 ? "#faf8f6" : "#f5f2f0",
                          borderBottom: "1px solid #e8d8cf",
                          transition: "background-color 0.2s ease",
                          height: "60px",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#efebe9")}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#faf8f6" : "#f5f2f0")
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
                          {docLabel}
                        </td>
                        <td
                          style={{
                            padding: "16px 20px",
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          {renderDocumentLink(docLabel)}
                        </td>
                        <td
                          style={{
                            padding: "16px 20px",
                            fontSize: "13px",
                            color: "#6d4037",
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          {updatedAt?.seconds
                            ? new Date(updatedAt.seconds * 1000).toLocaleDateString()
                            : files[0]?.uploadedAt
                              ? new Date(files[0].uploadedAt).toLocaleDateString()
                              : "-"}
                        </td>
                        <td
                          style={{
                            padding: "16px 20px",
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          {getStatusBadge(docLabel)}
                        </td>
                       <td
  style={{
    padding: "16px 20px",
    textAlign: "center",
    verticalAlign: "middle",
  }}
>
  <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
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
        cursor: "pointer",
        transition: "all 0.2s ease",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#8d6e63"
        e.currentTarget.style.transform = "translateY(-1px)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#a67c52"
        e.currentTarget.style.transform = "translateY(0)"
      }}
    >
      <Upload size={12} />
      {files.length > 0 ? "Update" : "Upload"}
      <input
        type="file"
        accept={docConfig.accept}
        multiple={docConfig.multiple}
        style={{ display: "none" }}
        onChange={(e) => handleFileUpload(docLabel, Array.from(e.target.files))}
      />
    </label>
    
    {files.length > 0 && (
      <>
        {files.length === 1 ? (
          <button
            onClick={() => handleDeleteFile(docLabel, 0)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              backgroundColor: "#d32f2f",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#c62828"
              e.currentTarget.style.transform = "translateY(-1px)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#d32f2f"
              e.currentTarget.style.transform = "translateY(0)"
            }}
          >
            <Trash2 size={12} />
            Delete
          </button>
        ) : (
          <button
            onClick={() => handleDeleteAllFiles(docLabel)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              backgroundColor: "#d32f2f",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#c62828"
              e.currentTarget.style.transform = "translateY(-1px)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#d32f2f"
              e.currentTarget.style.transform = "translateY(0)"
            }}
          >
            <Trash size={12} />
            Delete All ({files.length})
          </button>
        )}
      </>
    )}
  </div>
</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default MyDocuments
