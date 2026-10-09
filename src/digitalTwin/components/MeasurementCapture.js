"use client"

/**
 * digitalTwin/components/MeasurementCapture.jsx
 *
 * The Screen 1-2 style input form: "Record time and production for the
 * shift". Uses the natural operating grain (asset per shift) — the operator
 * enters only what happened, not a full enterprise scorecard.
 *
 * Brief references: Section 1.3 Screen 3 (contextual capture), Section 8.5
 * (input sheets), Section 8.5.3 (exact Slice 1A column definitions).
 */

import { useEffect, useMemo, useState } from "react"
import { Check, AlertTriangle, X, Info } from "lucide-react"
import { createMeasurement } from "../services/measurementService"
import { COMPONENT_CATALOGUE } from "../models/kpiSchema"
import { toCanonical, UNITS, unitLabel } from "../models/units"
import { RESOURCE_KIND } from "../models/assetSchema"
import { listResources } from "../services/resourceService"
import { DATA_CONFIDENCE } from "../models/enums"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", line: "#ded8d4",
  lineSoft: "#e9e3df", lineStrong: "#b0a29b", bg: "#ffffff",
  panel: "#faf8f7", raised: "#f2eeec", accent: "#4a352f", accentTint: "#f4efec",
  red: "#991b1b", amber: "#92400e", green: "#166534",
  redBg: "#fef2f2", amberBg: "#fffbeb", greenBg: "#f0fdf4", header: "#33231e",
}
const inputS = { width: "100%", padding: "9px 11px", border: `1px solid ${T.lineStrong}`,
  borderRadius: "8px", fontSize: "13.5px", fontFamily: "inherit",
  boxSizing: "border-box", color: T.ink, background: T.bg, outline: "none" }
const labelS = { display: "block", fontSize: "12px", fontWeight: 600, color: T.accent, marginBottom: "5px" }
const cardS = { background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "16px", marginBottom: "14px" }

// Slice 1A component set (Brief Section 8.5.3 IS05 + IS06)
const CAPTURE_COMPONENTS = [
  { id: "scheduled_time",  bucket: "time" },
  { id: "available_time",  bucket: "time" },
  { id: "operating_time",  bucket: "time" },
  { id: "planned_downtime", bucket: "time" },
  { id: "standby_time",    bucket: "time" },
  { id: "accepted_output", bucket: "production" },
  { id: "fuel_consumed",   bucket: "energy" },
]

