"use client"

import { Plus, Trash2 } from "lucide-react"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#5D4037", accentSoft: "#8D6E63", accentTint: "#EFEBE9",
  red: "#991b1b",
}
const inputS = {
  width: "100%", padding: "10px 12px",
  border: `1px solid ${T.lineStrong}`, borderRadius: "9px",
  fontSize: "14px", fontFamily: "inherit", color: T.ink, background: T.bg, outline: "none",
  boxSizing: "border-box",
}
const labelS = { display: "block", fontSize: "12.5px", fontWeight: 600, color: T.accent, marginBottom: "6px" }

const METRIC_PRESETS = [
  { id: "revenue",  label: "Revenue",       unit: "ZAR" },
  { id: "jobs",     label: "Jobs supported", unit: "count" },
  { id: "output",   label: "Output volume",  unit: "units" },
  { id: "capacity", label: "Production capacity", unit: "%" },
  { id: "custom",   label: "Custom metric",  unit: "" },
]

export default function StepOutcomes({ request, updateField }) {
  const outcomes = request.outcomes || []

  const addOutcome = () => updateField("outcomes", [...outcomes, { metric: "", baseline: "", target: "", unit: "", milestoneDate: "" }])
  const removeOutcome = (i) => updateField("outcomes", outcomes.filter((_, idx) => idx !== i))
  const updateOutcome = (i, key, value) => {
    const next = [...outcomes]
    next[i] = { ...next[i], [key]: value }
    updateField("outcomes", next)
  }

  return (
    <div>
      <p style={{ margin: "0 0 14px", fontSize: "13.5px", color: T.body, lineHeight: 1.55 }}>
        What will this funding unlock? Funders use these to judge alignment with their mandate. Baseline values should be real, historical numbers. Target values are projections.
      </p>

      <div style={{ marginBottom: "14px", display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={addOutcome}
          style={{
            padding: "6px 12px", borderRadius: "7px", background: T.accentTint,
            color: T.accent, border: `1px solid ${T.lineStrong}`, fontSize: "12px",
            fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", gap: "5px",
          }}>
          <Plus size={12} /> Add outcome
        </button>
      </div>

      {outcomes.length === 0 ? (
        <div style={{ padding: "24px", textAlign: "center", color: T.muted, fontSize: "13px", background: T.panel, borderRadius: "10px", border: `1px dashed ${T.lineStrong}` }}>
          No outcomes added yet. Add at least one to continue — even a single baseline-to-target pair is useful.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {outcomes.map((o, i) => (
            <div key={i} style={{ padding: "14px", background: T.panel, borderRadius: "10px", border: `1px solid ${T.lineSoft}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                <div>
                  <label style={labelS}>Metric</label>
                  <select value={o.metric || ""} onChange={(e) => {
                    const preset = METRIC_PRESETS.find((p) => p.id === e.target.value)
                    updateOutcome(i, "metric", preset?.label || e.target.value)
                    if (preset?.unit) updateOutcome(i, "unit", preset.unit)
                  }} style={inputS}>
                    <option value="">Select a metric</option>
                    {METRIC_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelS}>Baseline</label>
                  <input value={o.baseline ?? ""} onChange={(e) => updateOutcome(i, "baseline", e.target.value)} style={inputS} placeholder="Current" />
                </div>
                <div>
                  <label style={labelS}>Target</label>
                  <input value={o.target ?? ""} onChange={(e) => updateOutcome(i, "target", e.target.value)} style={inputS} placeholder="After funding" />
                </div>
                <div>
                  <label style={labelS}>Unit</label>
                  <input value={o.unit || ""} onChange={(e) => updateOutcome(i, "unit", e.target.value)} style={inputS} placeholder="e.g. ZAR" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 4fr auto", gap: "8px", alignItems: "center" }}>
                <input type="date" value={o.milestoneDate || ""} onChange={(e) => updateOutcome(i, "milestoneDate", e.target.value)} style={inputS} />
                <input value={o.notes || ""} onChange={(e) => updateOutcome(i, "notes", e.target.value)} style={inputS} placeholder="Optional context (why, how, milestones)" />
                <button type="button" onClick={() => removeOutcome(i)}
                  style={{ padding: "8px", background: "none", border: "none", cursor: "pointer", color: T.red, borderRadius: "6px" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "14px", padding: "10px 12px", background: T.panel, borderRadius: "8px", fontSize: "12px", color: T.body, lineHeight: 1.5 }}>
        Baseline values are treated as factual. Target values are labelled as projections in the funder's view.
      </div>
    </div>
  )
}