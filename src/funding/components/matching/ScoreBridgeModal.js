"use client"

import { useEffect, useMemo, useState } from "react"
import { X, Loader2, AlertTriangle, Info } from "lucide-react"
import { getScoreBridge } from "../../services/apiClient"
import { T } from "./Badges"

/**
 * The "Why this score?" modal — Brief §5, p.46 and §6, p.50-53.
 *
 * Consumes the engine's calculation trace. Does NOT recalculate any value.
 * Reconciliation: if displayed item totals and component totals differ
 * beyond 0.1 point, the narrative is suppressed (Brief §52).
 */

const NARRATIVE_TOLERANCE = 0.1

const REASON_LABELS = {
  HIGH_OPERATIONAL_WEIGHT: "Investor weights operational higher than default.",
  FUNDABILITY_ACTIVE: "Instrument activates Fundability rows.",
  GATE_MASKED_IMPROVEMENT: "A gate capped the score below the pre-cap value.",
  INSTRUMENT_INACTIVE_ROW: "One or more Fundability rows are inactive for this instrument.",
  PROVISIONAL_MISSING_INPUT: "One or more inputs are missing — score is provisional.",
}

export default function ScoreBridgeModal({ scoreId, onClose }) {
  const [bridge, setBridge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    if (!scoreId) return
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const data = await getScoreBridge(scoreId)
        if (!cancelled) setBridge(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [scoreId])

  // ── Reconciliation check (Brief §52) ────────────────────────────────
  const reconciliation = useMemo(() => {
    if (!bridge) return { ok: true, notes: [] }
    const notes = []
    const origSum = (bridge.original?.components || []).reduce((s, c) => s + (Number(c.value) || 0), 0)
    const origFinal = Number(bridge.original?.bigScore)
    if (Number.isFinite(origFinal) && Math.abs(origSum - origFinal) > NARRATIVE_TOLERANCE) {
      notes.push(`Original components sum to ${origSum.toFixed(2)} but score shows ${origFinal}.`)
    }

    const adj = bridge.adjusted || {}
    const preCap = Number(adj.preCap)
    const gateCap = Number(adj.gateCap)
    const final = Number(adj.final)
    if (Number.isFinite(preCap) && Number.isFinite(gateCap) && Number.isFinite(final)) {
      const expected = Math.min(preCap, gateCap)
      if (Math.abs(expected - final) > NARRATIVE_TOLERANCE) {
        notes.push(`Pre-cap ${preCap} under gate ${gateCap} should yield ${expected}, but final is ${final}.`)
      }
    }
    return { ok: notes.length === 0, notes }
  }, [bridge])

  if (!scoreId) return null

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} style={modalStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.accent }}>
              Why this score?
            </h2>
            {bridge && (
              <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3, lineHeight: 1.5 }}>
                Score <code style={codeStyle}>{bridge.scoreId}</code> · calculation <code style={codeStyle}>{bridge.calculationId}</code>
                <br />
                methodology <b>{bridge.versions?.methodology}</b> · rule registry <b>{bridge.versions?.ruleRegistry}</b> · scoring profile <b>{bridge.versions?.scoringProfile}</b>
              </div>
            )}
          </div>
          <button onClick={onClose} style={iconBtnStyle}>
            <X size={20} />
          </button>
        </div>

        {loading && (
          <div style={{ padding: 40, textAlign: "center", color: T.muted }}>
            <Loader2 size={20} className="animate-spin" />
          </div>
        )}

        {error && (
          <div style={errorBoxStyle}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {bridge && !reconciliation.ok && (
          <div style={{ ...errorBoxStyle, background: T.amberBg, borderColor: `${T.amber}33`, color: T.amber }}>
            <AlertTriangle size={14} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Reconciliation mismatch — narrative suppressed</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {reconciliation.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          </div>
        )}

        {bridge && (
          <>
            {/* ── Original section ─────────────────────────────────── */}
            <Section title="Original BIG Score" subtitle="Canonical profile result — same across every opportunity">
              <KV label="BIG Score" value={bridge.original?.bigScore} big />
              <KV label="Capital Appeal (= Financial Strength at 100%)" value={bridge.original?.capitalAppeal} />
              <div style={{ marginTop: 10 }}>
                <div style={subheadStyle}>Components</div>
                <table style={tableStyle}>
                  <thead>
                    <tr style={theadRowStyle}>
                      <th style={thStyle}>Component</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Value</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Max</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Weight</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Contribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bridge.original?.components || []).map((c, i) => (
                      <tr key={i} style={tbodyRowStyle}>
                        <td style={tdStyle}>{c.name}</td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>{c.value}</td>
                        <td style={{ ...tdStyle, textAlign: "right", color: T.muted }}>{c.max}</td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>{fmtPct(c.weight)}</td>
                        <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>
                          {fmtNum((Number(c.value) || 0) * (Number(c.weight) || 0), 2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* ── Adjusted section ─────────────────────────────────── */}
            <Section title="Adjusted BIG Score (this opportunity)" subtitle="Instrument Fundability + approved investor weights">
              <KV label="Fundability score" value={bridge.adjusted?.fundability} big />

              <div style={{ marginTop: 10 }}>
                <div style={subheadStyle}>Fundability rows</div>
                <table style={tableStyle}>
                  <thead>
                    <tr style={theadRowStyle}>
                      <th style={thStyle}>Row</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Score</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Weight</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bridge.adjusted?.fundabilityRows || []).map((r, i) => {
                      const active = r.status === "active"
                      return (
                        <tr key={i} style={{ ...tbodyRowStyle, opacity: active ? 1 : 0.55 }}>
                          <td style={tdStyle}>
                            {r.label}
                            {!active && r.reason && (
                              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{r.reason}</div>
                            )}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>{active ? r.score : "—"}</td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>{fmtPct(r.weight)}</td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                              background: active ? T.greenBg : T.grayBg,
                              color: active ? T.green : T.gray,
                              textTransform: "uppercase", letterSpacing: 0.4,
                            }}>{r.status}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                <div>
                  <div style={subheadStyle}>Capital Appeal split</div>
                  <KV label="Financial Strength" value={fmtPct(bridge.adjusted?.capitalAppealSplit?.financialStrength)} />
                  <KV label="Fundability" value={fmtPct(bridge.adjusted?.capitalAppealSplit?.fundability)} />
                </div>
                <div>
                  <div style={subheadStyle}>Investor five-component weights</div>
                  {Object.entries(bridge.adjusted?.investorWeights || {}).map(([k, v]) => (
                    <KV key={k} label={labelForComponent(k)} value={fmtPct(v)} />
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
                <Metric label="Pre-cap" value={bridge.adjusted?.preCap} />
                <Metric label="Gate cap" value={bridge.adjusted?.gateCap} />
                <Metric label="Final adjusted" value={bridge.adjusted?.final} highlight />
              </div>
              <KV label="Rounded delta vs original" value={`${bridge.adjusted?.roundedDelta > 0 ? "+" : ""}${bridge.adjusted?.roundedDelta}`} />
            </Section>

            {/* ── Reason codes ─────────────────────────────────────── */}
            {Array.isArray(bridge.reasonCodes) && bridge.reasonCodes.length > 0 && (
              <Section title="Reason codes">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {bridge.reasonCodes.map((code, i) => (
                    <span key={i} style={{
                      padding: "3px 10px", borderRadius: 999,
                      fontSize: 11, fontWeight: 700,
                      background: T.accentTint, color: T.accent,
                    }}>{code}</span>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Narrative (suppressed if reconciliation fails) ──── */}
            {Array.isArray(bridge.facts) && bridge.facts.length > 0 && reconciliation.ok && (
              <Section title="What drove the difference">
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: T.body, lineHeight: 1.6 }}>
                  {bridge.facts.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </Section>
            )}

            {!reconciliation.ok && (
              <div style={{
                marginTop: 12, padding: "10px 12px",
                background: T.panel, borderRadius: 9,
                fontSize: 12, color: T.muted, fontStyle: "italic",
              }}>
                Narrative explanation withheld until the calculation reconciles.
                Contact support with calculation ID <code style={codeStyle}>{bridge.calculationId}</code>.
              </div>
            )}

            <div style={{
              marginTop: 14, padding: "10px 12px",
              background: T.blueBg, borderRadius: 9,
              fontSize: 11.5, color: T.blue,
              display: "flex", gap: 8, alignItems: "flex-start",
            }}>
              <Info size={13} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                Adjusted BIG Score combines the original score with this instrument's Fundability and the investor's
                approved weights. Eligibility and Match Score are separate — they do not affect the BIG Score.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Layout helpers ────────────────────────────────────────────────────────

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 200, padding: 20,
}
const modalStyle = {
  background: T.bg, borderRadius: 14,
  maxWidth: 820, width: "100%", maxHeight: "90vh", overflowY: "auto",
  padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
}
const iconBtnStyle = {
  background: "none", border: "none", cursor: "pointer", color: T.muted,
}
const errorBoxStyle = {
  marginBottom: 14, padding: "10px 14px",
  background: T.redBg, border: `1px solid ${T.red}33`, color: T.red,
  borderRadius: 9, fontSize: 12.5,
  display: "flex", gap: 8, alignItems: "flex-start",
}
const codeStyle = {
  fontSize: 11, background: T.raised, padding: "1px 6px", borderRadius: 4,
  fontFamily: "ui-monospace, monospace",
}
const subheadStyle = {
  fontSize: 10.5, fontWeight: 700, color: T.muted,
  textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6,
}
const tableStyle = {
  width: "100%", borderCollapse: "collapse", fontSize: 12.5,
}
const theadRowStyle = {
  color: T.muted, fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.4,
}
const thStyle = {
  textAlign: "left", padding: "6px 8px 6px 0", fontWeight: 600,
}
const tbodyRowStyle = {
  borderTop: `1px solid ${T.lineSoft}`,
}
const tdStyle = {
  padding: "6px 8px 6px 0", color: T.ink,
}

function Section({ title, subtitle, children }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: T.accent }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}

function KV({ label, value, big = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12.5 }}>
      <span style={{ color: T.muted }}>{label}</span>
      <span style={{ color: T.ink, fontWeight: big ? 700 : 500, fontSize: big ? 15 : 12.5 }}>
        {value ?? "—"}
      </span>
    </div>
  )
}

function Metric({ label, value, highlight = false }) {
  return (
    <div style={{
      padding: "10px 12px", background: highlight ? T.accentTint : T.panel,
      borderRadius: 9, textAlign: "center",
    }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, marginTop: 4 }}>{value ?? "—"}</div>
    </div>
  )
}

// ── Formatting ────────────────────────────────────────────────────────────

function fmtPct(v) {
  if (v == null || Number.isNaN(Number(v))) return "—"
  return `${(Number(v) * 100).toFixed(0)}%`
}
function fmtNum(v, dp = 2) {
  if (v == null || Number.isNaN(Number(v))) return "—"
  return Number(v).toFixed(dp)
}
function labelForComponent(k) {
  return {
    compliance: "Compliance",
    legitimacy: "Legitimacy",
    leadership: "Leadership",
    operational: "Operational",
    financial: "Financial",
  }[k] || k
}