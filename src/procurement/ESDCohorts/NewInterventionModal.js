"use client"

import React, { useState } from "react"
import { X, Wrench, Calendar, ShieldCheck, CheckCircle2, DollarSign, UserCheck, AlertCircle } from "lucide-react"

const GAP_TEMPLATES = [
  "Lack of accredited ISO 45001 / ISO 9001 certification",
  "Working capital shortfall for Purchase Order fulfillment",
  "Machinery & tooling capacity bottleneck (turnaround > 10 days)",
  "Statutory environmental / waste transit licensing missing",
  "SHEQ file non-compliant with mine safety gates",
  "Financial management, audit readiness & cash flow forecasting",
  "Cybersecurity standard non-compliance (ISO 27001 / SOC2)",
]

const FUNDING_SOURCES = [
  "Enterprise Development (ED) Grant",
  "Supplier Development (SD) Contribution",
  "Revolving PO Working Capital Facility",
  "Sponsor Subsidized Incubation Voucher",
  "Shared Co-Investment",
  "Zero-Cost Technical Mentorship",
]

export default function NewInterventionModal({
  isOpen,
  onClose,
  cohort,
  supplier,
  onSaveIntervention,
}) {
  const [gap, setGap] = useState(GAP_TEMPLATES[0])
  const [customGap, setCustomGap] = useState("")
  const [intervention, setIntervention] = useState("")
  const [provider, setProvider] = useState("")
  const [owner, setOwner] = useState(cohort?.owner || "Nhlanhla Mthembu")
  const [dueDate, setDueDate] = useState("")
  const [evidenceRequired, setEvidenceRequired] = useState("")
  const [fundingSource, setFundingSource] = useState(FUNDING_SOURCES[0])
  const [fundingAmount, setFundingAmount] = useState("")
  const [status, setStatus] = useState("In Progress")

  if (!isOpen || !cohort || !supplier) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const resolvedGap = customGap.trim() || gap
    const finalFunding = fundingAmount ? `${fundingSource} (${fundingAmount})` : fundingSource

    onSaveIntervention(cohort.id, supplier.supplierId, {
      gap: resolvedGap,
      intervention: intervention.trim(),
      provider: provider.trim() || "Approved ESD Technical Partner",
      owner: owner.trim() || "Nhlanhla Mthembu",
      dueDate: dueDate || new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
      evidenceRequired: evidenceRequired.trim() || "Documentary proof and audit verification",
      fundingSource: finalFunding,
      status: status || "In Progress",
    })

    onClose()
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
        backgroundColor: "rgba(30, 20, 15, 0.58)",
        backdropFilter: "blur(4px)",
        zIndex: 1300,
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
          maxWidth: "640px",
          maxHeight: "90vh",
          backgroundColor: "#FAF7F2",
          borderRadius: "12px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            background: "#4A352F",
            color: "#FAF7F2",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Wrench size={20} color="#D4AF37" />
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#FAF7F2" }}>
                Assign Development Intervention
              </h3>
              <div style={{ fontSize: "0.75rem", color: "#D7CCC8", marginTop: "2px" }}>
                Target: <strong>{supplier.supplierName}</strong> ({supplier.category})
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

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: "20px 24px", overflowY: "auto" }}>
          {/* Supplier constraint recap */}
          <div
            style={{
              background: "#FFF8F0",
              border: "1px solid #E8D5C4",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <AlertCircle size={18} color="#D4AF37" />
            <div style={{ fontSize: "0.8rem", color: "#4A352F" }}>
              Primary Diagnostic Constraint: <strong>{supplier.primaryConstraint || "General Capability"}</strong>
            </div>
          </div>

          {/* Gap Selection */}
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Identified Gap / Deficiency *</label>
            <select
              value={gap}
              onChange={(e) => setGap(e.target.value)}
              style={inputStyle}
            >
              {GAP_TEMPLATES.map((t, idx) => (
                <option key={idx} value={t}>{t}</option>
              ))}
              <option value="custom">Other / Custom Gap...</option>
            </select>
            {gap === "custom" && (
              <input
                type="text"
                value={customGap}
                onChange={(e) => setCustomGap(e.target.value)}
                placeholder="Specify the specific commercial or technical bottleneck..."
                style={{ ...inputStyle, marginTop: "8px" }}
                required
              />
            )}
          </div>

          {/* Intervention Title */}
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Intervention Name & Scope *</label>
            <input
              type="text"
              value={intervention}
              onChange={(e) => setIntervention(e.target.value)}
              placeholder="e.g. SABS ISO 45001 Readiness Coaching & Pre-audit Mock Inspection"
              style={inputStyle}
              required
            />
          </div>

          {/* Provider & Owner Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={labelStyle}>Service Provider / Coach *</label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. SABS Advisory / Productivity SA"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>ESD / Procurement Lead *</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. Nhlanhla Mthembu"
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Due Date & Status Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={labelStyle}>Target Completion Date *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Initial Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={inputStyle}
              >
                <option value="In Progress">In Progress</option>
                <option value="Planned">Planned</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Evidence Required */}
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Evidence Required for Completion Sign-Off *</label>
            <input
              type="text"
              value={evidenceRequired}
              onChange={(e) => setEvidenceRequired(e.target.value)}
              placeholder="e.g. Stage 2 Audit Clearance Certificate / Formal Accreditation Letter"
              style={inputStyle}
              required
            />
            <div style={{ fontSize: "0.72rem", color: "#8D6E63", marginTop: "3px" }}>
              Auditable proof required before advancing commercial stage or closing the intervention.
            </div>
          </div>

          {/* Funding Source & Amount */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "12px", marginBottom: "20px" }}>
            <div>
              <label style={labelStyle}>Funding Source / Vehicle *</label>
              <select
                value={fundingSource}
                onChange={(e) => setFundingSource(e.target.value)}
                style={inputStyle}
              >
                {FUNDING_SOURCES.map((f, idx) => (
                  <option key={idx} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Budget Allocation (Optional)</label>
              <input
                type="text"
                value={fundingAmount}
                onChange={(e) => setFundingAmount(e.target.value)}
                placeholder="e.g. R 120,000"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "8px", borderTop: "1px solid #E8D5C4" }}>
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
              }}
            >
              <CheckCircle2 size={15} /> Save & Assign Intervention
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
