"use client"

import React, { useState } from "react"
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck,
  UserCheck,
  Calendar,
  Lock,
} from "lucide-react"

const GATE_TYPES = [
  "Tender Readiness Gate (Commercial / SLA)",
  "SHEQ & Statutory Compliance Gate (COIDA / Safety / Tax)",
  "Technical Capability & Capacity Gate (Equipment / Staff)",
  "Vendor Master Onboarding Gate (Banking / ERP Approval)",
  "ESD Incubation Stage Gate (5C Development)",
]

const OUTCOMES = [
  { id: "Approved", label: "Approved (Stage Gate Passed)", color: "#2E7D32", bg: "rgba(46, 125, 50, 0.12)" },
  { id: "Conditional", label: "Conditional Pass (Requirements Pending)", color: "#D4AF37", bg: "rgba(212, 175, 55, 0.18)" },
  { id: "Rejected", label: "Rejected (Gate Discontinued)", color: "#C62828", bg: "rgba(198, 40, 40, 0.12)" },
]

const REJECTION_CODES = [
  "Failed Technical / Quality Minimum Standards",
  "Commercial / Pricing Structure Disparity",
  "Critical SHEQ / Safety File Non-compliance",
  "Statutory Invalidation (SARS / COIDA / CIPC)",
  "Capacity Bottleneck for Target SLA",
  "Adverse Supplier Risk / Governance Finding",
]

export default function StageDecisionModal({
  isOpen,
  onClose,
  supplier,
  buyerProfile,
  onSaveDecision,
}) {
  const dec = buyerProfile?.decisionProcess || {}

  const [gateType, setGateType] = useState(GATE_TYPES[0])
  const [outcome, setOutcome] = useState("Approved")
  const [approver, setApprover] = useState(dec.approverRole || "Sbonelo Khumalo (CPO)")
  const [reviewer, setReviewer] = useState(dec.technicalReviewer || "Lindelani Dlamini (SHEQ Lead)")
  const [justification, setJustification] = useState("")
  const [conditionalRequirements, setConditionalRequirements] = useState("")
  const [rejectionCode, setRejectionCode] = useState(REJECTION_CODES[0])

  if (!isOpen || !supplier) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!justification.trim()) return

    onSaveDecision({
      id: `decision_${Date.now()}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierCategory: supplier.offeringCategory || "General",
      gateType,
      outcome,
      approver: approver.trim(),
      reviewer: reviewer.trim(),
      justification: justification.trim(),
      conditionalRequirements: outcome === "Conditional" ? conditionalRequirements.trim() : undefined,
      rejectionCode: outcome === "Rejected" ? rejectionCode : undefined,
      timestamp: new Date().toISOString(),
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

  const selectedOutcomeConfig = OUTCOMES.find((o) => o.id === outcome) || OUTCOMES[0]

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
          maxWidth: "660px",
          maxHeight: "92vh",
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
            <FileCheck size={20} color="#D4AF37" />
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#FAF7F2" }}>
                Auditable Stage-Gate Governance Decision
              </h3>
              <div style={{ fontSize: "0.75rem", color: "#D7CCC8", marginTop: "2px" }}>
                Target: <strong>{supplier.name}</strong> · Category: {supplier.offeringCategory || "General"}
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
          {/* Supplier Snapshot Card */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6D7C3",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#4A352F" }}>
                {supplier.name}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#8D6E63", marginTop: "2px" }}>
                {supplier.location} · B-BBEE: {supplier.bbbeeLevel} · Turnover: {supplier.turnoverBracket || "QSE"}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#4A352F" }}>
                BIG Score: {supplier.bigScore || 50}/100
              </div>
              <div style={{ fontSize: "0.725rem", color: "#2E7D32", fontWeight: 600 }}>
                Verification Coverage: {supplier.verifiedCoverage || 60}%
              </div>
            </div>
          </div>

          {/* Gate Selection */}
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Stage Gate under Evaluation *</label>
            <select
              value={gateType}
              onChange={(e) => setGateType(e.target.value)}
              style={inputStyle}
            >
              {GATE_TYPES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Decision Outcome Selector */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Gate Decision Outcome *</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              {OUTCOMES.map((o) => {
                const isSelected = outcome === o.id
                return (
                  <div
                    key={o.id}
                    onClick={() => setOutcome(o.id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: isSelected ? `2px solid ${o.color}` : "1px solid #D7CCC8",
                      background: isSelected ? o.bg : "#FFFFFF",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: o.color }}>
                      {o.id}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#6D4C41", marginTop: "2px" }}>
                      {o.id === "Approved" ? "Gate Cleared" : o.id === "Conditional" ? "Remediation" : "Discontinued"}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Approver & Reviewer Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={labelStyle}>Lead Approver / Sign-Off *</label>
              <input
                type="text"
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Technical Reviewer / Second Sign-Off</label>
              <input
                type="text"
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Conditional Requirements (if conditional) */}
          {outcome === "Conditional" && (
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Conditional Remediation Requirements *</label>
              <textarea
                value={conditionalRequirements}
                onChange={(e) => setConditionalRequirements(e.target.value)}
                placeholder="e.g. Approved subject to receipt of updated Tax Pin within 14 calendar days and satisfactory site sample test."
                rows={2}
                style={{ ...inputStyle, borderColor: "#D4AF37", resize: "vertical" }}
                required
              />
              <div style={{ fontSize: "0.72rem", color: "#8D6E63", marginTop: "3px" }}>
                These mandatory requirements must be verified before progressing to contract award.
              </div>
            </div>
          )}

          {/* Rejection Code (if rejected) */}
          {outcome === "Rejected" && (
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Root Cause Rejection Code *</label>
              <select
                value={rejectionCode}
                onChange={(e) => setRejectionCode(e.target.value)}
                style={{ ...inputStyle, borderColor: "#C62828" }}
              >
                {REJECTION_CODES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}

          {/* Justification & Audit Log */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Evaluation Findings & Justification *</label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Provide a comprehensive auditable explanation of the findings, evidence inspected, and commercial reasoning..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              required
            />
            <div style={{ fontSize: "0.72rem", color: "#8D6E63", marginTop: "3px" }}>
              Logged permanently in the compliance audit trail for statutory and tender review.
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
                background: selectedOutcomeConfig.color,
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
              <CheckCircle2 size={15} /> Record Auditable Decision
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
