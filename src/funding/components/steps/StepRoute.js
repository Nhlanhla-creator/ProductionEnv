"use client"

import { HelpCircle, ChevronRight } from "lucide-react"
import { INSTRUMENT_FAMILIES, listInstrumentsByFamily, getInstrument } from "../../models/instruments"
import { ROUTE_UNCERTAINTY } from "../../models/fundingRequest"
import useRouteChangeGuard from "../../hooks/useRouteChangeGuard"
import RouteChangeDialog from "../RouteChangeDialog"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#5D4037", accentSoft: "#8D6E63", accentTint: "#EFEBE9",
  green: "#166534", greenBg: "#f0fdf4",
  amber: "#92400e", amberBg: "#fffbeb",
}

const inputS = {
  width: "100%", padding: "10px 12px",
  border: `1px solid ${T.lineStrong}`, borderRadius: "9px",
  fontSize: "14px", fontFamily: "inherit", color: T.ink, background: T.bg, outline: "none",
  boxSizing: "border-box",
}
const labelS = { display: "block", fontSize: "12.5px", fontWeight: 600, color: T.accent, marginBottom: "6px" }

const FAMILY_LABELS = {
  [INSTRUMENT_FAMILIES.WORKING_CAPITAL]: "Working capital",
  [INSTRUMENT_FAMILIES.ASSET]:           "Asset finance",
  [INSTRUMENT_FAMILIES.TERM_DEBT]:       "Term debt",
  [INSTRUMENT_FAMILIES.BRIDGE]:          "Bridge",
  [INSTRUMENT_FAMILIES.TRADE]:           "Trade finance",
  [INSTRUMENT_FAMILIES.EQUITY]:          "Equity",
  [INSTRUMENT_FAMILIES.STRATEGIC]:       "Strategic equity",
  [INSTRUMENT_FAMILIES.GRANT]:           "Grant",
  [INSTRUMENT_FAMILIES.CONVERTIBLE]:     "Convertible",
  [INSTRUMENT_FAMILIES.REVENUE_BASED]:   "Revenue-based",
  [INSTRUMENT_FAMILIES.BLENDED]:         "Blended finance",
  [INSTRUMENT_FAMILIES.TRANSACTION]:     "Transaction capital",
}

export default function StepRoute({ request, updateField }) {
  const uncertainty = request.routeUncertainty || ROUTE_UNCERTAINTY.UNSURE
  const instruments = uncertainty === ROUTE_UNCERTAINTY.SURE && request.instrumentCategory
    ? listInstrumentsByFamily(request.instrumentCategory)
    : []
  const selected = request.instrumentId ? getInstrument(request.instrumentId) : null

  // Phase 7 — route change guard
  const routeGuard = useRouteChangeGuard({
    request,
    requestId: request?.requestId,
    onApply: (patch) => {
      Object.entries(patch).forEach(([k, v]) => updateField(k, v))
    },
  })

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <label style={labelS}>Do you know which instrument you want? *</label>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: ROUTE_UNCERTAINTY.SURE,  label: "Yes, I know" },
            { id: ROUTE_UNCERTAINTY.UNSURE, label: "Help me choose" },
            { id: ROUTE_UNCERTAINTY.ANY,   label: "Show me any suitable options" },
          ].map((opt) => {
            const active = uncertainty === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  updateField("routeUncertainty", opt.id)
                  if (opt.id !== ROUTE_UNCERTAINTY.SURE) {
                    routeGuard.requestChange("", "")
                  }
                }}
                style={{
                  padding: "10px 16px", borderRadius: "999px",
                  border: `1.5px solid ${active ? T.accent : T.lineStrong}`,
                  background: active ? T.accent : T.bg,
                  color: active ? "#fff" : T.body,
                  fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
        <p style={{ margin: "8px 0 0", fontSize: "12px", color: T.muted }}>
          If you're not sure, pick "Help me choose" — we'll show the trade-offs and default to matching against all suitable instruments.
        </p>
      </div>

      {uncertainty === ROUTE_UNCERTAINTY.SURE && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
          <div>
            <label style={labelS}>Category *</label>
            <select
              value={request.instrumentCategory || ""}
              onChange={(e) => {
                routeGuard.requestChange("", e.target.value)
              }}
              style={inputS}
            >
              <option value="">Select a category</option>
              {Object.entries(FAMILY_LABELS).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelS}>Instrument *</label>
            <select
              value={request.instrumentId || ""}
              onChange={(e) => routeGuard.requestChange(e.target.value, request.instrumentCategory)}
              style={inputS}
              disabled={!request.instrumentCategory}
            >
              <option value="">Select an instrument</option>
              {instruments.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {selected && (
        <div style={{ padding: "16px", background: T.panel, borderRadius: "10px", border: `1px solid ${T.lineSoft}`, marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <ChevronRight size={14} color={T.accent} />
            <span style={{ fontSize: "14px", fontWeight: 700, color: T.accent }}>{selected.label}</span>
          </div>
          <p style={{ margin: "0 0 10px", fontSize: "13px", color: T.body, lineHeight: 1.55 }}>{selected.description}</p>
          <div style={{ fontSize: "12px", color: T.muted }}>
            You'll capture {selected.incrementalCapture.filter((f) => f.required).length} additional fields at the next step.
          </div>
        </div>
      )}

      {(uncertainty === ROUTE_UNCERTAINTY.UNSURE || uncertainty === ROUTE_UNCERTAINTY.ANY) && (
        <div style={{ padding: "14px 16px", background: T.amberBg, border: `1px solid ${T.amber}33`, borderRadius: "10px", marginBottom: "16px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <HelpCircle size={15} color={T.amber} style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: "13px", color: T.amber, lineHeight: 1.55 }}>
            We'll match this request against every suitable opportunity. The score service will assess Fundability against each instrument it finds, and the matching table will show you the trade-offs.
          </div>
        </div>
      )}

      <div>
        <label style={labelS}>Preferred provider (optional)</label>
        <input value={request.preferredProvider || ""} onChange={(e) => updateField("preferredProvider", e.target.value)} style={inputS} placeholder="Name a preferred funder if you have one in mind" />
      </div>

      {/* Phase 7 — route change confirmation */}
      {routeGuard.pending && (
        <RouteChangeDialog
          preview={routeGuard.pending.preview}
          onConfirm={routeGuard.confirm}
          onCancel={routeGuard.cancel}
        />
      )}
    </div>
  )
}