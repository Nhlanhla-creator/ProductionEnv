"use client"

import React, { useEffect } from "react"
import { X, CheckCircle2, AlertTriangle, ShieldCheck, Scale, ArrowRight } from "lucide-react"

export default function SupplierCompareModal({
  isOpen,
  onClose,
  selectedSuppliers = [],
  onOpenSupplierDetail,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || selectedSuppliers.length === 0) return null

  const getScoreColor = (score) => {
    const s = Number(score) || 0
    if (s >= 75) return "#2E7D32"
    if (s >= 50) return "#F57C00"
    return "#D32F2F"
  }

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
        zIndex: 1100,
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
          maxWidth: "1000px",
          maxHeight: "90vh",
          backgroundColor: "#FAF7F2",
          borderRadius: "12px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 24px",
            background: "#4A352F",
            color: "#FAF7F2",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Scale size={20} color="#D4AF37" />
            <div>
              <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 600, color: "#FAF7F2" }}>
                Supplier Fit Comparison ({selectedSuppliers.length} suppliers)
              </h2>
              <div style={{ fontSize: "0.75rem", color: "#D7CCC8", marginTop: "2px" }}>
                Evaluating against Standard Procurement Requirement v1.0
              </div>
            </div>
          </div>
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

        {/* Scope Preservation Notice */}
        <div
          style={{
            background: "#FFF8E1",
            padding: "8px 24px",
            borderBottom: "1px solid #FFE082",
            fontSize: "0.75rem",
            color: "#795548",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontWeight: 600 }}>Notice:</span>
          <span>
            Comparison preserves category scope and Passport versions to ensure unlike supplier operational scopes are not evaluated as equivalent.
          </span>
        </div>

        {/* Comparison Grid */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `200px repeat(${selectedSuppliers.length}, 1fr)`,
              border: "1px solid #E8D5C4",
              borderRadius: "8px",
              overflow: "hidden",
              background: "#FFFFFF",
            }}
          >
            {/* Header Row: Names */}
            <div style={{ padding: "16px", background: "#F5F0E1", fontWeight: 700, color: "#4A352F", borderBottom: "1px solid #E8D5C4", borderRight: "1px solid #E8D5C4" }}>
              Supplier
            </div>
            {selectedSuppliers.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "16px",
                  background: "#FAF7F2",
                  borderBottom: "1px solid #E8D5C4",
                  borderRight: "1px solid #E8D5C4",
                  textAlign: "center",
                }}
              >
                <div style={{ fontWeight: 700, color: "#4A352F", fontSize: "0.95rem" }}>{s.name}</div>
                <div style={{ fontSize: "0.75rem", color: "#8D6E63", marginTop: "2px" }}>{s.offeringCategory}</div>
                <div style={{ fontSize: "0.75rem", color: "#8D6E63" }}>{s.location}</div>
              </div>
            ))}

            {/* Requirement Fit Row */}
            <div style={{ padding: "14px 16px", background: "#FEFCFA", fontWeight: 600, color: "#5D4037", borderBottom: "1px solid #E8D5C4", borderRight: "1px solid #E8D5C4" }}>
              Requirement Fit %
            </div>
            {selectedSuppliers.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid #E8D5C4",
                  borderRight: "1px solid #E8D5C4",
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color: getScoreColor(s.requirementFit),
                }}
              >
                {Math.round(s.requirementFit)}%
              </div>
            ))}

            {/* BIG Score Row */}
            <div style={{ padding: "14px 16px", background: "#FEFCFA", fontWeight: 600, color: "#5D4037", borderBottom: "1px solid #E8D5C4", borderRight: "1px solid #E8D5C4" }}>
              BIG Score
            </div>
            {selectedSuppliers.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid #E8D5C4",
                  borderRight: "1px solid #E8D5C4",
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "#4A352F",
                }}
              >
                {s.bigScore !== null ? `${s.bigScore}/100` : "Under Review"}
              </div>
            ))}

            {/* Passport Status Row */}
            <div style={{ padding: "14px 16px", background: "#FEFCFA", fontWeight: 600, color: "#5D4037", borderBottom: "1px solid #E8D5C4", borderRight: "1px solid #E8D5C4" }}>
              Passport Status
            </div>
            {selectedSuppliers.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid #E8D5C4",
                  borderRight: "1px solid #E8D5C4",
                  textAlign: "center",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: s.passportVariant === "success" ? "#2E7D32" : s.passportVariant === "warning" ? "#F57C00" : "#D32F2F",
                }}
              >
                {s.passportLabel}
              </div>
            ))}

            {/* B-BBEE Level Row */}
            <div style={{ padding: "14px 16px", background: "#FEFCFA", fontWeight: 600, color: "#5D4037", borderBottom: "1px solid #E8D5C4", borderRight: "1px solid #E8D5C4" }}>
              B-BBEE Level
            </div>
            {selectedSuppliers.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid #E8D5C4",
                  borderRight: "1px solid #E8D5C4",
                  textAlign: "center",
                  fontSize: "0.85rem",
                  color: "#4A352F",
                  fontWeight: 500,
                }}
              >
                {s.bbbeeLevel}
              </div>
            ))}

            {/* Verification Coverage Row */}
            <div style={{ padding: "14px 16px", background: "#FEFCFA", fontWeight: 600, color: "#5D4037", borderBottom: "1px solid #E8D5C4", borderRight: "1px solid #E8D5C4" }}>
              Verification Coverage
            </div>
            {selectedSuppliers.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid #E8D5C4",
                  borderRight: "1px solid #E8D5C4",
                  textAlign: "center",
                  fontSize: "0.85rem",
                  color: "#4A352F",
                }}
              >
                {s.verifiedCoverage}% ({s.documentCount} docs)
              </div>
            ))}

            {/* Critical Gaps Row */}
            <div style={{ padding: "14px 16px", background: "#FEFCFA", fontWeight: 600, color: "#5D4037", borderBottom: "1px solid #E8D5C4", borderRight: "1px solid #E8D5C4" }}>
              Critical Gaps
            </div>
            {selectedSuppliers.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid #E8D5C4",
                  borderRight: "1px solid #E8D5C4",
                  fontSize: "0.75rem",
                  color: s.criticalGaps?.length ? "#C62828" : "#2E7D32",
                  textAlign: "center",
                }}
              >
                {s.criticalGaps?.length ? s.criticalGaps.join(" · ") : "None detected"}
              </div>
            ))}

            {/* Action Row */}
            <div style={{ padding: "14px 16px", background: "#FEFCFA", fontWeight: 600, color: "#5D4037", borderRight: "1px solid #E8D5C4" }}>
              Inspect Action
            </div>
            {selectedSuppliers.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "14px 16px",
                  borderRight: "1px solid #E8D5C4",
                  textAlign: "center",
                }}
              >
                <button
                  onClick={() => {
                    onClose()
                    if (onOpenSupplierDetail) onOpenSupplierDetail(s)
                  }}
                  style={{
                    padding: "6px 12px",
                    background: "#4A352F",
                    border: "none",
                    borderRadius: "4px",
                    color: "#FAF7F2",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  View Detail
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #E8D5C4",
            background: "#FFFFFF",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 18px",
              background: "#4A352F",
              border: "none",
              borderRadius: "6px",
              color: "#FAF7F2",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  )
}
