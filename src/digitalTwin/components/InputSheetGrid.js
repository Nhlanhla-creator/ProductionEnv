"use client"

/**
 * digitalTwin/components/InputSheetGrid.jsx
 *
 * Grid entry for multiple assets per shift (Brief Section 8.5.1 "Grid Entry
 * for several assets/rows"). Row-level validation shows feedback inline, and
 * a draft-save workflow keeps work-in-progress from being lost.
 *
 * This is the web-native equivalent of the IS05 spreadsheet — same column
 * contract, different input surface.
 */

import { useEffect, useMemo, useState } from "react"
import { Save, AlertTriangle, CheckCircle2, XCircle, Plus, Trash2 } from "lucide-react"
import { RESOURCE_KIND } from "../models/assetSchema"
import { listResources } from "../services/resourceService"
import { createMeasurement } from "../services/measurementService"
import { COMPONENT_CATALOGUE } from "../models/kpiSchema"
import { DATA_CONFIDENCE } from "../models/enums"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", line: "#ded8d4",
  lineSoft: "#e9e3df", lineStrong: "#b0a29b", bg: "#ffffff",
  panel: "#faf8f7", raised: "#f2eeec", accent: "#4a352f", accentTint: "#f4efec",
  red: "#991b1b", amber: "#92400e", green: "#166534",
  redBg: "#fef2f2", amberBg: "#fffbeb", greenBg: "#f0fdf4", header: "#33231e",
}
const btnBase = { padding: "9px 16px", borderRadius: "8px", fontSize: "13.5px", fontWeight: 500,
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: "inherit" }
const btnPrimary = { ...btnBase, background: T.accent, color: "#fff", border: `1px solid ${T.accent}`, fontWeight: 600 }
const btnGhost = { ...btnBase, background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}` }
const inputS = { width: "100%", padding: "6px 8px", border: `1px solid ${T.lineStrong}`,
  borderRadius: "6px", fontSize: "12.5px", fontFamily: "inherit",
  boxSizing: "border-box", color: T.ink, background: T.bg, outline: "none",
  textAlign: "right", fontVariantNumeric: "tabular-nums" }

// Column contract — mirrors IS05 exactly (Brief Section 8.5.3)
const GRID_COLUMNS = [
  { id: "assetId", label: "Asset", type: "select", width: "220px", align: "left" },
  { id: "scheduled_time", label: "Scheduled (h)", type: "number", width: "110px" },
  { id: "available_time", label: "Available (h)", type: "number", width: "110px" },
  { id: "operating_time", label: "Operating (h)", type: "number", width: "110px" },
  { id: "planned_downtime", label: "Planned DT (h)", type: "number", width: "110px" },
  { id: "standby_time", label: "Standby (h)", type: "number", width: "110px" },
  { id: "accepted_output", label: "Output (t)", type: "number", width: "110px" },
  { id: "fuel_consumed", label: "Fuel (L)", type: "number", width: "100px" },
  { id: "operatorOrCrew", label: "Crew", type: "text", width: "130px", align: "left" },
  { id: "notes", label: "Notes", type: "text", width: "200px", align: "left" },
]

export default function InputSheetGrid({ tenantId, onBack }) {
  const [assets, setAssets] = useState([])
  const [loadingAssets, setLoadingAssets] = useState(true)
  const [shiftDate, setShiftDate] = useState(() => new Date().toISOString().split("T")[0])
  const [shiftId, setShiftId] = useState("day")
  const [rows, setRows] = useState([])
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState(null)

  useEffect(() => {
    (async () => {
      if (!tenantId) return
      setLoadingAssets(true)
      try {
        const list = await listResources(tenantId, { resourceKind: RESOURCE_KIND.ASSET, status: "available", pageSize: 500 })
        setAssets(list)
      } finally { setLoadingAssets(false) }
    })()
  }, [tenantId])

  const addRow = () => {
    setRows((prev) => [...prev, {
      _id: `row_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      assetId: "",
      scheduled_time: 12, available_time: "", operating_time: "", planned_downtime: "", standby_time: "",
      accepted_output: "", fuel_consumed: "", operatorOrCrew: "", notes: "",
    }])
  }

  const removeRow = (id) => setRows((prev) => prev.filter((r) => r._id !== id))

  const updateRow = (id, field, value) => {
    setRows((prev) => prev.map((r) => r._id === id ? { ...r, [field]: value } : r))
  }

  const validationFor = (row) => {
    const errors = []
    if (!row.assetId) errors.push("Asset required")
    const s = Number(row.scheduled_time)
    const a = Number(row.available_time)
    const o = Number(row.operating_time)
    const p = Number(row.planned_downtime)
    if (Number.isFinite(a) && Number.isFinite(s) && a > s) errors.push("Available > scheduled")
    if (Number.isFinite(o) && Number.isFinite(a) && o > a) errors.push("Operating > available")
    if (Number.isFinite(p) && Number.isFinite(s) && Number.isFinite(a)) {
      if (Math.abs(p + a - s) > 0.05) errors.push("Planned + available ≠ scheduled")
    }
    return errors
  }

  const rowStatus = (row) => {
    const e = validationFor(row)
    if (e.length > 0) return "error"
    const hasAny = Object.entries(row).some(([k, v]) => !k.startsWith("_") && k !== "assetId" && v !== "" && v !== undefined && v !== null)
    return hasAny ? "ok" : "empty"
  }

  const stats = useMemo(() => {
    const total = rows.length
    const ok = rows.filter((r) => rowStatus(r) === "ok").length
    const errs = rows.filter((r) => rowStatus(r) === "error").length
    return { total, ok, errs }
  }, [rows])

  const handleSave = async () => {
    const valid = rows.filter((r) => rowStatus(r) === "ok")
    if (valid.length === 0) return
    setSaving(true)
    setSaveResult(null)
    let saved = 0, failed = 0
    try {
      for (const row of valid) {
        const startIso = `${shiftDate}T06:00:00.000Z`
        const endIso   = `${shiftDate}T18:00:00.000Z`
        const comps = [
          { id: "scheduled_time", v: row.scheduled_time },
          { id: "available_time", v: row.available_time },
          { id: "operating_time", v: row.operating_time },
          { id: "planned_downtime", v: row.planned_downtime },
          { id: "standby_time", v: row.standby_time },
          { id: "accepted_output", v: row.accepted_output },
          { id: "fuel_consumed", v: row.fuel_consumed },
        ]
        for (const c of comps) {
          if (c.v === "" || c.v === undefined || c.v === null) continue
          try {
            await createMeasurement(tenantId, {
              component: c.id,
              numericValue: Number(c.v),
              inputUnit: COMPONENT_CATALOGUE[c.id].unit,
              assetId: row.assetId,
              startTimestamp: startIso,
              endTimestamp: endIso,
              shiftId,
              sourceType: "manual",
              sourceSystem: "grid",
              confidence: DATA_CONFIDENCE.MANUAL_ACTUAL,
              state: "draft",
              externalSourceId: `${row.assetId}-${shiftDate}-${shiftId}-${c.id}`,
            })
            saved += 1
          } catch (err) {
            failed += 1
          }
        }
      }
      setSaveResult({ ok: true, saved, failed })
      setRows([])
    } catch (err) {
      setSaveResult({ ok: false, message: err.message })
    } finally { setSaving(false) }
  }

  return (
    <div>
      {onBack && (
        <button onClick={onBack} style={{ ...btnGhost, marginBottom: "14px" }}>← Back</button>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: T.accent }}>Grid entry — equipment time</h2>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: T.muted }}>
            Multiple assets per shift. Each row saves at the natural grain (asset × shift × component).
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={addRow} style={btnGhost}><Plus size={14} /> Add row</button>
          <button onClick={handleSave} disabled={saving || stats.ok === 0} style={{ ...btnPrimary, opacity: (saving || stats.ok === 0) ? 0.6 : 1 }}>
            <Save size={14} /> {saving ? "Saving…" : `Save ${stats.ok} row${stats.ok === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "12px", marginBottom: "14px", alignItems: "end" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.accent, marginBottom: "5px" }}>Shift date</label>
          <input type="date" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)}
            style={{ ...inputS, textAlign: "left" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.accent, marginBottom: "5px" }}>Shift</label>
          <select value={shiftId} onChange={(e) => setShiftId(e.target.value)} style={{ ...inputS, textAlign: "left" }}>
            <option value="day">Day</option>
            <option value="night">Night</option>
            <option value="afternoon">Afternoon</option>
            <option value="full_day">Full day</option>
          </select>
        </div>
        <div style={{ padding: "9px 14px", background: T.panel, borderRadius: "8px", fontSize: "12.5px", color: T.body, border: `1px solid ${T.lineSoft}` }}>
          {stats.total === 0 ? "No rows yet" : `${stats.ok} ok · ${stats.errs} with issues`}
        </div>
      </div>

      {saveResult && (
        <div style={{ padding: "11px 14px", borderRadius: "10px", marginBottom: "14px", fontSize: "13.5px",
          background: saveResult.ok ? T.greenBg : T.redBg,
          border: `1px solid ${(saveResult.ok ? T.green : T.red)}33`,
          color: saveResult.ok ? T.green : T.red,
          display: "flex", alignItems: "center", gap: "8px" }}>
          {saveResult.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
          {saveResult.ok ? `${saveResult.saved} measurements saved as draft${saveResult.failed > 0 ? `, ${saveResult.failed} failed` : ""}.` : saveResult.message}
        </div>
      )}

      <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "12px", overflow: "hidden", background: T.bg }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ background: T.header }}>
                <th style={{ padding: "10px 12px", width: "44px", color: "#fff", textAlign: "left", fontSize: "11px", fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase", borderRight: "1px solid rgba(255,255,255,0.14)" }}>#</th>
                {GRID_COLUMNS.map((col) => (
                  <th key={col.id} style={{ padding: "10px 12px", width: col.width, color: "#fff",
                    textAlign: col.align === "left" ? "left" : "right", fontSize: "11px", fontWeight: 700,
                    letterSpacing: "0.4px", textTransform: "uppercase",
                    borderRight: "1px solid rgba(255,255,255,0.14)" }}>{col.label}</th>
                ))}
                <th style={{ padding: "10px 12px", width: "44px", color: "#fff", textAlign: "center",
                  fontSize: "11px", fontWeight: 700, borderRight: "none" }} />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={GRID_COLUMNS.length + 2} style={{ padding: "40px 16px", textAlign: "center",
                    color: T.muted, fontSize: "13.5px" }}>
                    Click <strong>Add row</strong> to start entering shift data for multiple assets.
                  </td>
                </tr>
              ) : rows.map((row, i) => {
                const status = rowStatus(row)
                const errs = validationFor(row)
                const rowBg = status === "error" ? T.redBg : i % 2 ? T.panel : T.bg
                return (
                  <tr key={row._id} style={{ background: rowBg, borderBottom: `1px solid ${T.lineSoft}` }}>
                    <td style={{ padding: "8px 12px", fontSize: "12.5px", color: T.muted, textAlign: "left",
                      borderRight: `1px solid ${T.lineSoft}`, verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {status === "ok" ? <CheckCircle2 size={13} color={T.green} />
                          : status === "error" ? <AlertTriangle size={13} color={T.red} />
                          : <span style={{ width: 13 }} />}
                        {i + 1}
                      </div>
                    </td>
                    {GRID_COLUMNS.map((col) => {
                      const value = row[col.id]
                      const onChange = (v) => updateRow(row._id, col.id, v)
                      if (col.type === "select") {
                        return (
                          <td key={col.id} style={{ padding: "6px 8px", borderRight: `1px solid ${T.lineSoft}`, textAlign: "left" }}>
                            <select value={value || ""} onChange={(e) => onChange(e.target.value)}
                              style={{ ...inputS, textAlign: "left" }}>
                              <option value="">Select asset…</option>
                              {assets.map((a) => (
                                <option key={a.assetId || a.id} value={a.assetId || a.id}>
                                  {a.name}{a.internalNumber ? ` · ${a.internalNumber}` : ""}
                                </option>
                              ))}
                            </select>
                          </td>
                        )
                      }
                      if (col.type === "number") {
                        return (
                          <td key={col.id} style={{ padding: "6px 8px", borderRight: `1px solid ${T.lineSoft}` }}>
                            <input type="number" step="0.01" value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={inputS} />
                          </td>
                        )
                      }
                      return (
                        <td key={col.id} style={{ padding: "6px 8px", borderRight: `1px solid ${T.lineSoft}` }}>
                          <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)}
                            style={{ ...inputS, textAlign: "left" }} />
                        </td>
                      )
                    })}
                    <td style={{ padding: "6px 8px", textAlign: "center" }}>
                      <button onClick={() => removeRow(row._id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: T.red, padding: "4px" }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {rows.some((r) => validationFor(r).length > 0) && (
        <div style={{ marginTop: "12px", padding: "11px 14px", background: T.redBg, borderRadius: "8px",
          border: `1px solid ${T.red}33`, color: T.red, fontSize: "12.5px" }}>
          <strong>Fix issues before saving.</strong> Rows with issues will not be committed.
        </div>
      )}
    </div>
  )
}