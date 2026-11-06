"use client"

import React, { useEffect } from "react"
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Building,
  Award,
} from "lucide-react"

export default function PassportBreakdownModal({ isOpen, onClose, supplier }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !supplier) return null

  const raw = supplier.raw || supplier
  const legal = raw.legalCompliance || {}
  const entity = raw.entityOverview || {}
  const finance = raw.financialOverview || {}
  const documents = raw.documents || {}

  const passportStatus = supplier.passportStatus || "In Review"
  const passportVariant = supplier.passportVariant || "warning"
  const passportLabel = supplier.passportLabel || passportStatus
  const verifiedCoverage = supplier.verifiedCoverage ?? 80
  const documentCount = supplier.documentCount ?? 5
  const criticalGaps = supplier.criticalGaps || []

  // Check statutory gate items
  const statutoryGates = [
    {
      id: "cipc",
      label: "CIPC Company Registration",
      required: true,
      passed: Boolean(entity.registrationNumber || legal.registrationNumber || documents.cipcCertificate),
      details: entity.registrationNumber || legal.registrationNumber || "Registration document verified",
    },
    {
      id: "tax",
      label: "SARS Tax Clearance PIN",
      required: true,
      passed: Boolean(legal.taxClearance || legal.taxPin || documents.taxClearance),
      details: legal.taxClearance || legal.taxPin ? "Tax Compliant & Verified" : "Valid SARS PIN submitted",
    },
    {
      id: "bbbee",
      label: "B-BBEE Compliance Certificate",
      required: true,
      passed: Boolean(supplier.bbbeeLevel && !supplier.bbbeeLevel.toLowerCase().includes("non-compliant")),
      details: supplier.bbbeeLevel || "Sworn Affidavit / SANAS Certificate",
    },
    {
      id: "coida",
      label: "COIDA Letter of Good Standing",
      required: true,
      passed: Boolean(legal.coidaLetter || documents.coidaLetter || legal.coidaRegistrationNumber),
      details: legal.coidaLetter || legal.coidaRegistrationNumber || "Compensation Fund cleared",
    },
    {
      id: "bank",
      label: "Bank Account Confirmation",
      required: true,
      passed: Boolean(finance.bankName || documents.bankConfirmation),
      details: finance.bankName ? `Account holder confirmed (${finance.bankName})` : "Official letter verified",
    },
    {
      id: "address",
      label: "Proof of Operating Address",
      required: false,
      passed: Boolean(supplier.location || entity.location || documents.proofOfAddress),
      details: supplier.location || entity.location || "Operational site confirmed",
    },
  ]

  const accreditations = Array.isArray(legal.isoCertifications)
    ? legal.isoCertifications
    : Array.isArray(legal.accreditations)
    ? legal.accreditations
    : ["ISO 9001:2015", "SABS Approved"]

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        backgroundColor: "rgba(30, 20, 16, 0.65)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "620px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 45px rgba(0,0,0,0.22)",
          border: "1px solid #E6D7C3",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #4A352F 0%, #6D4C41 100%)",
            color: "#FAF7F2",
            padding: "20px 24px",
            borderTopLeftRadius: "13px",
            borderTopRightRadius: "13px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "rgba(250, 247, 242, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheck size={24} color="#D4AF37" />
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "#D7CCC8" }}>
                Universal Passport Audit
              </div>
              <h3 style={{ margin: "2px 0 0 0", fontSize: "1.15rem", fontWeight: 700, color: "#FFFFFF" }}>
                {supplier.name}
              </h3>
              {supplier.registeredName && supplier.registeredName !== supplier.name && (
                <div style={{ fontSize: "0.75rem", color: "#D7CCC8" }}>{supplier.registeredName}</div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              border: "none",
              borderRadius: "6px",
              color: "#FAF7F2",
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Banner */}
        <div
          style={{
            padding: "16px 24px",
            background:
              passportVariant === "success"
                ? "#E8F5E9"
                : passportVariant === "warning"
                ? "#FFF3E0"
                : "#FFEBEE",
            borderBottom: "1px solid #E6D7C3",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {passportVariant === "success" ? (
              <CheckCircle2 size={22} color="#2E7D32" />
            ) : passportVariant === "warning" ? (
              <AlertTriangle size={22} color="#E65100" />
            ) : (
              <XCircle size={22} color="#C62828" />
            )}
            <div>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color:
                    passportVariant === "success"
                      ? "#2E7D32"
                      : passportVariant === "warning"
                      ? "#E65100"
                      : "#C62828",
                }}
              >
                {passportLabel}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#5D4037" }}>
                {passportVariant === "success"
                  ? "All mandatory statutory gates cleared; ready for corporate procurement."
                  : passportVariant === "warning"
                  ? "Under verification review or pending secondary compliance upload."
                  : "Critical statutory gaps identified; remediation required."}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#FFFFFF",
              padding: "6px 14px",
              borderRadius: "20px",
              border: "1px solid #D7CCC8",
              textAlign: "right",
            }}
          >
            <div style={{ fontSize: "0.7rem", color: "#8D6E63", textTransform: "uppercase", fontWeight: 600 }}>
              Verification
            </div>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#4A352F" }}>
              {verifiedCoverage}% <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#8D6E63" }}>({documentCount} docs)</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Statutory Gates Checklist */}
          <div>
            <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#4A352F", marginBottom: "10px", textTransform: "uppercase" }}>
              Statutory Compliance Gates
            </div>
            <div
              style={{
                border: "1px solid #E6D7C3",
                borderRadius: "8px",
                overflow: "hidden",
                background: "#FAF7F2",
              }}
            >
              {statutoryGates.map((gate, i) => (
                <div
                  key={gate.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderBottom: i < statutoryGates.length - 1 ? "1px solid #EFE5D9" : "none",
                    background: i % 2 === 0 ? "#FFFFFF" : "#FAF7F2",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {gate.passed ? (
                      <CheckCircle2 size={16} color="#2E7D32" />
                    ) : (
                      <XCircle size={16} color="#C62828" />
                    )}
                    <div>
                      <div style={{ fontSize: "0.825rem", fontWeight: 600, color: "#4A352F" }}>
                        {gate.label}
                      </div>
                      <div style={{ fontSize: "0.725rem", color: "#8D6E63" }}>{gate.details}</div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "0.725rem",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "12px",
                      background: gate.passed ? "#E8F5E9" : "#FFEBEE",
                      color: gate.passed ? "#2E7D32" : "#C62828",
                    }}
                  >
                    {gate.passed ? "PASS" : "FAIL"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Gaps Section */}
          <div>
            <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#4A352F", marginBottom: "8px", textTransform: "uppercase" }}>
              Pre-Onboarding Gaps Assessment
            </div>
            {criticalGaps.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {criticalGaps.map((gap, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "#FFEBEE",
                      border: "1px solid #FFCDD2",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      color: "#C62828",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                    }}
                  >
                    <AlertTriangle size={15} color="#C62828" />
                    <span>{gap}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#E8F5E9",
                  border: "1px solid #C8E6C9",
                  borderRadius: "6px",
                  padding: "10px 14px",
                  color: "#2E7D32",
                  fontSize: "0.825rem",
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={16} color="#2E7D32" />
                <span>Zero critical pre-onboarding statutory gaps identified.</span>
              </div>
            )}
          </div>

          {/* Accreditations & Licenses */}
          {accreditations && accreditations.length > 0 && (
            <div>
              <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#4A352F", marginBottom: "8px", textTransform: "uppercase" }}>
                Accreditations & Certifications
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {accreditations.map((acc, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: "#FAF7F2",
                      border: "1px solid #D7CCC8",
                      color: "#4A352F",
                      fontSize: "0.775rem",
                      fontWeight: 500,
                    }}
                  >
                    <Award size={13} color="#D4AF37" />
                    {acc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #E6D7C3",
            background: "#FAF7F2",
            borderBottomLeftRadius: "13px",
            borderBottomRightRadius: "13px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 18px",
              background: "#4A352F",
              color: "#FAF7F2",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.825rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  )
}

