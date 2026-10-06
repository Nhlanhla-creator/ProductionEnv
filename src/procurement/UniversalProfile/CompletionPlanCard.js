"use client"

import React from "react"
import { useNavigate } from "react-router-dom"
import { Sparkles, ArrowRight } from "lucide-react"

export default function CompletionPlanCard({
  stateInfo,
}) {
  const navigate = useNavigate()
  const { state, completionPercentage, isMatchReady } = stateInfo

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E6D7C3",
        borderRadius: "12px",
        padding: "20px 24px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
      }}
    >
      {/* Header Row: State Badge + Progress */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "20px",
                background: state.badgeBg,
                color: state.badgeColor,
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Stage {state.step}/6: {state.label}
            </span>
            <span style={{ fontSize: "0.85rem", color: "#8D6E63", fontWeight: 500 }}>
              Tailored Readiness Engine
            </span>
          </div>

          <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#4A352F" }}>
            Procurement Universal Profile Readiness
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#6D4C41", maxWidth: "600px" }}>
            {state.description}
          </p>
        </div>

        {/* Progress Indicator */}
        <div style={{ textAlign: "right", minWidth: "180px" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#4A352F" }}>
            {completionPercentage}%
          </div>
          <div style={{ fontSize: "0.75rem", color: "#8D6E63", marginBottom: "6px" }}>
            Profile Completion
          </div>
          <div
            style={{
              width: "100%",
              height: "8px",
              background: "#F5F0E1",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${completionPercentage}%`,
                height: "100%",
                background: state.badgeColor,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
