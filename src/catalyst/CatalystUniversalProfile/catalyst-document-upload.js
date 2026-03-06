"use client"
import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Upload, FileText, Loader2 } from "lucide-react"
import { auth, db, storage } from "../../firebaseConfig"
import { doc, getDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"

export const documentsList = [
  {
    id: "standardNda",
    label: "Standard NDA",
    accept: ".pdf,.doc,.docx",
    required: true,
    multiple: false,
    description: "Signed Non-Disclosure Agreement",
  },
  {
    id: "standardContract",
    label: "Standard Contract / Term Sheet",
    accept: ".pdf,.doc,.docx",
    required: true,
    multiple: false,
    description: "Standard contract or term sheet used for program participants",
  },
  {
    id: "programBrochures",
    label: "Program Brochures",
    accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
    required: true,
    multiple: true,
    description: "Program overview brochure or investment mandate document",
  },
]

export default function CatalystDocumentUpload({ data = {}, updateData }) {
  const [formData, setFormData] = useState(data)
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingFiles, setUploadingFiles] = useState({})

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setIsLoading(true)
        const userId = auth.currentUser?.uid
        if (!userId) { setIsLoading(false); return }
        const docRef = doc(db, "catalystProfiles", userId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const profileData = docSnap.data()
          const documentsData = {}
          documentsList.forEach((docItem) => {
            if (profileData.formData?.documentUpload?.[docItem.id]) {
              documentsData[docItem.id] = profileData.formData.documentUpload[docItem.id]
            }
          })
          setFormData(documentsData)
          updateData(documentsData)
        } else {
          setFormData(data)
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

  useEffect(() => {
    if (data && Object.keys(data).length > 0) setFormData(data)
  }, [data])

  const handleFileChange = async (documentId, files) => {
    setUploadingFiles((prev) => ({ ...prev, [documentId]: true }))
    try {
      const userId = auth.currentUser?.uid
      if (!userId) { alert("You must be logged in to upload files."); setUploadingFiles((prev) => ({ ...prev, [documentId]: false })); return }
      const uploadedFileUrls = []
      for (const file of files) {
        const filePath = `catalystProfiles/${userId}/documents/${documentId}/${file.name}`
        const fileRef = ref(storage, filePath)
        await uploadBytes(fileRef, file)
        const url = await getDownloadURL(fileRef)
        uploadedFileUrls.push({ name: file.name, url, path: filePath })
      }
      const updatedData = { ...formData, [documentId]: uploadedFileUrls }
      setFormData(updatedData)
      await updateData(updatedData)
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Failed to upload file.")
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [documentId]: false }))
    }
  }

  const handleDeleteFile = async (documentId, fileIndex) => {
    const currentFiles = formData[documentId] || []
    const fileToDelete = currentFiles[fileIndex]
    if (fileToDelete?.path) {
      try {
        await deleteObject(ref(storage, fileToDelete.path))
        const updatedFiles = currentFiles.filter((_, i) => i !== fileIndex)
        const updatedData = { ...formData, [documentId]: updatedFiles }
        setFormData(updatedData)
        await updateData(updatedData)
      } catch (error) {
        console.error("Error deleting file:", error)
        alert("Failed to delete file.")
      }
    }
  }

  const getStatusBadge = (documentId, document) => {
    const isUploading = uploadingFiles[documentId]
    const files = formData[documentId] || []
    if (isUploading) return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 8px", borderRadius: "16px", fontSize: "11px", fontWeight: "600", backgroundColor: "#e3f2fd", color: "#1976d2" }}>
        <Loader2 style={{ width: "12px", height: "12px" }} className="animate-spin" /> Uploading
      </span>
    )
    if (files.length > 0) return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 8px", borderRadius: "16px", fontSize: "11px", fontWeight: "600", backgroundColor: "#e8f5e8", color: "#2e7d32" }}>
        <CheckCircle style={{ width: "12px", height: "12px" }} /> Uploaded
      </span>
    )
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 8px", borderRadius: "16px", fontSize: "11px", fontWeight: "600", backgroundColor: document.required ? "#ffebee" : "#e3f2fd", color: document.required ? "#c62828" : "#1976d2" }}>
        <XCircle style={{ width: "12px", height: "12px" }} /> {document.required ? "Required" : "Optional"}
      </span>
    )
  }

  const getProgressStats = () => {
    const required = documentsList.filter((d) => d.required)
    const optional = documentsList.filter((d) => !d.required)
    return {
      required: { uploaded: required.filter((d) => (formData[d.id] || []).length > 0).length, total: required.length },
      optional: { uploaded: optional.filter((d) => (formData[d.id] || []).length > 0).length, total: optional.length },
    }
  }

  const stats = getProgressStats()

  if (isLoading) return (
    <div style={{ padding: "20px", backgroundColor: "#faf8f6", borderRadius: "12px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#8b4513", marginBottom: "24px" }}>Document Upload</h2>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Loader2 style={{ width: "24px", height: "24px", color: "#8d6e63" }} className="animate-spin" />
        <p style={{ color: "#6d4c41" }}>Loading your documents...</p>
      </div>
    </div>
  )

  return (
    <div style={{ padding: "20px", backgroundColor: "#faf8f6", borderRadius: "12px" }}>
      <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#5d4037", marginBottom: "16px", textAlign: "center" }}>
        Document Upload
      </h2>

      {/* Guidelines */}
      <div style={{ backgroundColor: "#f5f2f0", border: "2px solid #d7ccc8", borderRadius: "12px", padding: "24px", marginBottom: "30px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#5d4037", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          🏆 Document Verification Score
        </h3>
        <p style={{ color: "#6d4c41", lineHeight: "1.6", marginBottom: "20px" }}>
          Uploading all required documents helps us verify your profile and expedite the matching process.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {[
            { color: "#4caf50", titleColor: "#2e7d32", title: "✅ Accepted File Formats", items: ["PDF (.pdf) – Preferred format for all official documents", "Word Documents (.doc, .docx) – For editable text documents", "Image Files (.jpg, .jpeg, .png) – For scanned certificates or documents"] },
            { color: "#ff9800", titleColor: "#f57c00", title: "⚠️ File Size Limit", items: ["Maximum upload size: 10 MB per file"] },
            { color: "#f44336", titleColor: "#c62828", title: "🚫 Unsupported Formats", items: ["No ZIP/RAR folders, executable files (.exe), or Google Docs/Drive links", "Please download and upload original files directly (no screenshots or photos of screens)"] },
          ].map(({ color, titleColor, title, items }) => (
            <div key={title} style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", borderLeft: `4px solid ${color}` }}>
              <h4 style={{ fontSize: "14px", fontWeight: "600", color: titleColor, marginBottom: "12px" }}>{title}</h4>
              <ul style={{ margin: 0, paddingLeft: "20px", color: "#5d4037", fontSize: "14px", lineHeight: "1.5" }}>
                {items.map((item, i) => <li key={i} style={{ marginBottom: "4px" }} dangerouslySetInnerHTML={{ __html: item }} />)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#8d6e63", color: "white", height: "40px" }}>
              {["STATUS", "DOCUMENT NAME", "DESCRIPTION", "UPLOAD & MANAGE"].map((h, i) => (
                <th key={h} style={{ padding: "8px", textAlign: i === 0 || i === 3 ? "center" : "left", fontWeight: "600", fontSize: "11px", borderBottom: "2px solid #6d4c41", width: ["15%", "25%", "40%", "20%"][i] }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {documentsList.map((document, index) => (
              <tr key={document.id} style={{ backgroundColor: index % 2 === 0 ? "#faf8f6" : "#f5f2f0", borderBottom: "1px solid #e8d8cf", height: "50px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#efebe9"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#faf8f6" : "#f5f2f0"}
              >
                <td style={{ padding: "6px 8px", textAlign: "center", verticalAlign: "middle" }}>{getStatusBadge(document.id, document)}</td>
                <td style={{ padding: "6px 8px", verticalAlign: "middle" }}>
                  <div style={{ fontWeight: "500", color: "#5d4037", fontSize: "12px" }}>{document.label}</div>
                </td>
                <td style={{ padding: "6px 8px", verticalAlign: "middle" }}>
                  <div style={{ color: "#6d4c41", fontSize: "11px" }}>{document.description}</div>
                </td>
                <td style={{ padding: "6px 8px", textAlign: "center", verticalAlign: "middle" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", backgroundColor: "#8d6e63", color: "white", borderRadius: "6px", fontSize: "10px", fontWeight: "500", cursor: "pointer" }}>
                      <Upload style={{ width: "12px", height: "12px" }} />
                      Upload
                      <input type="file" accept={document.accept} multiple={document.multiple} onChange={(e) => handleFileChange(document.id, Array.from(e.target.files || []))} style={{ display: "none" }} />
                    </label>
                    {(formData[document.id] || []).length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
                        {(formData[document.id] || []).map((file, fileIndex) => (
                          <div key={fileIndex} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 4px", backgroundColor: "#efebe9", borderRadius: "4px", fontSize: "9px", color: "#5d4037" }}>
                            <FileText style={{ width: "10px", height: "10px" }} />
                            <span style={{ maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name || `File ${fileIndex + 1}`}</span>
                            <button onClick={() => handleDeleteFile(document.id, fileIndex)} style={{ background: "none", border: "none", color: "#c62828", cursor: "pointer", padding: 0 }}>&times;</button>
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
      <div style={{ marginTop: "30px", padding: "20px", backgroundColor: "#efebe9", borderRadius: "8px", borderLeft: "4px solid #8d6e63" }}>
        <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037", marginBottom: "8px" }}>Upload Summary</h4>
        <p style={{ color: "#6d4c41", fontSize: "14px", lineHeight: "1.5", margin: 0 }}>
          You have uploaded <strong>{stats.required.uploaded} out of {stats.required.total}</strong> required documents.{" "}
          {stats.required.uploaded === stats.required.total
            ? "✅ All required documents are complete!"
            : `Please upload the remaining ${stats.required.total - stats.required.uploaded} required document(s).`}
        </p>
      </div>
    </div>
  )
}