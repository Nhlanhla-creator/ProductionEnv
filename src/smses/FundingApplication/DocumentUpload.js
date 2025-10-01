
"use client"
import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Upload, FileText, Loader2 } from "lucide-react"
import FileUpload from "./FileUpload"
import "./FundingApplication.css"

import { db, auth } from "../../firebaseConfig"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "../../firebaseConfig"

const documentsList = [
  {
    id: "budgetDocuments",
    label: "5 Year Budget (Income Statement, Cashflows, Balance Sheet)",
    accept: ".pdf,.xlsx,.xls,.doc,.docx",
    required: true,
    multiple: false,
    description: "Comprehensive 5-year financial projections including income statement, cash flows, and balance sheet"
  },
  {
    id: "bankConfirmation",
    label: "Bank Details Confirmation Letter",
    accept: ".pdf,.jpg,.jpeg,.png",
    required: true,
    multiple: false,
    description: "Official letter from your bank confirming account details"
  },
  {
    id: "financialStatements",
    label: "Financial Statements",
    accept: ".pdf,.xlsx,.xls,.csv",
    required: true,
    multiple: false,
    description: "Current financial statements and records"
  },
  {
    id: "programReports",
    label: "Previous Program Reports",
    accept: ".pdf,.doc,.docx",
    required: true,
    multiple: false,
    description: "Reports from previous programs or initiatives (if applicable)"
  },
  {
    id: "loanAgreements",
    label: "Loan Agreements",
    accept: ".pdf,.doc,.docx",
    required: true,
    multiple: false,
    description: "Existing loan agreements or debt instruments (if applicable)"
  },
  {
    id: "supportLetters",
    label: "Support Letters / Endorsements",
    accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
    required: true,
    multiple: true,
    description: "Letters of support or endorsements from partners, clients, or stakeholders"
  },
  {
    id: "impactStatement",
    label: "Optional Impact Statement",
    accept: ".pdf,.doc,.docx",
    required: true,
    multiple: false,
    description: "Free-text or uploaded impact statement document"
  }
]

