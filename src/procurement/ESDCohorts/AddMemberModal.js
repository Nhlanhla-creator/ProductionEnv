"use client"

import React, { useState } from "react"
import { X, Users, Award, ShieldCheck, Plus, CheckCircle } from "lucide-react"

const FIVE_C_CONSTRAINTS = [
  "Capital (Cash flow, working capital, credit lines)",
  "Capacity (Equipment, facilities, staff shifts, scale)",
  "Capability (Technical certifications, ISO, skills)",
  "Compliance (Licensing, Tax pin, COIDA, CIPC, B-BBEE)",
  "Commercial (Pricing structure, contract delivery, SLA)",
]

export default function AddMemberModal({
  isOpen,
  onClose,
  cohort,
  matchedSuppliers = [],
  onEnrollSupplier,
}) {
  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [primaryConstraint, setPrimaryConstraint] = useState(FIVE_C_CONSTRAINTS[0])
  const [initialIntervention, setInitialIntervention] = useState("Incubation Diagnostic & Gap Closure Plan")

  if (!isOpen || !cohort) return null

  // Filter out suppliers already in this cohort
  const enrolledIds = new Set((cohort.members || []).map((m) => m.supplierId))
  const availableSuppliers = matchedSuppliers.filter((s) => !enrolledIds.has(s.id))

  const selectedSupplier = availableSuppliers.find((s) => s.id === selectedSupplierId) || availableSuppliers[0]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedSupplier) return

    onEnrollSupplier(cohort.id, selectedSupplier, {
      baselineScore: selectedSupplier.bigScore || 50,
      baselineCoverage: selectedSupplier.verifiedCoverage || 60,
      primaryConstraint,
      activeIntervention: initialIntervention,
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
        backgroundColor: "rgba(30, 20, 15, 0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 1200,
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
          maxWidth: "580px",
          backgroundColor: "#FAF7F2",
          borderRadius: "12px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.22)",
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
            <Users size={20} color="#D4AF37" />
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "#FAF7F2" }}>
                Enroll Supplier into ESD Cohort
              </h3>
              <div style={{ fontSize: "0.75rem", color: "#D7CCC8", marginTop: "2px" }}>
                Cohort: {cohort.name}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
          {availableSuppliers.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#8D6E63", fontSize: "0.85rem" }}>
              All eligible suppliers from the Matched Suppliers pool are already enrolled in this cohort.
            </div>
          ) : (
            <>
              {/* Select Supplier */}
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Select Matched Supplier to Enroll *</label>
                <select
                  value={selectedSupplierId || (selectedSupplier?.id || "")}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  style={inputStyle}
                >
                  {availableSuppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.offeringCategory} · BIG Score: {s.bigScore || "N/A"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Baseline Card */}
              {selectedSupplier && (
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E6D7C3",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    marginBottom: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#4A352F" }}>
                      Entry Baseline Snapshot
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#8D6E63" }}>
                      {selectedSupplier.location} · B-BBEE: {selectedSupplier.bbbeeLevel}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "#4A352F" }}>
                      BIG Score: {selectedSupplier.bigScore || 50}/100
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#2E7D32" }}>
                      Verification: {selectedSupplier.verifiedCoverage || 60}%
                    </div>
                  </div>
                </div>
              )}

              {/* 5C Constraint */}
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Primary 5C Diagnostic Constraint at Entry *</label>
                <select
                  value={primaryConstraint}
                  onChange={(e) => setPrimaryConstraint(e.target.value)}
                  style={inputStyle}
                >
                  {FIVE_C_CONSTRAINTS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div style={{ fontSize: "0.725rem", color: "#8D6E63", marginTop: "4px" }}>
                  Defines the primary structural bottleneck preventing commercial procurement readiness.
                </div>
              </div>

              {/* Initial Intervention */}
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Initial Development Intervention *</label>
                <input
                  type="text"
                  value={initialIntervention}
                  onChange={(e) => setInitialIntervention(e.target.value)}
                  placeholder="e.g. SABS Quality Certification Coaching & Grant"
                  style={inputStyle}
                  required
                />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
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
                  <Plus size={15} /> Enroll in Cohort
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
