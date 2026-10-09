"use client"

/**
 * digitalTwin/components/KpiLineageModal.jsx
 *
 * Every displayed KPI value can be opened to see:
 *   - the formula and components
 *   - every contributing measurement record
 *   - the source system, confidence and state of each
 *
 * Brief references: Section 1.2 step 7 (preserve formula, filters and
 * lineage), Section 7.3 (source priority), Section 9.4 (view the formula,
 * components and contributing measurements).
 */

import { useEffect, useState } from "react"
import { X, ExternalLink, ShieldCheck, AlertTriangle, Info } from "lucide-react"
import { getLineage } from "../services/kpiEngine"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", faint: "#8a7a74",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#4a352f", accentSoft: "#6b4f47", accentTint: "#f4efec",
  header: "#33231e",
  green: "#166534", greenBg: "#f0fdf4",
  amber: "#92400e", amberBg: "#fffbeb",
  red: "#991b1b", redBg: "#fef2f2",
}

const btnBase = { padding: "9px 16px", borderRadius: "8px", fontSize: "13.5px", fontWeight: 500,
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: "inherit" }
const btnPrimary = { ...btnBase, background: T.accent, color: "#fff", border: `1px solid ${T.accent}`, fontWeight: 600 }

const CONFIDENCE_LABEL = {
  integrated_verified: "Integrated · verified",
  verified_evidence: "Verified evidence",
  manual_actual: "Manual actual",
  estimate: "Estimate",
  calculated: "Calculated",
  unknown: "Unknown",
}

const CONFIDENCE_BADGE = {
  integrated_verified: { bg: T.greenBg, fg: T.green },
  verified_evidence: { bg: T.greenBg, fg: T.green },
  manual_actual: { bg: T.panel, fg: T.body },
  estimate: { bg: T.amberBg, fg: T.amber },
  calculated: { bg: "#eef2ff", fg: T.accent },
  unknown: { bg: T.raised, fg: T.muted },
}

