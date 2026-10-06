"use client"

import React from "react"
import { Building, Target } from "lucide-react"
import MultiSelect from "../../../components/MultiSelect"

const INDUSTRIES = [
  "Mining & Metals",
  "Financial Services & Banking",
  "Telecommunications & Technology",
  "Manufacturing & Industrial",
  "Energy, Oil & Utilities",
  "Transport & Logistics",
  "Healthcare & Pharmaceuticals",
  "FMCG & Retail",
  "Public Sector & Parastatals",
  "Agriculture & Agro-processing",
]

const OBJECTIVE_OPTIONS = [
  {
    id: "pre_vet",
    title: "Pre-vet Suppliers & Eliminate Risk",
    description: "Verify statutory compliance (Tax, CIPC, COIDA) and financial health before formal engagement.",
  },
  {
    id: "build_pipeline",
    title: "Build Qualified Supplier Pipeline",
    description: "Discover verified high-score suppliers aligned with ongoing and future procurement opportunities.",
  },
  {
    id: "improve_onboarding",
    title: "Accelerate Buyer Onboarding",
    description: "Streamline supplier document collection and eliminate weeks of repetitive vendor-pack reviews.",
  },
  {
    id: "manage_esd",
    title: "Manage Enterprise & Supplier Development (ESD)",
    description: "Track supplier growth cohorts, monitor 5C diagnostics, and close commercial readiness gaps.",
  },
  {
    id: "localisation",
    title: "Localisation & Community Sourcing",
    description: "Identify and build capacity for host-community and regionally based suppliers near operational sites.",
  },
  {
    id: "prepare_tenders",
    title: "Prepare Tenders & RFQs",
    description: "Curate vetted shortlists with explainable fit scores ready for formal RFP invitations.",
  },
]

export default function SectionObjectives({
  data = {},
  organisation = {},
  onChange,
  onOrgChange,
}) {
  const selected = Array.isArray(data.selectedObjectives) ? data.selectedObjectives : []

  const toggleObjective = (id) => {
    const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]
    onChange({ ...data, selectedObjectives: next })
  }

  const handleMetricChange = (field, value) => {
    const nextMetrics = { ...(data.successMeasures || {}), [field]: value }
    onChange({ ...data, successMeasures: nextMetrics })
  }

  const handleOrgChange = (field, value) => {
    if (onOrgChange) {
      onOrgChange({ ...organisation, [field]: value })
    }
  }

  const handleContactChange = (field, value) => {
    if (onOrgChange) {
      const nextContact = { ...(organisation.primaryContact || {}), [field]: value }
      onOrgChange({ ...organisation, primaryContact: nextContact })
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

  const objectiveDropdownOptions = OBJECTIVE_OPTIONS.map((obj) => ({
    value: obj.id,
    label: obj.title,
  }))

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ margin: "0 0 6px 0", fontSize: "1rem", fontWeight: 700, color: "#4A352F" }}>
          Corporate Objectives & Entity Details
        </h4>
        <p style={{ margin: 0, fontSize: "0.825rem", color: "#8D6E63" }}>
          Define corporate entity information and strategic procurement objectives that determine matching algorithms and workflow modules.
        </p>
      </div>

      {/* Part 1: Corporate Entity Information */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E6D7C3",
          borderRadius: "8px",
          padding: "18px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <Building size={18} color="#4A352F" />
          <h5 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#4A352F" }}>
            Entity Information & Procurement Contact
          </h5>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
          <div>
            <label style={labelStyle}>Registered Corporate Entity Name *</label>
            <input
              type="text"
              placeholder="e.g. Anglo American Inyosi Coal (Pty) Ltd"
              value={organisation.legalName || ""}
              onChange={(e) => handleOrgChange("legalName", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Trading Name / Brand Name</label>
            <input
              type="text"
              placeholder="e.g. Anglo American"
              value={organisation.tradingName || ""}
              onChange={(e) => handleOrgChange("tradingName", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Company Registration Number (CIPC)</label>
            <input
              type="text"
              placeholder="e.g. 2005/012345/07"
              value={organisation.registrationNumber || ""}
              onChange={(e) => handleOrgChange("registrationNumber", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Industry / Sector *</label>
            <select
              value={organisation.industry || ""}
              onChange={(e) => handleOrgChange("industry", e.target.value)}
              style={inputStyle}
            >
              <option value="">Select Primary Industry</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Primary Contact Name *</label>
            <input
              type="text"
              placeholder="e.g. Sbonelo Khumalo"
              value={organisation.primaryContact?.name || ""}
              onChange={(e) => handleContactChange("name", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Work Email Address *</label>
            <input
              type="email"
              placeholder="e.g. s.khumalo@anglo.com"
              value={organisation.primaryContact?.email || ""}
              onChange={(e) => handleContactChange("email", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Contact Telephone / Mobile</label>
            <input
              type="tel"
              placeholder="e.g. +27 11 373 6111"
              value={organisation.primaryContact?.phone || ""}
              onChange={(e) => handleContactChange("phone", e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Part 2: Strategic Procurement Objectives (MultiSelect Dropdown) */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E6D7C3",
          borderRadius: "8px",
          padding: "18px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <Target size={18} color="#4A352F" />
          <h5 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#4A352F" }}>
            Strategic Procurement Objectives & Priorities
          </h5>
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={labelStyle}>
            Select Strategic Procurement Objectives ({selected.length} selected) *
          </label>
          <MultiSelect
            options={objectiveDropdownOptions}
            selected={selected}
            onChange={(newSelected) => onChange({ ...data, selectedObjectives: newSelected })}
            placeholder="Select strategic objectives to configure dashboard workflows..."
          />
          {selected.length === 0 && (
            <div style={{ fontSize: "0.775rem", color: "#C62828", marginTop: "6px" }}>
              * Please select at least one strategic objective.
            </div>
          )}
        </div>

        {selected.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {selected.map((objId) => {
              const obj = OBJECTIVE_OPTIONS.find((o) => o.id === objId)
              return (
                <span
                  key={objId}
                  style={{
                    background: "#F5F0E1",
                    border: "1px solid #E0D0B8",
                    color: "#4A352F",
                    padding: "4px 10px",
                    borderRadius: "14px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  ✓ {obj ? obj.title : objId}
                  <button
                    type="button"
                    onClick={() => toggleObjective(objId)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#8D6E63",
                      cursor: "pointer",
                      padding: 0,
                      fontSize: "0.75rem",
                    }}
                  >
                    ✕
                  </button>
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Part 3: Success Benchmarks & KPIs */}
      <div
        style={{
          background: "#FAF7F2",
          border: "1px solid #E8D5C4",
          borderRadius: "8px",
          padding: "18px",
        }}
      >
        <h5 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "#4A352F" }}>
          Target Success Benchmarks & KPIs
        </h5>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Target Verified Intake (%)</label>
            <input
              type="text"
              placeholder="e.g. 85%"
              value={data.successMeasures?.targetVerifiedPercent || ""}
              onChange={(e) => handleMetricChange("targetVerifiedPercent", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Localisation Spend Target (%)</label>
            <input
              type="text"
              placeholder="e.g. 40%"
              value={data.successMeasures?.targetLocalSpendPercent || ""}
              onChange={(e) => handleMetricChange("targetLocalSpendPercent", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Annual Intake Capacity (Suppliers)</label>
            <input
              type="text"
              placeholder="e.g. 150 suppliers/yr"
              value={data.successMeasures?.annualSupplierIntake || ""}
              onChange={(e) => handleMetricChange("annualSupplierIntake", e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
