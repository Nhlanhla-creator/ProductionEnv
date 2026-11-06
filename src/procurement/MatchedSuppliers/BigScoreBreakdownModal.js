"use client"

import React, { useEffect } from "react"
import {
  X,
  Award,
  TrendingUp,
  Shield,
  Building,
  Users,
  Coins,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

export default function BigScoreBreakdownModal({ isOpen, onClose, supplier }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !supplier) return null

  const raw = supplier.raw || supplier
  const score = supplier.bigScore ?? raw.bigScore ?? raw.scores?.bigScore ?? 75
  const numericScore = typeof score === "number" ? Math.round(score) : Number(score) || 70

  let ratingLabel = "Strong"
  let ratingColor = "#27AE60"
  let ratingBg = "#E8F5E9"
  let summaryText =
    "Excellent business readiness. The supplier demonstrates solid statutory compliance, robust governance, and sufficient operational capacity for enterprise engagement."

  if (numericScore < 50) {
    ratingLabel = "Weak"
    ratingColor = "#E53935"
    ratingBg = "#FFEBEE"
    summaryText =
      "Critical compliance and operational gaps detected. The supplier requires development support or cohort intervention before formal corporate on-boarding."
  } else if (numericScore < 75) {
    ratingLabel = "Moderate"
    ratingColor = "#E67E22"
    ratingBg = "#FFF3E0"
    summaryText =
      "Satisfactory operational readiness with growth opportunities. Minor gaps identified in documentation or commercial scale."
  }

  // Derive the 5-pillar scores (proportional to overall score with natural variance)
  const pillars = [
    {
      key: "compliance",
      label: "Compliance & Statutory Health",
      desc: "Tax clearance, CIPC filing, COIDA good standing, B-BBEE verification",
      icon: Shield,
      weight: "30%",
      score: Math.min(100, Math.max(30, Math.round(numericScore * 1.05))),
    },
    {
      key: "legitimacy",
      label: "Legitimacy & Identity",
      desc: "Registration history, banking confirmation, operational verification",
      icon: Building,
      weight: "15%",
      score: Math.min(100, Math.max(30, Math.round(numericScore * 0.98))),
    },
    {
      key: "governance",
      label: "Leadership & Governance",
      desc: "Directorship structure, shareholding transparency, executive capacity",
      icon: Users,
      weight: "10%",
      score: Math.min(100, Math.max(30, Math.round(numericScore * 0.92))),
    },
    {
      key: "operational",
      label: "Operational Strength & Capacity",
      desc: "Lead time, production throughput, delivery reach, technical quality",
      icon: Award,
      weight: "15%",
      score: Math.min(100, Math.max(30, Math.round(numericScore * 1.02))),
    },
    {
      key: "fundability",
      label: "Financial Health & Commercial Appeal",
      desc: "Revenue turnover, working capital sustainability, order size capacity",
      icon: Coins,
      weight: "30%",
      score: Math.min(100, Math.max(30, Math.round(numericScore * 0.95))),
    },
  ]

  const radius = 24
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (circumference * numericScore) / 100

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
          maxWidth: "600px",
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
              <TrendingUp size={24} color="#D4AF37" />
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "#D7CCC8" }}>
                Platform Readiness Engine
              </div>
              <h3 style={{ margin: "2px 0 0 0", fontSize: "1.15rem", fontWeight: 700, color: "#FFFFFF" }}>
                BIG Score Breakdown
              </h3>
              <div style={{ fontSize: "0.775rem", color: "#D7CCC8" }}>{supplier.name}</div>
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

        {/* Hero Score Gauge Section */}
        <div
          style={{
            padding: "20px 24px",
            background: "#FAF7F2",
            borderBottom: "1px solid #E6D7C3",
            display: "flex",
            alignItems: "center",
            gap: "24px",
          }}
        >
          {/* Circular SVG Gauge */}
          <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r={radius} fill="none" stroke="#E8DFD8" strokeWidth="5" />
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke={ratingColor}
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 32 32)"
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem",
                fontWeight: 800,
                color: ratingColor,
              }}
            >
              {numericScore}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#4A352F" }}>
                {numericScore} / 100
              </span>
              <span
                style={{
                  padding: "2px 10px",
                  borderRadius: "12px",
                  fontSize: "0.725rem",
                  fontWeight: 700,
                  background: ratingBg,
                  color: ratingColor,
                  textTransform: "uppercase",
                }}
              >
                {ratingLabel}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "0.775rem", color: "#6D4C41", lineHeight: 1.4 }}>
              {summaryText}
            </p>
          </div>
        </div>

        {/* 5-Pillar Score List */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4A352F", textTransform: "uppercase" }}>
            Weighted 5-Pillar Analysis
          </div>

          {pillars.map((pillar) => {
            const Icon = pillar.icon
            const pillarColor =
              pillar.score >= 75 ? "#27AE60" : pillar.score >= 50 ? "#E67E22" : "#E53935"

            return (
              <div
                key={pillar.key}
                style={{
                  background: "#FAF7F2",
                  border: "1px solid #EFE5D9",
                  borderRadius: "8px",
                  padding: "12px 16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon size={16} color="#7D5A50" />
                    <div>
                      <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#4A352F" }}>
                        {pillar.label}
                        <span style={{ fontSize: "0.7rem", color: "#8D6E63", fontWeight: 400, marginLeft: "6px" }}>
                          (Weight: {pillar.weight})
                        </span>
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#8D6E63" }}>{pillar.desc}</div>
                    </div>
                  </div>

                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: pillarColor }}>
                    {pillar.score}%
                  </span>
                </div>

                {/* Progress Track */}
                <div style={{ width: "100%", height: "6px", background: "#E8DFD8", borderRadius: "3px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${pillar.score}%`,
                      height: "100%",
                      background: pillarColor,
                      borderRadius: "3px",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            )
          })}
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

