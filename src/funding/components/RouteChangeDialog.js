"use client"

import { X, ArrowRight, AlertTriangle, CheckCircle2, EyeOff } from "lucide-react"
import { T } from "./matching/Badges"

/**
 * Confirmation dialog for a route change that deactivates answers.
 * See Brief §3 acceptance #6.
 */

export default function RouteChangeDialog({ preview, onConfirm, onCancel }) {
  if (!preview) return null
  const { diff } = preview

  return (
    <div onClick={onCancel} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.accent }}>
              Change funding route?
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: T.muted, lineHeight: 1.5 }}>
              Some answers below are specific to your current instrument. They will be kept as inactive
              history so you can revert — but they'll no longer count toward the new route.
            </p>
          </div>
          <button onClick={onCancel} style={iconBtn}><X size={20} /></button>
        </div>

        {/* Route delta */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 14px", background: T.panel, borderRadius: 10,
          border: `1px solid ${T.lineSoft}`, marginBottom: 14,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, letterSpacing: 0.4, textTransform: "uppercase" }}>From</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>
              {diff.oldInstrumentId?.replace(/_/g, " ") || "Not selected"}
            </div>
          </div>
          <ArrowRight size={16} color={T.accentSoft} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, letterSpacing: 0.4, textTransform: "uppercase" }}>To</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: T.accent }}>
              {diff.newInstrumentId?.replace(/_/g, " ") || "Not selected"}
            </div>
          </div>
        </div>

        {/* Deactivated */}
        {diff.deactivated.length > 0 && (
          <div style={{
            padding: "12px 14px", background: T.amberBg,
            border: `1px solid ${T.amber}33`, borderRadius: 10, marginBottom: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: T.amber, marginBottom: 6 }}>
              <EyeOff size={13} /> {diff.deactivated.length} answer{diff.deactivated.length === 1 ? "" : "s"} will be deactivated
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: T.body, lineHeight: 1.6 }}>
              {diff.deactivated.map((f, i) => <li key={i}>{f.replace(/([A-Z])/g, " $1").toLowerCase()}</li>)}
            </ul>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 6 }}>
              These are retained in your inactive history. Switching back to the original route will restore them.
            </div>
          </div>
        )}

        {/* Kept */}
        {diff.keep.length > 0 && (
          <div style={{
            padding: "12px 14px", background: T.greenBg,
            border: `1px solid ${T.green}33`, borderRadius: 10, marginBottom: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: T.green, marginBottom: 6 }}>
              <CheckCircle2 size={13} /> {diff.keep.length} answer{diff.keep.length === 1 ? "" : "s"} stay active
            </div>
            <div style={{ fontSize: 12, color: T.body, lineHeight: 1.6 }}>
              {diff.keep.map((f) => f.replace(/([A-Z])/g, " $1").toLowerCase()).join(" · ")}
            </div>
          </div>
        )}

        {/* New fields needed */}
        {diff.newFields.length > 0 && (
          <div style={{
            padding: "12px 14px", background: T.blueBg,
            border: `1px solid ${T.blue}33`, borderRadius: 10, marginBottom: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: T.blue, marginBottom: 6 }}>
              <AlertTriangle size={13} /> {diff.newFields.length} new field{diff.newFields.length === 1 ? "" : "s"} required
            </div>
            <div style={{ fontSize: 12, color: T.body, lineHeight: 1.6 }}>
              You'll be asked to complete them on the Readiness and Terms steps.
            </div>
          </div>
        )}

        <div style={{ fontSize: 11.5, color: T.muted, marginTop: 10, lineHeight: 1.5 }}>
          Matches, requirements and the Adjusted BIG Score will be recalculated automatically.
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <button onClick={onCancel} style={ghostBtn}>Keep current route</button>
          <button onClick={onConfirm} style={primaryBtn}>
            Change to {diff.newInstrumentId?.replace(/_/g, " ") || "new route"}
          </button>
        </div>
      </div>
    </div>
  )
}

const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 250, padding: 20,
}
const modal = {
  background: T.bg, borderRadius: 14, maxWidth: 620, width: "100%",
  maxHeight: "90vh", overflowY: "auto", padding: 24,
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
}
const iconBtn = { background: "none", border: "none", cursor: "pointer", color: T.muted }
const primaryBtn = {
  padding: "10px 18px", borderRadius: 9,
  background: T.accent, color: "#fff", border: `1px solid ${T.accent}`,
  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
}
const ghostBtn = {
  padding: "10px 18px", borderRadius: 9,
  background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}`,
  fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
}