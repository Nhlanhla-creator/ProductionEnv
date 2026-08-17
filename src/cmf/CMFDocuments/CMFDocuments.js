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
  Eye,
  X,
  Loader2,
  Plus,
  Minus,
} from "lucide-react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, setDoc, getDoc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, db, storage } from "../../firebaseConfig"
import { getFunctions, httpsCallable } from "firebase/functions"

// Multi-upload documents
const MULTI_UPLOAD_DOCUMENTS = [
  "Industry Accreditations",
  "ISO Certifications",
  "Client References"
]

const CMF_DOCUMENT_CONFIGS = [
  // Required - SINGLE documents
  { id: "cipcRegistration", label: "CIPC Registration Document", category: "Required", description: "Certificate of Incorporation or equivalent", multiple: false },
  { id: "taxCompliancePin", label: "Tax Compliance PIN", category: "Required", description: "SARS Tax Compliance Certificate or PIN", multiple: false },
  { id: "companyProfile", label: "Company Profile (PDF)", category: "Required", description: "Formal company overview document", multiple: false },
  { id: "logo", label: "Company Logo", category: "Required", description: "High-resolution logo file (PNG, SVG or vector)", multiple: false },
  { id: "proofOfAddress", label: "Proof of Address", category: "Required", description: "Not older than 3 months", multiple: false },
  // Compliance - MIX of single and multi
  { id: "vatCertificate", label: "VAT Certificate", category: "Compliance", description: "If VAT registered", multiple: false },
  { id: "bbbeeCertificate", label: "B-BBEE Certificate", category: "Compliance", description: "Current B-BBEE verification certificate", multiple: false },
  { id: "fspLicence", label: "FSP Licence / Partner Details", category: "Compliance", description: "Financial Services Provider licence or agreement", multiple: false },
  { id: "professionalIndemnityInsurance", label: "Professional Indemnity Insurance", category: "Compliance", description: "Current PI insurance schedule", multiple: false },
  { id: "isoCertifications", label: "ISO Certifications", category: "Compliance", description: "Relevant ISO certification documents", multiple: true },
  { id: "industryAccreditations", label: "Industry Accreditations", category: "Compliance", description: "SAVCA / GIIN or professional accreditations", multiple: true },
  // Marketing & Capability - MIX of single and multi
  { id: "capabilityStatement", label: "Capability Statement", category: "Marketing", description: "Track record and capability overview", multiple: false },
  { id: "caseStudies", label: "Case Studies", category: "Marketing", description: "Examples of past transactions or engagements", multiple: false },
  { id: "clientReferences", label: "Client References", category: "Marketing", description: "Reference letters or client contacts", multiple: true },
  { id: "brochure", label: "Brochure", category: "Marketing", description: "Marketing or product brochure", multiple: false },
  { id: "serviceCatalogue", label: "Service Catalogue", category: "Marketing", description: "Listing of de-risking & facilitation services", multiple: false },
]

