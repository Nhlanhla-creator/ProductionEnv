"use client"

import React, { useEffect, useState } from "react"
import {
  FileText,
  ExternalLink,
  Upload,
  Filter,
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCircle,
  AlertCircle,
  Folder,
  Search,
} from "lucide-react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, db, storage } from "../../firebaseConfig"

const CMF_DOCUMENT_CONFIGS = [
  // Required
  { id: "cipcRegistration", label: "CIPC Registration Document", category: "Required", description: "Certificate of Incorporation or equivalent" },
  { id: "taxCompliancePin", label: "Tax Compliance PIN", category: "Required", description: "SARS Tax Compliance Certificate or PIN" },
  { id: "companyProfile", label: "Company Profile (PDF)", category: "Required", description: "Formal company overview document" },
  { id: "logo", label: "Company Logo", category: "Required", description: "High-resolution logo file (PNG, SVG or vector)" },
  { id: "proofOfAddress", label: "Proof of Address", category: "Required", description: "Not older than 3 months" },
  // Compliance
  { id: "vatCertificate", label: "VAT Certificate", category: "Compliance", description: "If VAT registered" },
  { id: "bbbeeCertificate", label: "B-BBEE Certificate", category: "Compliance", description: "Current B-BBEE verification certificate" },
  { id: "fspLicence", label: "FSP Licence / Partner Details", category: "Compliance", description: "Financial Services Provider licence or agreement" },
  { id: "professionalIndemnityInsurance", label: "Professional Indemnity Insurance", category: "Compliance", description: "Current PI insurance schedule" },
  { id: "isoCertifications", label: "ISO Certifications", category: "Compliance", description: "Relevant ISO certification documents" },
  { id: "industryAccreditations", label: "Industry Accreditations", category: "Compliance", description: "SAVCA / GIIN or professional accreditations" },
  // Marketing & Capability
  { id: "capabilityStatement", label: "Capability Statement", category: "Marketing", description: "Track record and capability overview" },
  { id: "caseStudies", label: "Case Studies", category: "Marketing", description: "Examples of past transactions or engagements" },
  { id: "clientReferences", label: "Client References", category: "Marketing", description: "Reference letters or client contacts" },
  { id: "brochure", label: "Brochure", category: "Marketing", description: "Marketing or product brochure" },
  { id: "serviceCatalogue", label: "Service Catalogue", category: "Marketing", description: "Listing of de-risking & facilitation services" },
]

