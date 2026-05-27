"use client";

import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getDoc, doc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../../firebaseConfig";
import { FileText, ExternalLink, Upload, Filter, ChevronDown, ChevronUp, Trash2, Plus, Minus, Eye } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

// ── Only these 3 documents remain ────────────────────────────────────────────
const DOCUMENT_PATHS = {
  "Standard NDA": "formData.documentUpload.standardNda",
  "Standard Contract / Term Sheet": "formData.documentUpload.standardContract",
  "Program Brochures": "formData.documentUpload.programBrochures",
};

const DOCUMENTS = Object.keys(DOCUMENT_PATHS);

const getDocumentURL = (label, data) => {
  const files = data?.formData?.documentUpload?.[label === "Standard NDA" ? "standardNda" : label === "Standard Contract / Term Sheet" ? "standardContract" : "programBrochures"];
  return files && files.length > 0 ? files[0].url : null;
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
              
              // Get registered name
              const name = data?.formData?.business?.registeredName || 
                          data?.formData?.applicant?.fullName ||
                          data?.formData?.companyName ||
                          "Unknown";
              setRegisteredName(name);
              
              // Check submitted documents
              const submitted = DOCUMENTS.filter(label => getDocumentURL(label, data));
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

  const handleFileUpload = async (docLabel, file) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !file) return;

    // Validate file type
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

    // Validate file size
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
    
    // Check if document has been uploaded but not validated
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

  const renderDocumentLink = (label) => {
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

  const hasDocumentMatchingStatusFilter = (docLabel) => {
    const status = getDocumentStatus(docLabel);
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return status === "pending";
    if (statusFilter === "verified") return status === "verified";
    if (statusFilter === "rejected") return status === "rejected";
    if (statusFilter === "uploaded") return status === "uploaded";
    return true;
  };

  const filteredDocuments = DOCUMENTS.filter((docLabel) => {
    const matchSearch = docLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = hasDocumentMatchingStatusFilter(docLabel);
    return matchSearch && matchStatus;
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
                      <li>Contracts must have clear terms and parties</li>
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
              {["all", "pending", "uploaded",].map((type) => {
                const labels = {
                  all: "All",
                  pending: "Pending",
                  uploaded: "Uploaded",
                };
                return (
                  <button
                    key={type}
                    onClick={() => setStatusFilter(type)}
                    style={{
                      padding: "10px 20px",
                      border: statusFilter === type ? "2px solid #8d6e63" : "2px solid #d7ccc8",
                      backgroundColor: statusFilter === type ? "#8d6e63" : "#faf8f6",
                      color: statusFilter === type ? "white" : "#6d4c41",
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
                    const timestampPath = parts.length === 1 ? `${parts[0]}UpdatedAt` : `${parts.slice(0, -1).join(".")}.UpdatedAt`;
                    const updatedAt = profileData?.formData?.documentUpload?.[
                      docLabel === "Standard NDA" ? "standardNda" : 
                      docLabel === "Standard Contract / Term Sheet" ? "standardContract" : 
                      "programBrochures"
                    ]?.[0]?.uploadedAt || profileData?.[timestampPath];
                    
                    const formattedDate = updatedAt ?
                      (updatedAt.seconds ? new Date(updatedAt.seconds * 1000).toLocaleDateString() : new Date(updatedAt).toLocaleDateString()) :
                      "Never";

                    const validationResult = validationResults[docLabel];
                    const url = getDocumentURL(docLabel, profileData);

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
                            ) : (
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