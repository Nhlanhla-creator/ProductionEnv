"use client"

import FormField from "./FormField"
import FileUpload from "./FileUpload"
import { FileText, ExternalLink, Eye, CheckCircle, Circle } from "lucide-react"
import "./AdvisoryApplication.css"

export const DocumentUploads = (data, updateFormData, existingUniversalDocs, documentSelections, onDocumentSelection) => {

  const handleFileChange = (name, files) => {
    updateFormData("documentUploads", { [name]: files })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    updateFormData("documentUploads", { [name]: value })
  }

  const renderReferenceLink = (url, label) => {
    if (!url) return null
    
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "#a67c52",
          textDecoration: "underline",
          fontSize: "12px",
        }}
      >
        <Eye size={12} />
        {label}
        <ExternalLink size={10} />
      </a>
    )
  }

  if (existingUniversalDocs?.loading) {
    return (
      <>
        <h2>Uploads (Conditional)</h2>
        <div style={{ padding: "20px", textAlign: "center" }}>Loading your existing documents...</div>
      </>
    )
  }

  return (
    <>
      <h2>Uploads (Conditional)</h2>
      <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
        Choose which documents to include in this application.
      </p>

      <div className="grid-container">
        {/* Business Plan */}
        <div style={{ padding: "16px", border: "1px solid #e0d5c5", borderRadius: "8px" }}>
          <FormField label="Business Plan (Required if revenue < R1M)">
            
            {/* Option 1: Use existing document */}
            {existingUniversalDocs?.businessPlan && (
              <div 
                onClick={() => onDocumentSelection("businessPlan", "existing")}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "12px", 
                  padding: "12px",
                  marginBottom: "12px",
                  background: documentSelections?.businessPlan === "existing" ? "#e8f5e9" : "#f5f0e1",
                  border: documentSelections?.businessPlan === "existing" ? "2px solid #4caf50" : "1px solid #e0d5c5",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {documentSelections?.businessPlan === "existing" ? (
                  <CheckCircle size={20} color="#4caf50" />
                ) : (
                  <Circle size={20} color="#a67c52" />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>Use existing Business Plan</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {renderReferenceLink(existingUniversalDocs.businessPlan, "View current Business Plan")}
                  </div>
                </div>
              </div>
            )}

            {/* Option 2: Upload new document */}
            <div 
              onClick={() => onDocumentSelection("businessPlan", "new")}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px", 
                padding: "12px",
                marginBottom: "12px",
                background: documentSelections?.businessPlan === "new" ? "#e8f5e9" : "#f5f0e1",
                border: documentSelections?.businessPlan === "new" ? "2px solid #4caf50" : "1px solid #e0d5c5",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {documentSelections?.businessPlan === "new" ? (
                <CheckCircle size={20} color="#4caf50" />
              ) : (
                <Circle size={20} color="#a67c52" />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>Upload new Business Plan</div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Upload a new document specifically for this application
                </div>
              </div>
            </div>

            {/* Show file upload if "new" is selected */}
            {documentSelections?.businessPlan === "new" && (
              <div style={{ marginTop: "12px", marginLeft: "32px" }}>
                <FileUpload
                  label="Upload Business Plan"
                  accept=".pdf,.doc,.docx"
                  onChange={(files) => handleFileChange("businessPlan", files)}
                  value={data.businessPlan || []}
                />
              </div>
            )}

            {/* Show what will be used */}
            <div style={{ marginTop: "12px", padding: "8px", background: "#f0f0f0", borderRadius: "6px", fontSize: "12px" }}>
              <strong>Will use:</strong>{' '}
              {documentSelections?.businessPlan === "existing" ? "Existing Business Plan from your profile" : 
               documentSelections?.businessPlan === "new" ? "New uploaded Business Plan" : 
               "Not selected"}
            </div>
          </FormField>
        </div>

        {/* Latest Financials */}
        <div style={{ padding: "16px", border: "1px solid #e0d5c5", borderRadius: "8px" }}>
          <FormField label="Latest Financials (Optional but boosts matching)">
            
            {/* Option 1: Use existing document */}
            {existingUniversalDocs?.financialStatements?.length > 0 && (
              <div 
                onClick={() => onDocumentSelection("latestFinancials", "existing")}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "12px", 
                  padding: "12px",
                  marginBottom: "12px",
                  background: documentSelections?.latestFinancials === "existing" ? "#e8f5e9" : "#f5f0e1",
                  border: documentSelections?.latestFinancials === "existing" ? "2px solid #4caf50" : "1px solid #e0d5c5",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {documentSelections?.latestFinancials === "existing" ? (
                  <CheckCircle size={20} color="#4caf50" />
                ) : (
                  <Circle size={20} color="#a67c52" />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>Use existing Financial Statements</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                      {existingUniversalDocs.financialStatements.map((doc, idx) => (
                        <div key={idx}>
                          {renderReferenceLink(doc.url, doc.customName)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Option 2: Upload new document */}
            <div 
              onClick={() => onDocumentSelection("latestFinancials", "new")}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px", 
                padding: "12px",
                marginBottom: "12px",
                background: documentSelections?.latestFinancials === "new" ? "#e8f5e9" : "#f5f0e1",
                border: documentSelections?.latestFinancials === "new" ? "2px solid #4caf50" : "1px solid #e0d5c5",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {documentSelections?.latestFinancials === "new" ? (
                <CheckCircle size={20} color="#4caf50" />
              ) : (
                <Circle size={20} color="#a67c52" />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>Upload new Financial Statements</div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Upload a new document specifically for this application
                </div>
              </div>
            </div>

            {/* Option 3: None (skip this document) */}
            <div 
              onClick={() => onDocumentSelection("latestFinancials", "none")}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px", 
                padding: "12px",
                marginBottom: "12px",
                background: documentSelections?.latestFinancials === "none" ? "#e8f5e9" : "#f5f0e1",
                border: documentSelections?.latestFinancials === "none" ? "2px solid #4caf50" : "1px solid #e0d5c5",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {documentSelections?.latestFinancials === "none" ? (
                <CheckCircle size={20} color="#4caf50" />
              ) : (
                <Circle size={20} color="#a67c52" />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>Skip this document</div>
                <div style={{ property: "value", anotherProperty: "value" }}>
                  Don't include financial statements in this application
                </div>
              </div>
            </div>

            {/* Show file upload if "new" is selected */}
            {documentSelections?.latestFinancials === "new" && (
              <div style={{ marginTop: "12px", marginLeft: "32px" }}>
                <FileUpload
                  label="Upload Latest Financials"
                  accept=".pdf,.xlsx,.xls,.doc,.docx"
                  onChange={(files) => handleFileChange("latestFinancials", files)}
                  value={data.latestFinancials || []}
                />
              </div>
            )}

            {/* Show what will be used */}
            <div style={{ marginTop: "12px", padding: "8px", background: "#f0f0f0", borderRadius: "6px", fontSize: "12px" }}>
              <strong>Will use:</strong>{' '}
              {documentSelections?.latestFinancials === "existing" ? "Existing Financial Statements from your profile" : 
               documentSelections?.latestFinancials === "new" ? "New uploaded Financial Statements" : 
               "Not included in this application"}
            </div>
          </FormField>
        </div>
      </div>

      {/* <div className="form-field mt-8">
        <FormField label="Current Board List (If any – else 'None')">
          <textarea
            name="currentBoardList"
            value={data.currentBoardList || ""}
            onChange={handleChange}
            className="form-textarea"
            placeholder="List your current board members and their roles, or enter 'None' if no board exists"
            rows={4}
          />
        </FormField>
      </div> */}
    </>
  )
}