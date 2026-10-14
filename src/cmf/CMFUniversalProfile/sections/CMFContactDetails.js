"use client"

import React from "react"
import { Mail, Phone, Calendar, Globe, User, Lock, MessageSquare } from "lucide-react"
import { LANGUAGES_LIST } from "../../cmfProfileConfig"

const CONTACT_ROUTES = [
  { id: "BIG enquiry", label: "BIG Marketplace Enquiry", desc: "In-platform messaging via 'Request Support' button" },
  { id: "Email", label: "Direct Public Email", desc: "SMEs can email your published enquiries inbox" },
  { id: "Telephone", label: "Telephone Contact", desc: "SMEs can call your direct line" },
  { id: "Booking link", label: "Online Booking Link", desc: "Calendly, Google Meet, or scheduled booking URL" }
]

export default function CMFContactDetails({ data = {}, updateData = () => {} }) {
  const handleChange = (field, value) => {
    updateData({ ...data, [field]: value })
  }

  const currentLanguages = Array.isArray(data.languagesSupported) ? data.languagesSupported : ["English"]

  const toggleLanguage = (lang) => {
    if (currentLanguages.includes(lang)) {
      handleChange("languagesSupported", currentLanguages.filter(l => l !== lang))
    } else {
      handleChange("languagesSupported", [...currentLanguages, lang])
    }
  }

  return (
    <div style={{ width: "100%", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#4a352f", margin: "0 0 0.5rem 0" }}>
          Contact Details
        </h2>
        <p style={{ color: "#7d5a50", fontSize: "0.95rem", margin: 0 }}>
          Specify how SMEs should connect with your facilitation team on BIG Marketplace, and maintain private account administration records.
        </p>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "14px", padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {/* SME-Facing Contact Section */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#4a352f", margin: 0 }}>
              SME-Facing Point of Contact
            </h3>
            <span style={{ fontSize: "11px", background: "#e8f5e9", color: "#2e7d32", padding: "3px 8px", borderRadius: "12px", fontWeight: "600" }}>
              🌐 Publicly Visible to Matching SMEs
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
                SME-Facing Contact Name <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <input
                type="text"
                value={data.smeContactName || ""}
                onChange={(e) => handleChange("smeContactName", e.target.value)}
                placeholder="e.g. Sipho Khumalo"
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
                SME-Facing Contact Role <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <input
                type="text"
                value={data.smeContactRole || ""}
                onChange={(e) => handleChange("smeContactRole", e.target.value)}
                placeholder="e.g. Head of SME Origination & Advisory"
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

          {/* Preferred Contact Route */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.5rem" }}>
              Preferred Contact Route <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
              {CONTACT_ROUTES.map(route => {
                const selected = (data.preferredContactRoute || "BIG enquiry") === route.id
                return (
                  <div
                    key={route.id}
                    onClick={() => handleChange("preferredContactRoute", route.id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: `2px solid ${selected ? "#8d6e63" : "#e6d7c3"}`,
                      background: selected ? "rgba(141, 110, 99, 0.08)" : "#faf7f2",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "2px" }}>
                      {route.label}
                    </div>
                    <div style={{ fontSize: "11px", color: "#7d5a50" }}>
                      {route.desc}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Contact details conditional on contact route */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
                Public Email {(data.preferredContactRoute === "Email") && <span style={{ color: "#e53e3e" }}>*</span>}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  value={data.publicEmail || ""}
                  onChange={(e) => handleChange("publicEmail", e.target.value)}
                  placeholder="enquiries@yourfacilitator.com"
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
                <Mail size={16} color="#8d6e63" style={{ position: "absolute", left: "10px", top: "10px" }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
                Public Telephone <span style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "normal" }}>(Optional)</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="tel"
                  value={data.publicTelephone || ""}
                  onChange={(e) => handleChange("publicTelephone", e.target.value)}
                  placeholder="+27 (0) 11 000 0000"
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
                <Phone size={16} color="#8d6e63" style={{ position: "absolute", left: "10px", top: "10px" }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
                Booking Link URL <span style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "normal" }}>(Optional)</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="url"
                  value={data.bookingLink || ""}
                  onChange={(e) => handleChange("bookingLink", e.target.value)}
                  placeholder="https://calendly.com/your-firm/discovery"
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
                <Calendar size={16} color="#8d6e63" style={{ position: "absolute", left: "10px", top: "10px" }} />
              </div>
            </div>
          </div>

          {/* Languages Supported */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              Languages Supported <span style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "normal" }}>(Optional)</span>
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {LANGUAGES_LIST.map(lang => {
                const isSelected = currentLanguages.includes(lang)
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "16px",
                      border: `1px solid ${isSelected ? "#8d6e63" : "#d7ccc8"}`,
                      background: isSelected ? "#f3e5dc" : "#ffffff",
                      color: "#4a352f",
                      fontSize: "12px",
                      fontWeight: isSelected ? "700" : "normal",
                      cursor: "pointer"
                    }}
                  >
                    {lang}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main Action Callout */}
          <div style={{
            padding: "10px 14px",
            borderRadius: "8px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <MessageSquare size={18} color="#2563eb" />
            <div style={{ fontSize: "12px", color: "#1e40af" }}>
              <strong>Platform Action:</strong> On your public SME profile, <strong>“Request Support”</strong> is highlighted as the primary call-to-action button, directing SME inquiries directly through your chosen contact route.
            </div>
          </div>
        </div>

        {/* Private Account Administrator Details */}
        <div style={{
          padding: "1.25rem",
          borderRadius: "12px",
          background: "#faf7f2",
          border: "1px solid #e6d7c3"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
            <Lock size={16} color="#92400e" />
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", margin: 0 }}>
              Account Administrator Details
            </h4>
            <span style={{ fontSize: "11px", background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: "8px", fontWeight: "600" }}>
              Private — BIG Verification Only
            </span>
          </div>
          <p style={{ margin: "0 0 1rem 0", fontSize: "12px", color: "#7d5a50" }}>
            Contact information for the designated representative administering this facilitator account. Never shared with SMEs.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4a352f", marginBottom: "0.3rem" }}>
                Administrator Full Name <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <input
                type="text"
                value={data.accountAdminName || ""}
                onChange={(e) => handleChange("accountAdminName", e.target.value)}
                placeholder="e.g. John Doe"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #d7ccc8",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  background: "#ffffff",
                  color: "#4a352f"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4a352f", marginBottom: "0.3rem" }}>
                Administrator Email Address <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <input
                type="email"
                value={data.accountAdminEmail || ""}
                onChange={(e) => handleChange("accountAdminEmail", e.target.value)}
                placeholder="admin@yourfacilitator.com"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #d7ccc8",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  background: "#ffffff",
                  color: "#4a352f"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4a352f", marginBottom: "0.3rem" }}>
                Administrator Telephone / Mobile <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <input
                type="tel"
                value={data.accountAdminPhone || ""}
                onChange={(e) => handleChange("accountAdminPhone", e.target.value)}
                placeholder="+27 (0) 82 000 0000"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #d7ccc8",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  background: "#ffffff",
                  color: "#4a352f"
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