// Document Upload Component
function DocumentUpload({ data = {}, updateData }) {
  const [formData, setFormData] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState({})
  const [uploadingDocs, setUploadingDocs] = useState({}) // Track which docs are uploading

  // Load data from Firebase when component mounts
  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true);
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error("User not logged in");

        const docRef = doc(db, "universalProfiles", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const profileData = docSnap.data();
          const documentsData = profileData.fundingDocuments || {};
          setFormData(documentsData);
          updateData("documentUpload", documentsData);

          const status = {};
          documentsList.forEach(doc => {
            const files = documentsData[doc.id] || [];
            status[doc.id] = files.length > 0 ? "success" : "pending";
          });
          setUploadStatus(status);
        }
      } catch (error) {
        console.error("Error loading documents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, []);

  const uploadToStorage = async (file, userId, documentId) => {
    const fileRef = ref(storage, `documents/${userId}/${documentId}/${Date.now()}-${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const handleFileChange = async (documentId, fileList) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    setUploadingDocs(prev => ({ ...prev, [documentId]: true }));

    try {
      const urls = [];
      for (let file of fileList) {
        const url = await uploadToStorage(file, userId, documentId);
        urls.push(url);
      }

      const updatedForm = { ...formData, [documentId]: urls };
      setFormData(updatedForm);
      updateData("documentUpload", updatedForm);

      await updateDoc(doc(db, "universalProfiles", userId), {
        [`fundingDocuments.${documentId}`]: urls,
        ...(documentId === "bankConfirmation" && { "financialOverview.bankConfirmation": urls }),
        ...(documentId === "financialStatements" && { "financialOverview.bankStatements": urls }),
        ...(documentId === "budgetDocuments" && { "financialOverview.budgetDocuments": urls }),
      });

      setUploadStatus(prev => ({ ...prev, [documentId]: "success" }));
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus(prev => ({ ...prev, [documentId]: "pending" }));
    } finally {
      setUploadingDocs(prev => ({ ...prev, [documentId]: false }));
    }
  };

  const getStatusBadge = (documentId, document) => {
    const isUploading = uploadingDocs[documentId]
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
          {document.required ? "missing" : "Optional"}
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
    updateData("documentUpload", updatedData)
    
    // Update Firebase
    try {
      const userId = auth.currentUser?.uid
      if (userId) {
        const docRef = doc(db, "universalProfiles", userId)
        const updateData = {
          [`fundingDocuments.${documentId}`]: updatedFiles,
        }

        // Update specific sections based on document type
        if (documentId === "bankConfirmation") {
          updateData["financialOverview.bankConfirmation"] = updatedFiles
        } else if (documentId === "financialStatements") {
          updateData["financialOverview.bankStatements"] = updatedFiles
        } else if (documentId === "budgetDocuments") {
          updateData["financialOverview.budgetDocuments"] = updatedFiles
        }
        
        await updateDoc(docRef, updateData)
      }
    } catch (error) {
      console.error("Error deleting file:", error)
    }
  }

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
        backgroundColor: "#faf8f6",
        borderRadius: "12px",
        maxWidth: "100%"
      }}>
        <h2 style={{ 
          fontSize: "24px", 
          fontWeight: "bold", 
          color: "#6d4c41", 
          marginBottom: "24px",
          textAlign: "left"
        }}>Funding Documents Upload</h2>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "flex-start",
          gap: "12px",
          padding: "16px",
          backgroundColor: "#f5f2f0",
          borderRadius: "8px"
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
      backgroundColor: "#faf8f6",
      borderRadius: "12px",
      maxWidth: "100%"
    }}>
      <h2 style={{ 
        fontSize: "24px", 
        fontWeight: "bold", 
        color: "#6d4c41", 
        marginBottom: "24px",
        textAlign: "left"
      }}>Funding Documents Upload</h2>
      
      <p style={{
        color: "#6d4c41",
        fontSize: "16px",
        lineHeight: "1.6",
        textAlign: "left",
        marginBottom: "30px"
      }}>
        Please upload all required documents to support your funding application.
        Ensure all documents are current and accurately reflect your financial position.
      </p>

      {/* Guidelines Section */}
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
          📋 Document Submission Guidelines
        </h3>
        <p style={{
          color: "#6d4c41",
          lineHeight: "1.6",
          marginBottom: "20px"
        }}>
          To ensure smooth processing, please follow these guidelines:
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
              <li style={{ marginBottom: "4px" }}><strong>PDF</strong> (.pdf) – Preferred for all official documents</li>
              <li style={{ marginBottom: "4px" }}><strong>Excel/CSV</strong> (.xlsx, .xls, .csv) – For financial data</li>
              <li style={{ marginBottom: "4px" }}><strong>Word Documents</strong> (.doc, .docx) – For reports and statements</li>
              <li style={{ marginBottom: "4px" }}><strong>Images</strong> (.jpg, .jpeg, .png) – For scanned documents</li>
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
            }}>⚠️ File Requirements</h4>
            <ul style={{
              margin: "0",
              paddingLeft: "20px",
              color: "#5d4037",
              fontSize: "14px",
              lineHeight: "1.5"
            }}>
              <li style={{ marginBottom: "4px" }}>Maximum file size: <strong>10 MB per file</strong></li>
              <li style={{ marginBottom: "4px" }}>Documents must be <strong>legible and complete</strong></li>
              <li style={{ marginBottom: "4px" }}>Financial statements should be <strong>audited or reviewed</strong></li>
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
            }}>🚫 Not Accepted</h4>
            <ul style={{
              margin: "0",
              paddingLeft: "20px",
              color: "#5d4037",
              fontSize: "14px",
              lineHeight: "1.5"
            }}>
              <li style={{ marginBottom: "4px" }}>ZIP/RAR files or executable files</li>
              <li style={{ marginBottom: "4px" }}>Screenshots or photos of computer screens</li>
              <li style={{ marginBottom: "4px" }}>Incomplete or illegible documents</li>
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
            {documentsList.map((document, index) => (
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
                        {(formData[document.id] || []).map((file, fileIndex) => (
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
                              {file.name || `File ${fileIndex + 1}`}
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
                                alignItems: "center"
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

// Export the render function
export const renderDocumentUpload = (data, updateData) => {
  return <DocumentUpload data={data} updateData={updateData} />
}