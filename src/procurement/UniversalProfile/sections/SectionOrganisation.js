"use client"

import React from "react"
import { Building, MapPin, Mail, Phone, User, Globe } from "lucide-react"

const PROVINCES = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "National (All Regions)",
  "Cross-border / SADC",
]

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

export default function SectionOrganisation({ data = {}, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value })
  }

  const handleContactChange = (field, value) => {
    const nextContact = { ...(data.primaryContact || {}), [field]: value }
    onChange({ ...data, primaryContact: nextContact })
  }

  const toggleProvince = (prov) => {
    const current = Array.isArray(data.operatingGeographies) ? data.operatingGeographies : []
    const next = current.includes(prov) ? current.filter((p) => p !== prov) : [...current, prov]
    onChange({ ...data, operatingGeographies: next })
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
          Organisation & Legal Entity Overview
        </h4>
        <p style={{ margin: 0, fontSize: "0.825rem", color: "#8D6E63" }}>
          Defines the corporate legal profile, enterprise operating geographies, and designated procurement lead.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={labelStyle}>Registered Corporate Entity Name *</label>
          <input
            type="text"
            placeholder="e.g. Anglo American Inyosi Coal (Pty) Ltd"
            value={data.legalName || ""}
            onChange={(e) => handleChange("legalName", e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Trading Name / Brand Name</label>
          <input
            type="text"
            placeholder="e.g. Anglo American"
            value={data.tradingName || ""}
            onChange={(e) => handleChange("tradingName", e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={labelStyle}>Industry / Economic Sector *</label>
          <select
            value={data.industry || ""}
            onChange={(e) => handleChange("industry", e.target.value)}
            style={inputStyle}
          >
            <option value="">Select Primary Industry</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Ownership Group / Parent Entity</label>
          <input
            type="text"
            placeholder="e.g. Anglo American plc / Multinational"
            value={data.ownershipGroup || ""}
            onChange={(e) => handleChange("ownershipGroup", e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Operating Geographies Multi-Select */}
      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>Operating Geographies (Sites & Operations)</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
          {PROVINCES.map((prov) => {
            const isSelected = Array.isArray(data.operatingGeographies) && data.operatingGeographies.includes(prov)
            return (
              <button
                key={prov}
                type="button"
                onClick={() => toggleProvince(prov)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "16px",
                  border: isSelected ? "1px solid #4A352F" : "1px solid #D7CCC8",
                  background: isSelected ? "#4A352F" : "#FFFFFF",
                  color: isSelected ? "#FAF7F2" : "#5D4037",
                  fontSize: "0.775rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {prov}
              </button>
            )
          })}
        </div>
      </div>

      {/* Key Procurement Lead Contact */}
      <div
        style={{
          background: "#FAF7F2",
          border: "1px solid #E8D5C4",
          borderRadius: "8px",
          padding: "16px",
          marginTop: "16px",
        }}
      >
        <h5 style={{ margin: "0 0 12px 0", fontSize: "0.85rem", fontWeight: 700, color: "#4A352F" }}>
          Designated Procurement Contact
        </h5>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Contact Name & Title *</label>
            <input
              type="text"
              placeholder="e.g. Sbonelo Khumalo (Head of Supply Chain)"
              value={data.primaryContact?.name || ""}
              onChange={(e) => handleContactChange("name", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Work Email Address *</label>
            <input
              type="email"
              placeholder="e.g. sbonelo.khumalo@anglo.com"
              value={data.primaryContact?.email || ""}
              onChange={(e) => handleContactChange("email", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Contact Phone / Office Direct</label>
            <input
              type="tel"
              placeholder="e.g. +27 11 373 6111"
              value={data.primaryContact?.phone || ""}
              onChange={(e) => handleContactChange("phone", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Primary Operating Site Address</label>
            <input
              type="text"
              placeholder="e.g. 55 Marshall Street, Johannesburg"
              value={data.primaryContact?.siteAddress || ""}
              onChange={(e) => handleContactChange("siteAddress", e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
