"use client"

/**
 * digitalTwin/components/EquipmentGroupManager.jsx
 *
 * Fleet / circuit / pool management. Groups carry shared targets and
 * nominal capacity, and membership is cached on the resource for fast
 * filtering but the source of truth is the group itself.
 */

import { useEffect, useState } from "react"
import { Plus, Pencil, Check, X, Users, Trash2 } from "lucide-react"
import {
  createGroup, listGroups, getGroup, updateGroup,
  listGroupMembers, setGroupMembers, listResources,
} from "../services/resourceService"
import { createEmptyGroup, validateGroup } from "../models/assetSchema"
import { RESOURCE_KIND } from "../models/assetSchema"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", line: "#ded8d4",
  lineSoft: "#e9e3df", lineStrong: "#b0a29b", bg: "#ffffff",
  panel: "#faf8f7", raised: "#f2eeec", accent: "#4a352f", accentTint: "#f4efec",
  header: "#33231e", red: "#991b1b", redBg: "#fef2f2",
}
const btnBase = { padding: "9px 16px", borderRadius: "8px", fontSize: "13.5px", fontWeight: 500,
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: "inherit" }
const btnPrimary = { ...btnBase, background: T.accent, color: "#fff", border: `1px solid ${T.accent}`, fontWeight: 600 }
const btnGhost = { ...btnBase, background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}` }
const inputS = { width: "100%", padding: "9px 11px", border: `1px solid ${T.lineStrong}`,
  borderRadius: "8px", fontSize: "13.5px", fontFamily: "inherit",
  boxSizing: "border-box", color: T.ink, background: T.bg, outline: "none" }
const labelS = { display: "block", fontSize: "12px", fontWeight: 600, color: T.accent, marginBottom: "5px" }
const cardS = { background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "16px", marginBottom: "12px" }

export default function EquipmentGroupManager({ tenantId, onBack }) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)   // the group form being shown
  const [membership, setMembership] = useState(null)  // group whose members we're editing
  const [notification, setNotification] = useState(null)

  const notify = (type, msg) => {
    setNotification({ type, message: msg })
    setTimeout(() => setNotification(null), 4000)
  }

  const reload = async () => {
    setLoading(true)
    try {
      const g = await listGroups(tenantId)
      setGroups(g)
    } finally { setLoading(false) }
  }

  useEffect(() => { reload() }, [tenantId])

  const handleSave = async (form) => {
    const { ok, errors } = validateGroup(form)
    if (!ok) throw new Error(errors[0].message)
    if (form.id) {
      await updateGroup(tenantId, form.id, form)
      notify("success", "Group updated.")
    } else {
      await createGroup(tenantId, form)
      notify("success", "Group created.")
    }
    setEditing(null)
    await reload()
  }

  return (
    <div>
      {onBack && <button onClick={onBack} style={{ ...btnGhost, marginBottom: "14px" }}>← Back</button>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "12px" }}>
        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: T.accent }}>Equipment Groups</h2>
        <button onClick={() => setEditing(createEmptyGroup(tenantId))} style={btnPrimary}>
          <Plus size={14} /> New group
        </button>
      </div>
      <p style={{ margin: "0 0 18px", fontSize: "13px", color: T.muted }}>
        Fleets, circuits, pools and lines. Groups carry shared targets and nominal capacity.
      </p>

      {notification && (
        <div style={{
          padding: "11px 14px", borderRadius: "10px", marginBottom: "14px", fontSize: "13.5px",
          background: notification.type === "error" ? T.redBg : "#f0fdf4",
          border: `1px solid ${notification.type === "error" ? T.red : "#166534"}33`,
          color: notification.type === "error" ? T.red : "#166534",
        }}>{notification.message}</div>
      )}

      {editing && (
        <GroupForm
          tenantId={tenantId}
          initial={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {membership && (
        <GroupMembershipEditor
          tenantId={tenantId}
          group={membership}
          onClose={() => setMembership(null)}
          onSaved={async () => { setMembership(null); await reload() }}
          notify={notify}
        />
      )}

      {loading ? (
        <div style={{ textAlign: "center", color: T.muted, padding: "40px", fontSize: "13.5px" }}>Loading groups…</div>
      ) : groups.length === 0 ? (
        <div style={cardS}>
          <p style={{ margin: 0, fontSize: "13.5px", color: T.muted, fontStyle: "italic" }}>
            No groups yet. Click <strong>New group</strong> to create your first fleet, circuit or pool.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
          {groups.map((g) => (
            <div key={g.id} style={{ ...cardS, marginBottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "8px" }}>
                <div>
                  <div style={{ fontSize: "15.5px", fontWeight: 600, color: T.accent }}>{g.name}</div>
                  <div style={{ fontSize: "12px", color: T.muted, textTransform: "capitalize" }}>{g.groupType}</div>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button onClick={() => setMembership(g)} title="Members"
                    style={{ background: "none", border: "none", cursor: "pointer", color: T.accent, padding: "4px" }}>
                    <Users size={15} />
                  </button>
                  <button onClick={() => setEditing({ ...g, id: g.id })} title="Edit"
                    style={{ background: "none", border: "none", cursor: "pointer", color: T.body, padding: "4px" }}>
                    <Pencil size={15} />
                  </button>
                </div>
              </div>
              {g.nominalCapacity && (
                <div style={{ fontSize: "13px", color: T.body }}>
                  Nominal capacity: <strong>{g.nominalCapacity} {g.capacityUnit}</strong>
                </div>
              )}
              {g.notes && <div style={{ fontSize: "12.5px", color: T.muted, marginTop: "6px" }}>{g.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Group form ────────────────────────────────────────────────────────────
function GroupForm({ tenantId, initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState([])
  const [saving, setSaving] = useState(false)

  const set = (patch) => setForm((p) => ({ ...p, ...patch }))

  const submit = async () => {
    const { ok, errors: verrs } = validateGroup(form)
    setErrors(verrs)
    if (!ok) return
    setSaving(true)
    try { await onSave(form) } catch (e) { setErrors([{ field: "_submit", message: e.message }]) }
    finally { setSaving(false) }
  }

  const err = (f) => errors.find((e) => e.field === f)?.message

  return (
    <div style={{ ...cardS, background: T.panel }}>
      <h3 style={{ margin: "0 0 14px", fontSize: "15.5px", fontWeight: 600, color: T.accent }}>
        {initial.id ? "Edit group" : "New group"}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div>
          <label style={labelS}>Name</label>
          <input value={form.name || ""} onChange={(e) => set({ name: e.target.value })} style={inputS}
            placeholder="e.g. 100 tonne haul fleet" />
          {err("name") && <div style={{ color: T.red, fontSize: "11.5px", marginTop: "3px" }}>{err("name")}</div>}
        </div>
        <div>
          <label style={labelS}>Type</label>
          <select value={form.groupType || "fleet"} onChange={(e) => set({ groupType: e.target.value })} style={inputS}>
            <option value="fleet">Fleet</option>
            <option value="circuit">Circuit</option>
            <option value="pool">Pool</option>
            <option value="line">Line</option>
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div>
          <label style={labelS}>Nominal capacity (optional)</label>
          <input type="number" step="0.01" value={form.nominalCapacity ?? ""}
            onChange={(e) => set({ nominalCapacity: e.target.value ? Number(e.target.value) : null })} style={inputS} />
        </div>
        <div>
          <label style={labelS}>Capacity unit</label>
          <input value={form.capacityUnit || ""} onChange={(e) => set({ capacityUnit: e.target.value })} style={inputS} placeholder="tonnes" />
        </div>
      </div>
      <div style={{ marginBottom: "12px" }}>
        <label style={labelS}>Notes</label>
        <textarea rows="2" value={form.notes || ""} onChange={(e) => set({ notes: e.target.value })}
          style={{ ...inputS, resize: "vertical" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        <button onClick={onCancel} style={btnGhost}><X size={14} /> Cancel</button>
        <button onClick={submit} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
          <Check size={14} /> {saving ? "Saving…" : (initial.id ? "Save changes" : "Create group")}
        </button>
      </div>
    </div>
  )
}

// ── Membership editor ────────────────────────────────────────────────────
function GroupMembershipEditor({ tenantId, group, onClose, onSaved, notify }) {
  const [assets, setAssets] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      const [allAssets, members] = await Promise.all([
        listResources(tenantId, { resourceKind: RESOURCE_KIND.ASSET, pageSize: 1000 }),
        listGroupMembers(tenantId, group.id),
      ])
      setAssets(allAssets)
      setSelected(new Set(members.map((m) => m.id)))
      setLoading(false)
    })()
  }, [tenantId, group.id])

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      const result = await setGroupMembers(tenantId, group.id, Array.from(selected))
      notify("success", `${result.added} added, ${result.removed} removed.`)
      onSaved()
    } catch (err) {
      notify("error", err.message)
    } finally { setSaving(false) }
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(45,32,28,0.55)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 1400, padding: "20px",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: T.bg, borderRadius: "14px", width: "100%", maxWidth: "640px",
        maxHeight: "94vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 60px rgba(45,32,28,0.28)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: "18px 22px 14px", borderBottom: `1px solid ${T.line}` }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", color: T.accent, fontWeight: 600 }}>
              Members of "{group.name}"
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: "13px", color: T.body }}>
              Tick assets to include them in this {group.groupType}.
            </p>
          </div>
          <button onClick={onClose} style={{ background: T.raised, border: "none", cursor: "pointer",
            color: T.body, width: 30, height: 30, borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} />
          </button>
        </div>
        <div style={{ padding: "16px 22px", overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: "center", color: T.muted, padding: "30px" }}>Loading assets…</div>
          ) : assets.length === 0 ? (
            <p style={{ margin: 0, fontSize: "13.5px", color: T.muted, fontStyle: "italic" }}>
              No assets exist yet. Add assets to the register first.
            </p>
          ) : (
            <div style={{ border: `1px solid ${T.lineSoft}`, borderRadius: "8px", overflow: "hidden" }}>
              {assets.map((a, i) => (
                <label key={a.id} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 14px",
                  borderBottom: i < assets.length - 1 ? `1px solid ${T.lineSoft}` : "none",
                  background: i % 2 ? T.panel : T.bg, cursor: "pointer",
                }}>
                  <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggle(a.id)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 500, color: T.ink }}>{a.name}</div>
                    <div style={{ fontSize: "11.5px", color: T.muted }}>
                      {[a.internalNumber, a.make, a.model].filter(Boolean).join(" · ") || "No identifiers"}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: "13px 22px", borderTop: `1px solid ${T.line}`, display: "flex",
          justifyContent: "flex-end", gap: "10px", background: T.panel, borderRadius: "0 0 14px 14px" }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
            <Check size={14} /> {saving ? "Saving…" : `Save (${selected.size} selected)`}
          </button>
        </div>
      </div>
    </div>
  )
}