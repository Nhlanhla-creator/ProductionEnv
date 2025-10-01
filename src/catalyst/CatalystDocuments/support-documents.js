"use client";

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../../firebaseConfig";
import { FileText, ExternalLink, Upload } from "lucide-react";
import get from "lodash.get";
import { onAuthStateChanged } from "firebase/auth";

const DOCUMENT_PATHS = {
  "Fund Mandate": "formData.documentUpload.fundMandate",
  "ID of Fund Lead": "formData.documentUpload.idOfFundLead", 
  "Registration Docs": "formData.documentUpload.registrationDocs",
};

const DOCUMENTS = Object.keys(DOCUMENT_PATHS).sort((a, b) => a.localeCompare(b));

const checkSubmittedDocs = (documents, data) => {
  return documents.filter(label => {
    const path = DOCUMENT_PATHS[label];
    const uploadedFiles = get(data, path, []);
    return Array.isArray(uploadedFiles) && uploadedFiles.length > 0;
  });
};

const getDocumentURL = (label, data) => {
  const files = get(data, DOCUMENT_PATHS[label], []);
  return files.length > 0 ? files[0].url : null;
};

const CatalystDocuments = () => {
  const [profileData, setProfileData] = useState({});
  const [submittedDocuments, setSubmittedDocuments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "catalystProfiles", user.uid);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) return;

          const data = docSnap.data();
          setProfileData(data);
          const submitted = checkSubmittedDocs(DOCUMENTS, data);
          setSubmittedDocuments(submitted);
        } catch (err) {
          console.error("Failed to load user documents:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (docLabel, file) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !file) return;

    const path = DOCUMENT_PATHS[docLabel];
    const docId = path.split(".").pop();
    const filePath = `catalystProfiles/${user.uid}/documents/${docId}/${file.name}`;
    const fileRef = ref(getStorage(), filePath);

    try {
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      const fileObj = { name: file.name, url: downloadURL, path: filePath };

      const profileRef = doc(db, "catalystProfiles", user.uid);
      const docSnap = await getDoc(profileRef);
      const currentData = docSnap.exists() ? docSnap.data() : {};

      const existingFiles = get(currentData, path) || [];
      const updatedFiles = [fileObj]; // Overwrite existing file

      const timestampPath = (() => {
        const parts = path.split(".");
        if (parts.length === 1) return `${parts[0]}UpdatedAt`;
        parts.pop();
        return `${parts.join(".")}.UpdatedAt`;
      })();

      await updateDoc(profileRef, {
        [path]: updatedFiles,
        [timestampPath]: serverTimestamp(),
      });

      setSubmittedDocuments((prev) => Array.from(new Set([...prev, docLabel])));
      
      const updatedProfileSnap = await getDoc(profileRef);
      if (updatedProfileSnap.exists()) {
        setProfileData(updatedProfileSnap.data());
      }
      
      alert(`${docLabel} uploaded successfully.`);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const filteredDocuments = DOCUMENTS.filter((doc) => {
    const isSubmitted = submittedDocuments.includes(doc);
    const matchFilter =
      filter === "all" ||
      (filter === "submitted" && isSubmitted) ||
      (filter === "pending" && !isSubmitted);
    const matchSearch = doc.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  const renderDocumentLink = (label) => {
    const url = getDocumentURL(label, profileData);
    if (!url) return (
      <span style={{
        color: "#8d6e63",
        fontSize: "12px",
        fontStyle: "italic"
      }}>
        No document uploaded
      </span>
    );
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

  const getStatusBadge = (docLabel) => {
    const url = getDocumentURL(docLabel, profileData);
    const isUploaded = !!url;
    
    return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 8px",
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: "600",
        backgroundColor: isUploaded ? "#e8f5e8" : "#ffebee",
        color: isUploaded ? "#2e7d32" : "#c62828"
      }}>
        {isUploaded ? "Uploaded" : "Pending"}
      </span>
    );
  };

  if (!getAuth().currentUser && !loading) {
    return (
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

      <div
        className="documents-container"
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          minHeight: "100vh",
          backgroundColor: "#faf8f6",
          padding: "24px",
          paddingLeft: "280px",
          marginTop: "60px",
          width: "100%",
          boxSizing: "border-box",
          overflowX: "hidden"
        }}
      >
        <div className="sidebar-space" style={{
          width: "280px",
          height: "100vh",
          position: "fixed",
          left: "0",
          top: "0",
          pointerEvents: "none"
        }} />
        
        <div style={{
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto",
        }}>
          {/* Header */}
          <div className="documents-header" style={{
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
            }}>Catalyst Profile Documents</h1>
            <p style={{
              fontSize: "1.125rem",
              color: "#6d4c41",
              margin: "0",
              fontWeight: "400"
            }}>Track all your submitted documents in one place</p>
          </div>

          {/* Controls Section */}
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
                    minWidth: "100px"
                  }}
                  onMouseEnter={(e) => {
                    if (filter !== type) {
                      e.target.style.backgroundColor = "#efebe9";
                      e.target.style.borderColor = "#a67c52";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filter !== type) {
                      e.target.style.backgroundColor = "#faf8f6";
                      e.target.style.borderColor = "#d7ccc8";
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
            }}>No documents found</div>
          ) : (
            <div className="documents-table-container" style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
              border: "1px solid #d7ccc8",
              width: "100%",
              overflowX: "auto"
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
                    }}>Status</th>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #6d4c41",
                      width: "25%"
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc, index) => {
                    const base = DOCUMENT_PATHS[doc];
                    let updatedAt;
                    if (typeof base === "string") {
                      const parts = base.split(".");
                      const timestampPath =
                        parts.length === 1
                          ? `${parts[0]}UpdatedAt`
                          : `${parts.slice(0, -1).join(".")}.UpdatedAt`;
                      updatedAt = get(profileData, timestampPath);
                    }

                    return (
                      <tr key={doc} style={{
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
                          {doc}
                        </td>
                        <td style={{
                          padding: "16px 20px",
                          textAlign: "center",
                          verticalAlign: "middle",
                          backgroundColor: "transparent"
                        }}>
                          {renderDocumentLink(doc)}
                        </td>
                        <td style={{
                          padding: "16px 20px",
                          fontSize: "13px",
                          color: "#6d4c41",
                          textAlign: "center",
                          verticalAlign: "middle",
                          backgroundColor: "transparent"
                        }}>
                          {updatedAt?.seconds
                            ? new Date(updatedAt.seconds * 1000).toLocaleDateString()
                            : "-"}
                        </td>
                        <td style={{
                          padding: "16px 20px",
                          textAlign: "center",
                          verticalAlign: "middle",
                          backgroundColor: "transparent"
                        }}>
                          {getStatusBadge(doc)}
                        </td>
                        <td style={{
                          padding: "16px 20px",
                          textAlign: "center",
                          verticalAlign: "middle",
                          backgroundColor: "transparent"
                        }}>
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
                            {getDocumentURL(doc, profileData) ? "Update" : "Upload"}
                            <input
                              type="file"
                              style={{ display: "none" }}
                              onChange={(e) => handleFileUpload(doc, e.target.files[0])}
                            />
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CatalystDocuments;