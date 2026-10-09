"use client"

/**
 * digitalTwin/components/KpiDefinitionEditor.jsx
 *
 * View/edit a KPI's meaning, measurement, thresholds and aggregation rules.
 * The formula itself is locked to the canonical registry in this phase —
 * future phases will allow tenants to add new KPIs through the same editor.
 *
 * Brief references: Section 7.3 (KPI definition fields), Section 7.4
 * (aggregation rules), Section 9.7 (page states — Draft, Warning, Blocking).
 */

import { useState } from "react"
import { Save, X, Info, AlertTriangle, CheckCircle2, Lock } from "lucide-react"
import { CANONICAL_KPIS, KPI_BY_ID, validateKpiDefinition, FORMULA_OPS } from "../models/kpiSchema"
import { AGGREGATION_METHOD, KPI_DIRECTION, KPI_CATEGORY } from "../models/enums"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", line: "#ded8d4",
  lineSoft: "#e9e3df", lineStrong: "#b0a29b", bg: "#ffffff",
  panel: "#faf8f7", raised: "#f2eeec", accent: "#4a352f", accentTint: "#f4efec",
  red: "#991b1b", amber: "#92400e", green: "#166534",
  redBg: "#fef2f2", amberBg: "#fffbeb", greenBg: "#f0fdf4",
}
const inputS = { width: "100%", padding: "9px 11px", border: `1px solid ${T.lineStrong}`,
  borderRadius: "8px", fontSize: "13.5px", fontFamily: "inherit",
  boxSizing: "border-box", color: T.ink, background: T.bg, outline: "none" }
const labelS = { display: "block", fontSize: "12px", fontWeight: 600, color: T.accent, marginBottom: "5px" }
const cardS = { background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "16px", marginBottom: "14px" }

