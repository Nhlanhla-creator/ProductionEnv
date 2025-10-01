"use client"
import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Upload, FileText, Loader2 } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "../../firebaseConfig" // ensure this is imported

export const documentsList = [
  {
    id: "profilePhoto",
    label: "Profile Photo",
    accept: ".jpg,.jpeg,.png",
    required: false,
    multiple: false,
    description: "Professional profile photo",
  },
  {
    id: "transcriptFile",
    label: "Academic Transcript",
    accept: ".pdf,.doc,.docx",
    required: false,
    multiple: false,
    description: "Official academic transcript",
  },
  {
    id: "cvFile",
    label: "CV/Resume",
    accept: ".pdf,.doc,.docx",
    required: true,
    multiple: false,
    description: "Current CV or resume",
  },
  {
    id: "portfolioFile",
    label: "Portfolio or Sample Work",
    accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
    required: false,
    multiple: true,
    description: "Portfolio or work samples",
  },
  {
    id: "idDocument",
    label: "ID Document",
    accept: ".pdf,.jpg,.jpeg,.png",
    required: true,
    multiple: false,
    description: "National ID or passport copy",
  },
  {
    id: "proofOfStudy",
    label: "Proof of Study",
    accept: ".pdf,.doc,.docx",
    required: true,
    multiple: false,
    description: "Student card or enrollment letter",
  },
  {
    id: "motivationLetter",
    label: "Motivation Letter",
    accept: ".pdf,.doc,.docx",
    required: false,
    multiple: false,
    description: "Letter of motivation for internship",
  },
  {
    id: "references",
    label: "Reference Letters",
    accept: ".pdf,.doc,.docx",
    required: false,
    multiple: true,
    description: "Academic or professional references",
  },
]

