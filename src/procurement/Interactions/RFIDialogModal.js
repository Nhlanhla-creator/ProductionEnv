"use client"

import React, { useState, useEffect } from "react"
import { X, Send, FileQuestion, Calendar, AlertCircle, CheckCircle } from "lucide-react"

const RFI_TYPES = [
  "Document Clarification",
  "Capacity & Shift Verification",
  "Technical Scope Inquiry",
  "Pricing & Rate Card Confirmation",
  "B-BBEE Scorecard Audit",
  "Safety & SHEQ Site Clearance",
  "Banking Details Verification",
]

export default function RFIDialogModal({
  isOpen,
  onClose,
  supplier,
  onSubmitRFI,
}) {
  const [type, setType] = useState("Document Clarification")
  const [subject, setSubject] = useState("")
  const [details, setDetails] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [requiresUpload, setRequiresUpload] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Default subject based on supplier
  useEffect(() => {
    if (supplier) {
      setSubject(`Information Request: ${supplier.offeringCategory || "Service Provision"} - ${supplier.name}`)
      // Default due date to 5 days from now
      const inFiveDays = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split("T")[0]
      setDueDate(inFiveDays)
    }
  }, [supplier])

  if (!isOpen || !supplier) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !details.trim()) return

    setSubmitting(true)
    try {
      await onSubmitRFI({
        supplierId: supplier.id,
        supplierName: supplier.name,
        type,
        subject,
        details,
        dueDate,
        requiresUpload,
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "6px",
    border: "1px solid #C8B6A6",
    fontSize: "0.85rem",
    color: "#4A352F",
    background: "#FFFFFF",
    boxSizing: "border-box",
    outline: "none",
  }

  const labelStyle = {
    display: "block",
    fontSize: "0.775rem",
    fontWeight: 600,
    color: "#5D4037",
    marginBottom: "5px",
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: "rgba(30, 20, 15, 0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          backgroundColor: "#FAF7F2",
          borderRadius: "12px",
          boxShadow: "0 18px 36px rgba(0,0,0,0.22)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 22px",
            background: "#4A352F",
            color: "#FAF7F2",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FileQuestion size={20} color="#D4AF37" />
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "#FAF7F2" }}>
                Issue Request for Information (RFI)
              </h3>
              <div style={{ fontSize: "0.75rem", color: "#D7CCC8", marginTop: "2px" }}>
                To: {supplier.name} ({supplier.offeringCategory})
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "none",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#FAF7F2",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={labelStyle}>Request Classification *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={inputStyle}
              >
                {RFI_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Response Due Date *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>RFI Title / Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Clarification on certified technician headcount"
              style={inputStyle}
              required
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Detailed Requirements & Questions *</label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Clearly state what information, evidence, or clarification the supplier must provide..."
              style={{ ...inputStyle, resize: "vertical" }}
              required
            />
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#FFFFFF",
              border: "1px solid #E6D7C3",
              borderRadius: "6px",
              padding: "10px 14px",
              cursor: "pointer",
              marginBottom: "16px",
            }}
          >
            <input
              type="checkbox"
              checked={requiresUpload}
              onChange={(e) => setRequiresUpload(e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <span style={{ fontSize: "0.775rem", color: "#4A352F", fontWeight: 500 }}>
              Requires document attachment / evidence upload from supplier
            </span>
          </label>

          {/* Audit Notice */}
          <div style={{ fontSize: "0.725rem", color: "#8D6E63", marginBottom: "18px" }}>
            ℹ️ This request creates an auditable interaction thread visible on both the Procurement and Supplier dashboards.
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                background: "#FFFFFF",
                border: "1px solid #C8B6A6",
                borderRadius: "6px",
                color: "#4A352F",
                fontSize: "0.825rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "8px 20px",
                background: "#4A352F",
                border: "none",
                borderRadius: "6px",
                color: "#FAF7F2",
                fontSize: "0.825rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              <Send size={14} /> {submitting ? "Dispatching..." : "Send Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
