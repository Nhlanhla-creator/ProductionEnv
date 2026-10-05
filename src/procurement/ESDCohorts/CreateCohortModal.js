"use client"

import React, { useState } from "react"
import { X, Users, Layers, Calendar, DollarSign, UserCheck, Plus } from "lucide-react"

export default function CreateCohortModal({ isOpen, onClose, onCreateCohort }) {
  const [name, setName] = useState("")
  const [sponsor, setSponsor] = useState("Corporate Enterprise Development Fund")
  const [objective, setObjective] = useState("")
  const [category, setCategory] = useState("Mining & Industrial Equipment")
  const [sites, setSites] = useState("Gauteng, Mpumalanga")
  const [budgetEnvelope, setBudgetEnvelope] = useState("R 3,500,000")
  const [owner, setOwner] = useState("Nhlanhla Mthembu (ESD Lead)")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0]
  )

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    onCreateCohort({
      name: name.trim(),
      sponsor: sponsor.trim(),
      objective: objective.trim() || "Accelerate local Black-owned SMMEs into procurement tender readiness.",
      category: category.trim(),
      sites: sites.split(",").map((s) => s.trim()).filter(Boolean),
      budgetEnvelope: budgetEnvelope.trim(),
      owner: owner.trim(),
      startDate,
      endDate,
      status: "Active",
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
          maxWidth: "600px",
          maxHeight: "90vh",
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
            <Layers size={20} color="#D4AF37" />
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#FAF7F2" }}>
                Create Enterprise Development Cohort
              </h3>
              <div style={{ fontSize: "0.75rem", color: "#D7CCC8", marginTop: "2px" }}>
                Structured multi-supplier development and readiness accelerator
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
        <form onSubmit={handleSubmit} style={{ padding: "20px 24px", overflowY: "auto" }}>
          {/* Cohort Name */}
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Cohort Name & Title *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 2026 Host Community Mining Consumables Accelerator"
              style={inputStyle}
              required
            />
          </div>

          {/* Sponsor & Category */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={labelStyle}>Funding Sponsor *</label>
              <input
                type="text"
                value={sponsor}
                onChange={(e) => setSponsor(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Category Focus *</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Industrial Equipment & PPE"
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Objective */}
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Program Strategic Objective *</label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g. Develop local Black-owned manufacturers and safety equipment suppliers to achieve Tier 1 commercial readiness."
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
              required
            />
          </div>

          {/* Budget & Lead Owner */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={labelStyle}>Budget Envelope</label>
              <input
                type="text"
                value={budgetEnvelope}
                onChange={(e) => setBudgetEnvelope(e.target.value)}
                placeholder="e.g. R 4,500,000"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Lead ESD Manager / Owner *</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Sites & Dates */}
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Target Operating Sites (comma separated)</label>
            <input
              type="text"
              value={sites}
              onChange={(e) => setSites(e.target.value)}
              placeholder="e.g. Gauteng, Mpumalanga (Witbank Site)"
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Target Graduation / End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Actions */}
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
              <Plus size={15} /> Create Cohort
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
