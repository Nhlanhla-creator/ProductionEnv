"use client"

/**
 * digitalTwin/components/AssetAssignmentModal.jsx
 *
 * Create a new effective-dated assignment. Enforces the brief's allocation
 * and overlap rules before writing (Sections 4.2 #5–#7, 6.2, 8.5.2 IS03).
 *
 * NOTE: listNodes lives in hierarchyService, not resourceService.
 */

import { useEffect, useState } from "react"
import { X, Check, AlertTriangle, Info } from "lucide-react"
import { createAssignment } from "../services/resourceService"
import { listNodes } from "../services/hierarchyService"
import { createEmptyAssignment, validateAssignment } from "../models/assetSchema"
import { ALLOCATION_BASIS, NODE_TYPES } from "../models/enums"

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

const CONTEXT_FIELDS = [
  { key: "siteId", label: "Site", nodeTypes: [NODE_TYPES.SITE] },
  { key: "contractId", label: "Contract", nodeTypes: [NODE_TYPES.CONTRACT] },
  { key: "facilityId", label: "Facility / Operation", nodeTypes: [NODE_TYPES.FACILITY] },
  { key: "processAreaId", label: "Process area", nodeTypes: [NODE_TYPES.PROCESS_AREA] },
  { key: "serviceId", label: "Service", nodeTypes: [NODE_TYPES.SERVICE] },
  { key: "activityId", label: "Activity", nodeTypes: [NODE_TYPES.ACTIVITY] },
  { key: "groupId", label: "Equipment group", nodeTypes: [NODE_TYPES.EQUIPMENT_GROUP] },
]

