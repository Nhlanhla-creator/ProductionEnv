"use client"

import React, { useState } from "react"
import { ShieldCheck, Award, Plus, Check } from "lucide-react"
import MultiSelect from "../../../components/MultiSelect"

const BBBEE_LEVELS = [
  "Level 1 (Highest Recognition)",
  "Level 1 or 2 (Preferred)",
  "Level 1 to 4 (Enterprise Baseline)",
  "Any Compliant Level (1 to 8)",
  "No Minimum Restriction",
]

const COMMON_ACCREDITATIONS = [
  { id: "iso9001", name: "ISO 9001 (Quality Management)", category: "Quality" },
  { id: "iso14001", name: "ISO 14001 (Environmental)", category: "Environmental" },
  { id: "iso45001", name: "ISO 45001 (Occupational Health & Safety)", category: "Safety" },
  { id: "sabs", name: "SABS Approved", category: "Standards" },
  { id: "cidb", name: "CIDB Contractor Grading (Civil/Works)", category: "Industry" },
  { id: "dmr_mining", name: "DMR / MQA Mining Safety Clearance", category: "Mining" },
  { id: "saqa_seta", name: "SETA / QCTO Accredited Provider", category: "Skills" },
  { id: "icasa", name: "ICASA Telecommunications License", category: "Telecoms" },
  { id: "psira", name: "PSiRA Registered (Security)", category: "Security" },
]

export default function SectionComplianceGates({ data = {}, onChange }) {
  const [customAccreditation, setCustomAccreditation] = useState("")

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value })
  }

  const selectedAccreditations = Array.isArray(data.requiredAccreditations) ? data.requiredAccreditations : []

  const toggleAccreditation = (accName) => {
    const next = selectedAccreditations.includes(accName)
      ? selectedAccreditations.filter((a) => a !== accName)
      : [...selectedAccreditations, accName]
    handleChange("requiredAccreditations", next)
  }

  const addCustomAccreditation = () => {
    if (customAccreditation.trim() && !selectedAccreditations.includes(customAccreditation.trim())) {
      handleChange("requiredAccreditations", [...selectedAccreditations, customAccreditation.trim()])
      setCustomAccreditation("")
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
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "#4A352F",
    marginBottom: "5px",
  }

  const accreditationOptions = COMMON_ACCREDITATIONS.map((a) => ({ value: a.name, label: a.name }))

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem", fontWeight: 700, color: "#4A352F" }}>
          Compliance & Accreditation Gates
        </h4>
        <p style={{ margin: 0, fontSize: "0.825rem", color: "#8D6E63" }}>
          Define the statutory minimums, mandatory accreditations, and operational overlays required for preferred supplier qualification.
        </p>
      </div>

      {/* Tier 1: Statutory Baseline Gates */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "8px", padding: "18px", marginBottom: "18px" }}>
        <h5 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "#4A352F" }}>
          1. Statutory Baseline Gates
        </h5>

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Minimum B-BBEE Level *</label>
          <select
            value={data.minBBBEELevel || "Level 1 to 4 (Enterprise Baseline)"}
            onChange={(e) => handleChange("minBBBEELevel", e.target.value)}
            style={inputStyle}
          >
            {BBBEE_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "#FAF7F2", border: "1px solid #E8D5C4", borderRadius: "6px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={data.mandatoryCIPC !== false}
              onChange={(e) => handleChange("mandatoryCIPC", e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "#4A352F" }}
            />
            <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "#4A352F" }}>Mandatory CIPC Registration</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "#FAF7F2", border: "1px solid #E8D5C4", borderRadius: "6px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={data.mandatoryTax !== false}
              onChange={(e) => handleChange("mandatoryTax", e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "#4A352F" }}
            />
            <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "#4A352F" }}>SARS Tax Clearance PIN</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "#FAF7F2", border: "1px solid #E8D5C4", borderRadius: "6px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={data.mandatoryCOIDA !== false}
              onChange={(e) => handleChange("mandatoryCOIDA", e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "#4A352F" }}
            />
            <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "#4A352F" }}>COIDA Letter of Good Standing</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "#FAF7F2", border: "1px solid #E8D5C4", borderRadius: "6px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={data.mandatoryBankLetter !== false}
              onChange={(e) => handleChange("mandatoryBankLetter", e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "#4A352F" }}
            />
            <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "#4A352F" }}>Bank Account Confirmation Letter</span>
          </label>
        </div>
      </div>

      {/* Tier 2: Accreditation Gates (MultiSelect Dropdown) */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "8px", padding: "18px", marginBottom: "18px" }}>
        <h5 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "#4A352F" }}>
          2. Accreditation Gates
        </h5>

        <div style={{ marginBottom: "14px" }}>
          <label style={labelStyle}>
            Select Industry & Quality Accreditations ({selectedAccreditations.length} required)
          </label>
          <MultiSelect
            options={accreditationOptions}
            selected={selectedAccreditations}
            onChange={(newSelected) => handleChange("requiredAccreditations", newSelected)}
            placeholder="Select required ISO, SABS, CIDB or industry certifications..."
          />
        </div>

        {selectedAccreditations.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
            {selectedAccreditations.map((acc) => (
              <span
                key={acc}
                style={{
                  background: "#E8F5E9",
                  border: "1px solid #C8E6C9",
                  color: "#2E7D32",
                  padding: "4px 10px",
                  borderRadius: "14px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                ✓ {acc}
                <button
                  type="button"
                  onClick={() => toggleAccreditation(acc)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2E7D32",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "0.75rem",
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder="Add custom specialized accreditation..."
            value={customAccreditation}
            onChange={(e) => setCustomAccreditation(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addCustomAccreditation()
              }
            }}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            type="button"
            onClick={addCustomAccreditation}
            style={{
              padding: "8px 16px",
              background: "#4A352F",
              color: "#FAF7F2",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* Tier 3: Operational & Risk Overlays */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "8px", padding: "18px" }}>
        <h5 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "#4A352F" }}>
          3. Operational & Risk Overlays
        </h5>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Minimum Annual Turnover Baseline</label>
            <select
              value={data.minTurnover || "Any Turnover (Include Micro-Enterprises)"}
              onChange={(e) => handleChange("minTurnover", e.target.value)}
              style={inputStyle}
            >
              <option value="Any Turnover (Include Micro-Enterprises)">Any Turnover (Include EMEs &lt; R10m)</option>
              <option value="EME & QSE (R5m - R50m)">EME & QSE (R5m - R50m)</option>
              <option value="QSE & Generic (R10m+)">QSE & Generic (R10m+)</option>
              <option value="Generic Enterprises Only (R50m+)">Generic Enterprises Only (R50m+)</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Public Liability Insurance Minimum</label>
            <select
              value={data.minInsurance || "R 5,000,000"}
              onChange={(e) => handleChange("minInsurance", e.target.value)}
              style={inputStyle}
            >
              <option value="No Minimum Requirement">No Minimum Requirement</option>
              <option value="R 1,000,000">R 1,000,000 Cover</option>
              <option value="R 5,000,000">R 5,000,000 Cover</option>
              <option value="R 10,000,000">R 10,000,000 Cover</option>
              <option value="R 20,000,000+">R 20,000,000+ Cover</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
