"use client"

import React from "react"
import { Database, Link2 } from "lucide-react"

const ERP_OPTIONS = [
  "SAP S/4HANA",
  "SAP ECC 6.0",
  "SAP Ariba",
  "Coupa",
  "Oracle Cloud ERP / Fusion",
  "Microsoft Dynamics 365",
  "Vendor Master Spreadsheets",
  "Custom In-house Sourcing Suite",
  "Other Enterprise Sourcing Suite",
]

export default function SectionEnvironment({ data = {}, onChange }) {
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
          Current Environment & ERP Coexistence
        </h4>
        <p style={{ margin: 0, fontSize: "0.825rem", color: "#8D6E63" }}>
          Configure enterprise ERP coexistence and vendor portal hand-off without replacing your internal vendor master.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={labelStyle}>Primary ERP / Sourcing Suite *</label>
          <select
            value={data.primaryERP || ""}
            onChange={(e) => handleChange("primaryERP", e.target.value)}
            style={inputStyle}
          >
            <option value="">Select ERP Environment</option>
            {ERP_OPTIONS.map((erp) => (
              <option key={erp} value={erp}>{erp}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Vendor Master Team Contact Email *</label>
          <input
            type="email"
            placeholder="e.g. vendormaster@anglo.com"
            value={data.vendorMasterEmail || ""}
            onChange={(e) => handleChange("vendorMasterEmail", e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>
          External Supplier-Facing Portal URL *
        </label>
        <div style={{ position: "relative" }}>
          <Link2 size={16} color="#8D6E63" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="url"
            placeholder="e.g. https://suppliers.angloamerican.com/registration"
            value={data.portalUrl || ""}
            onChange={(e) => handleChange("portalUrl", e.target.value)}
            style={{ ...inputStyle, paddingLeft: "36px" }}
          />
        </div>
        <div style={{ fontSize: "0.725rem", color: "#8D6E63", marginTop: "4px" }}>
          This link is provided to matched suppliers when initiating a "Request Portal Registration" hand-off.
        </div>
      </div>

      {/* Explicit Acknowledgment Checkbox */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "#FAF7F2",
          border: "1px solid #E8D5C4",
          borderRadius: "8px",
          padding: "12px 16px",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={data.coexistenceAcknowledged === true}
          onChange={(e) => handleChange("coexistenceAcknowledged", e.target.checked)}
          style={{ width: "16px", height: "16px", cursor: "pointer" }}
        />
        <span style={{ fontSize: "0.775rem", color: "#4A352F", fontWeight: 500 }}>
          I confirm that Prism approvals represent internal pre-vetting and do not automatically mutate external ERP vendor-master status without authorized confirmation.
        </span>
      </label>
    </div>
  )
}
