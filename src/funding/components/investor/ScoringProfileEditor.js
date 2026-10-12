"use client"

import { useEffect, useState } from "react"
import { Save, ShieldCheck, AlertTriangle } from "lucide-react"
import {
  DEFAULT_WEIGHTS, WEIGHT_BOUNDS, COMPONENT_LABELS,
  validateScoringProfile, diffFromDefault,
} from "../../models/scoringProfile"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7",
  accent: "#5D4037", accentTint: "#EFEBE9",
  red: "#991b1b", redBg: "#fef2f2",
  green: "#166534", greenBg: "#f0fdf4",
  amber: "#92400e", amberBg: "#fffbeb",
}

export default function ScoringProfileEditor({
  scoringProfile, onCreate, onSave, onApprove, canApprove = false,
}) {
  const [draft, setDraft] = useState(scoringProfile)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState([])

  useEffect(() => { setDraft(scoringProfile) }, [scoringProfile])

  if (!draft) {
    return (
      <div style={{ padding: "20px 22px", background: T.panel, borderRadius: 12, border: `1px solid ${T.lineSoft}` }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: T.accent }}>Scoring profile</h3>
        <p style={{ margin: "0 0 14px", fontSize: 12.5, color: T.muted }}>
          This opportunity has no investor scoring profile yet. Create one to control the weighted components of the Adjusted BIG Score.
        </p>
        <button onClick={onCreate} style={{
          padding: "10px 18px", borderRadius: 9, background: T.accent, color: "#fff",
          border: `1px solid ${T.accent}`, fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>Create scoring profile</button>
      </div>
    )
  }

  const setWeight = (key, pct) => {
    const clamped = Math.max(0, Math.min(100, Number(pct) || 0))
    setDraft((p) => ({ ...p, weights: { ...p.weights, [key]: clamped / 100 } }))
  }

  const total = Object.values(draft.weights || {}).reduce((s, v) => s + (Number(v) || 0), 0)
  const totalPct = Math.round(total * 100)
  const deviations = diffFromDefault(draft.weights)
  const hasDeviation = Object.keys(deviations).length > 0

  const handleSave = async () => {
    const v = validateScoringProfile(draft)
    if (!v.ok) { setErrors(v.errors); return }
    setSaving(true)
    try {
      await onSave({ weights: draft.weights, rationale: draft.rationale, effectiveFrom: draft.effectiveFrom })
      setErrors([])
    } finally { setSaving(false) }
  }

  return (
    <div style={{ padding: "18px 20px", background: T.panel, borderRadius: 12, border: `1px solid ${T.lineSoft}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.accent }}>Investor scoring profile</h3>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: T.muted }}>
            Approved weights override the v3 default for this opportunity only.
          </p>
        </div>
        <span style={{
          padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
          background: draft.status === "approved" ? T.greenBg : "#fef3c7",
          color: draft.status === "approved" ? T.green : T.amber,
        }}>{draft.status}</span>
      </div>

      {errors.length > 0 && (
        <div style={{ padding: "10px 14px", background: T.redBg, border: `1px solid ${T.red}33`, color: T.red, borderRadius: 9, marginBottom: 12, fontSize: 12.5 }}>
          {errors.map((e, i) => <div key={i}>{e.message}</div>)}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {Object.keys(DEFAULT_WEIGHTS).map((key) => {
          const pct = Math.round((Number(draft.weights?.[key]) || 0) * 100)
          const bound = WEIGHT_BOUNDS[key]
          const defaultPct = Math.round(DEFAULT_WEIGHTS[key] * 100)
          const drifted = Math.abs(pct - defaultPct) > 0
          return (
            <div key={key} style={{
              display: "grid", gridTemplateColumns: "180px 1fr 90px", gap: 12,
              alignItems: "center", padding: "8px 12px", background: T.bg, borderRadius: 9, border: `1px solid ${T.lineSoft}`,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{COMPONENT_LABELS[key]}</div>
                <div style={{ fontSize: 11, color: T.muted }}>
                  default {defaultPct}% · bounds {Math.round(bound.min * 100)}–{Math.round(bound.max * 100)}%
                </div>
              </div>
              <input type="range" min={0} max={100} value={pct} onChange={(e) => setWeight(key, e.target.value)} />
              <div style={{
                fontSize: 14, fontWeight: 700, textAlign: "right",
                color: drifted ? T.amber : T.ink,
              }}>
                {pct}%
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        padding: "10px 14px", borderRadius: 9, marginBottom: 12,
        background: Math.abs(totalPct - 100) < 1 ? T.greenBg : T.redBg,
        color: Math.abs(totalPct - 100) < 1 ? T.green : T.red,
        fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
      }}>
        {Math.abs(totalPct - 100) < 1 ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
        Total: {totalPct}%
      </div>

      {hasDeviation && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: T.accent, marginBottom: 6 }}>
            Written rationale (required for any deviation from default)
          </label>
          <textarea rows={2} value={draft.rationale || ""} onChange={(e) => setDraft((p) => ({ ...p, rationale: e.target.value }))}
            style={{
              width: "100%", padding: "10px 12px", border: `1px solid ${T.lineStrong}`,
              borderRadius: 9, fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
            }} />
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: 11.5, color: T.muted, maxWidth: 400, lineHeight: 1.5 }}>
          The Adjusted BIG Score uses these weights. Admin approval is required before production scoring.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleSave} disabled={saving} style={{
            padding: "9px 16px", borderRadius: 8, background: T.bg, color: T.body,
            border: `1px solid ${T.lineStrong}`, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            <Save size={12} /> {saving ? "Saving…" : "Save weights"}
          </button>
          {canApprove && draft.status !== "approved" && (
            <button onClick={onApprove} style={{
              padding: "9px 16px", borderRadius: 8, background: T.accent, color: "#fff",
              border: `1px solid ${T.accent}`, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 5,
            }}>
              <ShieldCheck size={12} /> Approve profile
            </button>
          )}
        </div>
      </div>
    </div>
  )
}