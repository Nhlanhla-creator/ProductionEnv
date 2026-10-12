"use client"

/**
 * digitalTwin/components/AssetRegister.jsx
 *
 * The asset register — list, filter, create, edit, retire, import stub.
 * Implements IS02 (Equipment and Resource Register) from Brief Section 8.5.2.
 */

import { useEffect, useState } from "react"
import { Plus, Search, Pencil, Trash2, Upload, Eye, Users, Zap } from "lucide-react"
import AssetForm from "./AssetForm"
import AssetDetail from "./AssetDetail"
import { RESOURCE_KIND, CRITICALITY } from "../models/assetSchema"
import { ASSET_STATUS } from "../models/enums"
import { createResource, updateResource, retireResource, listResources } from "../services/resourceService"
import { listGroups } from "../services/resourceService"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", line: "#ded8d4",
  lineSoft: "#e9e3df", lineStrong: "#b0a29b", bg: "#ffffff",
  panel: "#faf8f7", raised: "#f2eeec", accent: "#4a352f",
  header: "#33231e", green: "#166534", amber: "#92400e", red: "#991b1b",
  greenBg: "#f0fdf4", amberBg: "#fffbeb", redBg: "#fef2f2",
}
const btnBase = { padding: "9px 16px", borderRadius: "8px", fontSize: "13.5px", fontWeight: 500,
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: "inherit" }
const btnPrimary = { ...btnBase, background: T.accent, color: "#fff", border: `1px solid ${T.accent}`, fontWeight: 600 }
const btnGhost = { ...btnBase, background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}` }
const inputS = { width: "100%", padding: "9px 11px", border: `1px solid ${T.lineStrong}`, borderRadius: "8px",
  fontSize: "13.5px", fontFamily: "inherit", boxSizing: "border-box", color: T.ink, background: T.bg, outline: "none" }

const statusStyle = {
  [ASSET_STATUS.AVAILABLE]: { bg: T.greenBg, fg: T.green },
  [ASSET_STATUS.OPERATING]: { bg: T.greenBg, fg: T.green },
  [ASSET_STATUS.PLANNED]:   { bg: T.raised,  fg: T.muted },
  [ASSET_STATUS.COMMISSIONING]: { bg: T.amberBg, fg: T.amber },
  [ASSET_STATUS.STANDBY]:   { bg: T.amberBg, fg: T.amber },
  [ASSET_STATUS.PLANNED_MAINTENANCE]: { bg: T.amberBg, fg: T.amber },
  [ASSET_STATUS.UNPLANNED_DOWNTIME]:  { bg: T.redBg,   fg: T.red },
  [ASSET_STATUS.SUSPENDED]: { bg: T.redBg, fg: T.red },
  [ASSET_STATUS.RETIRED]:   { bg: T.raised, fg: T.muted },
  [ASSET_STATUS.DISPOSED]:  { bg: T.raised, fg: T.muted },
}

export default function AssetRegister({ tenantId, onBack }) {
  const [assets, setAssets] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterKind, setFilterKind] = useState(RESOURCE_KIND.ASSET)
  const [filterGroup, setFilterGroup] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [notification, setNotification] = useState(null)

  const notify = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4000)
  }

  const reload = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const [a, g] = await Promise.all([
        listResources(tenantId, {
          resourceKind: filterKind,
          status: filterStatus || null,
          groupId: filterGroup || null,
          search,
          pageSize: 1000,
        }),
        listGroups(tenantId),
      ])
      setAssets(a)
      setGroups(g)
    } catch (err) {
      console.error(err)
      notify("error", `Failed to load: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [tenantId, filterKind, filterStatus, filterGroup])

  const handleCreate = async (form) => {
    try {
      await createResource(tenantId, form)
      notify("success", `Asset "${form.name}" created.`)
      setShowForm(false)
      await reload()
    } catch (err) {
      if (err.validationErrors) throw err
      notify("error", err.message)
      throw err
    }
  }

  const handleUpdate = async (form) => {
    try {
      await updateResource(tenantId, form.assetId, form)
      notify("success", "Asset updated.")
      setEditing(null)
      await reload()
    } catch (err) {
      if (err.validationErrors) throw err
      notify("error", err.message)
      throw err
    }
  }

  const handleRetire = async (asset) => {
    if (!window.confirm(`Retire "${asset.name}"? This preserves history but removes it from active lists.`)) return
    try {
      await retireResource(tenantId, asset.assetId || asset.id)
      notify("success", "Asset retired.")
      await reload()
    } catch (err) {
      notify("error", err.message)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    reload()
  }

  if (viewing) {
    return <AssetDetail tenantId={tenantId} asset={viewing} onBack={() => { setViewing(null); reload() }} />
  }

  if (showForm) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <AssetForm tenantId={tenantId} onSave={handleCreate} onCancel={() => setShowForm(false)} />
      </div>
    )
  }

  if (editing) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <AssetForm tenantId={tenantId} initial={editing} onSave={handleUpdate} onCancel={() => setEditing(null)} />
      </div>
    )
  }

  return (
    <div>
      {onBack && (
        <button onClick={onBack} style={{ ...btnGhost, marginBottom: "14px" }}>← Back</button>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "12px" }}>
        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: T.accent }}>Asset Register</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <button style={btnGhost} title="Bulk import ships in Phase 4"
            onClick={() => notify("info", "Bulk import ships in Phase 4.")}>
            <Upload size={14} /> Import
          </button>
          <button style={btnPrimary} onClick={() => setShowForm(true)}>
            <Plus size={14} /> Add asset
          </button>
        </div>
      </div>
      <p style={{ margin: "0 0 18px", fontSize: "13px", color: T.muted }}>
        {assets.length} {filterKind === RESOURCE_KIND.ASSET ? "asset" : filterKind}{assets.length === 1 ? "" : "s"} · {
          filterKind === RESOURCE_KIND.ASSET ? "Physical equipment with identity, capacity and metering." : "Non-asset resources use service-output measures."
        }
      </p>

      {notification && (
        <div style={{
          padding: "11px 14px", borderRadius: "10px", marginBottom: "14px", fontSize: "13.5px",
          background: notification.type === "error" ? T.redBg : T.greenBg,
          border: `1px solid ${notification.type === "error" ? T.red : T.green}33`,
          color: notification.type === "error" ? T.red : T.green,
        }}>{notification.message}</div>
      )}

      {/* Filters */}
      <form onSubmit={handleSearchSubmit} style={{
        display: "grid", gridTemplateColumns: "1fr 200px 200px 200px auto", gap: "10px",
        marginBottom: "14px", alignItems: "end",
      }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.accent, marginBottom: "5px" }}>Search</label>
          <div style={{ position: "relative" }}>
            <Search size={14} color={T.muted} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, serial, registration…"
              style={{ ...inputS, paddingLeft: "32px" }} />
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.accent, marginBottom: "5px" }}>Kind</label>
          <select value={filterKind} onChange={(e) => setFilterKind(e.target.value)} style={inputS}>
            {Object.values(RESOURCE_KIND).map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.accent, marginBottom: "5px" }}>Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={inputS}>
            <option value="">All statuses</option>
            {Object.values(ASSET_STATUS).map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.accent, marginBottom: "5px" }}>Group</label>
          <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} style={inputS}>
            <option value="">All groups</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <button type="submit" style={btnGhost}>Apply</button>
      </form>

      {/* Table */}
      <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "12px", overflow: "hidden", background: T.bg }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ background: T.header, color: "#fff" }}>
                {[
                  { k: "name", w: "22%", l: "Name" },
                  { k: "internalNumber", w: "12%", l: "Internal no." },
                  { k: "equipmentTypeId", w: "18%", l: "Type" },
                  { k: "make", w: "10%", l: "Make / model" },
                  { k: "criticality", w: "10%", l: "Criticality" },
                  { k: "status", w: "12%", l: "Status" },
                  { k: "actions", w: "16%", l: "" },
                ].map((h) => (
                  <th key={h.k} style={{ padding: "11px 14px", fontSize: "11.5px", fontWeight: 700,
                    textAlign: "left", letterSpacing: "0.4px", textTransform: "uppercase",
                    borderRight: "1px solid rgba(255,255,255,0.14)", width: h.w }}>{h.l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: T.muted, fontSize: "13.5px" }}>Loading…</td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: T.muted, fontSize: "13.5px" }}>
                  No assets yet. Click <strong>Add asset</strong> to register your first.
                </td></tr>
              ) : assets.map((a, i) => {
                const ss = statusStyle[a.status] || { bg: T.raised, fg: T.muted }
                return (
                  <tr key={a.id} style={{ background: i % 2 ? T.panel : T.bg, borderBottom: `1px solid ${T.lineSoft}` }}>
                    <td style={{ padding: "12px 14px", borderRight: `1px solid ${T.lineSoft}` }}>
                      <button onClick={() => setViewing(a)} style={{ background: "none", border: "none", cursor: "pointer",
                        color: T.accent, fontWeight: 600, fontSize: "13.5px", padding: 0, fontFamily: "inherit", textAlign: "left" }}>
                        {a.name}
                      </button>
                      {a.serialNumber && <div style={{ fontSize: "11px", color: T.muted, marginTop: "2px" }}>SN: {a.serialNumber}</div>}
                    </td>
                    <td style={{ padding: "12px 14px", borderRight: `1px solid ${T.lineSoft}`, fontSize: "13px", color: T.body }}>
                      {a.internalNumber || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", borderRight: `1px solid ${T.lineSoft}`, fontSize: "12.5px", color: T.body }}>
                      {a.equipmentTypeId ? a.equipmentTypeId.split(".").pop().replace(/_/g, " ") : "—"}
                    </td>
                    <td style={{ padding: "12px 14px", borderRight: `1px solid ${T.lineSoft}`, fontSize: "13px", color: T.body }}>
                      {[a.make, a.model].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", borderRight: `1px solid ${T.lineSoft}`, fontSize: "13px" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: "999px", fontWeight: 600, fontSize: "11.5px",
                        background: a.criticality === CRITICALITY.CRITICAL ? T.redBg : a.criticality === CRITICALITY.HIGH ? T.amberBg : T.raised,
                        color: a.criticality === CRITICALITY.CRITICAL ? T.red : a.criticality === CRITICALITY.HIGH ? T.amber : T.muted,
                      }}>{a.criticality}</span>
                    </td>
                    <td style={{ padding: "12px 14px", borderRight: `1px solid ${T.lineSoft}`, fontSize: "13px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: "999px", fontWeight: 600, fontSize: "11.5px",
                        background: ss.bg, color: ss.fg }}>
                        {String(a.status).replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "13px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "4px" }}>
                        <button onClick={() => setViewing(a)} title="Open"
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "5px", borderRadius: "6px", color: T.body }}>
                          <Eye size={15} />
                        </button>
                        <button onClick={() => setEditing(a)} title="Edit"
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "5px", borderRadius: "6px", color: T.body }}>
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleRetire(a)} title="Retire"
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "5px", borderRadius: "6px", color: T.red }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}