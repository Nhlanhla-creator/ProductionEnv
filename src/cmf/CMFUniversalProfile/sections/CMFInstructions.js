"use client"

import React from "react"
import { Eye, CheckCircle, Clock, AlertCircle, Shield, Globe, ArrowRight } from "lucide-react"
import { CMF_SECTIONS, calculateProfileCompletion, getSectionStatus } from "../../cmfProfileConfig"

export default function CMFInstructions({ formData, completedSections, onPreviewSMEView, onContinue }) {
  const completionPercentage = calculateProfileCompletion(formData, completedSections)

  return (
    <div style={{ width: "100%", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, #4a352f 0%, #3e2723 100%)",
        color: "#f8f5f2",
        padding: "2rem",
        borderRadius: "16px",
        marginBottom: "2rem",
        boxShadow: "0 8px 24px rgba(62, 39, 35, 0.15)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ maxWidth: "800px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.12)", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "1rem", color: "#d9b98a" }}>
            <Shield size={14} /> Capital & Market Facilitator Setup
          </div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: "700", margin: "0 0 0.75rem 0", lineHeight: "1.3" }}>
            Facilitator Profile Setup
          </h1>
          <p style={{ fontSize: "1.05rem", lineHeight: "1.65", color: "#e8d8cf", margin: 0 }}>
            Complete your facilitator profile so SMEs can understand your services, suitability and engagement terms. Your public profile will be shared with SMEs on BIG Marketplace. Fields marked <strong>“Private—BIG verification only”</strong> will not appear on your public profile.
          </p>
        </div>

        {/* Progress & Quick Actions */}
        <div style={{
          marginTop: "1.75rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid rgba(255,255,255,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div style={{ minWidth: "260px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#d7ccc8" }}>
              <span>Profile Completion</span>
              <span>{completionPercentage}%</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.15)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{
                width: `${completionPercentage}%`,
                height: "100%",
                background: completionPercentage === 100 ? "#4caf50" : "linear-gradient(90deg, #d9b98a, #e6d7c3)",
                transition: "width 0.4s ease"
              }} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {onPreviewSMEView && (
              <button
                type="button"
                onClick={onPreviewSMEView}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.12)",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.25)",
                  padding: "9px 18px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <Eye size={16} /> Preview SME View
              </button>
            )}
            {onContinue && (
              <button
                type="button"
                onClick={onContinue}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#d9b98a",
                  color: "#3e2723",
                  border: "none",
                  padding: "9px 20px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                }}
              >
                Start Profile <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Principles Guidelines */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "1.25rem",
        marginBottom: "2rem"
      }}>
        <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.5rem" }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: "#e8f5e9", color: "#2e7d32" }}>
              <Globe size={18} />
            </span>
            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#4a352f" }}>Public SME Profile</h4>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "#7d5a50", lineHeight: "1.6" }}>
            Only relevant facilitator information, service offerings, matching criteria, and contact routes are displayed to SMEs on BIG Marketplace.
          </p>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.5rem" }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: "#fef3c7", color: "#b45309" }}>
              <Shield size={18} />
            </span>
            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#4a352f" }}>Private BIG Verification</h4>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "#7d5a50", lineHeight: "1.6" }}>
            Legal entity IDs, account admin details, and internal verification documentation are strictly confidential and only accessed by BIG for validation.
          </p>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.5rem" }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: "#e0f2fe", color: "#0369a1" }}>
              <CheckCircle size={18} />
            </span>
            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#4a352f" }}>Auto-Saved & Incremental</h4>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "#7d5a50", lineHeight: "1.6" }}>
            Save progress at any time and return later. Each card has an independent status (Not started / In progress / Complete).
          </p>
        </div>
      </div>

      {/* Section Roadmap & Status Breakdown */}
      <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "14px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "16px", fontWeight: "700", color: "#4a352f" }}>
          Profile Sections & Card Status
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "12px" }}>
          {CMF_SECTIONS.map((sec) => {
            const status = getSectionStatus(sec.id, formData, completedSections)
            const isDone = status === "Complete"
            const isInProg = status === "In progress"

            const badgeBg = isDone ? "#e8f5e9" : isInProg ? "#fef3c7" : "#f5f5f5"
            const badgeColor = isDone ? "#2e7d32" : isInProg ? "#b45309" : "#757575"
            const Icon = isDone ? CheckCircle : isInProg ? Clock : AlertCircle

            return (
              <div
                key={sec.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid #f0e6da",
                  background: "#faf7f2"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "#e6d7c3",
                    color: "#4a352f",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "700"
                  }}>
                    {sec.step}
                  </span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#4a352f" }}>
                      {sec.shortLabel}
                    </div>
                    <div style={{ fontSize: "11px", color: "#8d6e63" }}>
                      {sec.purpose}
                    </div>
                  </div>
                </div>

                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "3px 8px",
                  borderRadius: "12px",
                  background: badgeBg,
                  color: badgeColor,
                  whiteSpace: "nowrap"
                }}>
                  <Icon size={12} /> {status}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
