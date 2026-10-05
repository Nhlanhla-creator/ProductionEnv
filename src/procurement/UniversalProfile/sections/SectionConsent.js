"use client"

import React from "react"
import { ShieldCheck, Lock, FileText, CheckCircle2 } from "lucide-react"

export default function SectionConsent({ data = {}, onChange }) {
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
          Data Minimisation, Evidence Visibility & Consent Policy
        </h4>
        <p style={{ margin: 0, fontSize: "0.825rem", color: "#8D6E63" }}>
          Enforces data access boundaries, restricted document limitations, and benchmark governance.
        </p>
      </div>

      {/* Restricted Evidence Governance Card */}
      <div
        style={{
          background: "#FAF7F2",
          border: "1px solid #E8D5C4",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <Lock size={16} color="#8D6E63" />
          <h5 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#4A352F" }}>
            Evidence Access Boundaries (Brief Page 4)
          </h5>
        </div>
        <p style={{ margin: "0 0 12px 0", fontSize: "0.775rem", color: "#5D4037", lineHeight: "1.45" }}>
          The buyer sees only evidence permitted for that organisation and purpose. Restricted supplier documents (detailed financials, personal medical disclosures) display a clear limitation label rather than disappearing silently or leaking without delegated SHEQ/Finance authority.
        </p>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#FFFFFF",
            padding: "10px 14px",
            borderRadius: "6px",
            border: "1px solid #E6D7C3",
            cursor: "pointer",
            marginBottom: "8px",
          }}
        >
          <input
            type="checkbox"
            checked={data.strictEvidenceMinimisation !== false}
            onChange={(e) => handleChange("strictEvidenceMinimisation", e.target.checked)}
            style={{ width: "16px", height: "16px", cursor: "pointer" }}
          />
          <span style={{ fontSize: "0.775rem", color: "#4A352F", fontWeight: 500 }}>
            Enforce strict evidence minimisation: hide detailed financials and medical files from standard Procurement Managers.
          </span>
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#FFFFFF",
            padding: "10px 14px",
            borderRadius: "6px",
            border: "1px solid #E6D7C3",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={data.agreedToBenchmark !== false}
            onChange={(e) => handleChange("agreedToBenchmark", e.target.checked)}
            style={{ width: "16px", height: "16px", cursor: "pointer" }}
          />
          <span style={{ fontSize: "0.775rem", color: "#4A352F", fontWeight: 500 }}>
            Permit aggregated, anonymized benchmarking of supplier readiness gaps and delivery lead times.
          </span>
        </label>
      </div>

      {/* Data Retention & Export Policy */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
        <div>
          <label style={labelStyle}>Audit Log Retention Period</label>
          <select
            value={data.retentionPeriod || "5 Years (Standard Audit)"}
            onChange={(e) => handleChange("retentionPeriod", e.target.value)}
            style={inputStyle}
          >
            <option value="3 Years">3 Years</option>
            <option value="5 Years (Standard Audit)">5 Years (Standard Corporate Audit)</option>
            <option value="7 Years (Statutory Tax & Mining)">7 Years (Statutory Mining / Tax)</option>
            <option value="Indefinite Archive">Indefinite Immutable Archive</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Authorized Officer Signing Declaration *</label>
          <input
            type="text"
            placeholder="e.g. Sbonelo Khumalo / CPO"
            value={data.policySignedBy || ""}
            onChange={(e) => handleChange("policySignedBy", e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Declaration Confirmation */}
      <div
        style={{
          border: "2px solid #4A352F",
          borderRadius: "8px",
          padding: "16px",
          background: "#FDF8F0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <ShieldCheck size={18} color="#2E7D32" />
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#4A352F" }}>
            Corporate Universal Profile Declaration
          </span>
        </div>
        <p style={{ margin: "0 0 10px 0", fontSize: "0.775rem", color: "#5D4037", lineHeight: "1.4" }}>
          By submitting this Universal Profile, the organisation agrees that the captured objectives, ERP coexistence parameters, and statutory requirement gates constitute the official ruleset for matching, assessing, and progressing suppliers in BIG Prism.
        </p>
        <div style={{ fontSize: "0.725rem", color: "#8D6E63" }}>
          Timestamp recorded upon saving: <strong>{new Date().toLocaleString()}</strong>
        </div>
      </div>
    </div>
  )
}
