"use client"

/**
 * funding/components/PrefillRow.jsx
 *
 * The "Already in your profile" component from Brief §2.
 * Displays a canonical field's current value with Confirm and Edit in
 * profile actions. Corrections call the prefill service, which writes back
 * to the profile — never to the request.
 */

import { useState } from "react"
import { CheckCircle2, Pencil, AlertCircle, ExternalLink, Loader2 } from "lucide-react"
import { correctProfileField } from "../services/prefillService"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#5D4037", accentSoft: "#8D6E63", accentTint: "#EFEBE9",
  green: "#166534", greenBg: "#f0fdf4",
  amber: "#92400e", amberBg: "#fffbeb",
  red: "#991b1b", redBg: "#fef2f2",
  blue: "#1e40af", blueBg: "#eff6ff",
}

const VERIFICATION_LABEL = {
  verified:         { text: "Verified",       color: T.green, bg: T.greenBg },
  checked:          { text: "Checked",        color: T.green, bg: T.greenBg },
  uploaded:         { text: "Uploaded",       color: T.blue,  bg: T.blueBg  },
  self_declared:    { text: "Self-declared",  color: T.amber, bg: T.amberBg },
  unknown:          { text: "Unknown",        color: T.muted, bg: T.raised  },
}

export default function PrefillRow({
  label,
  fieldPath,
  value,
  source,
  verificationState = "self_declared",
  lastUpdated,
  confirmed,
  onConfirm,
  onCorrected,
  onOpenProfile,
  required = false,
  disabled = false,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const hasValue = value !== undefined && value !== null && value !== ""
  const badge = VERIFICATION_LABEL[verificationState] || VERIFICATION_LABEL.unknown

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      await correctProfileField(fieldPath, draft, { reason: "Corrected during funding application" })
      setEditing(false)
      onCorrected?.(draft)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      padding: "12px 14px", borderRadius: "10px",
      background: confirmed ? T.greenBg : T.panel,
      border: `1px solid ${confirmed ? T.green + "33" : T.lineSoft}`,
      marginBottom: "8px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: T.muted, letterSpacing: "0.4px", textTransform: "uppercase" }}>
              {label} {required && <span style={{ color: T.red }}>*</span>}
            </span>
            <span style={{
              padding: "1px 8px", borderRadius: "999px",
              fontSize: "10px", fontWeight: 700,
              background: badge.bg, color: badge.color,
            }}>
              {badge.text}
            </span>
          </div>

          {!editing ? (
            <div style={{ fontSize: "14px", color: hasValue ? T.ink : T.muted, fontStyle: hasValue ? "normal" : "italic" }}>
              {hasValue ? formatValue(value) : "Not yet in your profile — you can add it here."}
            </div>
          ) : (
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={saving || disabled}
              autoFocus
              style={{
                width: "100%", padding: "8px 10px",
                border: `1px solid ${T.lineStrong}`, borderRadius: "8px",
                fontSize: "14px", fontFamily: "inherit", color: T.ink, background: T.bg, outline: "none",
              }}
            />
          )}

          {lastUpdated && (
            <div style={{ fontSize: "11px", color: T.muted, marginTop: "4px" }}>
              Last updated {new Date(lastUpdated).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}
              {source && ` · source: ${source}`}
            </div>
          )}

          {error && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "6px", color: T.red, fontSize: "12px" }}>
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          {!editing && hasValue && !confirmed && (
            <button
              type="button"
              onClick={() => onConfirm?.()}
              disabled={disabled}
              style={{
                padding: "6px 12px", borderRadius: "7px",
                background: T.accent, color: "#fff", border: `1px solid ${T.accent}`,
                fontSize: "12px", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
                fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "5px",
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <CheckCircle2 size={12} /> Confirm current
            </button>
          )}
          {confirmed && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", color: T.green, fontWeight: 600 }}>
              <CheckCircle2 size={13} /> Confirmed
            </span>
          )}
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={disabled}
              style={{
                padding: "6px 10px", borderRadius: "7px",
                background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}`,
                fontSize: "12px", fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
                fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "5px",
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <Pencil size={12} /> Edit in profile
            </button>
          )}
          {editing && (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "6px 12px", borderRadius: "7px",
                  background: T.accent, color: "#fff", border: `1px solid ${T.accent}`,
                  fontSize: "12px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "5px",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                {saving ? "Saving…" : "Save to profile"}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setDraft(value ?? ""); setError(null) }}
                disabled={saving}
                style={{
                  padding: "6px 10px", borderRadius: "7px",
                  background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}`,
                  fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
            </>
          )}
          {!editing && onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              title="Open profile in a new tab"
              style={{
                padding: "6px 8px", borderRadius: "7px",
                background: "transparent", color: T.muted, border: "none",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <ExternalLink size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const formatValue = (v) => {
  if (Array.isArray(v)) return v.join(", ")
  if (typeof v === "boolean") return v ? "Yes" : "No"
  if (typeof v === "number") return v.toLocaleString("en-ZA")
  return String(v)
}