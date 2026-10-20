"use client"

import React, { useState } from "react"
import {
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  X,
  Plus,
  Trash2,
  ShieldCheck,
  Building,
  Award,
  HelpCircle,
  FileCheck,
  RefreshCw,
} from "lucide-react"
import FormField from "./FormField"
import styles from "./catalyst-universal-profile.module.css"
import {
  ORGANISATION_DOCUMENT_TYPES,
  DOCUMENT_REVIEW_STATES,
  AUTHORITY_DOCUMENT_TYPES,
  BBBEE_AFFIDAVIT_TYPES,
} from "./catalystTaxonomy"

export { ORGANISATION_DOCUMENT_TYPES as documentsList } from "./catalystTaxonomy"

export default function CatalystDocumentUpload({
  data = {},
  updateData,
  formData = {},
  isLocked = false,
}) {
  const docsData = data || {}
  const entityOverview = formData.entityOverview || {}
  const isHosted = entityOverview.organisationalArrangement === "hosted"
  const isNPO =
    entityOverview.legalEntityType === "non_profit" ||
    entityOverview.organisationType === "nonprofit"

  const updateDoc = (docId, patch) => {
    const current = docsData[docId] || {}
    updateData({
      ...docsData,
      [docId]: {
        ...current,
        ...patch,
      },
    })
  }

  const handleFileUpload = (docId, e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 10MB file limit check
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds the 10 MB limit. Please select a smaller file.")
      return
    }

    const current = docsData[docId] || {}
    updateDoc(docId, {
      file,
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      uploadedAt: new Date().toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: current.status === "accepted" ? "accepted" : "uploaded",
    })
  }

  const handleRemoveFile = (docId) => {
    updateDoc(docId, {
      file: null,
      fileName: "",
      fileSize: "",
      uploadedAt: "",
      status: "missing",
    })
  }

  // Repeatable Accreditations State
  const accreditations = Array.isArray(docsData.accreditations)
    ? docsData.accreditations
    : []

  const updateAccreditationsList = (newList) => {
    updateData({
      ...docsData,
      accreditations: newList,
    })
  }

  const handleAddAccreditation = () => {
    const newItem = {
      id: `acc_${Date.now()}`,
      issuer: "",
      credentialName: "",
      credentialId: "",
      issueDate: "",
      expiryDate: "",
      fileName: "",
      fileSize: "",
      status: "missing",
    }
    updateAccreditationsList([...accreditations, newItem])
  }

  const handleAccreditationChange = (id, field, value) => {
    const updated = accreditations.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    )
    updateAccreditationsList(updated)
  }

  const handleAccreditationFileUpload = (id, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alert("File exceeds 10 MB limit.")
      return
    }
    const updated = accreditations.map((item) =>
      item.id === id
        ? {
            ...item,
            file,
            fileName: file.name,
            fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            status: "uploaded",
            uploadedAt: new Date().toLocaleDateString("en-ZA"),
          }
        : item
    )
    updateAccreditationsList(updated)
  }

  const handleRemoveAccreditation = (id) => {
    updateAccreditationsList(accreditations.filter((item) => item.id !== id))
  }

  // Repeatable Supplementary Documents State
  const supplementaryDocs = Array.isArray(docsData.supplementaryDocs)
    ? docsData.supplementaryDocs
    : []

  const updateSupplementaryList = (newList) => {
    updateData({
      ...docsData,
      supplementaryDocs: newList,
    })
  }

  const handleAddSupplementary = () => {
    const newItem = {
      id: `supp_${Date.now()}`,
      title: "",
      description: "",
      fileName: "",
      fileSize: "",
      status: "missing",
    }
    updateSupplementaryList([...supplementaryDocs, newItem])
  }

  const handleSupplementaryChange = (id, field, value) => {
    const updated = supplementaryDocs.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    )
    updateSupplementaryList(updated)
  }

  const handleSupplementaryFileUpload = (id, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alert("File exceeds 10 MB limit.")
      return
    }
    const updated = supplementaryDocs.map((item) =>
      item.id === id
        ? {
            ...item,
            file,
            fileName: file.name,
            fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            status: "uploaded",
            uploadedAt: new Date().toLocaleDateString("en-ZA"),
          }
        : item
    )
    updateSupplementaryList(updated)
  }

  const handleRemoveSupplementary = (id) => {
    updateSupplementaryList(supplementaryDocs.filter((item) => item.id !== id))
  }

  const renderStatusPill = (statusId = "missing") => {
    const meta = DOCUMENT_REVIEW_STATES[statusId] || DOCUMENT_REVIEW_STATES.missing
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "3px 10px",
          borderRadius: "14px",
          fontSize: "12px",
          fontWeight: 600,
          backgroundColor: meta.bg,
          color: meta.color,
          border: `1px solid ${meta.border}`,
        }}
      >
        {statusId === "accepted" && <CheckCircle2 size={13} />}
        {statusId === "uploaded" && <Clock size={13} />}
        {statusId === "under_review" && <RefreshCw size={13} />}
        {statusId === "clarification_required" && <AlertTriangle size={13} />}
        {statusId === "rejected" && <XCircle size={13} />}
        {statusId === "missing" && <Clock size={13} />}
        {meta.label}
      </span>
    )
  }

  const sectionHeadingStyle = {
    borderBottom: "2px solid #795548",
    marginBottom: "1.25rem",
    marginTop: "2rem",
    paddingBottom: "6px",
  }

  const sectionHeadingTextStyle = {
    color: "#4e342e",
    fontSize: "16px",
    fontWeight: "700",
    margin: 0,
  }

  return (
    <div className={styles.productApplicationContainer}>
      <h2 className={styles.productApplicationHeading}>Organisation Document Vault</h2>

      <div
        style={{
          backgroundColor: "#f8f5f2",
          borderLeft: "4px solid #795548",
          padding: "12px 16px",
          borderRadius: "4px",
          marginBottom: "1.5rem",
          color: "#5d4037",
          fontSize: "14px",
          lineHeight: "1.5",
        }}
      >
        <strong>Document Vault Guidance:</strong> Provide institutional records verifying your organisation&apos;s legal identity, representative authority, and statutory compliance. Uploading a document submits it for administrator verification. Programme-specific brochures and participant contracts are managed within each programme setup workspace.
      </div>

      {/* ─── Core Institutional Documents Grid ──────────────────────────────── */}
      <div style={sectionHeadingStyle}>
        <h3 style={sectionHeadingTextStyle}>Core Legal & Statutory Records</h3>
      </div>

      <div style={{ display: "grid", gap: "1.25rem" }}>
        {ORGANISATION_DOCUMENT_TYPES.map((docDef) => {
          const docState = docsData[docDef.id] || {}
          const hasFile = !!docState.fileName
          const currentStatus = docState.status || (hasFile ? "uploaded" : "missing")

          // Determine dynamic requirement badge
          let isRequired = docDef.required
          let reqLabel = "Required"
          let reqColor = "#c62828"

          if (docDef.isConditionalHosted) {
            isRequired = isHosted
            reqLabel = isHosted ? "Required for Hosted Unit" : "Conditional (Hosted Units)"
            reqColor = isHosted ? "#c62828" : "#8d6e63"
          } else if (docDef.isConditionalNPO) {
            isRequired = isNPO
            reqLabel = isNPO ? "Required for Nonprofits" : "Conditional (NPOs / NPCs)"
            reqColor = isNPO ? "#c62828" : "#8d6e63"
          } else if (!docDef.required) {
            reqLabel = "Optional Supporting Document"
            reqColor = "#8d6e63"
          }

          return (
            <div
              key={docDef.id}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                padding: "1.25rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              {/* Header row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginBottom: "0.75rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        backgroundColor: "#f3ebe0",
                        color: "#5d4037",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        textTransform: "uppercase",
                      }}
                    >
                      {docDef.category}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: reqColor,
                      }}
                    >
                      {reqLabel}
                    </span>
                  </div>

                  <h4
                    style={{
                      margin: "6px 0 2px 0",
                      fontSize: "15px",
                      color: "#4e342e",
                      fontWeight: 700,
                    }}
                  >
                    {docDef.label} {isRequired && <span style={{ color: "#c62828" }}>*</span>}
                  </h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "#6d4c41" }}>
                    {docDef.tooltip}
                  </p>
                </div>

                <div>{renderStatusPill(currentStatus)}</div>
              </div>

              {/* Conditional metadata inputs for specific doc types */}
              {docDef.id === "authority_representation" && (
                <div style={{ maxWidth: "380px", marginBottom: "0.75rem" }}>
                  <FormField
                    label="Authority Document Type"
                    tooltip="Format of official legal appointment or power of attorney."
                  >
                    <select
                      value={docState.authorityType || "authorisation_letter"}
                      onChange={(e) => updateDoc(docDef.id, { authorityType: e.target.value })}
                      className={styles.formSelect}
                    >
                      {AUTHORITY_DOCUMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              )}

              {docDef.id === "tax_clearance" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "1rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <FormField
                    label="SARS Tax Compliance Status PIN"
                    tooltip="Security PIN issued by SARS for digital third-party compliance verification."
                  >
                    <input
                      type="text"
                      value={docState.taxPin || ""}
                      onChange={(e) => updateDoc(docDef.id, { taxPin: e.target.value })}
                      placeholder="e.g. 1234567890"
                      className={styles.formInput}
                    />
                  </FormField>
                  <FormField
                    label="PIN / Certificate Expiry Date"
                    tooltip="Date until which the tax PIN remains active for verification."
                  >
                    <input
                      type="date"
                      value={docState.taxExpiry || ""}
                      onChange={(e) => updateDoc(docDef.id, { taxExpiry: e.target.value })}
                      className={styles.formInput}
                    />
                  </FormField>
                </div>
              )}

              {docDef.id === "bbbee_evidence" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "1rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <FormField
                    label="B-BBEE Evidence Type"
                    tooltip="Form of B-BBEE verification supplied."
                  >
                    <select
                      value={docState.bbbeeType || "sworn_affidavit_eme"}
                      onChange={(e) => updateDoc(docDef.id, { bbbeeType: e.target.value })}
                      className={styles.formSelect}
                    >
                      {BBBEE_AFFIDAVIT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField
                    label="B-BBEE Recognition Level"
                    tooltip="Current contributor level."
                  >
                    <select
                      value={docState.bbbeeLevel || "level_1"}
                      onChange={(e) => updateDoc(docDef.id, { bbbeeLevel: e.target.value })}
                      className={styles.formSelect}
                    >
                      <option value="level_1">Level 1 Contributor (135% Recognition)</option>
                      <option value="level_2">Level 2 Contributor (125% Recognition)</option>
                      <option value="level_3">Level 3 Contributor (110% Recognition)</option>
                      <option value="level_4">Level 4 Contributor (100% Recognition)</option>
                      <option value="level_5">Level 5 Contributor (80% Recognition)</option>
                      <option value="level_6">Level 6 Contributor (60% Recognition)</option>
                      <option value="level_7">Level 7 Contributor (50% Recognition)</option>
                      <option value="level_8">Level 8 Contributor (10% Recognition)</option>
                      <option value="non_compliant">Non-Compliant Contributor</option>
                    </select>
                  </FormField>
                  <FormField
                    label="Certificate Expiry Date"
                    tooltip="Annual expiry date of the certificate or affidavit."
                  >
                    <input
                      type="date"
                      value={docState.bbbeeExpiry || ""}
                      onChange={(e) => updateDoc(docDef.id, { bbbeeExpiry: e.target.value })}
                      className={styles.formInput}
                    />
                  </FormField>
                </div>
              )}

              {/* Upload area or File display */}
              {!hasFile ? (
                <div
                  style={{
                    border: "1.5px dashed #bcaaa4",
                    borderRadius: "6px",
                    padding: "1rem",
                    backgroundColor: "#faf8f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "13px", color: "#5d4037", fontWeight: 600 }}>
                      No file uploaded yet
                    </span>
                    <span style={{ display: "block", fontSize: "12px", color: "#8d6e63" }}>
                      Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10 MB)
                    </span>
                  </div>

                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 14px",
                      backgroundColor: "#795548",
                      color: "#ffffff",
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: isLocked ? "not-allowed" : "pointer",
                    }}
                  >
                    <Upload size={14} /> Upload File
                    <input
                      type="file"
                      accept={docDef.formats}
                      onChange={(e) => handleFileUpload(docDef.id, e)}
                      disabled={isLocked}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              ) : (
                <div
                  style={{
                    border: "1px solid #c8e6c9",
                    backgroundColor: "#f1f8e9",
                    borderRadius: "6px",
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <FileText size={20} color="#2e7d32" />
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "13px", color: "#1b5e20", display: "block" }}>
                        {docState.fileName}
                      </span>
                      <span style={{ fontSize: "11px", color: "#558b2f" }}>
                        Size: {docState.fileSize} • Uploaded: {docState.uploadedAt}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label
                      title="Replace file"
                      style={{
                        padding: "4px 10px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "12px",
                        color: "#5d4037",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <RefreshCw size={12} /> Replace
                      <input
                        type="file"
                        accept={docDef.formats}
                        onChange={(e) => handleFileUpload(docDef.id, e)}
                        disabled={isLocked}
                        style={{ display: "none" }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => handleRemoveFile(docDef.id)}
                      disabled={isLocked}
                      title="Remove file"
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#ffebee",
                        border: "1px solid #ffcdd2",
                        borderRadius: "4px",
                        fontSize: "12px",
                        color: "#c62828",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ─── Accreditations & Memberships ───────────────────────────────────── */}
      <div style={sectionHeadingStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={sectionHeadingTextStyle}>Accreditations & Professional Memberships</h3>
          <button
            type="button"
            onClick={handleAddAccreditation}
            disabled={isLocked}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              backgroundColor: "#f3ebe0",
              border: "1px solid #d7ccc8",
              borderRadius: "4px",
              color: "#4e342e",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={14} /> Add Accreditation
          </button>
        </div>
      </div>

      <p style={{ margin: "0 0 1rem 0", fontSize: "13px", color: "#6d4c41" }}>
        Optional verification credentials (e.g. SETA accreditation, professional body registration, or incubator alliance memberships).
      </p>

      {accreditations.length === 0 ? (
        <div
          style={{
            padding: "1.25rem",
            backgroundColor: "#fff",
            border: "1px dashed #d7ccc8",
            borderRadius: "6px",
            textAlign: "center",
            color: "#8d6e63",
            fontSize: "13px",
            marginBottom: "1.5rem",
          }}
        >
          No accreditations added yet. Click &quot;Add Accreditation&quot; above if your organisation holds industry or educational credentials.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px", marginBottom: "1.5rem" }}>
          {accreditations.map((acc, idx) => (
            <div
              key={acc.id}
              style={{
                backgroundColor: "#fff",
                border: "1px solid #d7ccc8",
                borderRadius: "6px",
                padding: "1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontWeight: 700, fontSize: "14px", color: "#4e342e" }}>
                  Credential #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveAccreditation(acc.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#c62828",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <FormField label="Issuing Body / Institution" required>
                  <input
                    type="text"
                    value={acc.issuer || ""}
                    onChange={(e) => handleAccreditationChange(acc.id, "issuer", e.target.value)}
                    placeholder="e.g. Services SETA / SABEN"
                    className={styles.formInput}
                  />
                </FormField>
                <FormField label="Credential / Programme Name" required>
                  <input
                    type="text"
                    value={acc.credentialName || ""}
                    onChange={(e) => handleAccreditationChange(acc.id, "credentialName", e.target.value)}
                    placeholder="e.g. Accredited Training Provider"
                    className={styles.formInput}
                  />
                </FormField>
                <FormField label="Accreditation Number / ID">
                  <input
                    type="text"
                    value={acc.credentialId || ""}
                    onChange={(e) => handleAccreditationChange(acc.id, "credentialId", e.target.value)}
                    placeholder="e.g. ACC/2022/9871"
                    className={styles.formInput}
                  />
                </FormField>
                <FormField label="Expiry Date (if applicable)">
                  <input
                    type="date"
                    value={acc.expiryDate || ""}
                    onChange={(e) => handleAccreditationChange(acc.id, "expiryDate", e.target.value)}
                    className={styles.formInput}
                  />
                </FormField>
              </div>

              {/* File upload for credential */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                {!acc.fileName ? (
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      backgroundColor: "#795548",
                      color: "#fff",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    <Upload size={12} /> Upload Certificate
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleAccreditationFileUpload(acc.id, e)}
                      style={{ display: "none" }}
                    />
                  </label>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#2e7d32" }}>
                    <FileCheck size={14} /> {acc.fileName} ({acc.fileSize})
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Supplementary Organisation Documents ──────────────────────────── */}
      <div style={sectionHeadingStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={sectionHeadingTextStyle}>Supplementary Organisation Documents</h3>
          <button
            type="button"
            onClick={handleAddSupplementary}
            disabled={isLocked}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              backgroundColor: "#f3ebe0",
              border: "1px solid #d7ccc8",
              borderRadius: "4px",
              color: "#4e342e",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={14} /> Add Document
          </button>
        </div>
      </div>

      <p style={{ margin: "0 0 1rem 0", fontSize: "13px", color: "#6d4c41" }}>
        Optional additional evidence (e.g. audited annual financial statements, facility lease agreements, or ecosystem partnership letters).
      </p>

      {supplementaryDocs.length === 0 ? (
        <div
          style={{
            padding: "1.25rem",
            backgroundColor: "#fff",
            border: "1px dashed #d7ccc8",
            borderRadius: "6px",
            textAlign: "center",
            color: "#8d6e63",
            fontSize: "13px",
            marginBottom: "1.5rem",
          }}
        >
          No supplementary documents added. Click &quot;Add Document&quot; if needed.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px", marginBottom: "1.5rem" }}>
          {supplementaryDocs.map((supp) => (
            <div
              key={supp.id}
              style={{
                backgroundColor: "#fff",
                border: "1px solid #d7ccc8",
                borderRadius: "6px",
                padding: "1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontWeight: 700, fontSize: "14px", color: "#4e342e" }}>
                  Supplementary Document
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveSupplementary(supp.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#c62828",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <FormField label="Document Title" required>
                  <input
                    type="text"
                    value={supp.title || ""}
                    onChange={(e) => handleSupplementaryChange(supp.id, "title", e.target.value)}
                    placeholder="e.g. Audited Annual Financial Statements 2026"
                    className={styles.formInput}
                  />
                </FormField>
                <FormField label="Brief Description / Purpose">
                  <input
                    type="text"
                    value={supp.description || ""}
                    onChange={(e) => handleSupplementaryChange(supp.id, "description", e.target.value)}
                    placeholder="e.g. Full institutional audit by KPMG"
                    className={styles.formInput}
                  />
                </FormField>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                {!supp.fileName ? (
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      backgroundColor: "#795548",
                      color: "#fff",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    <Upload size={12} /> Upload File
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleSupplementaryFileUpload(supp.id, e)}
                      style={{ display: "none" }}
                    />
                  </label>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#2e7d32" }}>
                    <FileCheck size={14} /> {supp.fileName} ({supp.fileSize})
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}