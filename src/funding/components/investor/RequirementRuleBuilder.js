"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { createRequirementRule, RULE_LEVELS, validateRequirementRule, EVIDENCE_TYPES, FRESHNESS } from "../../models/requirementRule"
import { CANONICAL_FIELDS } from "../../models/canonicalFields"
import { listAllInstruments } from "../../models/instruments"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7",
  accent: "#5D4037", accentTint: "#EFEBE9",
  red: "#991b1b", redBg: "#fef2f2",
}

const inputS = {
  width: "100%", padding: "10px 12px", border: `1px solid ${T.lineStrong}`,
  borderRadius: 9, fontSize: 14, fontFamily: "inherit", color: T.ink,
  background: T.bg, outline: "none", boxSizing: "border-box",
}
const labelS = { display: "block", fontSize: 12.5, fontWeight: 600, color: T.accent, marginBottom: 6 }

/**
 * Structured rule editor (Brief §4, p.41).
 * Every rule must resolve to a canonical field, a supplementary answer,
 * OR an evidence upload. Mixed is allowed only if the rule accepts either.
 */
export default function RequirementRuleBuilder({ rule = null, parentProgrammeId, onSave, onCancel }) {
  const [draft, setDraft] = useState(
    rule || createRequirementRule({ level: RULE_LEVELS.OPPORTUNITY, parentId: parentProgrammeId, status: "published" })
  )
  const [errors, setErrors] = useState([])
  const set = (k, v) => setDraft((p) => ({ ...p, [k]: v }))

  const instruments = listAllInstruments()

  const handleSave = () => {
    const v = validateRequirementRule(draft)
    if (!v.ok) { setErrors(v.errors); return }
    onSave(draft)
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
    }}>
      <div style={{
        background: T.bg, borderRadius: 14, maxWidth: 720, width: "100%",
        maxHeight: "90vh", overflowY: "auto", padding: 24,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.accent }}>
            {rule ? "Edit requirement" : "Add requirement"}
          </h2>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted }}>
            <X size={20} />
          </button>
        </div>

        {errors.length > 0 && (
          <div style={{ padding: "10px 14px", background: T.redBg, border: `1px solid ${T.red}33`, color: T.red, borderRadius: 9, marginBottom: 14, fontSize: 12.5 }}>
            {errors.map((e, i) => <div key={i}>{e.message}</div>)}
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={labelS}>Label *</label>
          <input value={draft.label} onChange={(e) => set("label", e.target.value)} style={inputS} placeholder="e.g. Signed purchase order" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelS}>Why it's needed (shown to the SME)</label>
          <input value={draft.reason} onChange={(e) => set("reason", e.target.value)} style={inputS} placeholder="e.g. To verify the order against the buyer's PO reference." />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelS}>Applies to instruments</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {instruments.map((i) => {
              const active = draft.applicableInstruments.includes(i.id)
              return (
                <button key={i.id} type="button" onClick={() => {
                  const next = active
                    ? draft.applicableInstruments.filter((x) => x !== i.id)
                    : [...draft.applicableInstruments, i.id]
                  set("applicableInstruments", next)
                }} style={{
                  padding: "5px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 600,
                  border: `1.5px solid ${active ? T.accent : T.lineStrong}`,
                  background: active ? T.accent : T.bg,
                  color: active ? "#fff" : T.body,
                  cursor: "pointer", fontFamily: "inherit",
                }}>{i.label}</button>
              )
            })}
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, marginTop: 4 }}>
            Leave empty to apply to all instruments.
          </div>
        </div>

        <hr style={{ border: "none", borderTop: `1px solid ${T.lineSoft}`, margin: "16px 0" }} />

        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.accent, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 }}>
          Resolution — must have at least one
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelS}>Canonical profile field</label>
          <select value={draft.canonicalFieldPath || ""} onChange={(e) => set("canonicalFieldPath", e.target.value || null)} style={inputS}>
            <option value="">— None —</option>
            {CANONICAL_FIELDS.map((f) => <option key={f.path} value={f.path}>{f.label} ({f.path})</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelS}>Or supplementary answer (schema key)</label>
          <input value={draft.answerSchema || ""} onChange={(e) => set("answerSchema", e.target.value || null)} style={inputS} placeholder="e.g. opp.buyerName" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelS}>Or evidence type</label>
          <select value={draft.evidenceType || ""} onChange={(e) => set("evidenceType", e.target.value || null)} style={inputS}>
            <option value="">— None —</option>
            {Object.values(EVIDENCE_TYPES).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {draft.evidenceType && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={labelS}>Accepted file extensions</label>
              <input value={(draft.evidenceAccepts || []).join(", ")} onChange={(e) => set("evidenceAccepts", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} style={inputS} placeholder=".pdf, .xlsx" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelS}>Freshness</label>
              <select value={draft.evidenceFreshness} onChange={(e) => set("evidenceFreshness", e.target.value)} style={inputS}>
                {Object.values(FRESHNESS).map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </>
        )}

        <hr style={{ border: "none", borderTop: `1px solid ${T.lineSoft}`, margin: "16px 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelS}>Required / Recommended</label>
            <select value={draft.requirement} onChange={(e) => set("requirement", e.target.value)} style={inputS}>
              <option value="required">Required</option>
              <option value="recommended">Recommended</option>
            </select>
          </div>
          <div>
            <label style={labelS}>Validation threshold</label>
            <select value={draft.validationThreshold || ""} onChange={(e) => set("validationThreshold", e.target.value || null)} style={inputS} disabled={!draft.evidenceType}>
              <option value="">None</option>
              <option value="uploaded">Uploaded</option>
              <option value="checked">Checked</option>
              <option value="verified">Verified</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 20 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: T.body }}>
            <input type="checkbox" checked={!!draft.submissionGate} onChange={(e) => set("submissionGate", e.target.checked)} />
            Blocks submission
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onCancel} style={{
              padding: "10px 16px", borderRadius: 9, background: T.bg, color: T.body,
              border: `1px solid ${T.lineStrong}`, fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>Cancel</button>
            <button onClick={handleSave} style={{
              padding: "10px 20px", borderRadius: 9, background: T.accent, color: "#fff",
              border: `1px solid ${T.accent}`, fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>Save requirement</button>
          </div>
        </div>
      </div>
    </div>
  )
}