export default function KpiDefinitionEditor({ kpiId, onSave, onCancel }) {
  const initial = KPI_BY_ID[kpiId]
  const [form, setForm] = useState(() => ({ ...initial }))
  const [errors, setErrors] = useState([])
  const [warnings, setWarnings] = useState([])
  const [saving, setSaving] = useState(false)

  if (!initial) {
    return (
      <div style={cardS}>
        <p style={{ margin: 0, color: T.red }}>Unknown KPI: {kpiId}</p>
      </div>
    )
  }

  const isLocked = true // Phase 3 — canonical KPIs are read-only for formula
  const set = (patch) => setForm((p) => ({ ...p, ...patch }))

  const validate = () => {
    const { ok, errors: verrs, warnings: vwarns } = validateKpiDefinition(form)
    setErrors(verrs); setWarnings(vwarns)
    return ok
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await onSave?.(form)
    } finally { setSaving(false) }
  }

  const describeFormula = () => {
    const f = form.formula
    if (!f) return "No formula (input KPI)"
    switch (f.op) {
      case FORMULA_OPS.DIVIDE: return `${f.numerator} ÷ ${f.denominator}`
      case FORMULA_OPS.PERCENT: return `(${f.numerator} ÷ ${f.denominator}) × 100`
      case FORMULA_OPS.SUM: return `Σ(${(f.components || []).join(" + ")})`
      case FORMULA_OPS.MULTIPLY: return `(${(f.components || []).join(" × ")})`
      case FORMULA_OPS.SUBTRACT: return `${f.a} − ${f.b}`
      case FORMULA_OPS.WEIGHTED: return `Σ(value × weight) ÷ Σ(weight)`
      case FORMULA_OPS.COUNT_UNIQUE: return `COUNT_UNIQUE(${(f.components || []).join(", ")})`
      default: return f.op
    }
  }

  const aggregationExplanation = () => {
    switch (form.aggregation) {
      case AGGREGATION_METHOD.SUM: return "Summed across periods and hierarchy levels after currency/unit/allocation checks."
      case AGGREGATION_METHOD.RECOMPUTE: return "Recomputed from summed components at each level. Child percentages are never averaged."
      case AGGREGATION_METHOD.WEIGHTED_AVERAGE: return `Weighted using "${form.weightField || "(no weight)"}" as the explicit denominator.`
      case AGGREGATION_METHOD.AVERAGE: return "⚠ Unweighted average — only permitted when exposure is equal."
      case AGGREGATION_METHOD.MINIMUM: return "Minimum across the rollup."
      case AGGREGATION_METHOD.MAXIMUM: return "Maximum across the rollup."
      case AGGREGATION_METHOD.LAST_VALUE: return "Latest value in the period."
      case AGGREGATION_METHOD.PROHIBITED: return "Rollup not permitted for this KPI."
      default: return form.aggregation
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: T.accent }}>{form.name}</h2>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: T.muted }}>
            {form.kpiId} · Version {form.version} · {form.category.replace(/_/g, " ")}
          </p>
        </div>
        <button onClick={onCancel} style={{ background: T.raised, border: "none", cursor: "pointer",
          color: T.body, width: 34, height: 34, borderRadius: "8px",
          display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
      </div>

      {errors.length > 0 && (
        <div style={{ ...cardS, background: T.redBg, borderColor: `${T.red}33` }}>
          {errors.map((e, i) => (
            <div key={i} style={{ color: T.red, fontSize: "13px", display: "flex", gap: "8px" }}>
              <AlertTriangle size={14} style={{ marginTop: "2px", flexShrink: 0 }} />
              <span><strong>{e.field}:</strong> {e.message}</span>
            </div>
          ))}
        </div>
      )}
      {warnings.length > 0 && (
        <div style={{ ...cardS, background: T.amberBg, borderColor: `${T.amber}33` }}>
          {warnings.map((w, i) => (
            <div key={i} style={{ color: T.amber, fontSize: "13px", display: "flex", gap: "8px" }}>
              <AlertTriangle size={14} style={{ marginTop: "2px", flexShrink: 0 }} />
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      <div style={cardS}>
        <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Business meaning
        </h3>
        <textarea rows="3" value={form.businessMeaning || ""} onChange={(e) => set({ businessMeaning: e.target.value })}
          style={{ ...inputS, resize: "vertical" }}
          placeholder="In plain words — anyone reading the dashboard should get it from this sentence." />
      </div>

      <div style={cardS}>
        <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Lock size={12} /> Formula (canonical — locked in this phase)
        </h3>
        <div style={{ padding: "10px 12px", background: T.panel, borderRadius: "8px",
          border: `1px solid ${T.lineSoft}`, fontFamily: "ui-monospace, monospace",
          fontSize: "13px", color: T.body }}>
          {describeFormula()}
        </div>
        <div style={{ marginTop: "12px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "6px" }}>
            Components
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "8px", fontSize: "13px" }}>
            {form.components.map((c) => (
              <>
                <div key={c.id} style={{ padding: "6px 10px", background: T.panel, borderRadius: "6px", color: T.body }}>
                  {c.label} <span style={{ color: T.muted, fontFamily: "ui-monospace, monospace", fontSize: "11px" }}>({c.id})</span>
                </div>
                <div key={c.id + "_u"} style={{ color: T.muted, padding: "6px 10px", textAlign: "right" }}>{c.unit}</div>
                <div key={c.id + "_e"} style={{ padding: "6px 10px" }} />
              </>
            ))}
          </div>
        </div>
      </div>

      <div style={cardS}>
        <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Aggregation and roll-up
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <label style={labelS}>Rollup method</label>
            <select value={form.aggregation} onChange={(e) => set({ aggregation: e.target.value })} style={inputS}>
              {Object.values(AGGREGATION_METHOD).map((m) => (
                <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelS}>Weight field {form.aggregation === AGGREGATION_METHOD.WEIGHTED_AVERAGE && <span style={{ color: T.red }}>*</span>}</label>
            <input value={form.weightField || ""} onChange={(e) => set({ weightField: e.target.value || null })}
              style={inputS} placeholder="e.g. scheduled_time" disabled={form.aggregation !== AGGREGATION_METHOD.WEIGHTED_AVERAGE} />
          </div>
        </div>
        <div style={{ marginTop: "10px", padding: "10px 12px", background: T.panel, borderRadius: "8px",
          border: `1px solid ${T.lineSoft}`, fontSize: "12.5px", color: T.body,
          display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <Info size={13} style={{ marginTop: "2px", flexShrink: 0, color: T.muted }} />
          <span>{aggregationExplanation()}</span>
        </div>
      </div>

      <div style={cardS}>
        <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Thresholds
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
          <div>
            <label style={labelS}>Target</label>
            <input type="number" step="0.01" value={form.thresholds.target ?? ""}
              onChange={(e) => set({ thresholds: { ...form.thresholds, target: e.target.value ? Number(e.target.value) : null } })} style={inputS} />
          </div>
          <div>
            <label style={labelS}>Warning</label>
            <input type="number" step="0.01" value={form.thresholds.warning ?? ""}
              onChange={(e) => set({ thresholds: { ...form.thresholds, warning: e.target.value ? Number(e.target.value) : null } })} style={inputS} />
          </div>
          <div>
            <label style={labelS}>Critical</label>
            <input type="number" step="0.01" value={form.thresholds.critical ?? ""}
              onChange={(e) => set({ thresholds: { ...form.thresholds, critical: e.target.value ? Number(e.target.value) : null } })} style={inputS} />
          </div>
          <div>
            <label style={labelS}>Direction</label>
            <select value={form.direction} onChange={(e) => set({ direction: e.target.value })} style={inputS}>
              <option value={KPI_DIRECTION.HIGHER_IS_BETTER}>Higher is better</option>
              <option value={KPI_DIRECTION.LOWER_IS_BETTER}>Lower is better</option>
              <option value={KPI_DIRECTION.WITHIN_RANGE}>Within range</option>
              <option value={KPI_DIRECTION.INFORMATIONAL}>Informational</option>
            </select>
          </div>
        </div>
      </div>

      <div style={cardS}>
        <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Grain and applicability
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "14px" }}>
          <div>
            <label style={labelS}>Primary time grain</label>
            <select value={form.grain.time} onChange={(e) => set({ grain: { ...form.grain, time: e.target.value } })} style={inputS}>
              <option value="shift">Shift</option>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
              <option value="year">Year</option>
            </select>
          </div>
          <div>
            <label style={labelS}>Valid hierarchy levels</label>
            <div style={{ padding: "9px 11px", background: T.panel, borderRadius: "8px",
              border: `1px solid ${T.lineSoft}`, fontSize: "13px", color: T.body }}>
              {form.grain.dimensions.join(" → ")}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "14px", borderTop: `1px solid ${T.line}` }}>
        <button onClick={onCancel} style={{ padding: "9px 16px", borderRadius: "8px",
          border: `1px solid ${T.lineStrong}`, background: T.bg, color: T.body,
          cursor: "pointer", fontFamily: "inherit", fontSize: "13.5px", fontWeight: 500 }}>Close</button>
        <button onClick={handleSave} disabled={saving}
          style={{ padding: "9px 16px", borderRadius: "8px", border: `1px solid ${T.accent}`,
            background: T.accent, color: "#fff", cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", fontSize: "13.5px", fontWeight: 600, opacity: saving ? 0.6 : 1,
            display: "inline-flex", alignItems: "center", gap: "7px" }}>
          <Save size={14} /> {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  )
}