export default function KpiLineageModal({ tenantId, calculationResult, onClose, onOpenAsset }) {
  const [loading, setLoading] = useState(true)
  const [lineage, setLineage] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!calculationResult) return
    (async () => {
      setLoading(true)
      try {
        const rows = await getLineage(tenantId, calculationResult)
        setLineage(rows)
      } catch (err) {
        setError(err.message)
      } finally { setLoading(false) }
    })()
  }, [tenantId, calculationResult])

  if (!calculationResult) return null

  const kpi = calculationResult
  const formula = describeFormula(kpi)

  // Group lineage by component
  const byComponent = {}
  lineage.forEach((row) => {
    if (!byComponent[row.component]) byComponent[row.component] = []
    byComponent[row.component].push(row)
  })

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(45,32,28,0.55)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 1400, padding: "20px",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: T.bg, borderRadius: "14px", width: "100%", maxWidth: "960px",
        maxHeight: "94vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 60px rgba(45,32,28,0.28)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: "18px 22px 14px", borderBottom: `1px solid ${T.line}` }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", color: T.accent, fontWeight: 600 }}>
              {kpi.name}
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: "13px", color: T.body }}>
              {formula ? <>Formula: <strong>{formula}</strong> · </> : null}
              Calculated {kpi.calculatedAt ? new Date(kpi.calculatedAt).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }) : ""}
              {kpi.calculationTimeMs ? ` · ${kpi.calculationTimeMs} ms` : ""}
            </p>
          </div>
          <button onClick={onClose} style={{ background: T.raised, border: "none", cursor: "pointer",
            color: T.body, width: 30, height: 30, borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 22px", overflowY: "auto", flex: 1 }}>
          {/* Summary line */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px", marginBottom: "18px" }}>
            <SummaryStat label="Value" value={formatValue(kpi.value, kpi.unit)} />
            <SummaryStat label="Status" value={kpi.statusLabel || "—"}
              color={kpi.status === "red" ? T.red : kpi.status === "amber" ? T.amber : kpi.status === "green" ? T.green : T.muted} />
            <SummaryStat label="KPI version" value={`v${kpi.kpiVersion}`} />
            <SummaryStat label="Contributing records" value={lineage.length} />
          </div>

          {/* Components */}
          <h4 style={{ margin: "0 0 10px", fontSize: "12.5px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Components
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", marginBottom: "20px" }}>
            {Object.entries(kpi.components || {}).map(([key, comp]) => (
              <div key={key} style={{ padding: "12px 14px", background: T.panel, borderRadius: "8px", border: `1px solid ${T.lineSoft}` }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "4px" }}>
                  {comp.label}
                </div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: T.ink, fontVariantNumeric: "tabular-nums" }}>
                  {comp.total !== null && comp.total !== undefined ? Number(comp.total).toFixed(2) : "—"}
                  <span style={{ fontSize: "12px", fontWeight: 500, color: T.muted, marginLeft: "6px" }}>{comp.unit}</span>
                </div>
                <div style={{ fontSize: "11px", color: T.muted, marginTop: "4px" }}>
                  {comp.contributingIds?.length || 0} contributing record{comp.contributingIds?.length === 1 ? "" : "s"}
                </div>
              </div>
            ))}
          </div>

          {/* Exclusions */}
          {kpi.exclusions && kpi.exclusions.length > 0 && (
            <div style={{ padding: "10px 14px", background: T.amberBg, borderRadius: "8px",
              border: `1px solid ${T.amber}33`, marginBottom: "18px",
              display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <AlertTriangle size={14} color={T.amber} style={{ marginTop: "2px", flexShrink: 0 }} />
              <div style={{ fontSize: "12.5px", color: T.amber }}>
                <strong>Applied exclusions:</strong> {Array.from(new Set(kpi.exclusions)).join(", ")}. Intermediate and rehandled material are excluded from accepted-output totals by policy (§7.7).
              </div>
            </div>
          )}

          {/* Lineage records */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h4 style={{ margin: 0, fontSize: "12.5px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Contributing measurements
            </h4>
            {loading && <span style={{ fontSize: "12px", color: T.muted }}>Loading…</span>}
          </div>

          {error ? (
            <div style={{ padding: "20px", background: T.redBg, borderRadius: "8px", border: `1px solid ${T.red}33`, color: T.red, fontSize: "13px" }}>
              Could not load lineage: {error}
            </div>
          ) : lineage.length === 0 && !loading ? (
            <div style={{ padding: "30px", textAlign: "center", color: T.muted, fontSize: "13.5px", fontStyle: "italic",
              background: T.panel, borderRadius: "8px", border: `1px solid ${T.lineSoft}` }}>
              No contributing measurements found — the KPI shows no data for this scope and period.
            </div>
          ) : (
            <div style={{ border: `1px solid ${T.lineSoft}`, borderRadius: "8px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ background: T.header, color: "#fff" }}>
                    {["Component", "Value", "Interval start", "Source", "Confidence", "State"].map((h) => (
                      <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: "11px",
                        fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase",
                        borderRight: "1px solid rgba(255,255,255,0.14)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lineage.map((r, i) => {
                    const conf = CONFIDENCE_BADGE[r.confidence] || CONFIDENCE_BADGE.unknown
                    return (
                      <tr key={r.id} style={{ background: i % 2 ? T.panel : T.bg, borderBottom: `1px solid ${T.lineSoft}` }}>
                        <td style={{ padding: "9px 12px", borderRight: `1px solid ${T.lineSoft}`, color: T.body }}>
                          {r.component}
                        </td>
                        <td style={{ padding: "9px 12px", borderRight: `1px solid ${T.lineSoft}`, fontVariantNumeric: "tabular-nums" }}>
                          <strong>{r.value}</strong> <span style={{ color: T.muted }}>{r.unit}</span>
                        </td>
                        <td style={{ padding: "9px 12px", borderRight: `1px solid ${T.lineSoft}`, color: T.muted, fontSize: "11.5px", fontFamily: "ui-monospace, monospace" }}>
                          {r.start ? new Date(r.start).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" }) : "—"}
                        </td>
                        <td style={{ padding: "9px 12px", borderRight: `1px solid ${T.lineSoft}`, fontSize: "12px" }}>
                          {r.source}
                        </td>
                        <td style={{ padding: "9px 12px", borderRight: `1px solid ${T.lineSoft}` }}>
                          <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 600,
                            background: conf.bg, color: conf.fg }}>
                            {CONFIDENCE_LABEL[r.confidence] || r.confidence}
                          </span>
                        </td>
                        <td style={{ padding: "9px 12px", fontSize: "12px", color: T.body }}>
                          {r.state}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "13px 22px", borderTop: `1px solid ${T.line}`, display: "flex",
          justifyContent: "space-between", alignItems: "center", background: T.panel, borderRadius: "0 0 14px 14px" }}>
          <span style={{ fontSize: "12px", color: T.muted, display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={13} /> Every number is traceable to its source.
          </span>
          <button onClick={onClose} style={btnPrimary}>Close</button>
        </div>
      </div>
    </div>
  )
}

function SummaryStat({ label, value, color }) {
  return (
    <div style={{ padding: "12px 14px", background: T.panel, borderRadius: "8px", border: `1px solid ${T.lineSoft}` }}>
      <div style={{ fontSize: "10.5px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: "18px", fontWeight: 700, color: color || T.ink, marginTop: "3px", fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  )
}

const formatValue = (v, unit) => {
  if (v === null || v === undefined) return "—"
  if (unit === "percent") return `${Number(v).toFixed(1)}%`
  if (unit === "ZAR_per_tonne") return `R ${Number(v).toFixed(2)}`
  return Number(v).toLocaleString("en-ZA", { maximumFractionDigits: 2 })
}

const describeFormula = (kpi) => {
  if (!kpi?.components) return null
  const ids = Object.keys(kpi.components)
  if (ids.length === 2) return `${kpi.components[ids[0]].label} ÷ ${kpi.components[ids[1]].label}`
  if (ids.length === 3) return `${kpi.components[ids[0]].label} × ${kpi.components[ids[1]].label} × ${kpi.components[ids[2]].label}`
  return null
}