export default function AssetAssignmentModal({ tenantId, assetId, assetName, onClose, onSaved }) {
  const [form, setForm] = useState(() => createEmptyAssignment(tenantId, assetId, { state: "active" }))
  const [errors, setErrors] = useState([])
  const [warnings, setWarnings] = useState([])
  const [saving, setSaving] = useState(false)
  const [nodeOptions, setNodeOptions] = useState({})

  // Load node options per context type — small, cached per open
  useEffect(() => {
    (async () => {
      const map = {}
      for (const f of CONTEXT_FIELDS) {
        try {
          const nodes = []
          for (const nt of f.nodeTypes) {
            const batch = await listNodes(tenantId, { nodeType: nt, status: "active" })
            batch.forEach((n) => nodes.push({ id: n.id, name: n.name, type: n.nodeType }))
          }
          map[f.key] = nodes
        } catch { map[f.key] = [] }
      }
      setNodeOptions(map)
    })()
  }, [tenantId])

  const set = (patch) => setForm((p) => ({ ...p, ...patch }))

  const validate = () => {
    const { ok, errors: verrs, warnings: vwarns } = validateAssignment(form)
    setErrors(verrs); setWarnings(vwarns)
    return ok
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await createAssignment(tenantId, form)
      onSaved?.()
    } catch (err) {
      if (err.validationErrors) setErrors(err.validationErrors)
      else setErrors([{ field: "_submit", message: err.message }])
    } finally { setSaving(false) }
  }

  const fieldError = (name) => errors.find((e) => e.field === name)?.message
  const fieldWarning = (name) => warnings.find((w) => w.field === name)?.message

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(45,32,28,0.55)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 1400, padding: "20px",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: T.bg, borderRadius: "14px", width: "100%", maxWidth: "720px",
        maxHeight: "94vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 60px rgba(45,32,28,0.28)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: "18px 22px 14px", borderBottom: `1px solid ${T.line}` }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", color: T.accent, fontWeight: 600 }}>New assignment</h3>
            <p style={{ margin: "3px 0 0", fontSize: "13px", color: T.body }}>
              Attach <strong>{assetName}</strong> to a site, contract, activity or group.
            </p>
          </div>
          <button onClick={onClose} style={{ background: T.raised, border: "none", cursor: "pointer",
            color: T.body, width: 30, height: 30, borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: "18px 22px", overflowY: "auto", flex: 1 }}>
          {errors.some((e) => e.field === "_context") && (
            <div style={{ padding: "10px 12px", background: T.redBg, border: `1px solid ${T.red}33`,
              borderRadius: "8px", color: T.red, fontSize: "13px", marginBottom: "14px" }}>
              {fieldError("_context")}
            </div>
          )}
          {errors.some((e) => e.field === "_overlap") && (
            <div style={{ padding: "10px 12px", background: T.redBg, border: `1px solid ${T.red}33`,
              borderRadius: "8px", color: T.red, fontSize: "13px", marginBottom: "14px",
              display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <AlertTriangle size={14} style={{ marginTop: "2px" }} /> {fieldError("_overlap")}
            </div>
          )}
          {errors.some((e) => e.field === "_submit") && (
            <div style={{ padding: "10px 12px", background: T.redBg, border: `1px solid ${T.red}33`,
              borderRadius: "8px", color: T.red, fontSize: "13px", marginBottom: "14px",
              display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <AlertTriangle size={14} style={{ marginTop: "2px" }} /> {fieldError("_submit")}
            </div>
          )}
          {warnings.length > 0 && (
            <div style={{ padding: "10px 12px", background: T.amberBg, border: `1px solid ${T.amber}33`,
              borderRadius: "8px", color: T.amber, fontSize: "12.5px", marginBottom: "14px" }}>
              {warnings.map((w, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: i < warnings.length - 1 ? "6px" : 0 }}>
                  <Info size={13} style={{ marginTop: "2px", flexShrink: 0 }} /> {w.message}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            {CONTEXT_FIELDS.map((f) => (
              <div key={f.key}>
                <label style={labelS}>{f.label}</label>
                <select value={form[f.key] || ""} onChange={(e) => set({ [f.key]: e.target.value || null })} style={inputS}>
                  <option value="">— None —</option>
                  {(nodeOptions[f.key] || []).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={labelS}>Effective from</label>
              <input type="date" value={form.effectiveFrom || ""} onChange={(e) => set({ effectiveFrom: e.target.value || null })} style={inputS} />
            </div>
            <div>
              <label style={labelS}>Effective to (blank = open)</label>
              <input type="date" value={form.effectiveTo || ""} onChange={(e) => set({ effectiveTo: e.target.value || null })} style={inputS} />
            </div>
          </div>

          <div style={{ padding: "12px 14px", background: T.panel, borderRadius: "8px", border: `1px solid ${T.lineSoft}`, marginBottom: "14px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13.5px", color: T.body }}>
              <input type="checkbox" checked={!!form.isPrimary} onChange={(e) => set({ isPrimary: e.target.checked })} />
              <strong>Primary assignment</strong> — contributes 100% of measures to this context for the period
            </label>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: T.muted }}>
              Only one primary assignment may be active for the same resource and context at a time (Brief Section 4.2 #5).
            </p>
          </div>

          {!form.isPrimary && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div>
                <label style={labelS}>Allocation basis</label>
                <select value={form.allocationBasis || ""} onChange={(e) => set({ allocationBasis: e.target.value || null })} style={inputS}>
                  <option value="">— None —</option>
                  {Object.values(ALLOCATION_BASIS).map((b) => <option key={b} value={b}>{b.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label style={labelS}>Allocation value</label>
                <input type="number" step="0.01" value={form.allocationValue ?? ""}
                  onChange={(e) => set({ allocationValue: e.target.value ? Number(e.target.value) : null })}
                  style={inputS} placeholder={form.allocationBasis === "approved_percentage" ? "e.g. 60 (for 60%)" : "e.g. 12.5 hours"} />
                {fieldError("allocationValue") && <div style={{ color: T.red, fontSize: "11.5px", marginTop: "3px" }}>{fieldError("allocationValue")}</div>}
              </div>
            </div>
          )}

          <div>
            <label style={labelS}>Notes</label>
            <textarea rows="3" value={form.notes || ""} onChange={(e) => set({ notes: e.target.value })}
              style={{ ...inputS, resize: "vertical" }} placeholder="Any context for this assignment — handover notes, reason for change, etc." />
          </div>
        </div>

        <div style={{ padding: "13px 22px", borderTop: `1px solid ${T.line}`, display: "flex",
          justifyContent: "flex-end", gap: "10px", background: T.panel, borderRadius: "0 0 14px 14px" }}>
          <button onClick={onClose} style={{
            padding: "9px 16px", borderRadius: "8px", border: `1px solid ${T.lineStrong}`,
            background: T.bg, color: T.body, cursor: "pointer", fontFamily: "inherit", fontSize: "13.5px", fontWeight: 500 }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: "9px 16px", borderRadius: "8px", border: `1px solid ${T.accent}`,
            background: T.accent, color: "#fff", cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", fontSize: "13.5px", fontWeight: 600, opacity: saving ? 0.6 : 1,
            display: "inline-flex", alignItems: "center", gap: "7px" }}>
            <Check size={14} /> {saving ? "Saving…" : "Create assignment"}
          </button>
        </div>
      </div>
    </div>
  )
}