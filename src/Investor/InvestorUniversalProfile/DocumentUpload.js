"use client"
import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Upload, FileText, Loader2 } from "lucide-react"
import FileUpload from "./FileUpload"
import { Info } from "lucide-react"
import styles from "./InvestorUniversalProfile.module.css"
import { db, auth } from "../../firebaseConfig"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { ref, deleteObject } from "firebase/storage";
import { storage } from "../../firebaseConfig"; 

export const documentsList = [
  {
    id: "registrationDocs",
    label: "Company Registration Documents",
    accept: ".pdf,.doc,.docx",
    required: true,
    multiple: false,
    description: "Official company registration documents",
    dataPath: "documentUpload.registrationDocs"
  },
  {
    id: "idOffund",
    label: "ID of Fund Lead",
    accept: ".pdf,.jpg,.jpeg,.png",
    required: true,
    multiple: false,
    description: "ID Documents for the fund leader",
    dataPath: "documentUpload.idOffund"
  },
  {
    id: "fundMandate",
    label: " Investment Mandate or Programme Brochures",
    accept: ".pdf,.doc,.docx",
    required: true,
    multiple: false,
    description: "Official investment mandate document or Brochure",
    dataPath: "documentUpload.fundMandate"
  },
]

export default function InvestorDocumentUpload({ data = {}, updateData }) {
  const [formData, setFormData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [uploadStatus, setUploadStatus] = useState({})
  const [uploadingFiles, setUploadingFiles] = useState({})

// Load data from Firebase when component mounts
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

      // Load from the universalProfiles collection
      const docRef = doc(db, "MyuniversalProfiles", userId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const profileData = docSnap.data()
        console.log("Full Firebase data:", profileData)

        // Access the formData from Firebase
        const formDataFromFirebase = profileData.formData || {}
        console.log("formData from Firebase:", formDataFromFirebase)

        // Access documentUpload from formData (this is where your documents are stored)
        const documentUpload = formDataFromFirebase.documentUpload || {}
        console.log("documentUpload from formData:", documentUpload)

        // Collect only the 3 specific documents we want
        const documentsData = {}

        // Check for each of the 3 specific documents in documentUpload
        documentsList.forEach(docItem => {
          const documentValue = documentUpload[docItem.id]
          console.log(`Checking ${docItem.id} in documentUpload:`, documentValue)

          if (documentValue) {
            // If it's a string URL (from Firebase storage)
            if (typeof documentValue === 'string') {
              // Create a file-like object with the URL for display
              documentsData[docItem.id] = [{
                name: `${docItem.label}`,
                url: documentValue,
                type: 'application/pdf', // Default type
                fromFirebase: true
              }]
            } 
            // If it's already an array (from current session)
            else if (Array.isArray(documentValue)) {
              documentsData[docItem.id] = documentValue
            } 
            // If it's a single object
            else {
              documentsData[docItem.id] = [documentValue]
            }
          } else {
            documentsData[docItem.id] = []
          }
        })

        console.log("Final documents data for component:", documentsData)
        setFormData(documentsData)
        updateData(documentsData)

        // Update upload status
        const status = {}
        documentsList.forEach(docItem => {
          const files = documentsData[docItem.id] || []
          status[docItem.id] = files.length > 0 ? 'success' : 'pending'
        })
        setUploadStatus(status)

      } else {
        console.log("No document found in Firebase")
        // Initialize with passed data
        setFormData(data || {})
        const status = {}
        documentsList.forEach(docItem => {
          const files = data[docItem.id] || []
          status[docItem.id] = files.length > 0 ? 'success' : 'pending'
        })
        setUploadStatus(status)
      }
    } catch (error) {
      console.error("Error loading documents:", error)
      setFormData(data || {})
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

// Update the file display to handle both File objects and URL objects
const getFileDisplayName = (file) => {
  if (file.name) {
    return file.name
  } else if (file.url) {
    // Extract filename from URL or use a default name
    const urlParts = file.url.split('/')
    return urlParts[urlParts.length - 1].split('?')[0] || 'Download File'
  }
  return 'Unknown File'
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
  const currentFiles = formData[documentId] || [];
  const fileToDelete = currentFiles[fileIndex];
  
  console.log("=== DELETE FILE DEBUG ===");
  console.log("Document ID:", documentId);
  console.log("File Index:", fileIndex);
  console.log("File to delete:", fileToDelete);
  console.log("Type of fileToDelete:", typeof fileToDelete);
  
  // Show confirmation dialog
  const isConfirmed = window.confirm(
    `Are you sure you want to delete this file?\n\nThis action will permanently remove the file and cannot be undone.`
  );
  
  if (!isConfirmed) {
    console.log("Delete cancelled by user");
    return;
  }

  try {
    // Show deleting state
    setUploadingFiles(prev => ({ ...prev, [documentId]: true }));

    const userId = auth.currentUser?.uid;
    console.log("User ID:", userId);
    
    // Check if fileToDelete is a string URL (from Firebase storage)
    if (typeof fileToDelete === 'string' && fileToDelete.includes('firebasestorage.googleapis.com')) {
      console.log("Found Firebase storage URL");
      
      try {
        // Method 1: Extract path from URL and create proper storage reference
        console.log("=== METHOD 1: URL Path Extraction ===");
        const url = new URL(fileToDelete);
        console.log("Full URL object:", url);
        console.log("URL pathname:", url.pathname);
        
        // Extract the path after /o/
        const pathAfterO = url.pathname.split('/o/')[1];
        console.log("Path after /o/:", pathAfterO);
        
        if (pathAfterO) {
          const decodedPath = decodeURIComponent(pathAfterO);
          console.log("Decoded path:", decodedPath);
          
          try {
            const urlRef = ref(storage, decodedPath);
            console.log("URL-based storage ref path:", decodedPath);
            await deleteObject(urlRef);
            console.log("✅ Successfully deleted via URL path method");
          } catch (urlError) {
            console.error("❌ URL path deletion failed:", urlError);
            console.log("Error code:", urlError.code);
            console.log("Error message:", urlError.message);
          }
        }

        // Method 2: Also try to delete from the full path location
        console.log("=== METHOD 2: Full Path Deletion ===");
        if (userId) {
          const fullPath = `MyuniversalProfile/${userId}/full/documentUpload/${documentId}/0`;
          console.log("Trying full path:", fullPath);
          try {
            const fullPathRef = ref(storage, fullPath);
            await deleteObject(fullPathRef);
            console.log("✅ Successfully deleted from full path");
          } catch (fullPathError) {
            console.log("❌ Full path deletion failed:", fullPathError.message);
          }
        }

      } catch (storageError) {
        console.error("❌ Overall storage deletion error:", storageError);
      }
    } else {
      console.log("Not a Firebase storage URL or wrong type, skipping storage deletion");
      console.log("File type:", typeof fileToDelete);
      console.log("File value:", fileToDelete);
    }

    // Update local state - remove the file from the array
    console.log("Updating local state...");
    const updatedFiles = currentFiles.filter((_, index) => index !== fileIndex);
    const updatedData = { ...formData, [documentId]: updatedFiles };
    
    setFormData(updatedData);
    await updateData(updatedData);
    
    // Update upload status
    setUploadStatus(prev => ({
      ...prev,
      [documentId]: updatedFiles.length > 0 ? 'success' : 'pending'
    }));

    console.log("✅ Local state updated successfully");

  } catch (error) {
    console.error("❌ Overall delete error:", error);
    alert("Failed to delete the file. Please try again.");
  } finally {
    setUploadingFiles(prev => ({ ...prev, [documentId]: false }));
    console.log("=== DELETE PROCESS COMPLETED ===");
  }
};



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
        }}>Investor Documents Upload</h2>
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
      }}>Investor Documents Upload</h2>

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
          🏆 Investor Verification Score
        </h3>
        <p style={{
          color: "#6d4c41",
          lineHeight: "1.6",
          marginBottom: "20px"
        }}>
          The Investor Verification Score helps ensure that funders on BIG Marketplace are credible, transparent, and committed to responsible dealmaking. It goes beyond basic compliance to assess each investor's identity, past activity, engagement on the platform, and alignment with investment best practices.
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
            {documentsList?.map((document, index) => (
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
  .map((file, fileIndex) => {
    const displayName = getFileDisplayName(file);
    const fileUrl = typeof file === 'string' ? file : file.url;
    
    return (
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
          {displayName}
        </span>
        {fileUrl ? (
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: "#1976d2",
              textDecoration: "none",
              marginRight: "4px",
              fontSize: "8px"
            }}
            title="View file"
          >
            👁️
          </a>
        ) : null}
        <button
          onClick={() => handleDeleteFile(document.id, fileIndex)}
          style={{
            background: "none",
            border: "none",
            color: uploadingFiles[document.id] ? "#999" : "#c62828",
            cursor: uploadingFiles[document.id] ? "not-allowed" : "pointer",
            padding: "0",
            display: "flex",
            alignItems: "center"
          }}
          title="Delete file"
          disabled={uploadingFiles[document.id]}
        >
          {uploadingFiles[document.id] ? "..." : "×"}
        </button>
      </div>
    );
  })}
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