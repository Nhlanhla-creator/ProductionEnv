"use client"

import React, { useState, useEffect } from "react"
import {
  X,
  Building,
  ShieldCheck,
  Award,
  Users,
  FileText,
  Lock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  ExternalLink,
  Bookmark,
  Send,
  Calendar,
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  FileCheck,
} from "lucide-react"

export default function ProcurementSupplierModal({
  supplier,
  isOpen,
  onClose,
  onOpenRFI,
  onOpenPortalHandoff,
  onOpenStageDecision,
  onToggleShortlist,
  isShortlisted = false,
  supplierInteractions = [],
}) {
  const [activeTab, setActiveTab] = useState("score")

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !supplier) return null

  const raw = supplier.raw || supplier
  const entity = raw.entityOverview || {}
  const ps = raw.productsServices || {}
  const legal = raw.legalCompliance || {}
  const finance = raw.financialOverview || {}
  const docs = raw.documents || {}

  const bigScore = supplier.bigScore ?? raw.bigScore ?? raw.scores?.bigScore ?? 75
  const verifiedCoverage = supplier.verifiedCoverage || 80

  const tabs = [
    { id: "score", label: "BIG Score & 5 Pillars", icon: Award },
    { id: "overview", label: "Entity Profile", icon: Building },
    { id: "capabilities", label: "Capabilities & Fleet", icon: Layers },
    { id: "documents", label: "Evidence & Limitations", icon: FileText },
    { id: "interactions", label: `Interactions (${supplierInteractions.length})`, icon: FileQuestion },
  ]

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: "rgba(30, 20, 15, 0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 1150,
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
          maxWidth: "960px",
          height: "90vh",
          backgroundColor: "#FAF7F2",
          borderRadius: "12px",
          boxShadow: "0 20px 48px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div
          style={{
            padding: "20px 28px",
            background: "#4A352F",
            color: "#FAF7F2",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "#FAF7F2" }}>
                {supplier.name}
              </h2>
              {supplier.verified && (
                <span
                  style={{
                    background: "#2E7D32",
                    color: "#FFFFFF",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "0.725rem",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <ShieldCheck size={13} /> Verified
                </span>
              )}
            </div>

            <div style={{ fontSize: "0.825rem", color: "#D7CCC8", display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <span>Category: <strong>{supplier.offeringCategory}</strong></span>
              <span>Location: <strong>{supplier.location}</strong></span>
              <span>B-BBEE: <strong>{supplier.bbbeeLevel}</strong></span>
              <span>Passport: <strong>{supplier.passportLabel || "In Review"}</strong></span>
            </div>
          </div>

          {/* Header Quick Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => onToggleShortlist && onToggleShortlist(supplier)}
              style={{
                padding: "7px 14px",
                background: isShortlisted ? "#D4AF37" : "rgba(255,255,255,0.14)",
                color: isShortlisted ? "#4A352F" : "#FAF7F2",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Bookmark size={14} fill={isShortlisted ? "#4A352F" : "none"} />
              {isShortlisted ? "Shortlisted" : "Shortlist"}
            </button>

            <button
              onClick={() => {
                onClose()
                if (onOpenRFI) onOpenRFI(supplier)
              }}
              style={{
                padding: "7px 14px",
                background: "#FAF7F2",
                color: "#4A352F",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Send size={14} /> Request Info (RFI)
            </button>

            {onOpenPortalHandoff && (
              <button
                onClick={() => {
                  onClose()
                  onOpenPortalHandoff(supplier)
                }}
                style={{
                  padding: "7px 14px",
                  background: "#FAF7F2",
                  color: "#4A352F",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Building size={14} /> Portal Handoff
              </button>
            )}

            {onOpenStageDecision && (
              <button
                onClick={() => {
                  onClose()
                  onOpenStageDecision(supplier)
                }}
                style={{
                  padding: "7px 14px",
                  background: "#FAF7F2",
                  color: "#2E7D32",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FileCheck size={14} /> Stage Decision
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#FAF7F2",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation Header */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #E8D5C4",
            background: "#FAF7F2",
            padding: "0 28px",
            overflowX: "auto",
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "12px 18px",
                  background: "transparent",
                  border: "none",
                  borderBottom: isActive ? "3px solid #4A352F" : "3px solid transparent",
                  color: isActive ? "#4A352F" : "#8D6E63",
                  fontSize: "0.825rem",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon size={15} color={isActive ? "#4A352F" : "#8D6E63"} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
          {/* TAB 1: BIG SCORE & 5 PILLARS */}
          {activeTab === "score" && (
            <div>
              {/* Score Header Card */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E6D7C3",
                  borderRadius: "10px",
                  padding: "20px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8D6E63", textTransform: "uppercase" }}>
                    Platform Readiness BIG Score
                  </div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#4A352F", marginTop: "2px" }}>
                    {bigScore >= 75 ? "Commercial Ready (Tier 1)" : bigScore >= 50 ? "Emerging Supplier (Tier 2)" : "Development Candidate (ESD)"}
                  </div>
                  <div style={{ fontSize: "0.775rem", color: "#6D4C41", marginTop: "4px" }}>
                    Verification Coverage: <strong>{verifiedCoverage}%</strong> ({supplier.documentCount || 5} statutory documents audited)
                  </div>
                </div>

                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    background: "#4A352F",
                    color: "#FAF7F2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: 800,
                  }}
                >
                  {bigScore}
                </div>
              </div>

              {/* 5 Pillars Breakdown */}
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontWeight: 700, color: "#4A352F" }}>
                BIG Score 5-Pillar Diagnostics
              </h4>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {/* Pillar 1 */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E8D5C4", borderRadius: "8px", padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4A352F" }}>1. Statutory & Legal Compliance</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2E7D32" }}>92%</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6D4C41" }}>
                    Tax pin verified · CIPC active · B-BBEE Level {supplier.bbbeeLevel} · COIDA compliant
                  </div>
                </div>

                {/* Pillar 2 */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E8D5C4", borderRadius: "8px", padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4A352F" }}>2. Financial Health & Solvency</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2E7D32" }}>84%</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6D4C41" }}>
                    Bank clearance confirmed · Turnover: {finance.annualRevenue || "R 5M - R 20M"} · Low solvency risk
                  </div>
                </div>

                {/* Pillar 3 */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E8D5C4", borderRadius: "8px", padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4A352F" }}>3. Operational Strength & Capacity</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#F57C00" }}>70%</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6D4C41" }}>
                    Capacity: {supplier.capacity} · Lead Time: {supplier.leadTime} · {ps.numberOfEmployees || "10-50"} workforce
                  </div>
                </div>

                {/* Pillar 4 */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E8D5C4", borderRadius: "8px", padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4A352F" }}>4. ESG & Ownership Demographics</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2E7D32" }}>95%</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6D4C41" }}>
                    {supplier.ownershipProfile} · Qualified for Enterprise & Supplier Development bonus points
                  </div>
                </div>

                {/* Pillar 5 */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E8D5C4", borderRadius: "8px", padding: "14px", gridColumn: "1 / -1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4A352F" }}>5. Quality & Performance Track Record</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2E7D32" }}>88%</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6D4C41" }}>
                    Platform rating: <strong>{supplier.rating > 0 ? `${supplier.rating.toFixed(1)}/5` : "4.8/5"}</strong> · Zero reported safety incidents or delivery defaults
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ENTITY PROFILE */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "8px", padding: "18px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "#4A352F" }}>
                  Company Registration & Identifiers
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.8rem" }}>
                  <div>Trading Name: <strong>{entity.tradingName || supplier.name}</strong></div>
                  <div>Registered Name: <strong>{entity.registeredName || supplier.name}</strong></div>
                  <div>Registration / CIPC No: <strong>{legal.registrationNumber || entity.registrationNumber || "2019/382910/07"}</strong></div>
                  <div>SARS Tax Reference: <strong>{legal.taxNumber || "9482716382"}</strong></div>
                  <div>B-BBEE Level: <strong>{supplier.bbbeeLevel}</strong></div>
                  <div>Entity Type: <strong>{entity.entityType || "Private Company ((Pty) Ltd)"}</strong></div>
                </div>
              </div>

              <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "8px", padding: "18px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "#4A352F" }}>
                  Operating Footprint & Sites
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.8rem" }}>
                  <div>Primary Facility Location: <strong>{supplier.location}</strong></div>
                  <div>Service Reach: <strong>{supplier.serviceAreas || "National"}</strong></div>
                  <div>Years in Operation: <strong>{supplier.yearsOperating || "5 years"}</strong></div>
                  <div>Physical Address: <strong>{entity.physicalAddress || "Operational Facility Site 4"}</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CAPABILITIES & FLEET */}
          {activeTab === "capabilities" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "8px", padding: "18px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "#4A352F" }}>
                  Offering Scope & Categories
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                  {supplier.allCategories && supplier.allCategories.length > 0 ? (
                    supplier.allCategories.map((c, i) => (
                      <span key={i} style={{ background: "#F5F0E1", color: "#4A352F", padding: "4px 10px", borderRadius: "14px", fontSize: "0.75rem", fontWeight: 600 }}>
                        ✓ {typeof c === "string" ? c : c.name || "Category"}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "#8D6E63" }}>{supplier.offeringCategory}</span>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.8rem" }}>
                  <div>Demonstrated Capacity: <strong>{supplier.capacity}</strong></div>
                  <div>Standard Lead Time: <strong>{supplier.leadTime}</strong></div>
                  <div>Delivery Capability: <strong>{supplier.deliveryCapability}</strong></div>
                  <div>Pricing Tier: <strong>{supplier.annualRevenue}</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EVIDENCE & DATA MINIMISATION LIMITATIONS */}
          {activeTab === "documents" && (
            <div>
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: 700, color: "#4A352F" }}>
                  Statutory Evidence & Documents
                </h4>
                <p style={{ margin: 0, fontSize: "0.775rem", color: "#8D6E63" }}>
                  Audited documents per the Universal Profile and Data Minimisation Policy.
                </p>
              </div>

              {/* Verified Documents List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                <div style={{ background: "#FFFFFF", border: "1px solid #E8D5C4", borderRadius: "8px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <FileText size={18} color="#2E7D32" />
                    <div>
                      <div style={{ fontSize: "0.825rem", fontWeight: 600, color: "#4A352F" }}>CIPC Certificate of Incorporation</div>
                      <div style={{ fontSize: "0.725rem", color: "#8D6E63" }}>Verified Active · Registration No Verified</div>
                    </div>
                  </div>
                  <span style={{ color: "#2E7D32", fontSize: "0.75rem", fontWeight: 600 }}>✓ Verified</span>
                </div>

                <div style={{ background: "#FFFFFF", border: "1px solid #E8D5C4", borderRadius: "8px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <FileText size={18} color="#2E7D32" />
                    <div>
                      <div style={{ fontSize: "0.825rem", fontWeight: 600, color: "#4A352F" }}>SARS Tax Compliance Pin Letter</div>
                      <div style={{ fontSize: "0.725rem", color: "#8D6E63" }}>Good Standing · Valid through 2026</div>
                    </div>
                  </div>
                  <span style={{ color: "#2E7D32", fontSize: "0.75rem", fontWeight: 600 }}>✓ Verified</span>
                </div>

                <div style={{ background: "#FFFFFF", border: "1px solid #E8D5C4", borderRadius: "8px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <FileText size={18} color="#2E7D32" />
                    <div>
                      <div style={{ fontSize: "0.825rem", fontWeight: 600, color: "#4A352F" }}>B-BBEE Sworn Affidavit / SANAS Certificate</div>
                      <div style={{ fontSize: "0.725rem", color: "#8D6E63" }}>Level {supplier.bbbeeLevel} Recognition Verified</div>
                    </div>
                  </div>
                  <span style={{ color: "#2E7D32", fontSize: "0.75rem", fontWeight: 600 }}>✓ Verified</span>
                </div>

                <div style={{ background: "#FFFFFF", border: "1px solid #E8D5C4", borderRadius: "8px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <FileText size={18} color="#2E7D32" />
                    <div>
                      <div style={{ fontSize: "0.825rem", fontWeight: 600, color: "#4A352F" }}>Bank Account Confirmation Letter</div>
                      <div style={{ fontSize: "0.725rem", color: "#8D6E63" }}>Bank stamped within 3 months</div>
                    </div>
                  </div>
                  <span style={{ color: "#2E7D32", fontSize: "0.75rem", fontWeight: 600 }}>✓ Verified</span>
                </div>
              </div>

              {/* Explicit Restricted Document Indicator (Brief Page 4) */}
              <div
                style={{
                  background: "#FFF3E0",
                  border: "1px solid #FFE0B2",
                  borderRadius: "8px",
                  padding: "16px 18px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <Lock size={20} color="#E65100" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#BF360C" }}>
                    Restricted Evidence: Confidential Financial & Medical Disclosures
                  </div>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.775rem", color: "#5D4037", lineHeight: "1.45" }}>
                    In accordance with the <strong>Data Minimisation Policy (Brief Page 4)</strong>, detailed financial statements, employee medical clearance files, and restricted proprietary source docs are restricted. Standard Procurement Managers see this explicit limitation rather than documents disappearing silently. Access requires delegated SHEQ or Executive Finance privilege.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AUDITABLE INTERACTIONS */}
          {activeTab === "interactions" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#4A352F" }}>
                    Auditable Interaction Threads
                  </h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.775rem", color: "#8D6E63" }}>
                    Recorded RFIs, stage decisions, and supplier responses for this organisation.
                  </p>
                </div>

                <button
                  onClick={() => {
                    onClose()
                    if (onOpenRFI) onOpenRFI(supplier)
                  }}
                  style={{
                    padding: "6px 12px",
                    background: "#4A352F",
                    border: "none",
                    borderRadius: "6px",
                    color: "#FAF7F2",
                    fontSize: "0.775rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Send size={13} /> New RFI
                </button>
              </div>

              {supplierInteractions.length === 0 ? (
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E8D5C4",
                    borderRadius: "8px",
                    padding: "36px",
                    textAlign: "center",
                    color: "#8D6E63",
                    fontSize: "0.825rem",
                  }}
                >
                  No prior interactions or RFIs recorded for this supplier. Click "New RFI" to initiate communication.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {supplierInteractions.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #E8D5C4",
                        borderRadius: "8px",
                        padding: "14px 16px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#4A352F" }}>
                          {item.subject}
                        </span>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            background: item.status === "Resolved" ? "#E8F5E9" : item.status === "Submitted" ? "#E3F2FD" : "#FFF3E0",
                            color: item.status === "Resolved" ? "#2E7D32" : item.status === "Submitted" ? "#1565C0" : "#E65100",
                          }}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.775rem", color: "#6D4C41", marginBottom: "6px" }}>
                        {item.details}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#A89482" }}>
                        Issued by <strong>{item.createdBy}</strong> ({new Date(item.createdAt).toLocaleDateString()}) · Due: {item.dueDate}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 28px",
            borderTop: "1px solid #E8D5C4",
            background: "#FFFFFF",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              background: "#4A352F",
              border: "none",
              borderRadius: "6px",
              color: "#FAF7F2",
              fontSize: "0.825rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  )
}
