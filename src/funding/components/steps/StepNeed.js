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

const PURPOSES = [
  { id: "working_capital", label: "Working capital" },
  { id: "asset_acquisition", label: "Asset acquisition" },
  { id: "contract_mobilisation", label: "Contract mobilisation" },
  { id: "expansion", label: "Expansion / growth" },
  { id: "refinance", label: "Refinance existing debt" },
  { id: "bridge", label: "Bridge to a specific receipt" },
  { id: "other", label: "Other" },
]

export default function StepNeed({ request, updateField }) {
  const uses = request.usesOfFunds || []
  const total = uses.reduce((s, l) => s + (Number(l.amount) || 0), 0)
  const reconciles = !request.requestedAmount || Math.abs(total - Number(request.requestedAmount)) < 0.01

  const addLine = () => updateField("usesOfFunds", [...uses, { label: "", amount: "" }])
  const removeLine = (i) => updateField("usesOfFunds", uses.filter((_, idx) => idx !== i))
  const updateLine = (i, key, value) => {
    const next = [...uses]
    next[i] = { ...next[i], [key]: value }
    updateField("usesOfFunds", next)
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
        <div>
          <label style={labelS}>Purpose *</label>
          <select value={request.purpose || ""} onChange={(e) => updateField("purpose", e.target.value)} style={inputS}>
            <option value="">Select a purpose</option>
            {PURPOSES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelS}>Sub-purpose (optional)</label>
          <input value={request.subpurpose || ""} onChange={(e) => updateField("subpurpose", e.target.value)} style={inputS} placeholder="e.g. Fulfil order ABC-2026-041" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "16px" }}>
        <div>
          <label style={labelS}>Requested amount *</label>
          <input type="number" step="0.01" value={request.requestedAmount ?? ""} onChange={(e) => updateField("requestedAmount", e.target.value ? Number(e.target.value) : null)} style={inputS} placeholder="e.g. 1500000" />
        </div>
        <div>
          <label style={labelS}>Currency *</label>
          <select value={request.currency || "ZAR"} onChange={(e) => updateField("currency", e.target.value)} style={inputS}>
            <option value="ZAR">ZAR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <div>
          <label style={labelS}>Needed by</label>
          <input type="date" value={request.neededBy || ""} onChange={(e) => updateField("neededBy", e.target.value)} style={inputS} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
        <div>
          <label style={labelS}>Your contribution</label>
          <input type="number" step="0.01" value={request.contribution ?? ""} onChange={(e) => updateField("contribution", e.target.value ? Number(e.target.value) : null)} style={inputS} placeholder="Optional" />
        </div>
        <div>
          <label style={labelS}>Delivery timing</label>
          <input value={request.deliveryTiming || ""} onChange={(e) => updateField("deliveryTiming", e.target.value)} style={inputS} placeholder="e.g. 12 weeks from draw" />
        </div>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <label style={{ ...labelS, marginBottom: 0 }}>Uses of funds</label>
          <button type="button" onClick={addLine}
            style={{
              padding: "6px 12px", borderRadius: "7px", background: T.accentTint,
              color: T.accent, border: `1px solid ${T.lineStrong}`, fontSize: "12px",
              fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", gap: "5px",
            }}>
            <Plus size={12} /> Add line
          </button>
        </div>

        {uses.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: T.muted, fontSize: "13px", background: T.panel, borderRadius: "8px", border: `1px dashed ${T.lineStrong}` }}>
            No uses added yet. Add at least one line to break down the requested amount.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {uses.map((line, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: "8px", alignItems: "center" }}>
                <input value={line.label || ""} onChange={(e) => updateLine(i, "label", e.target.value)} style={inputS} placeholder="e.g. Supplier deposit" />
                <input type="number" step="0.01" value={line.amount ?? ""} onChange={(e) => updateLine(i, "amount", e.target.value ? Number(e.target.value) : "")} style={inputS} placeholder="Amount" />
                <button type="button" onClick={() => removeLine(i)}
                  style={{ padding: "8px", background: "none", border: "none", cursor: "pointer", color: T.red, borderRadius: "6px" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "13px", color: T.body, marginTop: "6px", gap: "16px" }}>
              <span>Total: <strong>{total.toLocaleString("en-ZA")}</strong></span>
              {request.requestedAmount ? (
                <span style={{ color: reconciles ? "#166534" : T.red, fontWeight: 600 }}>
                  {reconciles ? "✓ Reconciles to requested amount" : `⚠ Difference: ${(Number(request.requestedAmount) - total).toLocaleString("en-ZA")}`}
                </span>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}