export default function CMFDocuments({onClose}) {
  const [profileData, setProfileData] = useState({})
  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [showFullGuidelines, setShowFullGuidelines] = useState(false)
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [validationResults, setValidationResults] = useState({})
  const [registeredName, setRegisteredName] = useState("")
  const [isOverlayVisible, setIsOverlayVisible] = useState(false)
  const [overlayMessage, setOverlayMessage] = useState("Uploading & Validating Document...")
  const [expandedDocs, setExpandedDocs] = useState({})
  const [editingDoc, setEditingDoc] = useState({ docId: null, docIndex: null })
  const [editNameValue, setEditNameValue] = useState("")
  const functions = getFunctions()
  const params = new URLSearchParams(window.location.search);
 const returnToSection = params.get('returnTo') || 'fundDetails';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = `${user.uid}_cmf`
        setEffectiveUserId(uid)
        try {
          const docRef = doc(db, "cmfProfiles", uid)
          const unsubscribeSnap = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data()
              setProfileData(data)
              const name = data?.formData?.business?.registeredName || 
                          data?.registeredName || 
                          data?.companyName ||
                          "Unknown"
              setRegisteredName(name)
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

  // Click outside handler for status filter dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatusFilter && !event.target.closest('th')) {
        setShowStatusFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatusFilter]);

  const isMultiUpload = (docId) => {
    const config = CMF_DOCUMENT_CONFIGS.find(c => c.id === docId)
    return config?.multiple || false
  }

  const toggleExpanded = (docId) => {
    setExpandedDocs(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }))
  }

  const validateDocumentWithAI = async (docLabel, file, registeredName) => {
    try {
      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result.split(',')[1])
      })

      const validateCMFDocument = httpsCallable(functions, 'validateCMFDocument')

      const result = await validateCMFDocument({
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
              validationStatus: "pending",
              message: "Document uploaded - pending verification"
            }
          } else if (typeof item === "object" && item !== null) {
            return {
              id: item.id || `${docId}-${idx}`,
              name: item.name || item.filename || `Document ${idx + 1}`,
              url: item.url || item.downloadURL || null,
              uploadedAt: item.uploadedAt || profileData?.lastEditedAt || null,
              validationStatus: item.validationStatus || "pending",
              message: item.message || "Document uploaded - pending verification",
              isValid: item.isValid !== false,
              isSeedString: false,
              customName: item.customName || null
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
          validationStatus: "pending",
          message: "Document uploaded - pending verification",
          isSeedString: !raw.startsWith("http"),
        },
      ]
    }
    return []
  }

  const getDocumentStatus = (docId) => {
    const files = getDocFiles(docId)
    const uploadedFiles = files.filter(f => f.url && f.url !== "")
    
    if (uploadedFiles.length === 0) return "pending"
    
    const hasRejected = uploadedFiles.some(f => 
      f.validationStatus === "rejected" || 
      f.validationStatus === "wrong_type" || 
      f.validationStatus === "name_mismatch" || 
      f.validationStatus === "incomplete" ||
      f.validationStatus === "expired"
    )
    if (hasRejected) return "rejected"
    
    const allVerified = uploadedFiles.every(f => 
      f.validationStatus === "verified" || f.validationStatus === "verified:not_audited"
    )
    if (allVerified) return "verified"
    
    return "pending"
  }

  const getStatusBadge = (docId, individualDoc = null) => {
    if (individualDoc) {
      let status = "pending"
      let displayStatus = "Pending"
      let statusColor = "#ef6c00"
      let bgColor = "#fff3e0"
      let icon = <AlertCircle size={14} />
      
      if (!individualDoc.url || individualDoc.url === "") {
        status = "pending"
        displayStatus = "Pending"
      } else if (
        individualDoc.validationStatus === "rejected" || 
        individualDoc.validationStatus === "wrong_type" || 
        individualDoc.validationStatus === "name_mismatch" || 
        individualDoc.validationStatus === "incomplete" ||
        individualDoc.validationStatus === "expired"
      ) {
        status = "rejected"
        displayStatus = "Rejected"
        statusColor = "#c62828"
        bgColor = "#ffebee"
        icon = <X size={14} />
      } else if (individualDoc.validationStatus === "verified" || individualDoc.validationStatus === "verified:not_audited") {
        status = "verified"
        displayStatus = "Verified"
        statusColor = "#2e7d32"
        bgColor = "#e8f5e8"
        icon = <CheckCircle size={14} />
      }
      
      return (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: "600",
          backgroundColor: bgColor,
          color: statusColor
        }}>
          {icon}
          {displayStatus}
        </span>
      )
    }
    
    const status = getDocumentStatus(docId)
    
    let displayStatus = "Pending"
    let statusColor = "#ef6c00"
    let bgColor = "#fff3e0"
    let icon = <AlertCircle size={14} />
    
    if (status === "verified") {
      displayStatus = "Verified"
      statusColor = "#2e7d32"
      bgColor = "#e8f5e8"
      icon = <CheckCircle size={14} />
    } else if (status === "rejected") {
      displayStatus = "Rejected"
      statusColor = "#c62828"
      bgColor = "#ffebee"
      icon = <X size={14} />
    }
    
    return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: "600",
        backgroundColor: bgColor,
        color: statusColor
      }}>
        {icon}
        {displayStatus}
      </span>
    )
  }

  const hasDocumentMatchingStatusFilter = (docId) => {
    const status = getDocumentStatus(docId)
    if (statusFilter === "all") return true
    if (statusFilter === "pending") return status === "pending"
    if (statusFilter === "verified") return status === "verified"
    if (statusFilter === "rejected") return status === "rejected"
    return true
  }

  const handleFileUpload = async (docId, file, docIndex = 0) => {
    const user = auth.currentUser
    if (!user || !file) return

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert("File size exceeds 10MB limit. Please select a smaller file.")
      return
    }

    setIsUploading(true)
    setIsOverlayVisible(true)
    setOverlayMessage("Uploading & Validating Document...")

    try {
       const targetDocId = effectiveUserId || `${user.uid}_cmf`  // For Firestore
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    // Use user.uid for Storage path (matches auth UID)
    const storagePath = `cmfProfiles/${user.uid}/documents/${docId}/${timestamp}_${safeName}`
    const fileRef = ref(storage, storagePath)
      
      await uploadBytes(fileRef, file)
      const downloadURL = await getDownloadURL(fileRef)

      const config = CMF_DOCUMENT_CONFIGS.find(c => c.id === docId)
      const docLabel = config?.label || docId
      const isMulti = config?.multiple || false

      // Validate with AI
      const validationResult = await validateDocumentWithAI(docLabel, file, registeredName)

      setValidationResults(prev => ({
        ...prev,
        [docId]: validationResult
      }))

      const newFileObj = {
        id: `${docId}-${timestamp}`,
        name: file.name,
        url: downloadURL,
        storagePath,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
        fileType: file.type,
        validationStatus: validationResult.status,
        message: validationResult.message,
        isValid: validationResult.isValid !== false,
        customName: null
      }

      const docRef = doc(db, "cmfProfiles", targetDocId)
      const existingSnap = await getDoc(docRef)
      const currentData = existingSnap.exists() ? existingSnap.data() : {}
      const existingDocs = currentData.documents || {}
      const existingList = Array.isArray(existingDocs[docId]) ? existingDocs[docId] : []

      let updatedList
      if (isMulti) {
        // Multi-document - replace at specific index or append
        if (docIndex < existingList.length) {
          updatedList = existingList.map((item, idx) => idx === docIndex ? newFileObj : item)
        } else {
          updatedList = [...existingList, newFileObj]
        }
      } else {
        // Single document - replace entirely
        updatedList = [newFileObj]
      }

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

      const refreshedSnap = await getDoc(docRef)
      if (refreshedSnap.exists()) {
        setProfileData(refreshedSnap.data())
      }

      setIsOverlayVisible(false)
      setIsUploading(false)

    } catch (err) {
      console.error("Upload error:", err)
      
      if (err.message?.includes("validation") || err.message?.includes("AI")) {
        const targetDocId = effectiveUserId || `${user.uid}_cmf`
        const timestamp = Date.now()
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
        const storagePath = `cmfProfiles/${user.uid}/documents/${docId}/${timestamp}_${safeName}`
        const fileRef = ref(storage, storagePath)
        
        const downloadURL = await getDownloadURL(fileRef)
        
        const config = CMF_DOCUMENT_CONFIGS.find(c => c.id === docId)
        const isMulti = config?.multiple || false
        
        const newFileObj = {
          id: `${docId}-${timestamp}`,
          name: file.name,
          url: downloadURL,
          storagePath,
          uploadedAt: new Date().toISOString(),
          fileSize: file.size,
          fileType: file.type,
          validationStatus: "rejected",
          message: err.message || "Document rejected",
          isValid: false,
          customName: null
        }

        const docRef = doc(db, "cmfProfiles", targetDocId)
        const existingSnap = await getDoc(docRef)
        const currentData = existingSnap.exists() ? existingSnap.data() : {}
        const existingDocs = currentData.documents || {}
        const existingList = Array.isArray(existingDocs[docId]) ? existingDocs[docId] : []

        let updatedList
        if (isMulti) {
          if (docIndex < existingList.length) {
            updatedList = existingList.map((item, idx) => idx === docIndex ? newFileObj : item)
          } else {
            updatedList = [...existingList, newFileObj]
          }
        } else {
          updatedList = [newFileObj]
        }

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
        
        const refreshedSnap = await getDoc(docRef)
        if (refreshedSnap.exists()) {
          setProfileData(refreshedSnap.data())
        }
        
        alert("Document uploaded but failed validation: " + err.message)
      } else {
        alert("Failed to upload document: " + err.message)
      }
      
      setIsOverlayVisible(false)
      setIsUploading(false)
    }
  }

  const handleAddNewDocument = async (docId) => {
    const user = auth.currentUser
    if (!user) return

    try {
      const targetDocId = effectiveUserId || `${user.uid}_cmf`
      const docRef = doc(db, "cmfProfiles", targetDocId)
      const existingSnap = await getDoc(docRef)
      const currentData = existingSnap.exists() ? existingSnap.data() : {}
      const existingDocs = currentData.documents || {}
      const existingList = Array.isArray(existingDocs[docId]) ? existingDocs[docId] : []

      const newFileObj = {
        id: `${docId}-${Date.now()}`,
        name: "",
        url: "",
        storagePath: "",
        uploadedAt: new Date().toISOString(),
        validationStatus: "pending",
        message: "No document uploaded",
        isValid: false,
        customName: null,
        isPlaceholder: true
      }

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

      const refreshedSnap = await getDoc(docRef)
      if (refreshedSnap.exists()) {
        setProfileData(refreshedSnap.data())
      }

    } catch (error) {
      console.error("Error adding new document:", error)
      alert("Failed to add new document slot.")
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
        
        const refreshedSnap = await getDoc(docRef)
        if (refreshedSnap.exists()) {
          setProfileData(refreshedSnap.data())
        }
      }
    } catch (err) {
      console.error("Delete error:", err)
      alert("Failed to delete document: " + err.message)
    }
  }

  const handleUpdateDocName = async (docId, docIndex, newName) => {
    const user = auth.currentUser
    if (!user) return

    try {
      const targetDocId = effectiveUserId || `${user.uid}_cmf`
      const docRef = doc(db, "cmfProfiles", targetDocId)
      const existingSnap = await getDoc(docRef)
      if (existingSnap.exists()) {
        const currentData = existingSnap.data()
        const existingDocs = currentData.documents || {}
        const existingList = Array.isArray(existingDocs[docId]) ? existingDocs[docId] : []
        const updatedList = existingList.map((item, idx) => 
          idx === docIndex ? { ...item, customName: newName } : item
        )

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
        
        const refreshedSnap = await getDoc(docRef)
        if (refreshedSnap.exists()) {
          setProfileData(refreshedSnap.data())
        }
      }
      setEditingDoc({ docId: null, docIndex: null })
      setEditNameValue("")
    } catch (err) {
      console.error("Error updating document name:", err)
      alert("Failed to update document name")
    }
  }

  const renderDocumentLink = (docId) => {
    const files = getDocFiles(docId)
    const isMulti = isMultiUpload(docId)
    
    if (isMulti) {
      const uploadedCount = files.filter(f => f.url && f.url !== "").length
      const isExpanded = expandedDocs[docId] || false
      const config = CMF_DOCUMENT_CONFIGS.find(c => c.id === docId)
      const docName = config?.label || docId

      return (
        <div style={{ textAlign: "center" }}>
          <span style={{ color: "#5d4037", fontSize: "12px", fontWeight: "500" }}>
            {uploadedCount} {docName}{uploadedCount !== 1 ? 's' : ''} uploaded
          </span>
          <div style={{ marginTop: "4px" }}>
            <button
              onClick={() => toggleExpanded(docId)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                backgroundColor: "transparent",
                color: "#8d6e63",
                border: "1px solid #8d6e63",
                borderRadius: "4px",
                fontSize: "10px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#8d6e63";
                e.target.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#8d6e63";
              }}
            >
              {isExpanded ? <Minus size={10} /> : <Plus size={10} />}
              {isExpanded ? "Hide" : "Show"} {docName}s
            </button>
          </div>
        </div>
      )
    }

    // Single document
    const file = files.length > 0 ? files[0] : null
    if (!file || !file.url) {
      return (
        <span style={{ color: "#9ca3af", fontSize: "13px", fontStyle: "italic" }}>
          No document uploaded
        </span>
      )
    }

    return (
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "#4a352f",
          fontWeight: "600",
          fontSize: "13px",
          textDecoration: "underline"
        }}
      >
        <FileText size={14} color="#8d6e63" />
        {file.name}
        <ExternalLink size={12} color="#8d6e63" />
      </a>
    )
  }

  const renderExpandedRows = (docId) => {
    if (!expandedDocs[docId]) return null
    
    const files = getDocFiles(docId)
    let filteredDocs = files

    if (filteredDocs.length === 0) {
      filteredDocs = [{
        id: `${docId}-placeholder`,
        name: "",
        url: "",
        uploadedAt: new Date().toISOString(),
        validationStatus: "pending",
        message: "No document uploaded",
        isValid: false,
        customName: null,
        isPlaceholder: true
      }]
    }

    return (
      <>
        <tr style={{ backgroundColor: "#f5f2f0", borderBottom: "1px solid #e8d8cf" }}>
          <td colSpan="7" style={{ padding: "12px 20px", textAlign: "center", color: "#8d6e63", fontSize: "12px", fontWeight: "500" }}>
            Documents
          </td>
        </tr>
        {filteredDocs.map((doc, docIndex) => {
          let displayName = doc.customName || `${docId} ${docIndex + 1}`
          
          return (
            <tr 
              key={`${docId}-${docIndex}`}
              style={{
                backgroundColor: docIndex % 2 === 0 ? "#f9f5f3" : "#f5f2f0",
                borderBottom: "1px solid #e8d8cf"
              }}
            >
              <td style={{
                padding: "12px 20px 12px 40px",
                fontSize: "13px",
                color: "#6d4c41",
                fontWeight: "500",
                verticalAlign: "middle",
                borderLeft: "3px solid #8d6e63"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ 
                    display: "inline-flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    width: "20px",
                    height: "20px",
                    backgroundColor: "#8d6e63",
                    color: "white",
                    borderRadius: "50%",
                    fontSize: "10px",
                    fontWeight: "600"
                  }}>
                    {docIndex + 1}
                  </span>
                  
                  {editingDoc.docId === docId && editingDoc.docIndex === docIndex ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="text"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        style={{
                          padding: "4px 8px",
                          border: "1px solid #8d6e63",
                          borderRadius: "4px",
                          fontSize: "13px",
                          width: "200px",
                          outline: "none"
                        }}
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleUpdateDocName(docId, docIndex, editNameValue)
                          }
                        }}
                      />
                      <button
                        onClick={() => handleUpdateDocName(docId, docIndex, editNameValue)}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#8d6e63",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "11px",
                          cursor: "pointer"
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingDoc({ docId: null, docIndex: null })
                          setEditNameValue("")
                        }}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#ccc",
                          color: "#666",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "11px",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>{displayName}</span>
                      <button
                        onClick={() => {
                          setEditingDoc({ docId, docIndex })
                          setEditNameValue(displayName)
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#8d6e63",
                          fontSize: "10px",
                          padding: "2px 4px",
                          borderRadius: "3px"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#efebe9"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      >
                        ✎
                      </button>
                    </div>
                  )}
                </div>
              </td>
              <td style={{ padding: "12px 20px", textAlign: "center", verticalAlign: "middle" }}>
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#4a352f",
                      fontWeight: "600",
                      fontSize: "12px",
                      textDecoration: "underline"
                    }}
                  >
                    <FileText size={14} color="#8d6e63" />
                    {doc.name || "Document"}
                    <ExternalLink size={12} color="#8d6e63" />
                  </a>
                ) : (
                  <span style={{ color: "#9ca3af", fontSize: "12px", fontStyle: "italic" }}>
                    No document uploaded
                  </span>
                )}
              </td>
              <td style={{ padding: "12px 20px", textAlign: "center", verticalAlign: "middle", fontSize: "12px", color: "#6b7280" }}>
                {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" }) : "-"}
              </td>
              <td style={{ padding: "12px 20px", textAlign: "center", verticalAlign: "middle", fontSize: "12px", color: "#6b7280" }}>
                {doc.message || (doc.url ? "Document uploaded" : "No document uploaded")}
              </td>
              <td style={{ padding: "12px 20px", textAlign: "center", verticalAlign: "middle" }}>
                {getStatusBadge(docId, doc)}
              </td>
              <td style={{ padding: "12px 20px", textAlign: "center", verticalAlign: "middle" }}>
                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                  <label style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    backgroundColor: "#a67c52",
                    color: "white",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: isUploading ? "wait" : "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#8d6e63";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#a67c52";
                  }}
                  >
                    <Upload size={14} />
                    {doc.url ? "Update" : "Upload"}
                    <input
                      type="file"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          handleFileUpload(docId, file, docIndex)
                        }
                      }}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                  </label>
                  <button
                    onClick={() => handleDeleteDocument(docId, docIndex)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 12px",
                      backgroundColor: "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#b91c1c";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#dc2626";
                    }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          )
        })}
        <tr style={{ backgroundColor: "#f5f2f0", borderBottom: "1px solid #e8d8cf" }}>
          <td colSpan="7" style={{ padding: "12px 20px", textAlign: "center" }}>
            <button
              onClick={() => handleAddNewDocument(docId)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "6px 16px",
                color: "#5d4037",
                backgroundColor: "transparent",
                border: "1px solid #5d4037",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: "500",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#5d4037";
                e.target.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#5d4037";
              }}
            >
              <Plus size={14} />
              Add New {CMF_DOCUMENT_CONFIGS.find(c => c.id === docId)?.label || 'Document'}
            </button>
          </td>
        </tr>
      </>
    )
  }

  const filteredConfigs = CMF_DOCUMENT_CONFIGS.filter((cfg) => {
    const matchesCategory =
      categoryFilter === "all" || cfg.category.toLowerCase() === categoryFilter.toLowerCase()
    const matchesSearch =
      cfg.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cfg.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = hasDocumentMatchingStatusFilter(cfg.id)
    return matchesCategory && matchesSearch && matchesStatus
  })

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .cmf-docs-container { padding: 16px !important; }
          .cmf-docs-header-grid { flex-direction: column !important; align-items: flex-start !important; }
          .cmf-docs-controls { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
          .cmf-search-box { width: 100% !important; }
        }
      `}</style>

      {isOverlayVisible && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)',
          transition: 'opacity 0.3s ease-in-out',
        }}>
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '40px 60px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid #ddd',
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #e0e0e0',
              borderTop: '4px solid #a67c52',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px auto',
            }}></div>
            <p style={{
              margin: 0,
              color: '#5d4037',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: 'Arial, sans-serif',
            }}>
              {overlayMessage}
            </p>
            <p style={{
              margin: '10px 0 0 0',
              color: '#8d6e63',
              fontSize: '12px',
              fontStyle: 'italic',
            }}>
              Please wait while we validate your document
            </p>
          </div>
        </div>
      )}

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
                {registeredName && registeredName !== "Unknown" && (
                  <p style={{ fontSize: "14px", color: "#8d6e63", marginTop: "8px" }}>
                    Registered as: {registeredName}
                  </p>
                )}
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

          {/* Table */}
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
                        Notes
                      </th>
                      <th style={{
                        padding: "16px 20px",
                        textAlign: "center",
                        fontSize: "12px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        position: "relative"
                      }}>
                        <div style={{ 
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
                            <div style={{
                              position: "absolute",
                              top: "100%",
                              left: "50%",
                              transform: "translateX(-50%)",
                              backgroundColor: "white",
                              border: "1px solid #d7ccc8",
                              borderRadius: "8px",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                              zIndex: 9999,
                              minWidth: "200px",
                              marginTop: "8px",
                              overflow: "hidden"
                            }}>
                              <div style={{
                                padding: "8px 12px",
                                backgroundColor: "#f5f2f0",
                                borderBottom: "1px solid #d7ccc8",
                                fontSize: "12px",
                                fontWeight: "600",
                                color: "#5d4037"
                              }}>
                                Filter by Status
                              </div>
                              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                                {["all", "pending", "verified", "rejected"].map((status) => {
                                  const statusLabels = {
                                    all: "All",
                                    pending: "Pending",
                                    verified: "Verified",
                                    rejected: "Rejected"
                                  };
                                  return (
                                    <button
                                      key={status}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setStatusFilter(status);
                                        setShowStatusFilter(false);
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
                                        transition: "all 0.2s ease",
                                        borderBottom: "1px solid #f5f2f0"
                                      }}
                                      onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = statusFilter === status ? "#efebe9" : "#faf8f6";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = statusFilter === status ? "#efebe9" : "white";
                                      }}
                                    >
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span>{statusLabels[status]}</span>
                                        {statusFilter === status && (
                                          <span style={{ color: "#8d6e63", fontSize: "12px" }}>✓</span>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
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
                      const isMulti = cfg.multiple || false

                      return (
                        <React.Fragment key={cfg.id}>
                          <tr style={{ backgroundColor: rowBg, borderBottom: "1px solid #e8d8cf", transition: "background-color 0.2s" }}>
                            {/* Document Name & Description */}
                            <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                              <div style={{ fontWeight: "700", color: "#4a352f", fontSize: "14px" }}>
                                {cfg.label}
                                {isMulti && (
                                  <span style={{
                                    fontSize: "9px",
                                    backgroundColor: "#e3f2fd",
                                    color: "#1565c0",
                                    padding: "1px 6px",
                                    borderRadius: "10px",
                                    fontWeight: "500",
                                    marginLeft: "6px"
                                  }}>
                                    Multi
                                  </span>
                                )}
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

                            {/* Uploaded File */}
                            <td style={{ padding: "16px 20px", textAlign: "center", verticalAlign: "middle" }}>
                              {renderDocumentLink(cfg.id)}
                            </td>

                            {/* Last Updated */}
                            <td style={{ padding: "16px 20px", textAlign: "center", verticalAlign: "middle", fontSize: "12px", color: "#6b7280" }}>
                              {hasFiles && files[0]?.uploadedAt
                                ? new Date(files[0].uploadedAt).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
                                : "—"}
                            </td>

                            {/* Notes */}
                            <td style={{ padding: "16px 20px", textAlign: "center", verticalAlign: "middle", fontSize: "12px", color: "#6b7280" }}>
                              {hasFiles && files[0]?.message
                                ? files[0].message
                                : "No document uploaded"}
                            </td>

                            {/* Status */}
                            <td style={{ padding: "16px 20px", textAlign: "center", verticalAlign: "middle" }}>
                              {getStatusBadge(cfg.id)}
                            </td>

                            {/* Actions */}
                            <td style={{ padding: "16px 20px", textAlign: "center", verticalAlign: "middle" }}>
                              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                                {isMulti ? (
                                  <label style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "6px 12px",
                                    backgroundColor: "#a67c52",
                                    color: "white",
                                    borderRadius: "8px",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    cursor: isUploading ? "wait" : "pointer",
                                    transition: "all 0.2s ease"
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = "#8d6e63";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = "#a67c52";
                                  }}
                                  >
                                    <Upload size={14} />
                                    Upload
                                    <input
                                      type="file"
                                      style={{ display: 'none' }}
                                      onChange={(e) => {
                                        const file = e.target.files[0]
                                        if (file) {
                                          const currentFiles = getDocFiles(cfg.id)
                                          handleFileUpload(cfg.id, file, currentFiles.length)
                                        }
                                      }}
                                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    />
                                  </label>
                                ) : (
                                  <label style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "6px 12px",
                                    backgroundColor: "#a67c52",
                                    color: "white",
                                    borderRadius: "8px",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    cursor: isUploading ? "wait" : "pointer",
                                    transition: "all 0.2s ease"
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = "#8d6e63";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = "#a67c52";
                                  }}
                                  >
                                    <Upload size={14} />
                                    {hasFiles ? "Update" : "Upload"}
                                    <input
                                      type="file"
                                      style={{ display: 'none' }}
                                      onChange={(e) => {
                                        const file = e.target.files[0]
                                        if (file) {
                                          handleFileUpload(cfg.id, file, 0)
                                        }
                                      }}
                                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    />
                                  </label>
                                )}
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
                                      fontSize: "11px",
                                      fontWeight: "600",
                                      cursor: "pointer",
                                      transition: "all 0.2s ease"
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = "#b91c1c";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = "#dc2626";
                                    }}
                                  >
                                    <Trash2 size={14} />
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {isMulti && renderExpandedRows(cfg.id)}
                        </React.Fragment>
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