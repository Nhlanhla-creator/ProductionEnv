"use client"

import { Plus, Trash2 } from "lucide-react"
import { getInstrument } from "../../models/instruments"

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

export default function StepTerms({ request, updateField }) {
  const instrument = request.instrumentId ? getInstrument(request.instrumentId) : null
  const answers = request.termsAnswers || {}
  const security = request.securityRights || []

  const setAnswer = (key, value) => updateField("termsAnswers", { ...answers, [key]: value })

  const addSecurity = () => updateField("securityRights", [...security, { type: "", counterparty: "", value: "", notes: "" }])
  const removeSecurity = (i) => updateField("securityRights", security.filter((_, idx) => idx !== i))
  const updateSecurity = (i, key, value) => {
    const next = [...security]
    next[i] = { ...next[i], [key]: value }
    updateField("securityRights", next)
  }

  return (
    <div>
      {instrument && (
        <div style={{ padding: "12px 14px", background: T.accentTint, borderRadius: "10px", border: `1px solid ${T.lineSoft}`, marginBottom: "16px" }}>
          <div style={{ fontSize: "13px", color: T.accent, fontWeight: 600, marginBottom: "2px" }}>{instrument.label}</div>
          <div style={{ fontSize: "12px", color: T.body }}>Fields below are specific to this instrument.</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
        <div>
          <label style={labelS}>Tenor (months)</label>
          <input type="number" value={answers.tenorMonths ?? ""} onChange={(e) => setAnswer("tenorMonths", e.target.value)} style={inputS} placeholder="e.g. 12" />
        </div>
        <div>
          <label style={labelS}>Repayment event</label>
          <input value={answers.repaymentEvent || ""} onChange={(e) => setAnswer("repaymentEvent", e.target.value)} style={inputS} placeholder="e.g. Monthly, on order receipt" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
        <div>
          <label style={labelS}>Rate / structure expectations</label>
          <input value={answers.rateStructure || ""} onChange={(e) => setAnswer("rateStructure", e.target.value)} style={inputS} placeholder="e.g. Prime + 2%, fixed monthly" />
        </div>
        <div>
          <label style={labelS}>Conversion / valuation notes (if applicable)</label>
          <input value={answers.conversionNotes || ""} onChange={(e) => setAnswer("conversionNotes", e.target.value)} style={inputS} placeholder="For equity or convertible instruments" />
        </div>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label style={labelS}>Grant conditions (if applicable)</label>
        <textarea rows={2} value={answers.grantConditions || ""} onChange={(e) => setAnswer("grantConditions", e.target.value)} placeholder="Co-funding, eligible costs, reporting obligations" style={{ ...inputS, resize: "vertical", fontFamily: "inherit" }} />
      </div>

      <div style={{ marginTop: "20px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <label style={{ ...labelS, marginBottom: "2px" }}>Security rights you can offer</label>
          <div style={{ fontSize: "11.5px", color: T.muted }}>
            Anything you can pledge against this funding — an order, a receivable, equipment, or a guarantee.
          </div>
        </div>
        <button type="button" onClick={addSecurity}
          style={{
            padding: "6px 12px", borderRadius: "7px", background: T.accentTint,
            color: T.accent, border: `1px solid ${T.lineStrong}`, fontSize: "12px",
            fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", gap: "5px",
          }}>
          <Plus size={12} /> Add security
        </button>
      </div>

      {security.length === 0 ? (
        <div style={{ padding: "16px", textAlign: "center", color: T.muted, fontSize: "12.5px", background: T.panel, borderRadius: "8px", border: `1px dashed ${T.lineStrong}`, marginBottom: "14px" }}>
          No security listed. Many instruments (grants, PO finance, equity) do not require property collateral — you can leave this empty.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
          {security.map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 2fr auto", gap: "8px", alignItems: "center" }}>
              <input value={s.type || ""} onChange={(e) => updateSecurity(i, "type", e.target.value)} style={inputS} placeholder="Type (asset, receivable…)" />
              <input value={s.counterparty || ""} onChange={(e) => updateSecurity(i, "counterparty", e.target.value)} style={inputS} placeholder="Counterparty" />
              <input type="number" value={s.value ?? ""} onChange={(e) => updateSecurity(i, "value", e.target.value)} style={inputS} placeholder="Value" />
              <input value={s.notes || ""} onChange={(e) => updateSecurity(i, "notes", e.target.value)} style={inputS} placeholder="Notes" />
              <button type="button" onClick={() => removeSecurity(i)}
                style={{ padding: "8px", background: "none", border: "none", cursor: "pointer", color: T.red, borderRadius: "6px" }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}