export default function MeasurementCapture({ tenantId, onBack }) {
  const [assets, setAssets] = useState([])
  const [loadingAssets, setLoadingAssets] = useState(true)
  const [assetId, setAssetId] = useState("")
  const [shiftDate, setShiftDate] = useState(() => new Date().toISOString().split("T")[0])
  const [shiftId, setShiftId] = useState("day")
  const [timezone, setTimezone] = useState("Africa/Johannesburg")
  const [confidence, setConfidence] = useState(DATA_CONFIDENCE.MANUAL_ACTUAL)
  const [values, setValues] = useState({})
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState([])

  // Load assets for the scope
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

  const selectedAsset = assets.find((a) => (a.assetId || a.id) === assetId)

  const set = (comp, raw) => setValues((p) => ({ ...p, [comp]: raw }))

  // Live reconciliation — the "Calculated" panel from Screen 3
  const reconciliation = useMemo(() => {
    const sched = Number(values.scheduled_time) || 0
    const avail = Number(values.available_time) || 0
    const op    = Number(values.operating_time) || 0
    const plan  = Number(values.planned_downtime) || 0
    const stand = Number(values.standby_time) || 0

    const scheduledReconciles = sched > 0 && Math.abs(plan + avail - sched) < 0.01
    const availableReconciles = avail > 0 && Math.abs(op + stand - avail) < 0.01

    const availability = avail > 0 && sched > 0 ? (avail / sched) * 100 : null
    const utilisation  = op > 0 && avail > 0 ? (op / avail) * 100 : null

    const acceptedOutput = Number(values.accepted_output) || 0
    const lostOutput = op > 0 && acceptedOutput > 0 && avail > 0
      ? ((avail - op) / avail) * acceptedOutput
      : null

    return { scheduledReconciles, availableReconciles, availability, utilisation, lostOutput }
  }, [values])

  const validate = () => {
    const errs = []
    if (!assetId) errs.push("Select an asset before saving.")
    if (!shiftDate) errs.push("Shift date is required.")
    const sched = Number(values.scheduled_time)
    const avail = Number(values.available_time)
    const op = Number(values.operating_time)
    if (Number.isFinite(sched) && Number.isFinite(avail) && avail > sched) {
      errs.push("Available time cannot exceed scheduled time.")
    }
    if (Number.isFinite(op) && Number.isFinite(avail) && op > avail) {
      errs.push("Operating time cannot exceed available time.")
    }
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    setErrors(errs)
    if (errs.length > 0) return

    setSaving(true)
    setResult(null)
    try {
      const startIso = `${shiftDate}T06:00:00.000Z`
      const endIso   = `${shiftDate}T18:00:00.000Z`
      const rows = []
      for (const c of CAPTURE_COMPONENTS) {
        const raw = values[c.id]
        if (raw === undefined || raw === "" || raw === null) continue
        rows.push({
          component: c.id,
          numericValue: Number(raw),
          inputUnit: COMPONENT_CATALOGUE[c.id].unit,
          assetId,
          startTimestamp: startIso,
          endTimestamp: endIso,
          shiftId,
          timezone,
          sourceType: "manual",
          sourceSystem: "manual",
          confidence,
          state: "draft",
        })
      }

      const created = []
      for (const r of rows) {
        try {
          const m = await createMeasurement(tenantId, r)
          created.push(m)
        } catch (err) {
          console.error("Component save failed:", err)
        }
      }
      setResult({ count: created.length })
      setValues({})
    } catch (err) {
      setErrors([err.message])
    } finally { setSaving(false) }
  }

  const groupedComponents = {
    time: CAPTURE_COMPONENTS.filter((c) => c.bucket === "time"),
    production: CAPTURE_COMPONENTS.filter((c) => c.bucket === "production"),
    energy: CAPTURE_COMPONENTS.filter((c) => c.bucket === "energy"),
  }

  return (
    <div>
      {onBack && (
        <button onClick={onBack} style={{ padding: "9px 16px", borderRadius: "8px",
          border: `1px solid ${T.lineStrong}`, background: T.bg, color: T.body,
          cursor: "pointer", fontFamily: "inherit", fontSize: "13.5px", fontWeight: 500,
          marginBottom: "14px", display: "inline-flex", alignItems: "center", gap: "7px" }}>← Back</button>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: T.accent }}>Record shift data</h2>
      </div>
      <p style={{ margin: "0 0 18px", fontSize: "13px", color: T.muted }}>
        Only fields needed to calculate and explain the shift are shown.
      </p>

      {/* Header — asset, date, shift */}
      <div style={cardS}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px" }}>
          <div>
            <label style={labelS}>Asset *</label>
            <select value={assetId} onChange={(e) => setAssetId(e.target.value)} style={inputS} disabled={loadingAssets}>
              <option value="">{loadingAssets ? "Loading…" : "Select asset…"}</option>
              {assets.map((a) => (
                <option key={a.assetId || a.id} value={a.assetId || a.id}>
                  {a.name}{a.internalNumber ? ` · ${a.internalNumber}` : ""}
                </option>
              ))}
            </select>
            {selectedAsset && (
              <div style={{ fontSize: "11.5px", color: T.muted, marginTop: "4px" }}>
                {selectedAsset.equipmentTypeId?.split(".").pop().replace(/_/g, " ") || "Unclassified"}
                {selectedAsset.make && ` · ${selectedAsset.make} ${selectedAsset.model || ""}`.trim()}
              </div>
            )}
          </div>
          <div>
            <label style={labelS}>Shift date *</label>
            <input type="date" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} style={inputS} />
          </div>
          <div>
            <label style={labelS}>Shift</label>
            <select value={shiftId} onChange={(e) => setShiftId(e.target.value)} style={inputS}>
              <option value="day">Day</option>
              <option value="night">Night</option>
              <option value="afternoon">Afternoon</option>
              <option value="full_day">Full day</option>
            </select>
          </div>
        </div>
      </div>

      {/* Two-column: components + calculated summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "14px" }}>

        {/* Left — component inputs */}
        <div>
          <div style={cardS}>
            <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Time and utilisation
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {groupedComponents.time.map((c) => (
                <div key={c.id}>
                  <label style={labelS}>{COMPONENT_CATALOGUE[c.id].label} (hours)</label>
                  <input type="number" step="0.01" value={values[c.id] ?? ""}
                    onChange={(e) => set(c.id, e.target.value)}
                    style={inputS} placeholder="e.g. 12" />
                </div>
              ))}
            </div>
          </div>

          <div style={cardS}>
            <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Production
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {groupedComponents.production.map((c) => (
                <div key={c.id}>
                  <label style={labelS}>{COMPONENT_CATALOGUE[c.id].label} ({unitLabel(COMPONENT_CATALOGUE[c.id].unit)})</label>
                  <input type="number" step="0.01" value={values[c.id] ?? ""}
                    onChange={(e) => set(c.id, e.target.value)} style={inputS} />
                </div>
              ))}
            </div>
          </div>

          <div style={cardS}>
            <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Energy
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {groupedComponents.energy.map((c) => (
                <div key={c.id}>
                  <label style={labelS}>{COMPONENT_CATALOGUE[c.id].label} ({unitLabel(COMPONENT_CATALOGUE[c.id].unit)})</label>
                  <input type="number" step="0.01" value={values[c.id] ?? ""}
                    onChange={(e) => set(c.id, e.target.value)} style={inputS} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — calculated + save */}
        <div>
          <div style={{ ...cardS, background: T.accentTint, borderColor: T.accentSoft || T.lineStrong }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Calculated
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <MetricRow label="Physical availability"
                value={reconciliation.availability === null ? "—" : `${reconciliation.availability.toFixed(1)}%`} />
              <MetricRow label="Utilisation"
                value={reconciliation.utilisation === null ? "—" : `${reconciliation.utilisation.toFixed(1)}%`} />
              <MetricRow label="Estimated lost output"
                value={reconciliation.lostOutput === null ? "—"
                  : `${reconciliation.lostOutput.toLocaleString("en-ZA", { maximumFractionDigits: 1 })} t`} />
            </div>
          </div>

          {(reconciliation.scheduledReconciles === false || reconciliation.availableReconciles === false) && Object.keys(values).length > 0 && (
            <div style={{ ...cardS, background: T.amberBg, borderColor: `${T.amber}33` }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", color: T.amber, fontSize: "13px" }}>
                <AlertTriangle size={15} style={{ marginTop: "2px", flexShrink: 0 }} />
                <div>
                  {reconciliation.scheduledReconciles === false && <div>Planned downtime + available time does not equal scheduled time.</div>}
                  {reconciliation.availableReconciles === false && <div>Operating + standby does not equal available time.</div>}
                </div>
              </div>
            </div>
          )}

          <div style={cardS}>
            <label style={labelS}>Data confidence</label>
            <select value={confidence} onChange={(e) => setConfidence(e.target.value)} style={inputS}>
              {Object.values(DATA_CONFIDENCE).map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
              ))}
            </select>
            <p style={{ margin: "6px 0 0", fontSize: "11.5px", color: T.muted }}>
              Estimates are labelled and can be replaced by verified data later.
            </p>
          </div>

          {errors.length > 0 && (
            <div style={{ ...cardS, background: T.redBg, borderColor: `${T.red}33` }}>
              <div style={{ display: "flex", gap: "8px", color: T.red, fontSize: "13px" }}>
                <X size={15} style={{ marginTop: "2px", flexShrink: 0 }} />
                <div>
                  {errors.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              </div>
            </div>
          )}

          {result && (
            <div style={{ ...cardS, background: T.greenBg, borderColor: `${T.green}33` }}>
              <div style={{ display: "flex", gap: "8px", color: T.green, fontSize: "13.5px" }}>
                <Check size={15} style={{ marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <strong>{result.count}</strong> measurement{result.count === 1 ? "" : "s"} saved as draft.
                  <div style={{ fontSize: "12px", color: T.body, marginTop: "3px" }}>Submit for approval to feed KPIs.</div>
                </div>
              </div>
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            style={{ width: "100%", padding: "12px", borderRadius: "10px",
              background: T.accent, color: "#fff", border: `1px solid ${T.accent}`,
              cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: "14px",
              fontWeight: 600, opacity: saving ? 0.6 : 1, marginTop: "4px" }}>
            {saving ? "Saving…" : "Save shift"}
          </button>

          <div style={{ marginTop: "12px", padding: "10px 12px", background: T.panel, borderRadius: "8px",
            border: `1px solid ${T.lineSoft}`, fontSize: "11.5px", color: T.body,
            display: "flex", gap: "6px", alignItems: "flex-start" }}>
            <Info size={13} style={{ marginTop: "2px", flexShrink: 0, color: T.muted }} />
            <span>Values save at the natural operating grain — one row per component per asset per shift. The KPI engine recomputes ratios from these components, never averaging daily values.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ fontSize: "12.5px", color: "#3b2b26" }}>{label}</span>
      <span style={{ fontSize: "16px", fontWeight: 700, color: "#2d201c", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  )
}