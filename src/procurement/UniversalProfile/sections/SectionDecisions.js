"use client"

import React from "react"
import { Users, Shield, CheckSquare, AlertCircle, Award } from "lucide-react"

const DEFAULT_STAGES = [
  { id: "shortlist", label: "Stage 1: Shortlisting & Pipeline Qualification", defaultRole: "Procurement Manager" },
  { id: "technical", label: "Stage 2: Technical & SHEQ Scope Review", defaultRole: "Technical or SHEQ Reviewer" },
  { id: "commercial", label: "Stage 3: Commercial & Category Fit Assessment", defaultRole: "Category Manager" },
  { id: "approval", label: "Stage 4: Internal Stage Decision / Conditional Waiver", defaultRole: "Authorized Approver" },
  { id: "portal", label: "Stage 5: External Portal Registration Request", defaultRole: "Procurement Manager" },
  { id: "outcome", label: "Stage 6: Buyer-Confirmed Formal Outcome", defaultRole: "Authorized Approver" },
]

export default function SectionDecisions({ data = {}, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value })
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
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ margin: "0 0 6px 0", fontSize: "1rem", fontWeight: 700, color: "#4A352F" }}>
          Decision Process, Roles & Approval Thresholds
        </h4>
        <p style={{ margin: 0, fontSize: "0.825rem", color: "#8D6E63" }}>
          Configures accountability and decision gates conforming to the brief's 6-role permission matrix.
        </p>
      </div>

      {/* Role Assignment Inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
        <div>
          <label style={labelStyle}>Designated Stage Approver (Role / Email) *</label>
          <input
            type="text"
            placeholder="e.g. Sbonelo Khumalo / approver@anglo.com"
            value={data.approverRole || ""}
            onChange={(e) => handleChange("approverRole", e.target.value)}
            style={inputStyle}
          />
          <div style={{ fontSize: "0.725rem", color: "#8D6E63", marginTop: "4px" }}>
            Authorized to record stage-specific decisions, conditional waivers, and buyer outcomes.
          </div>
        </div>

        <div>
          <label style={labelStyle}>Approval Authority Threshold (ZAR)</label>
          <select
            value={data.approvalThreshold || "R 5,000,000"}
            onChange={(e) => handleChange("approvalThreshold", e.target.value)}
            style={inputStyle}
          >
            <option value="R 500,000">Up to R 500,000</option>
            <option value="R 2,000,000">Up to R 2,000,000</option>
            <option value="R 5,000,000">Up to R 5,000,000</option>
            <option value="R 20,000,000">Up to R 20,000,000</option>
            <option value="Unlimited (Executive Delegation)">Unlimited (Executive Delegation)</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Technical & SHEQ Reviewer Contact</label>
          <input
            type="text"
            placeholder="e.g. Lindelani Dlamini / sheq@anglo.com"
            value={data.technicalReviewer || ""}
            onChange={(e) => handleChange("technicalReviewer", e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>ESD / Supplier Development Lead</label>
          <input
            type="text"
            placeholder="e.g. Nhlanhla Mthembu / esd@anglo.com"
            value={data.esdManager || ""}
            onChange={(e) => handleChange("esdManager", e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Governed Workflow Stages */}
      <div
        style={{
          background: "#FAF7F2",
          border: "1px solid #E8D5C4",
          borderRadius: "8px",
          padding: "16px",
        }}
      >
        <h5 style={{ margin: "0 0 10px 0", fontSize: "0.85rem", fontWeight: 700, color: "#4A352F" }}>
          Active Procurement Approval Journey
        </h5>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {DEFAULT_STAGES.map((stg, i) => (
            <div
              key={stg.id}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E6D7C3",
                borderRadius: "6px",
                padding: "10px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4A352F" }}>
                {stg.label}
              </div>
              <span
                style={{
                  background: "#F5F0E1",
                  color: "#5D4037",
                  fontSize: "0.725rem",
                  fontWeight: 500,
                  padding: "3px 8px",
                  borderRadius: "12px",
                }}
              >
                Owner: {stg.defaultRole}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
