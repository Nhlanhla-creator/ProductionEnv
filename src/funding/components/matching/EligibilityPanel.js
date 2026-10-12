"use client"

import { X, CheckCircle2, XCircle, HelpCircle, Info } from "lucide-react"
import { T } from "./Badges"

/**
 * Separate panel from the Score Bridge — Brief §5, p.46:
 *   "Explain the eligibility/match rationale in a separate panel."
 *
 * Eligibility is a HARD gate and cannot be rescued by a high Adjusted BIG Score
 * (Brief §45). Match Score is a SOFT mandate fit, distinct from the BIG Score.
 */

export default function EligibilityPanel({ row, onClose }) {
  if (!row) return null

  const eligibilityReasons = row.eligibilityReasons || []
  const matchReasons = row.matchReasons || []

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} style={modalStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.accent }}>
              Why does this fit?
            </h2>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>
              {row.investorName} · {row.opportunityName}
            </div>
          </div>
          <button onClick={onClose} style={iconBtnStyle}><X size={20} /></button>
        </div>

        {/* Eligibility — HARD gate */}
        <div style={{ marginBottom: 18 }}>
          <div style={headStyle}>Hard eligibility</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>
            Must pass before any soft-fit consideration. A hard failure is never rescued by a high Adjusted BIG Score.
          </div>

          {eligibilityReasons.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {eligibilityReasons.map((r, i) => (
                <ReasonRow key={i} {...r} />
              ))}
            </div>
          ) : (
            <div style={{
              padding: "10px 12px", background: T.panel, borderRadius: 9,
              fontSize: 12, color: T.muted, fontStyle: "italic",
              border: `1px dashed ${T.line}`,
            }}>
              Detailed reasons will appear here once the requirement engine returns the breakdown for this opportunity.
              Current status: <b style={{ color: statusColor(row.eligibility) }}>{row.eligibility}</b>.
            </div>
          )}
        </div>

        {/* Match Score — SOFT mandate fit */}
        <div>
          <div style={headStyle}>Soft mandate fit (Match Score)</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>
            Published weights applied to known inputs. Distinct from the BIG Score and from Eligibility.
          </div>

          {matchReasons.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {matchReasons.map((r, i) => (
                <ReasonRow key={i} {...r} />
              ))}
            </div>
          ) : (
            <div style={{
              padding: "10px 12px", background: T.panel, borderRadius: 9,
              fontSize: 12, color: T.muted,
            }}>
              Score: <b style={{ color: T.ink }}>{row.matchScore ?? "—"}</b>{" "}
              ({row.matchFit || "—"} fit).
              Detailed numerator/denominator breakdown will appear here when the matching engine returns per-criterion contributions.
            </div>
          )}
        </div>

        <div style={{
          marginTop: 16, padding: "10px 12px", background: T.blueBg, borderRadius: 9,
          fontSize: 11.5, color: T.blue, display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <Info size={13} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            Eligibility = hard criteria (entity, geography, sector, stage, instrument, ticket, dates, exclusions).
            Match Score = soft mandate fit from published weights. Neither is the BIG Score.
          </div>
        </div>
      </div>
    </div>
  )
}

function ReasonRow({ label, passed, note }) {
  const Icon = passed === true ? CheckCircle2 : passed === false ? XCircle : HelpCircle
  const color = passed === true ? T.green : passed === false ? T.red : T.amber
  const bg = passed === true ? T.greenBg : passed === false ? T.redBg : T.amberBg
  return (
    <div style={{
      display: "flex", gap: 10, padding: "9px 12px",
      borderRadius: 9, background: bg,
      border: `1px solid ${color}22`,
    }}>
      <Icon size={14} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>{label}</div>
        {note && <div style={{ fontSize: 11.5, color: T.body, marginTop: 2 }}>{note}</div>}
      </div>
    </div>
  )
}

function statusColor(status) {
  if (status === "eligible") return T.green
  if (status === "ineligible") return T.red
  return T.amber
}

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 200, padding: 20,
}
const modalStyle = {
  background: T.bg, borderRadius: 14,
  maxWidth: 620, width: "100%", maxHeight: "90vh", overflowY: "auto",
  padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
}
const iconBtnStyle = { background: "none", border: "none", cursor: "pointer", color: T.muted }
const headStyle = {
  fontSize: 11, fontWeight: 700, color: T.muted,
  textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4,
}