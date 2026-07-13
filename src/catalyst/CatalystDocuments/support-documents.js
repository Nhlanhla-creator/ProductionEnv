"use client";

import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getDoc, doc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../../firebaseConfig";
import { FileText, ExternalLink, Upload, Filter, ChevronDown, ChevronUp, Trash2, Plus, Minus, Eye } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

// ── Document configurations ────────────────────────────────────────────
// Multi-upload documents (can have multiple files)
const MULTI_UPLOAD_DOCUMENTS = [
  "Termsheets & Agreements"
];

const DOCUMENT_PATHS = {
  "Standard NDA": "formData.documentUpload.standardNda",
  "Termsheets & Agreements": "formData.documentUpload.standardContract",
  "Program Brochures": "formData.documentUpload.programBrochures",
};

const DOCUMENTS = Object.keys(DOCUMENT_PATHS);

const getDocumentURL = (label, data, index = 0) => {
  const fieldMap = {
    "Standard NDA": "standardNda",
    "Termsheets & Agreements": "standardContract",
    "Program Brochures": "programBrochures"
  };
  
  const field = fieldMap[label];
  const files = data?.formData?.documentUpload?.[field];
  
  if (!files || files.length === 0) return null;
  
  if (MULTI_UPLOAD_DOCUMENTS.includes(label)) {
    if (index === -1) return files.map(f => f.url);
    return files[index]?.url || null;
  }
  
  return files[0]?.url || null;
};

const getAllDocuments = (label, data) => {
  const fieldMap = {
    "Standard NDA": "standardNda",
    "Termsheets & Agreements": "standardContract",
    "Program Brochures": "programBrochures"
  };
  
  const field = fieldMap[label];
  const files = data?.formData?.documentUpload?.[field] || [];
  return files;
};
const getUpdatedAt = (label, data) => {
  const fieldMap = {
    "Standard NDA": "standardNda",
    "Termsheets & Agreements": "standardContract",
    "Program Brochures": "programBrochures"
  };
  
  const field = fieldMap[label];
  
  // Check for UpdatedAt timestamp first
  const updatedAt = data?.formData?.documentUpload?.[`${field}UpdatedAt`];
  if (updatedAt?.seconds) {
    return new Date(updatedAt.seconds * 1000);
  }
  
  // Check individual document uploadedAt
  const files = data?.formData?.documentUpload?.[field];
  if (files && files.length > 0) {
    // Check if any file has uploadedAt
    for (const file of files) {
      if (file?.uploadedAt) {
        return new Date(file.uploadedAt);
      }
    }
    // If no uploadedAt, use the current date as fallback
    return new Date();
  }
  
  return null;
};

