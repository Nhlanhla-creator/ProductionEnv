"use client"

import { useEffect, useState } from "react"
import { Plus, Save, ChevronRight, Trash2 } from "lucide-react"
import { validateProgramme } from "../../models/investorFirm"
import { INSTRUMENT_FAMILIES, listInstrumentsByFamily, getInstrumentLabel } from "../../models/instruments"

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

const FAMILY_LABELS = {
  [INSTRUMENT_FAMILIES.WORKING_CAPITAL]: "Working capital",
  [INSTRUMENT_FAMILIES.ASSET]: "Asset finance",
  [INSTRUMENT_FAMILIES.TERM_DEBT]: "Term debt",
  [INSTRUMENT_FAMILIES.BRIDGE]: "Bridge",
  [INSTRUMENT_FAMILIES.TRADE]: "Trade",
  [INSTRUMENT_FAMILIES.EQUITY]: "Equity",
  [INSTRUMENT_FAMILIES.STRATEGIC]: "Strategic equity",
  [INSTRUMENT_FAMILIES.GRANT]: "Grant",
  [INSTRUMENT_FAMILIES.CONVERTIBLE]: "Convertible",
  [INSTRUMENT_FAMILIES.REVENUE_BASED]: "Revenue-based",
  [INSTRUMENT_FAMILIES.BLENDED]: "Blended",
  [INSTRUMENT_FAMILIES.TRANSACTION]: "Transaction",
}

export default function ProgrammeEditor({ firm, programme, opportunities, onSave, onOpenOpportunity, onCreateOpportunity }) {
  const [draft, setDraft] = useState(programme)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState([])

  useEffect(() => { setDraft(programme) }, [programme])

  if (!draft) return null
  const set = (k, v) => setDraft((p) => ({ ...p, [k]: v }))

  const toggleInstrument = (id) => {
    const next = draft.allowedInstruments?.includes(id)
      ? draft.allowedInstruments.filter((x) => x !== id)
      : [...(draft.allowedInstruments || []), id]
    set("allowedInstruments", next)
  }

  const handleSave = async () => {
    const v = validateProgramme(draft)
    if (!v.ok) { setErrors(v.errors); return }
    setSaving(true)
    try {
      await onSave({
        name: draft.name, capitalSource: draft.capitalSource, mandate: draft.mandate,
        allowedInstruments: draft.allowedInstruments,
        ticketMin: Number(draft.ticketMin), ticketMax: Number(draft.ticketMax),
        currency: draft.currency,
        sectors: draft.sectors, stages: draft.stages, geographies: draft.geographies,
        supportOffered: draft.supportOffered,
      })
      setErrors([])
    } finally { setSaving(false) }
  }

  const allInstruments = Object.values(INSTRUMENT_FAMILIES).flatMap((f) => listInstrumentsByFamily(f))

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: T.accent }}>
        {draft.name || "New programme"} <span style={{ fontSize: 14, color: T.muted, fontWeight: 500 }}>under {firm?.name}</span>
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: T.muted }}>
        The programme is the mandate: capital source, ticket range, allowed instruments, sectors, stage and geography.
      </p>

      {errors.length > 0 && (
        <div style={{ padding: "10px 14px", background: T.redBg, border: `1px solid ${T.red}33`, color: T.red, borderRadius: 9, marginBottom: 14, fontSize: 12.5 }}>
          {errors.map((e, i) => <div key={i}>{e.message}</div>)}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <label style={labelS}>Programme name *</label>
          <input value={draft.name || ""} onChange={(e) => set("name", e.target.value)} style={inputS} />
        </div>
        <div>
          <label style={labelS}>Capital source *</label>
          <input value={draft.capitalSource || ""} onChange={(e) => set("capitalSource", e.target.value)} style={inputS} placeholder="e.g. Balance sheet, DFI facility, Fund II" />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelS}>Mandate summary</label>
        <textarea rows={2} value={draft.mandate || ""} onChange={(e) => set("mandate", e.target.value)}
          style={{ ...inputS, resize: "vertical", fontFamily: "inherit" }}
          placeholder="What this programme is for and what it will not fund." />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelS}>Allowed instruments *</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {Object.entries(FAMILY_LABELS).map(([fam, famLabel]) => (
            <div key={fam} style={{ flexBasis: "100%" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, margin: "10px 0 6px" }}>{famLabel}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {listInstrumentsByFamily(fam).map((inst) => {
                  const active = draft.allowedInstruments?.includes(inst.id)
                  return (
                    <button key={inst.id} type="button" onClick={() => toggleInstrument(inst.id)} style={{
                      padding: "6px 12px", borderRadius: 999,
                      border: `1.5px solid ${active ? T.accent : T.lineStrong}`,
                      background: active ? T.accent : T.bg,
                      color: active ? "#fff" : T.body,
                      fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    }}>{inst.label}</button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <label style={labelS}>Ticket min *</label>
          <input type="number" value={draft.ticketMin ?? ""} onChange={(e) => set("ticketMin", e.target.value)} style={inputS} />
        </div>
        <div>
          <label style={labelS}>Ticket max *</label>
          <input type="number" value={draft.ticketMax ?? ""} onChange={(e) => set("ticketMax", e.target.value)} style={inputS} />
        </div>
        <div>
          <label style={labelS}>Currency</label>
          <select value={draft.currency || "ZAR"} onChange={(e) => set("currency", e.target.value)} style={inputS}>
            <option>ZAR</option><option>USD</option><option>EUR</option><option>GBP</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 24 }}>
        <button onClick={handleSave} disabled={saving} style={{
          padding: "10px 18px", borderRadius: 9, background: T.accent, color: "#fff",
          border: `1px solid ${T.accent}`, fontSize: 13.5, fontWeight: 600, cursor: saving ? "wait" : "pointer",
          display: "inline-flex", alignItems: "center", gap: 6, opacity: saving ? 0.7 : 1,
        }}>
          <Save size={13} /> {saving ? "Saving…" : "Save programme"}
        </button>
      </div>

      {/* Opportunities */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.accent }}>Opportunities</h2>
        <button onClick={onCreateOpportunity} style={{
          padding: "6px 12px", borderRadius: 7, background: T.accentTint, color: T.accent,
          border: `1px solid ${T.lineStrong}`, fontSize: 12, fontWeight: 600, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 5,
        }}>
          <Plus size={12} /> Add opportunity
        </button>
      </div>

      {opportunities.length === 0 ? (
        <div style={{ padding: 20, textAlign: "center", background: T.panel, borderRadius: 8, border: `1px dashed ${T.lineStrong}`, color: T.muted, fontSize: 13 }}>
          No opportunities yet. An opportunity is the live, dated, submittable unit that SMEs see in the matching table.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {opportunities.map((o) => (
            <div key={o.opportunityId} style={{
              padding: "12px 14px", background: T.bg, border: `1px solid ${T.lineSoft}`,
              borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{o.name || "Untitled opportunity"}</div>
                <div style={{ fontSize: 12, color: T.muted }}>
                  {o.instrumentId ? getInstrumentLabel(o.instrumentId) : "instrument not set"}
                  {o.deadline ? ` · deadline ${o.deadline}` : ""}
                  {" · "}<span style={{ textTransform: "uppercase", fontWeight: 700 }}>{o.status}</span>
                </div>
              </div>
              <button onClick={() => onOpenOpportunity(o.opportunityId)} style={{
                padding: "6px 12px", borderRadius: 7, background: T.bg, color: T.accent,
                border: `1px solid ${T.lineStrong}`, fontSize: 12, fontWeight: 600, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 5,
              }}>
                Open <ChevronRight size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}