export default function CMFDocuments() {
  const [profileData, setProfileData] = useState({})
  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [showFullGuidelines, setShowFullGuidelines] = useState(false)
  const [showStatusFilter, setShowStatusFilter] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = `${user.uid}_cmf`
        setEffectiveUserId(uid)
        try {
          const docRef = doc(db, "cmfProfiles", uid)
          const unsubscribeSnap = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              setProfileData(docSnap.data())
            } else {
              setProfileData({})
            }
            setLoading(false)
          })
          return () => unsubscribeSnap()
        } catch (err) {
          console.error("Error loading CMF profile documents:", err)
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [])

  const getDocFiles = (docId) => {
    const docsObj = profileData?.documents || profileData?.formData?.documents || {}
    const raw = docsObj[docId]
    if (!raw) return []
    if (Array.isArray(raw)) {
      return raw
        .map((item, idx) => {
          if (typeof item === "string") {
            return {
              id: `${docId}-${idx}`,
              name: item.split("/").pop(),
              url: item.startsWith("http") || item.startsWith("blob") ? item : null,
              uploadedAt: profileData?.lastEditedAt || null,
              isSeedString: !item.startsWith("http"),
            }
          } else if (typeof item === "object" && item !== null) {
            return {
              id: item.id || `${docId}-${idx}`,
              name: item.name || item.filename || `Document ${idx + 1}`,
              url: item.url || item.downloadURL || null,
              uploadedAt: item.uploadedAt || profileData?.lastEditedAt || null,
              isSeedString: false,
            }
          }
          return null
        })
        .filter(Boolean)
    }
    if (typeof raw === "string") {
      return [
        {
          id: `${docId}-0`,
          name: raw.split("/").pop(),
          url: raw.startsWith("http") || raw.startsWith("blob") ? raw : null,
          uploadedAt: profileData?.lastEditedAt || null,
          isSeedString: !raw.startsWith("http"),
        },
      ]
    }
    return []
  }

  const handleFileUpload = async (docId, file) => {
    const user = auth.currentUser
    if (!user || !file) return

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert("File size exceeds 10MB limit. Please select a smaller file.")
      return
    }

    setIsUploading(true)
    try {
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const targetDocId = effectiveUserId || `${user.uid}_cmf`
      const storagePath = `cmfProfiles/${user.uid}/documents/${docId}/${timestamp}_${safeName}`
      const fileRef = ref(storage, storagePath)
      
      await uploadBytes(fileRef, file)
      const downloadURL = await getDownloadURL(fileRef)

      const newFileObj = {
        id: `${docId}-${timestamp}`,
        name: file.name,
        url: downloadURL,
        storagePath,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
        fileType: file.type,
      }

      const docRef = doc(db, "cmfProfiles", targetDocId)
      const existingSnap = await getDoc(docRef)
      const currentData = existingSnap.exists() ? existingSnap.data() : {}
      const existingDocs = currentData.documents || {}
      const existingList = Array.isArray(existingDocs[docId]) ? existingDocs[docId] : []

      const updatedList = [...existingList, newFileObj]
      await setDoc(
        docRef,
        {
          documents: {
            ...existingDocs,
            [docId]: updatedList,
          },
          lastEditedAt: new Date().toISOString(),
          lastEditedBy: user.uid,
        },
        { merge: true }
      )
    } catch (err) {
      console.error("Upload error:", err)
      alert("Failed to upload document: " + err.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteDocument = async (docId, fileIndex) => {
    const user = auth.currentUser
    if (!user) return

    const confirmDelete = window.confirm("Are you sure you want to remove this document?")
    if (!confirmDelete) return

    try {
      const targetDocId = effectiveUserId || `${user.uid}_cmf`
      const docRef = doc(db, "cmfProfiles", targetDocId)
      const existingSnap = await getDoc(docRef)
      if (existingSnap.exists()) {
        const currentData = existingSnap.data()
        const existingDocs = currentData.documents || {}
        const existingList = Array.isArray(existingDocs[docId]) ? existingDocs[docId] : []
        const updatedList = existingList.filter((_, idx) => idx !== fileIndex)

        await setDoc(
          docRef,
          {
            documents: {
              ...existingDocs,
              [docId]: updatedList,
            },
            lastEditedAt: new Date().toISOString(),
          },
          { merge: true }
        )
      }
    } catch (err) {
      console.error("Delete error:", err)
      alert("Failed to delete document: " + err.message)
    }
  }

  const filteredConfigs = CMF_DOCUMENT_CONFIGS.filter((cfg) => {
    const matchesCategory =
      categoryFilter === "all" || cfg.category.toLowerCase() === categoryFilter.toLowerCase()
    const matchesSearch =
      cfg.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cfg.description.toLowerCase().includes(searchTerm.toLowerCase())

    const files = getDocFiles(cfg.id)
    const hasFiles = files.length > 0

    let matchesStatus = true
    if (statusFilter === "uploaded") matchesStatus = hasFiles
    if (statusFilter === "pending") matchesStatus = !hasFiles

    return matchesCategory && matchesSearch && matchesStatus
  })

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .cmf-docs-container { padding: 16px !important; }
          .cmf-docs-header-grid { flex-direction: column !important; align-items: flex-start !important; }
          .cmf-docs-controls { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
          .cmf-search-box { width: 100% !important; }
        }
      `}</style>

      <div
        className="cmf-docs-container"
        style={{
          minHeight: "100vh",
          padding: "24px",
          width: "100%",
          boxSizing: "border-box",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
          {/* Header Banner */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(250, 247, 242, 0.95), rgba(245, 240, 225, 0.95))",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              padding: "32px",
              marginBottom: "32px",
              boxShadow: "0 20px 40px rgba(74, 53, 47, 0.1)",
              border: "1px solid rgba(200, 182, 166, 0.3)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-50%",
                right: "-20%",
                width: "400px",
                height: "400px",
                background: "radial-gradient(circle, rgba(166, 124, 82, 0.12) 0%, transparent 70%)",
                borderRadius: "50%",
              }}
            />
            <div
              className="cmf-docs-header-grid"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div>
                <div style={{ fontSize: "13px", color: "#a67c52", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>
                  Capital & Market Facilitator
                </div>
                <h1
                  style={{
                    background: "linear-gradient(135deg, #4a352f, #7d5a50)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontSize: "clamp(24px, 4vw, 36px)",
                    fontWeight: "800",
                    margin: "0 0 8px 0",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Document Management & Library
                </h1>
                <p style={{ color: "#7d5a50", fontSize: "16px", margin: 0, fontWeight: "500" }}>
                  Manage compliance, institutional credentials, and capability documents for your firm.
                </p>
              </div>
            </div>

            {/* Document Guidelines Banner */}
            <div
              style={{
                marginTop: "24px",
                padding: "20px 24px",
                backgroundColor: "#f5f2f0",
                borderRadius: "16px",
                border: "1px solid #d7ccc8",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#4a352f", display: "flex", alignItems: "center", gap: "8px" }}>
                  📋 Document Submission Guidelines
                </h3>
                <button
                  onClick={() => setShowFullGuidelines(!showFullGuidelines)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    backgroundColor: "transparent",
                    color: "#8d6e63",
                    border: "1px solid #8d6e63",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {showFullGuidelines ? "See Less" : "See Guidelines"}
                  {showFullGuidelines ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              <p style={{ margin: "8px 0 0", color: "#6d4c41", fontSize: "14px", lineHeight: "1.5" }}>
                Ensure your documents are up-to-date. Max file size: 10 MB per file. Supported formats: PDF, Word (.doc, .docx), and Image files (.jpg, .png).
              </p>

              {showFullGuidelines && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "16px",
                    marginTop: "20px",
                    animation: "fadeIn 0.3s ease",
                  }}
                >
                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #4caf50" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#2e7d32", margin: "0 0 8px 0" }}>✅ Accepted Formats</h4>
                    <ul style={{ margin: 0, paddingLeft: "20px", color: "#5d4037", fontSize: "13px", lineHeight: "1.5" }}>
                      <li>PDF (.pdf) – Recommended</li>
                      <li>Word (.doc, .docx)</li>
                      <li>Images (.png, .jpg, .jpeg)</li>
                    </ul>
                  </div>
                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #ff9800" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#f57c00", margin: "0 0 8px 0" }}>⚠️ Size & Verification</h4>
                    <ul style={{ margin: 0, paddingLeft: "20px", color: "#5d4037", fontSize: "13px", lineHeight: "1.5" }}>
                      <li>Max size: 10MB per document</li>
                      <li>Ensure text and PIN numbers are legible</li>
                    </ul>
                  </div>
                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #2196f3" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#1565c0", margin: "0 0 8px 0" }}>📄 Document Scope</h4>
                    <ul style={{ margin: 0, paddingLeft: "20px", color: "#5d4037", fontSize: "13px", lineHeight: "1.5" }}>
                      <li>CIPC, Tax PIN & Proof of Address required</li>
                      <li>B-BBEE & FSP licenses for verification</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls Bar */}
          <div
            className="cmf-docs-controls"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "28px",
              padding: "20px 24px",
              backgroundColor: "#f5f2f0",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(74, 53, 47, 0.05)",
              border: "1px solid #d7ccc8",
              boxSizing: "border-box",
            }}
          >
            {/* Category Filter Buttons */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                { id: "all", label: "All Documents" },
                { id: "required", label: "Required" },
                { id: "compliance", label: "Compliance" },
                { id: "marketing", label: "Marketing" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  style={{
                    padding: "8px 16px",
                    border: categoryFilter === cat.id ? "2px solid #8d6e63" : "2px solid #d7ccc8",
                    backgroundColor: categoryFilter === cat.id ? "#8d6e63" : "#faf8f6",
                    color: categoryFilter === cat.id ? "white" : "#6d4c41",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div style={{ position: "relative" }}>
              <input
                className="cmf-search-box"
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "10px 16px 10px 36px",
                  border: "2px solid #d7ccc8",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  backgroundColor: "#faf8f6",
                  color: "#5d4037",
                  width: "260px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#8d6e63"
                  e.target.style.boxShadow = "0 0 0 3px rgba(141, 110, 99, 0.15)"
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d7ccc8"
                  e.target.style.boxShadow = "none"
                }}
              />
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#8d6e63" }} />
            </div>
          </div>

          {/* Table Container */}
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
                fontWeight: "600",
              }}
            >
              Loading document library...
            </div>
          ) : filteredConfigs.length === 0 ? (
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
              No documents found matching your filter criteria.
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                boxShadow: "0 8px 24px rgba(74, 53, 47, 0.08)",
                border: "1px solid #d7ccc8",
                overflow: "hidden",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#8d6e63", color: "white" }}>
                      <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Document Name & Description
                      </th>
                      <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Category
                      </th>
                      <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Uploaded File
                      </th>
                      <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Last Updated
                      </th>
                      <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Status
                      </th>
                      <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConfigs.map((cfg, idx) => {
                      const files = getDocFiles(cfg.id)
                      const hasFiles = files.length > 0
                      const rowBg = idx % 2 === 0 ? "#ffffff" : "#fbf9f8"

                      return (
                        <tr key={cfg.id} style={{ backgroundColor: rowBg, borderBottom: "1px solid #e8d8cf", transition: "background-color 0.2s" }}>
                          {/* Document Name & Description */}
                          <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                            <div style={{ fontWeight: "700", color: "#4a352f", fontSize: "14px" }}>
                              {cfg.label}
                            </div>
                            <div style={{ color: "#7d5a50", fontSize: "12px", marginTop: "2px" }}>
                              {cfg.description}
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td style={{ padding: "16px 20px", textAlign: "center", verticalAlign: "middle" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: "700",
                                textTransform: "uppercase",
                                backgroundColor:
                                  cfg.category === "Required"
                                    ? "#fee2e2"
                                    : cfg.category === "Compliance"
                                    ? "#fef3c7"
                                    : "#d1fae5",
                                color:
                                  cfg.category === "Required"
                                    ? "#dc2626"
                                    : cfg.category === "Compliance"
                                    ? "#d97706"
                                    : "#059669",
                              }}
                            >
                              {cfg.category}
                            </span>
                          </td>

                          {/* Uploaded File Link */}
                          <td style={{ padding: "16px 20px", textAlign: "center", verticalAlign: "middle" }}>
                            {hasFiles ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                                {files.map((f, fileIdx) => (
                                  <div key={fileIdx} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <FileText size={14} color="#8d6e63" />
                                    {f.url ? (
                                      <a
                                        href={f.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: "#4a352f", fontWeight: "600", fontSize: "13px", textDecoration: "underline" }}
                                      >
                                        {f.name}
                                      </a>
                                    ) : (
                                      <span style={{ color: "#4a352f", fontWeight: "600", fontSize: "13px" }}>
                                        {f.name}
                                      </span>
                                    )}
                                    {f.url && <ExternalLink size={12} color="#8d6e63" />}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: "#9ca3af", fontSize: "13px", fontStyle: "italic" }}>
                                No document uploaded
                              </span>
                            )}
                          </td>

                          {/* Last Updated */}
                          <td style={{ padding: "16px 20px", textAlign: "center", verticalAlign: "middle", fontSize: "12px", color: "#6b7280" }}>
                            {hasFiles && files[0]?.uploadedAt
                              ? new Date(files[0].uploadedAt).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
                              : "—"}
                          </td>

                          {/* Status */}
                          <td style={{ padding: "16px 20px", textAlign: "center", verticalAlign: "middle" }}>
                            {hasFiles ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "12px", backgroundColor: "#dcfce7", color: "#166534", fontSize: "12px", fontWeight: "700" }}>
                                <CheckCircle size={14} /> Uploaded
                              </span>
                            ) : (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "12px", backgroundColor: "#fef2f2", color: "#991b1b", fontSize: "12px", fontWeight: "700" }}>
                                <AlertCircle size={14} /> Pending
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: "16px 20px", textAlign: "center", verticalAlign: "middle" }}>
                            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                              <label
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "6px 12px",
                                  backgroundColor: "#a67c52",
                                  color: "white",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  cursor: isUploading ? "wait" : "pointer",
                                  transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#8d6e63")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#a67c52")}
                              >
                                <Upload size={14} />
                                {hasFiles ? "Update" : "Upload"}
                                <input
                                  type="file"
                                  style={{ display: "none" }}
                                  disabled={isUploading}
                                  onChange={(e) => {
                                    const selected = e.target.files[0]
                                    if (selected) handleFileUpload(cfg.id, selected)
                                  }}
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                              </label>
                              {hasFiles && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDocument(cfg.id, 0)}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "6px 12px",
                                    backgroundColor: "#dc2626",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#b91c1c")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#dc2626")}
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
