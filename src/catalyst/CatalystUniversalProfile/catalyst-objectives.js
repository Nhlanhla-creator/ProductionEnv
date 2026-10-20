"use client"

import React from "react"
import { Check, Info, ArrowRight, CheckCircle2 } from "lucide-react"
import { CATALYST_ACTIVITIES, PLATFORM_OBJECTIVES } from "./catalystTaxonomy"
import styles from "./catalyst-universal-profile.module.css"

export default function CatalystObjectives({
  data = {},
  updateData,
  onContinue,
  onSave,
}) {
  const selectedActivities = data.catalystActivities || []
  const selectedObjectives = data.platformObjectives || []

  const toggleActivity = (activityId) => {
    let updated
    if (selectedActivities.includes(activityId)) {
      updated = selectedActivities.filter((id) => id !== activityId)
    } else {
      updated = [...selectedActivities, activityId]
    }
    updateData({ catalystActivities: updated })
  }

  const toggleObjective = (objectiveId) => {
    let updated
    if (selectedObjectives.includes(objectiveId)) {
      updated = selectedObjectives.filter((id) => id !== objectiveId)
    } else {
      updated = [...selectedObjectives, objectiveId]
    }
    updateData({ platformObjectives: updated })
  }

  const isComplete = selectedActivities.length > 0 && selectedObjectives.length > 0

  return (
    <div className={styles.productApplicationContainer}>
      <div className={styles.sectionTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span>Platform Objectives & Catalyst Scope</span>
      </div>

      <div
        style={{
          backgroundColor: "var(--up-brown-100, #f3e5dc)",
          borderLeft: "4px solid var(--up-brown-700, #795548)",
          padding: "1rem",
          borderRadius: "4px",
          marginBottom: "1.5rem",
          color: "var(--up-brown-900, #5d4037)",
          fontSize: "0.95rem",
          lineHeight: "1.5",
        }}
      >
        <strong>Setup Guidance:</strong> Choose the enterprise support services your organisation runs and what you want to achieve on BIG. These choices tailor your programme workspace and matching criteria, and they can be updated later at any time without creating another account.
      </div>

      {/* Section 1: Catalyst Activities */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div>
            <h3 className={styles.productApplicationHeading} style={{ margin: 0, border: "none" }}>
              1. Catalyst Activities <span style={{ color: "var(--up-red, #f44336)" }}>*</span>
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--up-brown-600, #8d6e63)" }}>
              Types of enterprise support your organisation operates. You may select more than one.
            </p>
          </div>
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              padding: "4px 8px",
              borderRadius: "12px",
              backgroundColor: selectedActivities.length > 0 ? "var(--up-brown-200, #e8d8cf)" : "#eee",
              color: "var(--up-brown-900, #5d4037)",
            }}
          >
            {selectedActivities.length} selected
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          {CATALYST_ACTIVITIES.map((activity) => {
            const isSelected = selectedActivities.includes(activity.id)
            return (
              <div
                key={activity.id}
                onClick={() => toggleActivity(activity.id)}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    toggleActivity(activity.id)
                  }
                }}
                style={{
                  border: isSelected ? "2px solid var(--up-brown-700, #795548)" : "1px solid var(--up-brown-300, #d7ccc8)",
                  backgroundColor: isSelected ? "var(--up-brown-50, #f8f5f2)" : "#ffffff",
                  borderRadius: "8px",
                  padding: "1rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: isSelected ? "0 2px 6px rgba(121, 85, 72, 0.15)" : "none",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--up-brown-900, #5d4037)" }}>
                      {activity.label}
                    </span>
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "4px",
                        border: isSelected ? "none" : "2px solid var(--up-brown-400, #bcaaa4)",
                        backgroundColor: isSelected ? "var(--up-brown-700, #795548)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                      }}
                    >
                      {isSelected && <Check size={16} strokeWidth={3} />}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--up-brown-700, #6d4c41)", lineHeight: "1.4" }}>
                    {activity.description}
                  </p>
                </div>
                {activity.id === "esd" && (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      padding: "6px 8px",
                      backgroundColor: "var(--up-brown-100, #f3e5dc)",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      color: "var(--up-brown-800, #6d4c41)",
                      fontWeight: 500,
                    }}
                  >
                    💡 Enables Enterprise Development (ED), Supplier Development (SD) and combined ESD templates.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 2: Platform Objectives */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div>
            <h3 className={styles.productApplicationHeading} style={{ margin: 0, border: "none" }}>
              2. Platform Objectives <span style={{ color: "var(--up-red, #f44336)" }}>*</span>
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--up-brown-600, #8d6e63)" }}>
              What your organisation aims to accomplish on the BIG Marketplace.
            </p>
          </div>
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              padding: "4px 8px",
              borderRadius: "12px",
              backgroundColor: selectedObjectives.length > 0 ? "var(--up-brown-200, #e8d8cf)" : "#eee",
              color: "var(--up-brown-900, #5d4037)",
            }}
          >
            {selectedObjectives.length} selected
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          {PLATFORM_OBJECTIVES.map((obj) => {
            const isSelected = selectedObjectives.includes(obj.id)
            return (
              <div
                key={obj.id}
                onClick={() => toggleObjective(obj.id)}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    toggleObjective(obj.id)
                  }
                }}
                style={{
                  border: isSelected ? "2px solid var(--up-brown-700, #795548)" : "1px solid var(--up-brown-300, #d7ccc8)",
                  backgroundColor: isSelected ? "var(--up-brown-50, #f8f5f2)" : "#ffffff",
                  borderRadius: "8px",
                  padding: "1rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: isSelected ? "0 2px 6px rgba(121, 85, 72, 0.15)" : "none",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--up-brown-900, #5d4037)" }}>
                      {obj.label}
                    </span>
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "4px",
                        border: isSelected ? "none" : "2px solid var(--up-brown-400, #bcaaa4)",
                        backgroundColor: isSelected ? "var(--up-brown-700, #795548)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                      }}
                    >
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--up-brown-600, #8d6e63)", lineHeight: "1.4" }}>
                    {obj.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Action footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid var(--up-brown-200, #e8d8cf)",
          paddingTop: "1.25rem",
          marginTop: "1.5rem",
        }}
      >
        <div style={{ fontSize: "0.85rem", color: "var(--up-brown-700, #6d4c41)" }}>
          {isComplete ? (
            <span style={{ color: "var(--up-green, #4caf50)", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
              <CheckCircle2 size={16} /> Objectives configured
            </span>
          ) : (
            <span style={{ color: "var(--up-brown-600, #8d6e63)" }}>
              Please select at least one activity and one objective to proceed.
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className={styles.saveBtn || ""}
              style={{
                backgroundColor: "#fff",
                border: "1px solid var(--up-brown-400, #bcaaa4)",
                color: "var(--up-brown-900, #5d4037)",
                borderRadius: "6px",
                padding: "8px 16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save Draft
            </button>
          )}
          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              disabled={!isComplete}
              style={{
                backgroundColor: isComplete ? "var(--up-brown-700, #795548)" : "var(--up-brown-300, #d7ccc8)",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 20px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: isComplete ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
              }}
            >
              <span>Continue to Entity Overview</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
