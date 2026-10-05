"use client"

import React, { useState, useEffect } from "react"
import {
  X,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Building,
  FileText,
  CheckCircle2,
  Clock,
  Layers,
  Info,
  Hash,
} from "lucide-react"

const HANDOFF_STATUSES = [
  "Invited to External Portal",
  "Pending Supplier Submission",
  "Submitted to External Portal",
  "Under Buyer Vendor Master Review",
  "Approved - Vendor Code Active",
  "Registration Rejected / On Hold",
]

export default function PortalRegistrationModal({
  isOpen,
  onClose,
  supplier,
  buyerProfile,
  existingHandoff,
  onSaveHandoff,
}) {
  const env = buyerProfile?.currentEnvironment || {}
  const org = buyerProfile?.organisation || {}

  const defaultPortalUrl = env.portalUrl || "https://suppliers.angloamerican.com/registration"
  const defaultERP = env.primaryERP || "SAP S/4HANA"
  const defaultInstructions =
    env.onboardingInstructions ||
    "Upload registered CIPC certificate, verified SARS Tax Pin, valid COIDA letter of good standing, and confirmed banking details less than 3 months old."

  const [portalUrl, setPortalUrl] = useState(defaultPortalUrl)
  const [referenceNumber, setReferenceNumber] = useState("")
  const [status, setStatus] = useState(HANDOFF_STATUSES[0])
  const [instructions, setInstructions] = useState(defaultInstructions)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (existingHandoff) {
      setPortalUrl(existingHandoff.portalUrl || defaultPortalUrl)
      setReferenceNumber(existingHandoff.referenceNumber || "")
      setStatus(existingHandoff.status || HANDOFF_STATUSES[0])
      setInstructions(existingHandoff.instructions || defaultInstructions)
      setNotes(existingHandoff.notes || "")
    } else {
      setPortalUrl(defaultPortalUrl)
      setReferenceNumber("")
      setStatus(HANDOFF_STATUSES[0])
      setInstructions(defaultInstructions)
      setNotes("")
    }
  }, [existingHandoff, defaultPortalUrl, defaultInstructions, isOpen])

  if (!isOpen || !supplier) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSaveHandoff({
      id: existingHandoff?.id || `handoff_${Date.now()}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierCategory: supplier.offeringCategory || "General",
      portalUrl: portalUrl.trim(),
      erpSystem: defaultERP,
      referenceNumber: referenceNumber.trim() || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      status,
      instructions: instructions.trim(),
      notes: notes.trim(),
      buyerOrg: org.tradingName || org.legalName || "Corporate Buyer",
      updatedAt: new Date().toISOString(),
    })
    onClose()
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
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: "rgba(30, 20, 15, 0.58)",
        backdropFilter: "blur(4px)",
        zIndex: 1300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          maxHeight: "92vh",
          backgroundColor: "#FAF7F2",
          borderRadius: "12px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            background: "#4A352F",
            color: "#FAF7F2",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Building size={20} color="#D4AF37" />
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#FAF7F2" }}>
                External Portal Coexistence & Handoff
              </h3>
              <div style={{ fontSize: "0.75rem", color: "#D7CCC8", marginTop: "2px" }}>
                Supplier: <strong>{supplier.name}</strong> ({supplier.offeringCategory || "General"})
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "none",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#FAF7F2",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: "20px 24px", overflowY: "auto" }}>
          {/* Zero Scraping & Security Boundary Banner */}
          <div
            style={{
              background: "#FFF8F0",
              border: "1px solid #E8D5C4",
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
            }}
          >
            <ShieldCheck size={20} color="#2E7D32" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4A352F" }}>
                Zero-Scraping Credential Boundary
              </div>
              <div style={{ fontSize: "0.75rem", color: "#6D4C41", marginTop: "2px", lineHeight: "1.4" }}>
                The platform acts as a readiness pre-qualification engine. In adherence to strict security standards, 
                we do not request, store, or scrape external ERP/portal passwords. Supplier submissions occur directly 
                within the buyer&apos;s authorized portal.
              </div>
            </div>
          </div>

          {/* External Portal URL with Launch Button */}
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Official Buyer Portal URL *</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="url"
                value={portalUrl}
                onChange={(e) => setPortalUrl(e.target.value)}
                style={inputStyle}
                required
              />
              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 14px",
                  background: "#4A352F",
                  color: "#FAF7F2",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Open Portal <ExternalLink size={14} />
              </a>
            </div>
            <div style={{ fontSize: "0.725rem", color: "#8D6E63", marginTop: "4px" }}>
              Underlying Vendor Master: <strong>{defaultERP}</strong> · Managed by: {org.tradingName || "Anglo American Supply Chain"}
            </div>
          </div>

          {/* Reference Number & Status Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={labelStyle}>Portal Application / Vendor Ref #</label>
              <div style={{ position: "relative" }}>
                <Hash size={14} color="#8D6E63" style={{ position: "absolute", left: "10px", top: "11px" }} />
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. SAP-VN-89412"
                  style={{ ...inputStyle, paddingLeft: "30px" }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Handoff Lifecycle Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={inputStyle}
              >
                {HANDOFF_STATUSES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Onboarding Instructions */}
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Required Evidence & Upload Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <div style={{ fontSize: "0.72rem", color: "#8D6E63", marginTop: "3px" }}>
              Standard prerequisite checklist delivered to the supplier for seamless onboarding.
            </div>
          </div>

          {/* Handoff Audit Notes */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Internal Notes & Handoff Comments (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Supplier notified via email. Awaiting SAP master data code generation from shared services."
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Form Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "8px", borderTop: "1px solid #E8D5C4" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                background: "#FFFFFF",
                border: "1px solid #C8B6A6",
                borderRadius: "6px",
                color: "#4A352F",
                fontSize: "0.825rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                padding: "8px 20px",
                background: "#4A352F",
                border: "none",
                borderRadius: "6px",
                color: "#FAF7F2",
                fontSize: "0.825rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <CheckCircle2 size={15} /> Save Handoff Reference
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