export default function RequiredDocuments({ data = {}, updateData }) {
  const [formData, setFormData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [uploadStatus, setUploadStatus] = useState({})
  const [uploadingFiles, setUploadingFiles] = useState({})

  // Load data when component mounts
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
        const docRef = doc(db, "internProfiles", userId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const profileData = docSnap.data()
          const documentsData = profileData.requiredDocuments || {}
          setFormData(documentsData)
          updateData(documentsData) // Sync with parent
          // Update upload status
          const status = {}
          documentsList.forEach((doc) => {
            const files = documentsData[doc.id] || []
            status[doc.id] = files.length > 0 ? "success" : "pending"
          })
          setUploadStatus(status)
        } else {
          // Initialize with passed data if no saved data
          setFormData(data)
          const status = {}
          documentsList.forEach((doc) => {
            const files = data[doc.id] || []
            status[doc.id] = files.length > 0 ? "success" : "pending"
          })
          setUploadStatus(status)
        }
      } catch (error) {
        console.error("Error loading documents:", error)
        setFormData(data) // Fallback to initial data prop
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
      documentsList.forEach((doc) => {
        const files = data[doc.id] || []
        status[doc.id] = files.length > 0 ? "success" : "pending"
      })
      setUploadStatus(status)
    }
  }, [data])

  const handleFileChange = async (documentId, fileList) => {
  const userId = auth.currentUser?.uid
  if (!userId || !fileList || fileList.length === 0) return

  setUploadingFiles((prev) => ({ ...prev, [documentId]: true }))

  try {
    const uploadedFiles = []

    for (const file of fileList) {
      const fileRef = ref(storage, `internDocuments/${userId}/${documentId}/${file.name}`)
      await uploadBytes(fileRef, file)
      const downloadURL = await getDownloadURL(fileRef)

      uploadedFiles.push({
        name: file.name,
        type: file.type,
        url: downloadURL,
        uploadedAt: new Date().toISOString(),
      })
    }

    // If multiple not allowed, only keep the last uploaded file
    const finalFiles = documentsList.find((doc) => doc.id === documentId)?.multiple
      ? uploadedFiles
      : [uploadedFiles[uploadedFiles.length - 1]]

    const updatedData = { ...formData, [documentId]: finalFiles }
    setFormData(updatedData)

    const docRef = doc(db, "internProfiles", userId)
    await updateDoc(docRef, {
      requiredDocuments: updatedData,
      lastUpdated: new Date(),
    }).catch(async (err) => {
      if (err.code === "not-found") {
        await setDoc(docRef, {
          requiredDocuments: updatedData,
          createdAt: new Date(),
          lastUpdated: new Date(),
          userId,
        })
      } else throw err
    })

    await updateData(updatedData)

    setUploadStatus((prev) => ({
      ...prev,
      [documentId]: finalFiles.length > 0 ? "success" : "pending",
    }))

  } catch (error) {
    console.error("Error uploading file:", error)
  } finally {
    setUploadingFiles((prev) => ({ ...prev, [documentId]: false }))
  }
}

  const getStatusBadge = (documentId, document) => {
    const isUploading = uploadingFiles[documentId]
    const files = formData[documentId] || []

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
          <Loader2 style={{ width: "12px", height: "12px" }} className="animate-spin" />
          Uploading
        </span>
      )
    }

    if (files.length > 0) {
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
            backgroundColor: "#e8f5e8",
            color: "#2e7d32",
          }}
        >
          <CheckCircle style={{ width: "12px", height: "12px" }} />
          Uploaded
        </span>
      )
    } else {
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
            backgroundColor: document.required ? "#ffebee" : "#e3f2fd",
            color: document.required ? "#c62828" : "#1976d2",
          }}
        >
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
    await updateData(updatedData) // Sync with parent

    // Update upload status
    setUploadStatus((prev) => ({
      ...prev,
      [documentId]: updatedFiles.length > 0 ? "success" : "pending",
    }))
  }

  const getProgressStats = () => {
    const required = documentsList.filter((doc) => doc.required)
    const optional = documentsList.filter((doc) => !doc.required)

    const requiredUploaded = required.filter((doc) => {
      const files = formData[doc.id] || []
      return files.length > 0
    }).length
    const optionalUploaded = optional.filter((doc) => {
      const files = formData[doc.id] || []
      return files.length > 0
    }).length

    return {
      required: { uploaded: requiredUploaded, total: required.length },
      optional: { uploaded: optionalUploaded, total: optional.length },
    }
  }

  const stats = getProgressStats()

  if (isLoading) {
    return (
      <div
        style={{
          padding: "20px",
          backgroundColor: "#faf8f6",
          borderRadius: "12px",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#8b4513",
            marginBottom: "24px",
          }}
        >
          Student Documents Upload
        </h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Loader2
            style={{
              width: "24px",
              height: "24px",
              color: "#8d6e63",
            }}
            className="animate-spin"
          />
          <p style={{ color: "#6d4c41" }}>Loading your documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#faf8f6",
        borderRadius: "12px",
      }}
    >
      <h2
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          color: "#5d4037",
          marginBottom: "16px",
          textAlign: "center",
        }}
      >
        Student Documents Upload
      </h2>
      {/* Updated Guidelines Section */}
      <div
        style={{
          backgroundColor: "#f5f2f0",
          border: "2px solid #d7ccc8",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "30px",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#5d4037",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🎓 Student Profile Verification
        </h3>
        <p
          style={{
            color: "#6d4c41",
            lineHeight: "1.6",
            marginBottom: "20px",
          }}
        >
          Upload your documents to complete your student profile verification. This helps employers verify your
          credentials and qualifications.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#efebe9",
              padding: "16px",
              borderRadius: "8px",
              borderLeft: "4px solid #4caf50",
            }}
          >
            <h4
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#2e7d32",
                marginBottom: "12px",
              }}
            >
              ✅ Accepted File Formats
            </h4>
            <ul
              style={{
                margin: "0",
                paddingLeft: "20px",
                color: "#5d4037",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              <li style={{ marginBottom: "4px" }}>
                <strong>PDF</strong> (.pdf) – Preferred format for all official documents
              </li>
              <li style={{ marginBottom: "4px" }}>
                <strong>Word Documents</strong> (.doc, .docx) – For editable text documents
              </li>
              <li style={{ marginBottom: "4px" }}>
                <strong>Image Files</strong> (.jpg, .jpeg, .png) – For scanned certificates or documents
              </li>
            </ul>
          </div>
          <div
            style={{
              backgroundColor: "#efebe9",
              padding: "16px",
              borderRadius: "8px",
              borderLeft: "4px solid #ff9800",
            }}
          >
            <h4
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#f57c00",
                marginBottom: "12px",
              }}
            >
              ⚠️ File Size Limit
            </h4>
            <ul
              style={{
                margin: "0",
                paddingLeft: "20px",
                color: "#5d4037",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              <li>
                Maximum upload size: <strong>10 MB per file</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "#8d6e63",
                color: "white",
                height: "40px",
              }}
            >
              <th
                style={{
                  padding: "8px",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: "11px",
                  borderBottom: "2px solid #6d4c41",
                  width: "15%",
                }}
              >
                STATUS
              </th>
              <th
                style={{
                  padding: "8px",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "11px",
                  borderBottom: "2px solid #6d4c41",
                  width: "25%",
                }}
              >
                DOCUMENT NAME
              </th>
              <th
                style={{
                  padding: "8px",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "11px",
                  borderBottom: "2px solid #6d4c41",
                  width: "40%",
                }}
              >
                DESCRIPTION
              </th>
              <th
                style={{
                  padding: "8px",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: "11px",
                  borderBottom: "2px solid #6d4c41",
                  width: "20%",
                }}
              >
                UPLOAD & MANAGE
              </th>
            </tr>
          </thead>
          <tbody>
            {documentsList.map((document, index) => (
              <tr
                key={document.id}
                style={{
                  backgroundColor: index % 2 === 0 ? "#faf8f6" : "#f5f2f0",
                  borderBottom: "1px solid #e8d8cf",
                  transition: "background-color 0.2s",
                  height: "50px",
                }}
                onMouseEnter={(e) => (e.target.closest("tr").style.backgroundColor = "#efebe9")}
                onMouseLeave={(e) =>
                  (e.target.closest("tr").style.backgroundColor = index % 2 === 0 ? "#faf8f6" : "#f5f2f0")
                }
              >
                <td
                  style={{
                    padding: "6px 8px",
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >
                  {getStatusBadge(document.id, document)}
                </td>
                <td
                  style={{
                    padding: "6px 8px",
                    verticalAlign: "middle",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "500",
                      color: "#5d4037",
                      fontSize: "12px",
                      lineHeight: "1.2",
                    }}
                  >
                    {document.label}
                  </div>
                </td>
                <td
                  style={{
                    padding: "6px 8px",
                    verticalAlign: "middle",
                  }}
                >
                  <div
                    style={{
                      color: "#6d4c41",
                      fontSize: "11px",
                      lineHeight: "1.2",
                    }}
                  >
                    {document.description}
                  </div>
                </td>
                <td
                  style={{
                    padding: "6px 8px",
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {/* Upload button */}
                    <label
                      style={{
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
                        border: "none",
                      }}
                    >
                      <Upload style={{ width: "12px", height: "12px" }} />
                      Upload
                      <input
                        type="file"
                        accept={document.accept}
                        multiple={document.multiple}
                        onChange={(e) => handleFileChange(document.id, e.target.files)}
                        style={{ display: "none" }}
                      />
                    </label>
                    {/* Uploaded files list */}
                    {(formData[document.id] || []).length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                          marginTop: "4px",
                        }}
                      >
                        {(formData[document.id] || []).map((file, fileIndex) => (
                          <div
                            key={fileIndex}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "2px 4px",
                              backgroundColor: "#efebe9",
                              borderRadius: "4px",
                              fontSize: "9px",
                              color: "#5d4037",
                            }}
                          >
                            <FileText style={{ width: "10px", height: "10px" }} />
                            <span
                              style={{
                                maxWidth: "80px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                             <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
  {file.name || `File ${fileIndex + 1}`}
</a>

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
                                alignItems: "center",
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
      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "#efebe9",
          borderRadius: "8px",
          borderLeft: "4px solid #8d6e63",
        }}
      >
        <h4
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#5d4037",
            marginBottom: "8px",
          }}
        >
          Upload Summary
        </h4>
        <p
          style={{
            color: "#6d4c41",
            fontSize: "14px",
            lineHeight: "1.5",
            margin: "0",
          }}
        >
          You have uploaded{" "}
          <strong>
            {stats.required.uploaded} out of {stats.required.total}
          </strong>{" "}
          required documents and{" "}
          <strong>
            {stats.optional.uploaded} out of {stats.optional.total}
          </strong>{" "}
          optional documents.
          {stats.required.uploaded === stats.required.total
            ? " ✅ All required documents are complete!"
            : ` Please upload the remaining ${stats.required.total - stats.required.uploaded} required document(s).`}
        </p>
      </div>
    </div>
  )
}