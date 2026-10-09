"use client"

/**
 * digitalTwin/components/DowntimeEventForm.jsx
 *
 * Screen 3 from the brief: contextual downtime capture that asks only for
 * what is needed now (Brief page 4). Every classification field maps
 * directly to Section 7.8's downtime event model.
 */

import { useEffect, useMemo, useState } from "react"
import { Check, AlertTriangle, X, Plus } from "lucide-react"
import { createDowntimeEvent, DOWNTIME_TAXONOMY, listDowntimeEvents } from "../services/downtimeService"
import { DOWNTIME_RESPONSIBILITY, DOWNTIME_LOSS_TYPE, DATA_CONFIDENCE } from "../models/enums"
import { listResources } from "../services/resourceService"
import { RESOURCE_KIND } from "../models/assetSchema"

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
const cardS = { background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "16px", marginBottom: "14px" }

export default function DowntimeEventForm({ tenantId, defaultAssetId = null, onBack }) {
  const [assets, setAssets] = useState([])
  const [loadingAssets, setLoadingAssets] = useState(true)
  const [assetId, setAssetId] = useState(defaultAssetId || "")
  const [recentEvents, setRecentEvents] = useState([])

  const [form, setForm] = useState({
    categoryLevel1: "",
    categoryLevel2: "",
    lossType: "",
    failureMode: "",
    causeCode: "",
    responsibility: DOWNTIME_RESPONSIBILITY.INTERNAL,
    responsibleOwner: "",
    eventStart: new Date().toISOString().slice(0, 16),
    eventEnd: "",
    notes: "",
    confidence: DATA_CONFIDENCE.MANUAL_ACTUAL,
    assetStateBefore: "",
    operatingMode: "",
    crew: "",
    workOrderId: "",
  })

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState([])
  const [result, setResult] = useState(null)

  // Load assets
  useEffect(() => {
    (async () => {
      if (!tenantId) return
      setLoadingAssets(true)
      try {
        const list = await listResources(tenantId, { resourceKind: RESOURCE_KIND.ASSET, status: "available", pageSize: 500 })
        setAssets(list)
        if (!assetId && list.length > 0 && !defaultAssetId) setAssetId(list[0].assetId || list[0].id)
      } finally { setLoadingAssets(false) }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  // Load recent events for the selected asset
  useEffect(() => {
    (async () => {
      if (!tenantId || !assetId) return
      try {
        const events = await listDowntimeEvents(tenantId, { assetId, pageSize: 10 })
        setRecentEvents(events.slice(0, 5))
      } catch { setRecentEvents([]) }
    })()
  }, [tenantId, assetId])

  const set = (patch) => setForm((p) => ({ ...p, ...patch }))

  const categoryDef = form.categoryLevel1 ? DOWNTIME_TAXONOMY[form.categoryLevel1] : null
  const subcategories = categoryDef?.subcategories || []

  // Live duration preview
  const durationHours = useMemo(() => {
    if (!form.eventStart) return null
    const start = new Date(form.eventStart).getTime()
    const end = form.eventEnd ? new Date(form.eventEnd).getTime() : null
    if (end === null) return null
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null
    return (end - start) / 3600000
  }, [form.eventStart, form.eventEnd])

  // Estimated lost output — using selected asset's nominal productivity if we have one
  const estimatedLostOutput = useMemo(() => {
    if (durationHours === null) return null
    const asset = assets.find((a) => (a.assetId || a.id) === assetId)
    if (!asset || !asset.currentDeratedCapacity && !asset.nameplateCapacity) return null
    const rate = asset.currentDeratedCapacity || asset.nameplateCapacity
    return durationHours * Number(rate) // crude; better once productivity history exists
  }, [durationHours, assets, assetId])

  const validate = () => {
    const errs = []
    if (!assetId) errs.push("Select an asset.")
    if (!form.categoryLevel1) errs.push("Select a downtime category.")
    if (!form.eventStart) errs.push("Enter a start time.")
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    setErrors(errs)
    if (errs.length > 0) return

    setSaving(true)
    setResult(null)
    try {
      const isoStart = new Date(form.eventStart).toISOString()
      const isoEnd = form.eventEnd ? new Date(form.eventEnd).toISOString() : null
      await createDowntimeEvent(tenantId, {
        assetId,
        eventStart: isoStart,
        eventEnd: isoEnd,
        categoryLevel1: form.categoryLevel1,
        categoryLevel2: form.categoryLevel2 || null,
        lossType: form.lossType || undefined,
        failureMode: form.failureMode || null,
        causeCode: form.causeCode || null,
        responsibility: form.responsibility,
        responsibleOwner: form.responsibleOwner,
        assetStateBefore: form.assetStateBefore,
        operatingMode: form.operatingMode,
        crew: form.crew,
        workOrderId: form.workOrderId,
        estimatedLostOutput: estimatedLostOutput,
        notes: form.notes,
        confidence: form.confidence,
      })
      setResult({ ok: true })
      // Reset the entry but keep the asset selection for rapid multi-entry
      setForm((p) => ({
        ...p,
        categoryLevel1: "",
        categoryLevel2: "",
        failureMode: "",
        causeCode: "",
        eventStart: new Date().toISOString().slice(0, 16),
        eventEnd: "",
        notes: "",
      }))
    } catch (err) {
      if (err.conflicts) {
        setErrors([`Overlapping downtime — closes at a time that clashes with another event.`, ...err.conflicts.map((c) => `${c.eventStart.slice(0, 16)} → ${(c.eventEnd || "open").slice(0, 16)}`)])
      } else {
        setErrors([err.message])
      }
    } finally { setSaving(false) }
  }

  const Section = ({ title, children }) => (
    <div style={cardS}>
      <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {title}
      </h3>
      {children}
    </div>
  )

  return (
    <div>
      {onBack && (
        <button onClick={onBack} style={{ padding: "9px 16px", borderRadius: "8px",
          border: `1px solid ${T.lineStrong}`, background: T.bg, color: T.body,
          cursor: "pointer", fontFamily: "inherit", fontSize: "13.5px", fontWeight: 500,
          marginBottom: "14px", display: "inline-flex", alignItems: "center", gap: "7px" }}>← Back</button>
      )}

      <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 700, color: T.accent }}>Record a downtime event</h2>
      <p style={{ margin: "0 0 18px", fontSize: "13px", color: T.muted }}>
        Only fields needed to calculate and explain this event are shown.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "14px" }}>
        <div>
          <Section title="Scope">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
              </div>
              <div>
                <label style={labelS}>Asset state before event</label>
                <input value={form.assetStateBefore} onChange={(e) => set({ assetStateBefore: e.target.value })}
                  style={inputS} placeholder="e.g. operating" />
              </div>
            </div>
          </Section>

          <Section title="Timing">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelS}>Started *</label>
                <input type="datetime-local" value={form.eventStart} onChange={(e) => set({ eventStart: e.target.value })} style={inputS} />
              </div>
              <div>
                <label style={labelS}>Returned to service</label>
                <input type="datetime-local" value={form.eventEnd} onChange={(e) => set({ eventEnd: e.target.value })} style={inputS} />
                <p style={{ margin: "4px 0 0", fontSize: "11.5px", color: T.muted }}>
                  Leave blank if the event is still open — close it later.
                </p>
              </div>
            </div>
          </Section>

          <Section title="Classification">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={labelS}>Category *</label>
                <select value={form.categoryLevel1} onChange={(e) => set({ categoryLevel1: e.target.value, categoryLevel2: "" })} style={inputS}>
                  <option value="">Select category…</option>
                  {Object.entries(DOWNTIME_TAXONOMY).map(([code, def]) => (
                    <option key={code} value={code}>
                      {def.label}{def.planned ? " (planned)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelS}>Subcategory</label>
                <select value={form.categoryLevel2} onChange={(e) => set({ categoryLevel2: e.target.value })} style={inputS} disabled={!form.categoryLevel1}>
                  <option value="">Select subcategory…</option>
                  {subcategories.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelS}>Failure mode</label>
                <input value={form.failureMode} onChange={(e) => set({ failureMode: e.target.value })}
                  style={inputS} placeholder="e.g. Hose failure" />
              </div>
              <div>
                <label style={labelS}>Responsibility</label>
                <select value={form.responsibility} onChange={(e) => set({ responsibility: e.target.value })} style={inputS}>
                  {Object.values(DOWNTIME_RESPONSIBILITY).map((r) => (
                    <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            </div>
          </Section>

          <Section title="Operational context">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelS}>Operating mode</label>
                <input value={form.operatingMode} onChange={(e) => set({ operatingMode: e.target.value })} style={inputS} placeholder="e.g. hauling" />
              </div>
              <div>
                <label style={labelS}>Crew</label>
                <input value={form.crew} onChange={(e) => set({ crew: e.target.value })} style={inputS} placeholder="e.g. B crew" />
              </div>
              <div>
                <label style={labelS}>Work order</label>
                <input value={form.workOrderId} onChange={(e) => set({ workOrderId: e.target.value })} style={inputS} />
              </div>
            </div>
          </Section>

          <Section title="Notes">
            <textarea rows="3" value={form.notes} onChange={(e) => set({ notes: e.target.value })}
              style={{ ...inputS, resize: "vertical" }}
              placeholder="Root cause and action can be completed after initial submission." />
          </Section>
        </div>

        {/* Right panel */}
        <div>
          <div style={{ ...cardS, background: T.accentTint, borderColor: T.lineStrong }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Calculated
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <CalcRow label="Duration"
                value={durationHours === null ? "—"
                  : durationHours >= 1
                    ? `${Math.floor(durationHours)} h ${Math.round((durationHours % 1) * 60)} min`
                    : `${Math.round(durationHours * 60)} min`} />
              <CalcRow label="Estimated lost output"
                value={estimatedLostOutput === null ? "—"
                  : `${estimatedLostOutput.toLocaleString("en-ZA", { maximumFractionDigits: 0 })} ${assets.find((a) => (a.assetId || a.id) === assetId)?.canonicalUnit === "tonnes" ? "tonnes" : ""}`.trim()} />
            </div>
          </div>

          <div style={cardS}>
            <label style={labelS}>Confidence</label>
            <select value={form.confidence} onChange={(e) => set({ confidence: e.target.value })} style={inputS}>
              {Object.values(DATA_CONFIDENCE).map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
              ))}
            </select>
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
                <div>Downtime event saved.</div>
              </div>
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            style={{ width: "100%", padding: "12px", borderRadius: "10px",
              background: T.accent, color: "#fff", border: `1px solid ${T.accent}`,
              cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
              fontSize: "14px", fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : "Submit event"}
          </button>

          {recentEvents.length > 0 && (
            <div style={{ ...cardS, marginTop: "14px" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Recent events on this asset
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {recentEvents.map((e) => (
                  <div key={e.id} style={{ fontSize: "12px", color: T.body, padding: "6px 8px",
                    background: T.panel, borderRadius: "6px", border: `1px solid ${T.lineSoft}` }}>
                    <div style={{ fontWeight: 600 }}>{DOWNTIME_TAXONOMY[e.categoryLevel1]?.label || e.categoryLevel1}</div>
                    <div style={{ color: T.muted }}>
                      {e.eventStart.slice(0, 16).replace("T", " ")} → {e.eventEnd ? e.eventEnd.slice(0, 16).replace("T", " ") : <span style={{ color: T.green }}>open</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CalcRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ fontSize: "12.5px", color: "#3b2b26" }}>{label}</span>
      <span style={{ fontSize: "15px", fontWeight: 700, color: "#2d201c", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  )
}