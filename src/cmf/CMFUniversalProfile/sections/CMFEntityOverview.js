"use client"

import React, { useRef } from "react"
import { Building2, User, Globe, Linkedin, MapPin, Upload, Image as ImageIcon, Sparkles } from "lucide-react"

export default function CMFEntityOverview({ data = {}, updateData = () => {} }) {
  const fileInputRef = useRef(null)

  const handleChange = (field, value) => {
    updateData({ ...data, [field]: value })
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        handleChange("logo", reader.result)
        handleChange("logoFileName", file.name)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div style={{ width: "100%", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#4a352f", margin: "0 0 0.5rem 0" }}>
          Entity Overview
        </h2>
        <p style={{ color: "#7d5a50", fontSize: "0.95rem", margin: 0 }}>
          Introduce yourself or your facilitation practice. This sets how SMEs encounter your firm on BIG Marketplace.
        </p>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "14px", padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {/* Profile Type Selection */}
        <div style={{ marginBottom: "1.75rem" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "0.5rem" }}>
            Profile Type <span style={{ color: "#e53e3e" }}>*</span>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
            {[
              { id: "Organisation", label: "Organisation / Advisory Firm", desc: "Corporate entity, consultancy, accelerator or syndicate", icon: Building2 },
              { id: "Individual practitioner", label: "Individual Practitioner", desc: "Independent facilitator, advisor or consultant", icon: User }
            ].map(type => {
              const selected = (data.profileType || "Organisation") === type.id
              const Icon = type.icon
              return (
                <div
                  key={type.id}
                  onClick={() => handleChange("profileType", type.id)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: `2px solid ${selected ? "#8d6e63" : "#e6d7c3"}`,
                    background: selected ? "rgba(141, 110, 99, 0.08)" : "#faf7f2",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <Icon size={18} color={selected ? "#4a352f" : "#8d6e63"} />
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f" }}>{type.label}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "#7d5a50" }}>{type.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Name and Logo Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              {(data.profileType === "Individual practitioner") ? "Professional / Practitioner Name" : "Organisation / Firm Name"} <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <input
              type="text"
              value={data.organisationName || ""}
              onChange={(e) => handleChange("organisationName", e.target.value)}
              placeholder={(data.profileType === "Individual practitioner") ? "e.g. Dr. Jane Smith" : "e.g. Alpha Capital & Trade Facilitators"}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                background: "#faf7f2",
                color: "#4a352f"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              Logo or Professional Photograph <span style={{ fontSize: "12px", color: "#8d6e63", fontWeight: "normal" }}>(Optional)</span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "10px",
                border: "1px dashed #bcaaa4",
                background: "#faf7f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden"
              }}>
                {data.logo ? (
                  <img src={data.logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <ImageIcon size={24} color="#8d6e63" />
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                style={{ display: "none" }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  background: "#f3e5dc",
                  border: "1px solid #d7ccc8",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#4a352f",
                  cursor: "pointer"
                }}
              >
                <Upload size={14} /> {data.logo ? "Change Image" : "Upload File"}
              </button>
              {data.logo && (
                <button
                  type="button"
                  onClick={() => handleChange("logo", "")}
                  style={{
                    padding: "8px 10px",
                    background: "transparent",
                    border: "none",
                    color: "#e53e3e",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Headline */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <label style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f" }}>
              Profile Headline <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <span style={{ fontSize: "12px", color: "#8d6e63" }}>One compelling sentence</span>
          </div>
          <input
            type="text"
            value={data.headline || ""}
            onChange={(e) => handleChange("headline", e.target.value)}
            placeholder="e.g. Helping growing SMEs prepare for funding and access suitable funders."
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #d7ccc8",
              borderRadius: "8px",
              fontSize: "14px",
              boxSizing: "border-box",
              background: "#faf7f2",
              color: "#4a352f"
            }}
          />
          <span style={{ display: "block", fontSize: "12px", color: "#8d6e63", marginTop: "4px" }}>
            Example: “Helping growing SMEs prepare for funding and access suitable funders.”
          </span>
        </div>

        {/* About Short Paragraph */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
            About Your Organisation or Practice <span style={{ color: "#e53e3e" }}>*</span>
          </label>
          <textarea
            rows={4}
            value={data.about || ""}
            onChange={(e) => handleChange("about", e.target.value)}
            placeholder="Provide a short overview of your facilitation philosophy, core expertise, track record, and how you assist SMEs in reaching capital or market opportunities."
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #d7ccc8",
              borderRadius: "8px",
              fontSize: "14px",
              boxSizing: "border-box",
              background: "#faf7f2",
              color: "#4a352f",
              lineHeight: "1.6",
              resize: "vertical"
            }}
          />
        </div>

        {/* Facilitation Focus (Crucial for downstream conditionals!) */}
        <div style={{ marginBottom: "1.75rem" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "0.5rem" }}>
            Facilitation Focus <span style={{ color: "#e53e3e" }}>*</span>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            {[
              { id: "Capital", label: "Capital Facilitation", desc: "Funding readiness, debt/equity origination & syndication" },
              { id: "Market access", label: "Market Access Facilitation", desc: "Buyer links, corporate supply chain readiness & tender tenders" },
              { id: "Both", label: "Both Capital & Market", desc: "Full spectrum facilitation covering finance and market commercialization" }
            ].map(focus => {
              const selected = (data.facilitationFocus || "Both") === focus.id
              return (
                <div
                  key={focus.id}
                  onClick={() => handleChange("facilitationFocus", focus.id)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: `2px solid ${selected ? "#8d6e63" : "#e6d7c3"}`,
                    background: selected ? "rgba(141, 110, 99, 0.08)" : "#faf7f2",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "4px" }}>
                    {focus.label}
                  </div>
                  <div style={{ fontSize: "12px", color: "#7d5a50", lineHeight: "1.4" }}>
                    {focus.desc}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Location & Online Links */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              Base Country <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <input
              type="text"
              value={data.baseCountry || "South Africa"}
              onChange={(e) => handleChange("baseCountry", e.target.value)}
              placeholder="e.g. South Africa"
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                fontSize: "13px",
                boxSizing: "border-box",
                background: "#faf7f2",
                color: "#4a352f"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              Base City <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <input
              type="text"
              value={data.baseCity || ""}
              onChange={(e) => handleChange("baseCity", e.target.value)}
              placeholder="e.g. Johannesburg / Cape Town"
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                fontSize: "13px",
                boxSizing: "border-box",
                background: "#faf7f2",
                color: "#4a352f"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              Website <span style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "normal" }}>(Optional)</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="url"
                value={data.website || ""}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://yourcompany.com"
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 34px",
                  border: "1px solid #d7ccc8",
                  borderRadius: "8px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  background: "#faf7f2",
                  color: "#4a352f"
                }}
              />
              <Globe size={16} color="#8d6e63" style={{ position: "absolute", left: "10px", top: "10px" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              LinkedIn Page / Profile <span style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "normal" }}>(Optional)</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="url"
                value={data.linkedin || ""}
                onChange={(e) => handleChange("linkedin", e.target.value)}
                placeholder="https://linkedin.com/company/yourfirm"
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 34px",
                  border: "1px solid #d7ccc8",
                  borderRadius: "8px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  background: "#faf7f2",
                  color: "#4a352f"
                }}
              />
              <Linkedin size={16} color="#8d6e63" style={{ position: "absolute", left: "10px", top: "10px" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