const CatalystDocuments = () => {
  const [profileData, setProfileData] = useState({});
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [validationResults, setValidationResults] = useState({});
  const [submittedDocuments, setSubmittedDocuments] = useState([]);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [isInvestorView, setIsInvestorView] = useState(false);
  const [viewingSMEId, setViewingSMEId] = useState(null);
  const [viewingSMEName, setViewingSMEName] = useState("");
  const [showFullGuidelines, setShowFullGuidelines] = useState(false);
  const [registeredName, setRegisteredName] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedTermsheets, setExpandedTermsheets] = useState(false);
  const [editingDoc, setEditingDoc] = useState({ docLabel: null, docIndex: null });
  const [editNameValue, setEditNameValue] = useState("");
  
  const functions = getFunctions();

  useEffect(() => {
    const investorViewMode = sessionStorage.getItem("investorViewMode") === "true";
    const smeId = sessionStorage.getItem("viewingSMEId");
    const smeName = sessionStorage.getItem("viewingSMEName");

    if (investorViewMode && smeId) {
      setIsInvestorView(true);
      setViewingSMEId(smeId);
      setViewingSMEName(smeName || "SME");
      console.log("Investor view mode active, viewing SME:", smeId);
    }
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          let profileId = user.uid;
          
          if (isInvestorView && viewingSMEId) {
            profileId = viewingSMEId;
            console.log("Loading documents for SME:", viewingSMEId);
          }
          
          const profileRef = doc(db, "catalystProfiles", profileId);
          
          const unsubscribeSnapshot = onSnapshot(profileRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setProfileData(data);
              
              const name = data?.formData?.business?.registeredName || 
                          data?.formData?.applicant?.fullName ||
                          data?.formData?.companyName ||
                          "Unknown";
              setRegisteredName(name);
              
              const submitted = DOCUMENTS.filter(label => {
                const url = getDocumentURL(label, data);
                return !!(url && url !== null && url !== '');
              });
              setSubmittedDocuments(submitted);
            } else {
              console.log("No profile found for ID:", profileId);
            }
            setLoading(false);
          });

          return () => unsubscribeSnapshot();
        } catch (err) {
          console.error("Failed to load user documents:", err);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isInvestorView, viewingSMEId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatusFilter && !event.target.closest('th')) {
        setShowStatusFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatusFilter]);

  const getRegisteredName = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return null;
    try {
      const profileRef = doc(db, "catalystProfiles", user.uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        return data?.formData?.business?.registeredName || 
               data?.formData?.applicant?.fullName ||
               data?.formData?.companyName ||
               null;
      }
      return null;
    } catch (error) {
      console.error("Error fetching registeredName:", error);
      return null;
    }
  };

  const validateDocumentWithAI = async (docLabel, file, registeredName) => {
    try {
      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
      });

      const validateCatalystDocument = httpsCallable(functions, 'validateCatalystDocument');

      const result = await validateCatalystDocument({
        documentLabel: docLabel,
        base64File: base64Data,
        mimeType: file.type,
        registeredName: registeredName,
      });

      return result.data.validationResult;
    } catch (error) {
      console.error("AI validation failed:", error);
      throw new Error("Network error - please check your connection and try again");
    }
  };

  const handleIndividualDocumentUpload = async (docLabel, file, docIndex) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !file) return;

    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!allowedTypes.includes(`.${fileExtension}`)) {
      setValidationResults(prev => ({
        ...prev,
        [docLabel]: {
          isValid: false,
          status: "rejected",
          message: `Invalid file type. Please upload PDF, Word, or Image files`,
          warnings: []
        }
      }));
      setTimeout(() => {
        setValidationResults(prev => {
          const newResults = { ...prev };
          delete newResults[docLabel];
          return newResults;
        });
      }, 5000);
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setValidationResults(prev => ({
        ...prev,
        [docLabel]: {
          isValid: false,
          status: "rejected",
          message: `File size exceeds 10MB limit. Please upload a smaller file.`,
          warnings: []
        }
      }));
      setTimeout(() => {
        setValidationResults(prev => {
          const newResults = { ...prev };
          delete newResults[docLabel];
          return newResults;
        });
      }, 5000);
      return;
    }

    setIsUploading(true);
    setIsOverlayVisible(true);

    try {
      const registeredNameValue = await getRegisteredName();
      const validationResult = await validateDocumentWithAI(docLabel, file, registeredNameValue);

      setValidationResults(prev => ({
        ...prev,
        [docLabel]: validationResult
      }));

      if (!validationResult.isValid) {
        setIsUploading(false);
        setTimeout(() => {
          setIsOverlayVisible(false);
        }, 300);
        return;
      }

      const storage = getStorage();
      const path = DOCUMENT_PATHS[docLabel];
      const docId = path.split(".").pop();
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `catalystProfiles/${user.uid}/documents/${docId}/${timestamp}_${safeFileName}`;
      const fileRef = ref(storage, filePath);

      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      const fileObj = {
        name: file.name,
        url: downloadURL,
        path: filePath,
        validatedAt: new Date().toISOString(),
        validationStatus: validationResult.status,
        fileSize: file.size,
        fileType: file.type,
        customName: null,
        uploadedAt: new Date().toISOString()
      };

      const profileRef = doc(db, "catalystProfiles", user.uid);
      const existingDocs = getAllDocuments(docLabel, profileData);
      let updatedDocs;
      
      if (docIndex < existingDocs.length) {
        updatedDocs = existingDocs.map((doc, index) =>
          index === docIndex ? fileObj : doc
        );
      } else {
        updatedDocs = [...existingDocs, fileObj];
      }

      const fieldMap = {
        "Standard NDA": "standardNda",
        "Termsheets & Agreements": "standardContract",
        "Program Brochures": "programBrochures"
      };
      const field = fieldMap[docLabel];

      await updateDoc(profileRef, {
        [`formData.documentUpload.${field}`]: updatedDocs,
        [`formData.documentUpload.${field}UpdatedAt`]: serverTimestamp(),
      });

      setSubmittedDocuments((prev) => Array.from(new Set([...prev, docLabel])));

      const updatedSnap = await getDoc(profileRef);
      if (updatedSnap.exists()) {
        setProfileData(updatedSnap.data());
      }

      setIsUploading(false);
      setTimeout(() => {
        setIsOverlayVisible(false);
      }, 300);

    } catch (error) {
      console.error("Upload failed:", error);
      setIsUploading(false);
      setTimeout(() => {
        setIsOverlayVisible(false);
        alert(error.message || "Network error - please try again");
      }, 300);
    }
  };

  const handleDeleteIndividualDocument = async (docLabel, displayIndex) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete this ${docLabel}?`);
    if (!confirmDelete) return;

    try {
      const profileRef = doc(db, "catalystProfiles", user.uid);
      const existingDocs = getAllDocuments(docLabel, profileData);
      const updatedDocs = existingDocs.filter((_, i) => i !== displayIndex);

      const fieldMap = {
        "Standard NDA": "standardNda",
        "Termsheets & Agreements": "standardContract",
        "Program Brochures": "programBrochures"
      };
      const field = fieldMap[docLabel];

      await updateDoc(profileRef, {
        [`formData.documentUpload.${field}`]: updatedDocs,
        [`formData.documentUpload.${field}UpdatedAt`]: serverTimestamp(),
      });

      const updatedSnap = await getDoc(profileRef);
      if (updatedSnap.exists()) {
        setProfileData(updatedSnap.data());
        const submitted = DOCUMENTS.filter(label => {
          const url = getDocumentURL(label, updatedSnap.data());
          return !!(url && url !== null && url !== '');
        });
        setSubmittedDocuments(submitted);
      }

    } catch (error) {
      console.error("Error deleting document:", error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const handleAddNewDocument = async (docLabel) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const profileRef = doc(db, "catalystProfiles", user.uid);
      const existingDocs = getAllDocuments(docLabel, profileData);
      
      const newDocData = {
        url: "",
        status: "pending",
        message: "No document uploaded",
        uploadedAt: new Date().toISOString(),
        customName: null,
        name: `New ${docLabel}`
      };

      const updatedDocs = [...existingDocs, newDocData];

      const fieldMap = {
        "Standard NDA": "standardNda",
        "Termsheets & Agreements": "standardContract",
        "Program Brochures": "programBrochures"
      };
      const field = fieldMap[docLabel];

      await updateDoc(profileRef, {
        [`formData.documentUpload.${field}`]: updatedDocs,
        [`formData.documentUpload.${field}UpdatedAt`]: serverTimestamp(),
      });

      const updatedSnap = await getDoc(profileRef);
      if (updatedSnap.exists()) {
        setProfileData(updatedSnap.data());
      }

    } catch (error) {
      console.error("Error adding new document slot:", error);
      alert('Failed to add new document slot. Please try again.');
    }
  };

  const handleUpdateDocName = async (docLabel, docIndex, newName) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const profileRef = doc(db, "catalystProfiles", user.uid);
      const existingDocs = getAllDocuments(docLabel, profileData);
      const updatedDocs = existingDocs.map((doc, index) =>
        index === docIndex ? { ...doc, customName: newName } : doc
      );

      const fieldMap = {
        "Standard NDA": "standardNda",
        "Termsheets & Agreements": "standardContract",
        "Program Brochures": "programBrochures"
      };
      const field = fieldMap[docLabel];

      await updateDoc(profileRef, {
        [`formData.documentUpload.${field}`]: updatedDocs,
        [`formData.documentUpload.${field}UpdatedAt`]: serverTimestamp(),
      });

      const updatedSnap = await getDoc(profileRef);
      if (updatedSnap.exists()) {
        setProfileData(updatedSnap.data());
      }

      setEditingDoc({ docLabel: null, docIndex: null });
      setEditNameValue("");

    } catch (error) {
      console.error("Error updating document name:", error);
      alert("Failed to update document name");
    }
  };

  const handleFileUpload = async (docLabel, file) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !file) return;

    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!allowedTypes.includes(`.${fileExtension}`)) {
      setValidationResults(prev => ({
        ...prev,
        [docLabel]: {
          isValid: false,
          status: "rejected",
          message: `Invalid file type. Please upload only PDF or Image files (.pdf, .jpg, .jpeg, .png)`,
          warnings: []
        }
      }));
      setTimeout(() => {
        setValidationResults(prev => {
          const newResults = { ...prev };
          delete newResults[docLabel];
          return newResults;
        });
      }, 5000);
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setValidationResults(prev => ({
        ...prev,
        [docLabel]: {
          isValid: false,
          status: "rejected",
          message: `File size exceeds 10MB limit. Please upload a smaller file.`,
          warnings: []
        }
      }));
      setTimeout(() => {
        setValidationResults(prev => {
          const newResults = { ...prev };
          delete newResults[docLabel];
          return newResults;
        });
      }, 5000);
      return;
    }

    setIsUploading(true);
    setIsOverlayVisible(true);

    try {
      const registeredNameValue = await getRegisteredName();
      const validationResult = await validateDocumentWithAI(docLabel, file, registeredNameValue);

      setValidationResults(prev => ({
        ...prev,
        [docLabel]: validationResult
      }));

      if (!validationResult.isValid) {
        setIsUploading(false);
        setTimeout(() => {
          setIsOverlayVisible(false);
        }, 300);
        return;
      }

      const storage = getStorage();
      const path = DOCUMENT_PATHS[docLabel];
      const docId = path.split(".").pop();
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `catalystProfiles/${user.uid}/documents/${docId}/${timestamp}_${safeFileName}`;
      const fileRef = ref(storage, filePath);

      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      const fileObj = {
        name: file.name,
        url: downloadURL,
        path: filePath,
        validatedAt: new Date().toISOString(),
        validationStatus: validationResult.status,
        fileSize: file.size,
        fileType: file.type
      };

      const profileRef = doc(db, "catalystProfiles", user.uid);
      const parts = path.split(".");
      const timestampPath = parts.length === 1
        ? `${parts[0]}UpdatedAt`
        : `${parts.slice(0, -1).join(".")}.UpdatedAt`;

      await updateDoc(profileRef, {
        [path]: [fileObj],
        [timestampPath]: serverTimestamp(),
      });

      setSubmittedDocuments((prev) => Array.from(new Set([...prev, docLabel])));

      const updatedSnap = await getDoc(profileRef);
      if (updatedSnap.exists()) {
        setProfileData(updatedSnap.data());
      }

      setIsUploading(false);
      setTimeout(() => {
        setIsOverlayVisible(false);
      }, 300);

    } catch (error) {
      console.error("Upload failed:", error);
      setIsUploading(false);
      setTimeout(() => {
        setIsOverlayVisible(false);
        alert(error.message || "Network error - please try again");
      }, 300);
    }
  };

  const getDocumentStatus = (docLabel) => {
    const url = getDocumentURL(docLabel, profileData);
    const validationResult = validationResults[docLabel];
    
    if (!url) {
      return "pending";
    }
    
    if (validationResult) {
      if (!validationResult.isValid) {
        return "rejected";
      }
      if (validationResult.isValid) {
        return "verified";
      }
    }
    
    if (url && !validationResult) {
      return "uploaded";
    }
    
    return "pending";
  };

  const getStatusBadge = (docLabel) => {
    const status = getDocumentStatus(docLabel);
    const validationResult = validationResults[docLabel];
    
    let displayStatus = "Pending";
    let statusColor = "#ef6c00";
    let bgColor = "#fff3e0";
    
    if (status === "verified") {
      displayStatus = "Verified";
      statusColor = "#2e7d32";
      bgColor = "#e8f5e8";
    } else if (status === "rejected") {
      displayStatus = "Rejected";
      statusColor = "#c62828";
      bgColor = "#ffebee";
    } else if (status === "uploaded") {
      displayStatus = "Uploaded";
      statusColor = "#2196f3";
      bgColor = "#e3f2fd";
    }
    
    return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 8px",
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: "600",
        backgroundColor: bgColor,
        color: statusColor
      }}>
        {displayStatus}
      </span>
    );
  };

  const renderDocumentLinkForIndividual = (doc) => {
    if (!doc.url || doc.url === "") {
      return (
        <span style={{
          color: "#8d6e63",
          fontSize: "12px",
          fontStyle: "italic"
        }}>
          No document uploaded
        </span>
      );
    }

    return (
      <a
        href={doc.url}
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
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.target.style.color = "#8d6e63";
          e.target.style.borderBottomColor = "#8d6e63";
        }}
        onMouseLeave={(e) => {
          e.target.style.color = "#5d4037";
          e.target.style.borderBottomColor = "#5d4037";
        }}
      >
        <FileText size={14} />
        <span>View Document</span>
        <ExternalLink size={12} />
      </a>
    );
  };

  const renderIndividualDocumentActions = (docLabel, docIndex, doc) => {
    return (
      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        <label style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          backgroundColor: "#a67c52",
          color: "white",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "#8d6e63";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "#a67c52";
        }}
        >
          <Upload size={12} />
          {doc.url ? "Update" : "Upload"}
          <input
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                handleIndividualDocumentUpload(docLabel, file, docIndex);
              }
            }}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
        </label>
        <button
          onClick={() => handleDeleteIndividualDocument(docLabel, docIndex)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "6px 12px",
            backgroundColor: "#d32f2f",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "11px",
            cursor: "pointer",
            fontWeight: "600",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#b71c1c";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#d32f2f";
          }}
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>
    );
  };

  const renderDocumentLink = (label) => {
    // For multi-upload documents (Termsheets & Agreements)
    if (MULTI_UPLOAD_DOCUMENTS.includes(label)) {
      const allDocs = getAllDocuments(label, profileData);
      const documentName = "Termsheet";

      return (
        <div style={{ textAlign: "center" }}>
          <span style={{
            color: "#5d4037",
            fontSize: "12px",
            fontWeight: "500"
          }}>
            {allDocs.filter(doc => doc.url && doc.url !== "").length} {documentName}{allDocs.filter(doc => doc.url && doc.url !== "").length !== 1 ? 's' : ''} uploaded
          </span>
          <div style={{ marginTop: "4px" }}>
            <button
              onClick={() => setExpandedTermsheets(!expandedTermsheets)}
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
              {expandedTermsheets ? <Minus size={10} /> : <Plus size={10} />}
              {expandedTermsheets ? "Hide" : "Show"} {documentName}s
            </button>
          </div>
        </div>
      );
    }

    // For single documents (Standard NDA, Program Brochures)
    const url = getDocumentURL(label, profileData);
    if (!url) {
      return (
        <span style={{
          color: "#8d6e63",
          fontSize: "12px",
          fontStyle: "italic"
        }}>
          No document uploaded
        </span>
      );
    }
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
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.target.style.color = "#8d6e63";
          e.target.style.borderBottomColor = "#8d6e63";
        }}
        onMouseLeave={(e) => {
          e.target.style.color = "#5d4037";
          e.target.style.borderBottomColor = "#5d4037";
        }}
      >
        <FileText size={14} />
        <span>View Document</span>
        <ExternalLink size={12} />
      </a>
    );
  };

  const renderExpandedRows = (docLabel) => {
    if (!expandedTermsheets) return null;
    
    let allDocs = getAllDocuments(docLabel, profileData);
    let filteredDocs = allDocs;

    // Ensure there's always at least one document slot (placeholder)
    if (filteredDocs.length === 0) {
      filteredDocs = [{
        url: "",
        status: "pending",
        message: "No document uploaded",
        uploadedAt: new Date().toISOString(),
        customName: null
      }];
    }

    return (
      <React.Fragment>
        <tr style={{ backgroundColor: "#f5f2f0", borderBottom: "1px solid #e8d8cf" }}>
          <td colSpan="6" style={{ padding: "12px 20px", textAlign: "center", color: "#8d6e63", fontSize: "12px", fontWeight: "500" }}>
            Documents
          </td>
        </tr>
        {filteredDocs.map((doc, docIndex) => {
          let displayName = doc.customName || `Termsheet ${docIndex + 1}`;
          
          let statusDisplay = "Pending";
          let statusStyle = "pending";
          
          if (!doc.url || doc.url === "") {
            statusDisplay = "Pending";
            statusStyle = "pending";
          } else if (doc.status === "verified" || doc.status === "verified:not_audited") {
            statusDisplay = "Verified";
            statusStyle = "verified";
          } else if (doc.status === "expired") {
            statusDisplay = "Expired";
            statusStyle = "expired";
          } else if (
            doc.status === "wrong_type" || 
            doc.status === "name_mismatch" || 
            doc.status === "incomplete" || 
            doc.status === "rejected"
          ) {
            statusDisplay = "Rejected";
            statusStyle = "rejected";
          }
          
          return (
            <tr 
              key={`${docLabel}-${docIndex}`}
              style={{
                backgroundColor: docIndex % 2 === 0 ? "#f9f5f3" : "#f5f2f0",
                borderBottom: "1px solid #e8d8cf",
                transition: "background-color 0.2s ease"
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
                  
                  {editingDoc.docLabel === docLabel && editingDoc.docIndex === docIndex ? (
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
                            handleUpdateDocName(docLabel, docIndex, editNameValue);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleUpdateDocName(docLabel, docIndex, editNameValue)}
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
                          setEditingDoc({ docLabel: null, docIndex: null });
                          setEditNameValue("");
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
                          setEditingDoc({ docLabel, docIndex });
                          setEditNameValue(displayName);
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
              <td style={{
                padding: "12px 20px",
                textAlign: "center",
                verticalAlign: "middle"
              }}>
                {renderDocumentLinkForIndividual(doc)}
              </td>
              <td style={{
                padding: "12px 20px",
                fontSize: "12px",
                color: "#6d4c41",
                textAlign: "center",
                verticalAlign: "middle"
              }}>
                {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "-"}
              </td>
              <td style={{
                padding: "12px 20px",
                fontSize: "12px",
                color: "#6d4c41",
                textAlign: "center",
                verticalAlign: "middle"
              }}>
                {doc.message || (doc.url ? "Document uploaded" : "No document uploaded")}
              </td>
              <td style={{
                padding: "12px 20px",
                textAlign: "center",
                verticalAlign: "middle"
              }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  fontSize: "10px",
                  fontWeight: "600",
                  backgroundColor: statusStyle === "verified" ? "#e8f5e8" : 
                                statusStyle === "pending" ? "#fff3e0" : 
                                statusStyle === "expired" ? "#fff3e0" : "#ffebee",
                  color: statusStyle === "verified" ? "#2e7d32" : 
                        statusStyle === "pending" ? "#ef6c00" :
                        statusStyle === "expired" ? "#c62828" : "#c62828"
                }}>
                  {statusDisplay}
                </span>
              </td>
              <td style={{
                padding: "12px 20px",
                textAlign: "center",
                verticalAlign: "middle"
              }}>
                {renderIndividualDocumentActions(docLabel, docIndex, doc)}
              </td>
            </tr>
          );
        })}
        <tr style={{ backgroundColor: "#f5f2f0", borderBottom: "1px solid #e8d8cf" }}>
          <td colSpan="6" style={{ padding: "12px 20px", textAlign: "center" }}>
            <button
              onClick={() => handleAddNewDocument(docLabel)}
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
              Add New Termsheet
            </button>
          </td>
        </tr>
      </React.Fragment>
    );
  };

  const hasDocumentMatchingStatusFilter = (docLabel) => {
    const status = getDocumentStatus(docLabel);
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return status === "pending";
    if (statusFilter === "verified") return status === "verified";
    if (statusFilter === "rejected") return status === "rejected";
    if (statusFilter === "uploaded") return status === "uploaded";
    return true;
  };

  const hasDocumentMatchingTypeFilter = (docLabel) => {
    const internalDocuments = [
      "Program Brochures"
    ];

    const externalDocuments = [
      "Standard NDA",
      "Termsheets & Agreements"
    ];

    if (typeFilter === "all") return true;
    if (typeFilter === "internal") return internalDocuments.includes(docLabel);
    if (typeFilter === "external") return externalDocuments.includes(docLabel);
    return true;
  };

  const filteredDocuments = DOCUMENTS.filter((docLabel) => {
    const matchSearch = docLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = hasDocumentMatchingTypeFilter(docLabel);
    const matchStatus = hasDocumentMatchingStatusFilter(docLabel);
    return matchSearch && matchType && matchStatus;
  });

  const getContainerStyles = () => ({
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    padding: "20px",
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease",
    backgroundColor: "#faf8f6"
  });

  const auth = getAuth();
  if (!auth.currentUser && !loading) {
    return (
      <div style={getContainerStyles()}>
        <div style={{
          textAlign: "center",
          padding: "80px 32px",
          backgroundColor: "#f5f2f0",
          borderRadius: "16px",
          border: "2px dashed #d7ccc8",
          color: "#6d4c41",
          fontSize: "1.125rem",
          fontWeight: "500"
        }}>
          Please sign in to view documents.
        </div>
      </div>
    );
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
        @media (max-width: 1024px) {
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
          .documents-table-container {
            overflow-x: auto;
          }
          .documents-table {
            min-width: 700px;
          }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={getContainerStyles()}>
        <div style={{
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto",
        }}>
          <div className="my-documents-header" style={{
            marginBottom: "32px",
            padding: "32px",
            background: "linear-gradient(135deg, #f5f2f0 0%, #faf8f6 100%)",
            borderRadius: "16px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            border: "2px solid #d7ccc8"
          }}>
            <h1 style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              color: "#5d4037",
              margin: "0 0 8px 0",
              letterSpacing: "-0.025em"
            }}>
              {isInvestorView ? `${viewingSMEName}'s Documents` : "Catalyst Documents Hub"}
            </h1>
            <p style={{
              fontSize: "1.125rem",
              color: "#6d4c41",
              margin: "0",
              fontWeight: "400"
            }}>
              {isInvestorView
                ? `Reviewing documents required for the program`
                : "Manage your program documents in one place"}
            </p>

            {registeredName && registeredName !== "Unknown" && !isInvestorView && (
              <p style={{
                fontSize: "0.875rem",
                color: "#8d6e63",
                marginTop: "8px"
              }}>
                Registered as: {registeredName}
              </p>
            )}

            {/* Document Submission Guidelines */}
            <div style={{
              backgroundColor: "#f5f2f0",
              border: "2px solid #d7ccc8",
              borderRadius: "12px",
              padding: "24px",
              marginTop: "20px"
            }}>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#5d4037",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                flexWrap: "wrap"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  📋 Document Submission Guidelines
                </div>
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
                    fontWeight: "500",
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
                  {showFullGuidelines ? "See Less" : "See More"}
                  {showFullGuidelines ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </h3>

              <p style={{
                color: "#6d4c41",
                lineHeight: "1.6",
                marginBottom: showFullGuidelines ? "20px" : "0"
              }}>
                To ensure smooth processing, we only accept specific file types and sizes.
                {!showFullGuidelines && " Click 'See More' for detailed guidelines."}
              </p>

              {showFullGuidelines && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "20px",
                  marginTop: "20px",
                  animation: "fadeIn 0.3s ease"
                }}>
                  <div style={{
                    backgroundColor: "#efebe9",
                    padding: "16px",
                    borderRadius: "8px",
                    borderLeft: "4px solid #4caf50"
                  }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#2e7d32", marginBottom: "12px" }}>✅ Accepted File Formats</h4>
                    <ul style={{ margin: "0", paddingLeft: "20px", color: "#5d4037", fontSize: "14px", lineHeight: "1.5" }}>
                      <li><strong>PDF</strong> (.pdf) – Preferred format</li>
                      <li><strong>Word Documents</strong> (.doc, .docx)</li>
                      <li><strong>Image Files</strong> (.jpg, .jpeg, .png)</li>
                    </ul>
                  </div>

                  <div style={{
                    backgroundColor: "#efebe9",
                    padding: "16px",
                    borderRadius: "8px",
                    borderLeft: "4px solid #ff9800"
                  }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#f57c00", marginBottom: "12px" }}>⚠️ File Size Limit</h4>
                    <ul style={{ margin: "0", paddingLeft: "20px", color: "#5d4037", fontSize: "14px", lineHeight: "1.5" }}>
                      <li>Maximum upload size: <strong>10 MB per file</strong></li>
                    </ul>
                  </div>

                  <div style={{
                    backgroundColor: "#efebe9",
                    padding: "16px",
                    borderRadius: "8px",
                    borderLeft: "4px solid #2196f3"
                  }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#1565c0", marginBottom: "12px" }}>📄 Document Requirements</h4>
                    <ul style={{ margin: "0", paddingLeft: "20px", color: "#5d4037", fontSize: "14px", lineHeight: "1.5" }}>
                      <li>NDA must have parties and confidentiality clause</li>
                      <li>Termsheets must have clear terms and parties</li>
                      <li>Brochures must describe program offering</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="document-controls" style={{
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
            boxSizing: "border-box"
          }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["all", "internal", "external"].map((type) => {
                const labels = {
                  all: "All",
                  internal: "Internal",
                  external: "External",
                };
                return (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    style={{
                      padding: "10px 20px",
                      border: typeFilter === type ? "2px solid #8d6e63" : "2px solid #d7ccc8",
                      backgroundColor: typeFilter === type ? "#8d6e63" : "#faf8f6",
                      color: typeFilter === type ? "white" : "#6d4c41",
                      borderRadius: "8px",
                      fontWeight: "500",
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      minWidth: "100px"
                    }}
                  >
                    {labels[type]}
                  </button>
                );
              })}
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
                boxSizing: "border-box"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#8d6e63";
                e.target.style.boxShadow = "0 0 0 3px rgba(141, 110, 99, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d7ccc8";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {loading ? (
            <div style={{
              textAlign: "center",
              padding: "80px 32px",
              backgroundColor: "#f5f2f0",
              borderRadius: "16px",
              border: "2px dashed #d7ccc8",
              color: "#6d4c41",
              fontSize: "1.125rem",
              fontWeight: "500",
              width: "100%"
            }}>Loading documents...</div>
          ) : filteredDocuments.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "80px 32px",
              backgroundColor: "#f5f2f0",
              borderRadius: "16px",
              border: "2px dashed #d7ccc8",
              color: "#6d4c41",
              fontSize: "1.125rem",
              fontWeight: "500",
              width: "100%"
            }}>
              {isInvestorView ? "No documents found" : "No documents found"}
            </div>
          ) : (
            <div className="documents-table-container" style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              border: "1px solid #d7ccc8",
              width: "100%",
              overflowX: "auto",
              position: "relative"
            }}>
              <table className="documents-table" style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "800px"
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: "#8d6e63",
                    color: "white",
                    height: "50px"
                  }}>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "left",
                      fontWeight: "600",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #6d4c41",
                      width: "25%"
                    }}>Document Name</th>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #6d4c41",
                      width: "20%"
                    }}>Uploaded Document</th>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #6d4c41",
                      width: "15%"
                    }}>Last Updated</th>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #6d4c41",
                      width: "15%"
                    }}>Notes</th>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #6d4c41",
                      width: "15%",
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
                              {["all", "pending", "uploaded", "verified", "rejected"].map((status) => {
                                const statusLabels = {
                                  all: "All",
                                  pending: "Pending",
                                  uploaded: "Uploaded",
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
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #6d4c41",
                      width: isInvestorView ? "15%" : "25%"
                    }}>
                      {isInvestorView ? "Access" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((docLabel, index) => {
                    const path = DOCUMENT_PATHS[docLabel];
                    const parts = path.split(".");
                    
                    const fieldMap = {
                      "Standard NDA": "standardNda",
                      "Termsheets & Agreements": "standardContract",
                      "Program Brochures": "programBrochures"
                    };
                    const field = fieldMap[docLabel];
                    const docData = profileData?.formData?.documentUpload?.[field];
                    
                    const updatedDate = getUpdatedAt(docLabel, profileData);
                    const formattedDate = updatedDate ? updatedDate.toLocaleDateString() : "Never";

                    const validationResult = validationResults[docLabel];
                    const url = getDocumentURL(docLabel, profileData);
                    const isMultiUpload = MULTI_UPLOAD_DOCUMENTS.includes(docLabel);

                    return (
                      <React.Fragment key={docLabel}>
                        <tr style={{
                          backgroundColor: index % 2 === 0 ? "white" : "#faf8f6",
                          borderBottom: "1px solid #e8d8cf",
                          transition: "background-color 0.2s ease",
                          height: "60px"
                        }}
                        onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = "#efebe9"}
                        onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = index % 2 === 0 ? "white" : "#faf8f6"}
                        >
                          <td style={{
                            padding: "16px 20px",
                            fontSize: "14px",
                            color: "#5d4037",
                            fontWeight: "600",
                            verticalAlign: "middle"
                          }}>
                            <div style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                              gap: "4px"
                            }}>
                              <div>{docLabel}</div>
                              {validationResult && !validationResult.isValid && (
                                <div style={{
                                  fontSize: "10px",
                                  color: "#c62828",
                                  backgroundColor: "#ffebee",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  display: "inline-block"
                                }}>
                                  {validationResult.message}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{
                            padding: "16px 20px",
                            textAlign: "center",
                            verticalAlign: "middle",
                            backgroundColor: "transparent"
                          }}>
                            {renderDocumentLink(docLabel)}
                          </td>
                          <td style={{
                            padding: "16px 20px",
                            fontSize: "13px",
                            color: "#6d4c41",
                            textAlign: "center",
                            verticalAlign: "middle",
                            backgroundColor: "transparent"
                          }}>
                            {formattedDate}
                          </td>
                          <td style={{
                            padding: "16px 20px",
                            fontSize: "12px",
                            color: "#6d4c41",
                            textAlign: "center",
                            verticalAlign: "middle",
                            backgroundColor: "transparent"
                          }}>
                            {!url ? "No document uploaded" : (validationResult?.message || "Document uploaded")}
                          </td>
                          <td style={{
                            padding: "16px 20px",
                            textAlign: "center",
                            verticalAlign: "middle",
                            backgroundColor: "transparent"
                          }}>
                            {getStatusBadge(docLabel)}
                          </td>
                          <td style={{
                            padding: "16px 20px",
                            textAlign: "center",
                            verticalAlign: "middle",
                            backgroundColor: "transparent"
                          }}>
                            {isInvestorView ? (
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 8px",
                                backgroundColor: "#f5f2f0",
                                color: "#8d6e63",
                                borderRadius: "4px",
                                fontSize: "10px",
                                fontWeight: "500"
                              }}>
                                <Eye size={12} />
                                Read only
                              </span>
                            ) : isMultiUpload ? (
                              <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
                                <label style={{
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
                                  letterSpacing: "0.5px"
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = "#8d6e63";
                                  e.target.style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = "#a67c52";
                                  e.target.style.transform = "translateY(0)";
                                }}
                                >
                                  <Upload size={12} />
                                  Upload
                                  <input
                                    type="file"
                                    style={{ display: "none" }}
                                    onChange={(e) => {
                                      const files = e.target.files;
                                      if (files && files.length > 0) {
                                        const allDocs = getAllDocuments(docLabel, profileData);
                                        handleIndividualDocumentUpload(docLabel, files[0], allDocs.length);
                                      }
                                    }}
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                  />
                                </label>
                              </div>
                      ) : docLabel === "Standard NDA" ? (
                      // Standard NDA - Read only (no upload button)
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "4px 8px",
                        backgroundColor: "#f5f2f0",
                        color: "#8d6e63",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: "500"
                      }}>
                        <Eye size={12} />
                        Read only
                      </span>
                    ) : (
                      // Program Brochures - Allow upload/update
                      <label style={{
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
                        letterSpacing: "0.5px"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#8d6e63";
                        e.target.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#a67c52";
                        e.target.style.transform = "translateY(0)";
                      }}
                      >
                        <Upload size={12} />
                        {url ? "Update" : "Upload"}
                        <input
                          type="file"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(docLabel, e.target.files[0]);
                            }
                            e.target.value = '';
                          }}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                      </label>
                            )}
                          </td>
                        </tr>
                        {isMultiUpload && renderExpandedRows(docLabel)}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
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
          opacity: isUploading ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          pointerEvents: isUploading ? 'auto' : 'none'
        }}>
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '40px 60px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid #ddd',
            transform: isUploading ? 'scale(1)' : 'scale(0.9)',
            transition: 'all 0.3s ease-in-out',
            opacity: isUploading ? 1 : 0
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #e0e0e0',
              borderTop: '4px solid #a67c52',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px auto'
            }}></div>
            <p style={{
              margin: 0,
              color: '#5d4037',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: 'Arial, sans-serif'
            }}>
              {isUploading ? "Uploading Document..." : "Processing..."}
            </p>
            <p style={{
              margin: '10px 0 0 0',
              color: '#8d6e63',
              fontSize: '12px',
              fontStyle: 'italic'
            }}>
              {isUploading ? "Please wait while we validate and upload your file" : "Please wait"}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default CatalystDocuments;