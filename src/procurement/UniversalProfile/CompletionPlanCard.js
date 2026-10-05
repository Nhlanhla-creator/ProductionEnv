"use client"

import React from "react"
import { useNavigate } from "react-router-dom"
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ListTodo,
} from "lucide-react"

export default function CompletionPlanCard({
  stateInfo,
  onNavigateToSection,
}) {
  const navigate = useNavigate()
  const { state, completionPercentage, tasks, isMatchReady } = stateInfo

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E6D7C3",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
      }}
    >
      {/* Header Row: State Badge + Progress */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
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

          <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#4A352F" }}>
            Procurement Universal Profile Setup Plan
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.825rem", color: "#6D4C41", maxWidth: "600px" }}>
            {state.description}
          </p>
        </div>

        {/* Progress Circular / Bar Indicator */}
        <div style={{ textAlign: "right", minWidth: "160px" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#4A352F" }}>
            {completionPercentage}%
          </div>
          <div style={{ fontSize: "0.75rem", color: "#8D6E63", marginBottom: "6px" }}>
            Profile Readiness
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

      {/* Match Ready Banner Callout */}
      {isMatchReady && (
        <div
          style={{
            background: "#E8F5E9",
            border: "1px solid #C8E6C9",
            borderRadius: "8px",
            padding: "14px 18px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Sparkles size={20} color="#2E7D32" />
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1B5E20" }}>
                Criteria Threshold Reached: Your Organization is Match Ready!
              </div>
              <div style={{ fontSize: "0.775rem", color: "#2E7D32" }}>
                Demand taxonomy and location context are sufficient. You can explore live matched suppliers now.
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate("/procurement/matches")}
            style={{
              padding: "8px 16px",
              background: "#2E7D32",
              border: "none",
              borderRadius: "6px",
              color: "#FFFFFF",
              fontSize: "0.825rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            Explore Matched Suppliers <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Actionable Completion Checklist */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <ListTodo size={16} color="#8D6E63" />
          <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#4A352F" }}>
            Actionable Setup Checklist ({tasks.length} pending task{tasks.length === 1 ? "" : "s"})
          </h4>
        </div>

        {tasks.length === 0 ? (
          <div
            style={{
              background: "#F5F0E1",
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
              color: "#2E7D32",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            ✓ All profile configuration gates are complete! Your organization is fully Live.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  background: "#FAF7F2",
                  border: "1px solid #E8D5C4",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4A352F" }}>
                      {task.title}
                    </span>
                    {task.blocking && (
                      <span
                        style={{
                          background: "#FFEBEE",
                          color: "#C62828",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "0.675rem",
                          fontWeight: 700,
                        }}
                      >
                        Blocks Matching
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.775rem", color: "#6D4C41", marginTop: "2px" }}>
                    {task.description} · Owner: <strong>{task.owner}</strong> ({task.dueDate})
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToSection && onNavigateToSection(task.section)}
                  style={{
                    padding: "6px 12px",
                    background: "#FFFFFF",
                    border: "1px solid #C8B6A6",
                    borderRadius: "6px",
                    color: "#4A352F",
                    fontSize: "0.775rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Configure <ChevronRight size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
