"use client"
// utils/ProfileScopeSwitcher.js
// Toggle shown to company members: company profile  <->  their own profile.
// Renders nothing for owners, users without a company, and facilitator views.
import { useProfileContext, setProfileScope } from "./profile-context"

export default function ProfileScopeSwitcher({ style = {} }) {
  const ctx = useProfileContext()
  if (!ctx || !ctx.canSwitch || ctx.isCmf) return null

  const pill = (active) => ({
    padding: "0.45rem 1rem",
    border: "none",
    cursor: active ? "default" : "pointer",
    fontSize: "0.85rem",
    fontWeight: active ? 600 : 500,
    backgroundColor: active ? "#a67c52" : "white",
    color: active ? "white" : "#4a352f",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  })

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", ...style }}>
      <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>Viewing:</span>
      <div style={{ display: "inline-flex", border: "1px solid #e6d7c3", borderRadius: "999px", overflow: "hidden" }}>
        <button type="button" disabled={ctx.scope === "company"} onClick={() => setProfileScope("company")} style={pill(ctx.scope === "company")}>
          🏢 {ctx.companyName || "Company"}
        </button>
        <button type="button" disabled={ctx.scope === "own"} onClick={() => setProfileScope("own")} style={pill(ctx.scope === "own")}>
          👤 My own profile
        </button>
      </div>
    </div>
  )
}