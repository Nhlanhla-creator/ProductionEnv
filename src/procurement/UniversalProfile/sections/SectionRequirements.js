"use client"

import React from "react"
import { ShieldCheck, AlertCircle, Lock, Award, FileCheck } from "lucide-react"

const BBBEE_LEVELS = [
  "Level 1 (Highest Recognition)",
  "Level 1 or 2",
  "Level 1 to 4 (Enterprise Baseline)",
  "Any Compliant Level (1 to 8)",
  "No Minimum Restriction",
]

export default function SectionRequirements({ data = {}, onChange }) {
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
          Requirement Templates & Hard Statutory Gates
        </h4>
        <p style={{ margin: 0, fontSize: "0.825rem", color: "#8D6E63" }}>
          Defines the mandatory compliance gates that suppliers must satisfy before being shortlisted or passed to the onboarding stage.
        </p>
      </div>

      {/* B-BBEE Baseline Requirement */}
      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>Minimum Broad-Based Black Economic Empowerment (B-BBEE) Level *</label>
        <select
          value={data.minBBBEELevel || "Level 1 to 4 (Enterprise Baseline)"}
          onChange={(e) => handleChange("minBBBEELevel", e.target.value)}
          style={inputStyle}
        >
          {BBBEE_LEVELS.map((lvl) => (
            <option key={lvl} value={lvl}>{lvl}</option>
          ))}
        </select>
        <div style={{ fontSize: "0.725rem", color: "#8D6E63", marginTop: "4px" }}>
          Suppliers below this threshold will be flagged with a B-BBEE readiness gap in the matches grid.
        </div>
      </div>

      {/* Hard Gate Toggles */}
      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>Statutory Baseline Gates (Hard Requirements)</label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
          {/* CIPC Gate */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 14px",
              background: data.mandatoryCIPC !== false ? "#FDF8F0" : "#FFFFFF",
              border: data.mandatoryCIPC !== false ? "1px solid #4A352F" : "1px solid #E8D5C4",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={data.mandatoryCIPC !== false}
              onChange={(e) => handleChange("mandatoryCIPC", e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <div>
              <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#4A352F" }}>
                Mandatory CIPC Registration
              </div>
              <div style={{ fontSize: "0.725rem", color: "#8D6E63" }}>
                Active South African company registration certificate.
              </div>
            </div>
          </label>

          {/* Tax Pin Gate */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 14px",
              background: data.mandatoryTax !== false ? "#FDF8F0" : "#FFFFFF",
              border: data.mandatoryTax !== false ? "1px solid #4A352F" : "1px solid #E8D5C4",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={data.mandatoryTax !== false}
              onChange={(e) => handleChange("mandatoryTax", e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <div>
              <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#4A352F" }}>
                Valid SARS Tax Compliance Pin
              </div>
              <div style={{ fontSize: "0.725rem", color: "#8D6E63" }}>
                Verified tax compliance status code.
              </div>
            </div>
          </label>

          {/* COIDA Gate */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 14px",
              background: data.mandatoryCOIDA === true ? "#FDF8F0" : "#FFFFFF",
              border: data.mandatoryCOIDA === true ? "1px solid #4A352F" : "1px solid #E8D5C4",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={data.mandatoryCOIDA === true}
              onChange={(e) => handleChange("mandatoryCOIDA", e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <div>
              <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#4A352F" }}>
                COIDA Letter of Good Standing
              </div>
              <div style={{ fontSize: "0.725rem", color: "#8D6E63" }}>
                Mandatory for on-site services, logistics, and construction.
              </div>
            </div>
          </label>

          {/* Bank Letter Gate */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 14px",
              background: data.mandatoryBank !== false ? "#FDF8F0" : "#FFFFFF",
              border: data.mandatoryBank !== false ? "1px solid #4A352F" : "1px solid #E8D5C4",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={data.mandatoryBank !== false}
              onChange={(e) => handleChange("mandatoryBank", e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <div>
              <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#4A352F" }}>
                Bank Account Confirmation Letter
              </div>
              <div style={{ fontSize: "0.725rem", color: "#8D6E63" }}>
                Stamped banking details less than 3 months old.
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Operational Overlays */}
      <div
        style={{
          background: "#FAF7F2",
          border: "1px solid #E8D5C4",
          borderRadius: "8px",
          padding: "16px",
        }}
      >
        <h5 style={{ margin: "0 0 12px 0", fontSize: "0.85rem", fontWeight: 700, color: "#4A352F" }}>
          Operational & Risk Overlays
        </h5>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Minimum Operating Track Record</label>
            <select
              value={data.minYearsOperating || "1 year"}
              onChange={(e) => handleChange("minYearsOperating", e.target.value)}
              style={inputStyle}
            >
              <option value="No minimum (Start-ups accepted)">No minimum (Start-ups accepted)</option>
              <option value="1 year">Minimum 1 year operating</option>
              <option value="2 years">Minimum 2 years operating</option>
              <option value="3+ years">Minimum 3+ years operating</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Safety & SHEQ Threshold</label>
            <select
              value={data.sheqRequirement || "Standard Enterprise"}
              onChange={(e) => handleChange("sheqRequirement", e.target.value)}
              style={inputStyle}
            >
              <option value="Standard Enterprise">Standard Enterprise Compliance</option>
              <option value="High Risk (Mining / Heavy Industrial)">High Risk (Mining / Heavy Industrial)</option>
              <option value="ISO 9001 / 14001 / 45001 Preferred">ISO Certified Preferred</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
