"use client"

import React from "react"
import { Check, Plus, HelpCircle, Layers, Monitor, Users, Calendar } from "lucide-react"
import { CAPITAL_SERVICES, MARKET_SERVICES } from "../../cmfProfileConfig"

export default function CMFServicesSupport({ data = {}, allFormData = {}, updateData = () => {} }) {
  // Facilitation focus determines which services catalogue to render
  const focus = allFormData?.entityOverview?.facilitationFocus || data.facilitationFocus || "Both"
  const showCapital = focus === "Capital" || focus === "Both"
  const showMarket = focus === "Market access" || focus === "Both"

  const handleChange = (field, value) => {
    updateData({ ...data, [field]: value })
  }

  const currentServices = Array.isArray(data.servicesOffered) ? data.servicesOffered : []

  const toggleService = (srv) => {
    if (currentServices.includes(srv)) {
      handleChange("servicesOffered", currentServices.filter(s => s !== srv))
    } else {
      handleChange("servicesOffered", [...currentServices, srv])
    }
  }

  return (
    <div style={{ width: "100%", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#4a352f", margin: "0 0 0.5rem 0" }}>
          Services & Support
        </h2>
        <p style={{ color: "#7d5a50", fontSize: "0.95rem", margin: 0 }}>
          Define the facilitation assistance you provide, how you deliver it, and the tangible deliverables SMEs can expect.
        </p>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "14px", padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {/* Services Offered Filtered by Facilitation Focus */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <label style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f" }}>
              Services Offered <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <span style={{ fontSize: "12px", color: "#8d6e63" }}>
              Showing selections for: <strong>{focus}</strong> focus
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "#7d5a50", margin: "0 0 1rem 0" }}>
            Select all specific services your practice offers to SMEs.
          </p>

          {/* Capital Facilitation Services */}
          {showCapital && (
            <div style={{ marginBottom: "1.25rem", padding: "1rem", borderRadius: "10px", background: "#faf7f2", border: "1px solid #e6d7c3" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>💰</span> Capital Facilitation Services
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px" }}>
                {CAPITAL_SERVICES.map(srv => {
                  const isChecked = currentServices.includes(srv)
                  return (
                    <label
                      key={srv}
                      onClick={() => toggleService(srv)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        background: isChecked ? "#f3e5dc" : "#ffffff",
                        border: `1px solid ${isChecked ? "#8d6e63" : "#d7ccc8"}`,
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "#4a352f",
                        fontWeight: isChecked ? "600" : "normal",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ accentColor: "#8d6e63" }}
                      />
                      <span>{srv}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Market Facilitation Services */}
          {showMarket && (
            <div style={{ marginBottom: "1.25rem", padding: "1rem", borderRadius: "10px", background: "#faf7f2", border: "1px solid #e6d7c3" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🤝</span> Market Access & Procurement Services
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px" }}>
                {MARKET_SERVICES.map(srv => {
                  const isChecked = currentServices.includes(srv)
                  return (
                    <label
                      key={srv}
                      onClick={() => toggleService(srv)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        background: isChecked ? "#f3e5dc" : "#ffffff",
                        border: `1px solid ${isChecked ? "#8d6e63" : "#d7ccc8"}`,
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "#4a352f",
                        fontWeight: isChecked ? "600" : "normal",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ accentColor: "#8d6e63" }}
                      />
                      <span>{srv}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Other Service Specification */}
          <div style={{ marginTop: "0.75rem" }}>
            <label style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: "600",
              color: "#4a352f",
              cursor: "pointer",
              marginBottom: "0.4rem"
            }}>
              <input
                type="checkbox"
                checked={currentServices.includes("Other")}
                onChange={() => toggleService("Other")}
                style={{ accentColor: "#8d6e63" }}
              />
              Other — please specify
            </label>
            {currentServices.includes("Other") && (
              <input
                type="text"
                value={data.otherServiceText || ""}
                onChange={(e) => handleChange("otherServiceText", e.target.value)}
                placeholder="Specify any additional specialised facilitation service..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d7ccc8",
                  borderRadius: "6px",
                  fontSize: "13px",
                  background: "#faf7f2",
                  boxSizing: "border-box",
                  color: "#4a352f"
                }}
              />
            )}
          </div>
        </div>

        {/* Deliverables: What SMEs Receive */}
        <div style={{ marginBottom: "1.75rem" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
            What SMEs Receive (Deliverables) <span style={{ color: "#e53e3e" }}>*</span>
          </label>
          <textarea
            rows={4}
            value={data.whatSmesReceive || ""}
            onChange={(e) => handleChange("whatSmesReceive", e.target.value)}
            placeholder="Describe the concrete deliverables (e.g. audited financial model, investor pitch memorandum, introductions to at least 3 vetted capital providers, procurement capability statement, tender submission support)..."
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

        {/* Operational Configurations Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
          {/* Delivery Method */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              Delivery Method <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <select
              value={data.deliveryMethod || "Hybrid"}
              onChange={(e) => handleChange("deliveryMethod", e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                fontSize: "13px",
                background: "#faf7f2",
                color: "#4a352f"
              }}
            >
              <option value="Online">Online / Remote</option>
              <option value="In person">In person</option>
              <option value="Hybrid">Hybrid (Online & In person)</option>
            </select>
          </div>

          {/* Support Format */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              Support Format <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <select
              value={data.supportFormat || "Both"}
              onChange={(e) => handleChange("supportFormat", e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                fontSize: "13px",
                background: "#faf7f2",
                color: "#4a352f"
              }}
            >
              <option value="Individual support">Individual 1-on-1 Support</option>
              <option value="Group programme">Group Programme / Cohort</option>
              <option value="Both">Both (1-on-1 & Cohorts)</option>
            </select>
          </div>

          {/* Engagement Type */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              Engagement Type <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <select
              value={data.engagementType || "Ongoing"}
              onChange={(e) => handleChange("engagementType", e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                fontSize: "13px",
                background: "#faf7f2",
                color: "#4a352f"
              }}
            >
              <option value="Once-off">Once-off assignment / transaction</option>
              <option value="Ongoing">Ongoing advisory / retainer</option>
              <option value="Programme-based">Programme-based structured intervention</option>
            </select>
          </div>

          {/* Typical Engagement Duration */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              Typical Engagement Duration <span style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "normal" }}>(Optional)</span>
            </label>
            <input
              type="text"
              value={data.typicalDuration || ""}
              onChange={(e) => handleChange("typicalDuration", e.target.value)}
              placeholder="e.g. 2 - 4 months, or 6 weeks"
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
        </div>
      </div>
    </div>
  )
}
