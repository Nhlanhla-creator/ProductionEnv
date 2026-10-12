"use client"

import { useEffect, useState } from "react"
import { Plus, Save, ChevronRight, Trash2 } from "lucide-react"
import { FIRM_TYPES, FIRM_ROLES, validateFirm } from "../../models/investorFirm"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#5D4037", accentTint: "#EFEBE9",
  red: "#991b1b", redBg: "#fef2f2", green: "#166534",
}

const inputS = {
  width: "100%", padding: "10px 12px", border: `1px solid ${T.lineStrong}`,
  borderRadius: 9, fontSize: 14, fontFamily: "inherit", color: T.ink,
  background: T.bg, outline: "none", boxSizing: "border-box",
}
const labelS = { display: "block", fontSize: 12.5, fontWeight: 600, color: T.accent, marginBottom: 6 }

export default function FirmEditor({ firm, programmes, onSave, onOpenProgramme, onCreateProgramme, onDeleteProgramme }) {
  const [draft, setDraft] = useState(firm)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState([])

  useEffect(() => { setDraft(firm) }, [firm])

  if (!draft) return null
  const set = (k, v) => setDraft((p) => ({ ...p, [k]: v }))

  const handleSave = async () => {
    const v = validateFirm(draft)
    if (!v.ok) { setErrors(v.errors); return }
    setSaving(true)
    try {
      await onSave({
        name: draft.name, type: draft.type, roles: draft.roles,
        registrationNumber: draft.registrationNumber, country: draft.country,
        contactName: draft.contactName, contactEmail: draft.contactEmail, contactPhone: draft.contactPhone,
        verifiedAuthority: draft.verifiedAuthority, verificationNotes: draft.verificationNotes,
      })
      setErrors([])
    } finally { setSaving(false) }
  }

  const toggleRole = (role) => {
    const next = draft.roles?.includes(role)
      ? draft.roles.filter((r) => r !== role)
      : [...(draft.roles || []), role]
    set("roles", next)
  }

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: T.accent }}>
        {draft.name || "New firm"}
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: T.muted }}>
        A firm is your legal entity. Programmes and opportunities hang off it.
      </p>

      {errors.length > 0 && (
        <div style={{ padding: "10px 14px", background: T.redBg, border: `1px solid ${T.red}33`, color: T.red, borderRadius: 9, marginBottom: 14, fontSize: 12.5 }}>
          {errors.map((e, i) => <div key={i}>{e.message}</div>)}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <label style={labelS}>Firm name *</label>
          <input value={draft.name || ""} onChange={(e) => set("name", e.target.value)} style={inputS} />
        </div>
        <div>
          <label style={labelS}>Firm type *</label>
          <select value={draft.type || ""} onChange={(e) => set("type", e.target.value)} style={inputS}>
            {Object.entries(FIRM_TYPES).map(([k, v]) => <option key={v} value={v}>{k.replace(/_/g, " ").toLowerCase()}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelS}>Roles *</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.values(FIRM_ROLES).map((r) => {
            const active = draft.roles?.includes(r)
            return (
              <button key={r} type="button" onClick={() => toggleRole(r)} style={{
                padding: "8px 14px", borderRadius: 999,
                border: `1.5px solid ${active ? T.accent : T.lineStrong}`,
                background: active ? T.accent : T.bg,
                color: active ? "#fff" : T.body,
                fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>{r.replace(/_/g, " ")}</button>
            )
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <label style={labelS}>Registration number</label>
          <input value={draft.registrationNumber || ""} onChange={(e) => set("registrationNumber", e.target.value)} style={inputS} />
        </div>
        <div>
          <label style={labelS}>Country</label>
          <input value={draft.country || ""} onChange={(e) => set("country", e.target.value)} style={inputS} />
        </div>
        <div>
          <label style={labelS}>Contact phone</label>
          <input value={draft.contactPhone || ""} onChange={(e) => set("contactPhone", e.target.value)} style={inputS} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <div>
          <label style={labelS}>Contact name</label>
          <input value={draft.contactName || ""} onChange={(e) => set("contactName", e.target.value)} style={inputS} />
        </div>
        <div>
          <label style={labelS}>Contact email</label>
          <input value={draft.contactEmail || ""} onChange={(e) => set("contactEmail", e.target.value)} style={inputS} />
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer", fontSize: 13 }}>
          <input type="checkbox" checked={!!draft.verifiedAuthority} onChange={(e) => set("verifiedAuthority", e.target.checked)} />
          Authority to publish opportunities has been verified (admin approval required for production)
        </label>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 24 }}>
        <button onClick={handleSave} disabled={saving} style={{
          padding: "10px 18px", borderRadius: 9, background: T.accent, color: "#fff",
          border: `1px solid ${T.accent}`, fontSize: 13.5, fontWeight: 600, cursor: saving ? "wait" : "pointer",
          display: "inline-flex", alignItems: "center", gap: 6, opacity: saving ? 0.7 : 1,
        }}>
          <Save size={13} /> {saving ? "Saving…" : "Save firm"}
        </button>
      </div>

      {/* Programmes */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.accent }}>Programmes</h2>
        <button onClick={onCreateProgramme} style={{
          padding: "6px 12px", borderRadius: 7, background: T.accentTint, color: T.accent,
          border: `1px solid ${T.lineStrong}`, fontSize: 12, fontWeight: 600, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 5,
        }}>
          <Plus size={12} /> Add programme
        </button>
      </div>

      {programmes.length === 0 ? (
        <div style={{ padding: 20, textAlign: "center", background: T.panel, borderRadius: 8, border: `1px dashed ${T.lineStrong}`, color: T.muted, fontSize: 13 }}>
          No programmes yet. Create one to define capital source, ticket size and instruments.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {programmes.map((p) => (
            <div key={p.programmeId} style={{
              padding: "12px 14px", background: T.bg, border: `1px solid ${T.lineSoft}`,
              borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{p.name || "Untitled programme"}</div>
                <div style={{ fontSize: 12, color: T.muted }}>
                  {p.ticketMin != null && p.ticketMax != null ? `${p.currency} ${Number(p.ticketMin).toLocaleString()} – ${Number(p.ticketMax).toLocaleString()}` : "ticket not set"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => onOpenProgramme(p.programmeId)} style={{
                  padding: "6px 12px", borderRadius: 7, background: T.bg, color: T.accent,
                  border: `1px solid ${T.lineStrong}`, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}>
                  Open <ChevronRight size={12} />
                </button>
                <button onClick={() => onDeleteProgramme(p.programmeId)} style={{ padding: 8, background: "none", border: "none", cursor: "pointer", color: T.red }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}