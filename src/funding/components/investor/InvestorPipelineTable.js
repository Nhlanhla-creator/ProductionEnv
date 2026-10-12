"use client"

import { useEffect, useState } from "react"
import { Loader2, AlertTriangle, ArrowUpDown, Eye, Building2 } from "lucide-react"
import { T } from "../matching/Badges"
import { EligibilityBadge, MatchFitBadge, ScorePill } from "../matching/Badges"
import { getInstrumentLabel } from "../../models/instruments"
import useInvestorPipeline from "../../hooks/useInvestorPipeline"
import { listMyFirms } from "../../services/investorFirmService"

/**
 * Investor pipeline table — Brief §4, p.44.
 *
 * The pipeline only lists submissions addressed to the investor's firm
 * (funderId == current user, or the investor is the firm owner).
 */

const STAGE_LABELS = {
  received:     "Received",
  under_review: "Under review",
  information_requested: "Information requested",
  termsheet:    "Termsheet",
  approved:     "Approved",
  declined:     "Declined",
  withdrawn:    "Withdrawn",
  deal_closed:  "Deal closed",
}

const STAGE_TONE = {
  received:              { color: T.blue,  bg: T.blueBg },
  under_review:          { color: T.amber, bg: T.amberBg },
  information_requested: { color: T.amber, bg: T.amberBg },
  termsheet:             { color: T.green, bg: T.greenBg },
  approved:              { color: T.green, bg: T.greenBg },
  declined:              { color: T.red,   bg: T.redBg },
  withdrawn:             { color: T.gray,  bg: T.grayBg },
  deal_closed:           { color: T.green, bg: T.greenBg },
}

export default function InvestorPipelineTable({ onOpenCase }) {
  const [firms, setFirms] = useState([])
  const [firmId, setFirmId] = useState(null)
  const [firmsLoading, setFirmsLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const fs = await listMyFirms()
        setFirms(fs)
        if (fs.length > 0) setFirmId(fs[0].firmId)
      } finally { setFirmsLoading(false) }
    })()
  }, [])

  const p = useInvestorPipeline({ firmId })

  if (firmsLoading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: T.muted }}>
        <Loader2 size={22} className="animate-spin" />
      </div>
    )
  }

  if (firms.length === 0) {
    return (
      <div style={{ padding: "40px 24px", background: T.panel, borderRadius: 12, border: `1px dashed ${T.lineStrong}`, textAlign: "center" }}>
        <Building2 size={28} color={T.accentSoft} style={{ marginBottom: 10 }} />
        <h3 style={{ margin: "0 0 6px", fontSize: 16, color: T.accent }}>No firms yet</h3>
        <p style={{ margin: 0, fontSize: 13, color: T.muted }}>
          Set up a firm and publish an opportunity to start receiving submissions.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: T.accent, letterSpacing: -0.3 }}>
            Submissions
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: T.muted }}>
            {p.rows.length} submission{p.rows.length === 1 ? "" : "s"} across your firm
          </p>
        </div>

        {firms.length > 1 && (
          <select value={firmId} onChange={(e) => setFirmId(e.target.value)} style={selectS}>
            {firms.map((f) => <option key={f.firmId} value={f.firmId}>{f.name || "Untitled firm"}</option>)}
          </select>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <StagePill active={p.stageFilter === "all"} onClick={() => p.setStageFilter("all")} label="All" count={p.allRows.length} />
        {p.stages.map((s) => (
          <StagePill
            key={s}
            active={p.stageFilter === s}
            onClick={() => p.setStageFilter(s)}
            label={STAGE_LABELS[s] || s}
            count={p.allRows.filter((x) => x.currentStage === s).length}
          />
        ))}
      </div>

      {/* Sort bar */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 12 }}>
        <ArrowUpDown size={13} color={T.muted} />
        {[
          { id: "submittedAt", label: "Date" },
          { id: "adjustedBigScore", label: "Adjusted BIG Score" },
          { id: "matchScore", label: "Match Score" },
          { id: "requestedAmount", label: "Amount" },
        ].map((sf) => {
          const active = p.sortField === sf.id
          return (
            <button key={sf.id} onClick={() => p.toggleSort(sf.id)} style={{
              padding: "5px 12px", borderRadius: 999,
              border: `1.5px solid ${active ? T.accent : T.line}`,
              background: active ? T.accent : T.bg,
              color: active ? "#fff" : T.body,
              fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
              {sf.label}{active ? (p.sortDir === "asc" ? " ↑" : " ↓") : ""}
            </button>
          )
        })}
      </div>

      {p.loading ? (
        <div style={{ padding: 60, textAlign: "center", color: T.muted }}>
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : p.error ? (
        <div style={errorBox}><AlertTriangle size={14} /> {p.error}</div>
      ) : p.rows.length === 0 ? (
        <div style={{
          padding: "40px 24px", background: T.panel, borderRadius: 12,
          border: `1px dashed ${T.lineStrong}`, textAlign: "center", color: T.muted, fontSize: 13,
        }}>
          No submissions yet. They will appear here as SMEs submit to your published opportunities.
        </div>
      ) : (
        <div style={{ overflowX: "auto", border: `1px solid ${T.line}`, borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 1150 }}>
            <thead>
              <tr style={{ background: T.panel }}>
                <Th>SME</Th>
                <Th>Opportunity</Th>
                <Th>Instrument</Th>
                <Th align="right">Amount</Th>
                <Th align="right">Original</Th>
                <Th align="right">Adjusted</Th>
                <Th align="center">Eligibility</Th>
                <Th align="center">Match</Th>
                <Th align="center">Completeness</Th>
                <Th align="center">Evidence</Th>
                <Th>Date</Th>
                <Th align="center">Stage</Th>
                <Th align="center"></Th>
              </tr>
            </thead>
            <tbody>
              {p.rows.map((row) => (
                <PipelineRow key={row.submissionId} row={row} onOpen={() => onOpenCase?.(row.submissionId)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PipelineRow({ row, onOpen }) {
  const stageMeta = STAGE_TONE[row.currentStage] || STAGE_TONE.received
  return (
    <tr style={{ borderTop: `1px solid ${T.lineSoft}` }}>
      <td style={{ padding: "11px 10px", verticalAlign: "top" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{row.smeName || "—"}</div>
        <div style={{ fontSize: 11, color: T.muted }}>{row.smeId?.slice(0, 12)}…</div>
      </td>
      <td style={{ padding: "11px 10px", verticalAlign: "top", fontSize: 12.5, color: T.body, maxWidth: 220 }}>
        {row.opportunityName || "—"}
      </td>
      <td style={{ padding: "11px 10px", verticalAlign: "top", fontSize: 12, color: T.body }}>
        {row.instrumentId ? getInstrumentLabel(row.instrumentId) : "—"}
      </td>
      <td style={{ padding: "11px 10px", verticalAlign: "top", textAlign: "right", fontSize: 12.5, whiteSpace: "nowrap" }}>
        {row.requestedAmount
          ? `${row.currency || "ZAR"} ${Number(row.requestedAmount).toLocaleString("en-ZA")}`
          : "—"}
      </td>
      <td style={{ padding: "11px 10px", verticalAlign: "top", textAlign: "right", fontSize: 13, color: T.ink, fontWeight: 600 }}>
        {row.originalBigScore ?? "—"}
      </td>
      <td style={{ padding: "11px 10px", verticalAlign: "top", textAlign: "right" }}>
        <ScorePill value={row.adjustedBigScore} delta={row.adjustedDelta} />
      </td>
      <td style={{ padding: "11px 10px", verticalAlign: "top", textAlign: "center" }}>
        <EligibilityBadge status={row.eligibility} />
      </td>
      <td style={{ padding: "11px 10px", verticalAlign: "top", textAlign: "center" }}>
        <MatchFitBadge fit={row.matchFit} score={row.matchScore} />
      </td>
      <td style={{ padding: "11px 10px", verticalAlign: "top", textAlign: "center", fontSize: 12.5 }}>
        {typeof row.completeness === "number" ? `${Math.round(row.completeness * 100)}%` : "—"}
      </td>
      <td style={{ padding: "11px 10px", verticalAlign: "top", textAlign: "center", fontSize: 11.5, color: T.muted }}>
        {row.evidenceConfidence || "—"}
      </td>
      <td style={{ padding: "11px 10px", verticalAlign: "top", fontSize: 11.5, color: T.body, whiteSpace: "nowrap" }}>
        {row.submittedAt ? new Date(row.submittedAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
      </td>
      <td style={{ padding: "11px 10px", verticalAlign: "top", textAlign: "center" }}>
        <span style={{
          padding: "3px 10px", borderRadius: 999, fontSize: 10.5, fontWeight: 700,
          background: stageMeta.bg, color: stageMeta.color, textTransform: "uppercase", letterSpacing: 0.4,
          whiteSpace: "nowrap",
        }}>
          {STAGE_LABELS[row.currentStage] || row.currentStage || "—"}
        </span>
      </td>
      <td style={{ padding: "11px 10px", verticalAlign: "top", textAlign: "center" }}>
        <button onClick={onOpen} style={openBtn}>
          <Eye size={11} /> Open
        </button>
      </td>
    </tr>
  )
}

function Th({ children, align = "left" }) {
  return (
    <th style={{
      textAlign: align, padding: "10px 10px",
      fontSize: 10.5, fontWeight: 700, color: T.muted,
      letterSpacing: 0.5, textTransform: "uppercase",
      borderBottom: `1px solid ${T.line}`,
    }}>{children}</th>
  )
}

function StagePill({ active, onClick, label, count }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 12px", borderRadius: 999,
      border: `1.5px solid ${active ? T.accent : T.line}`,
      background: active ? T.accent : T.bg,
      color: active ? "#fff" : T.body,
      fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      {label} <span style={{ opacity: 0.7 }}>({count})</span>
    </button>
  )
}

const selectS = {
  padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.lineStrong}`,
  fontSize: 12.5, fontFamily: "inherit", background: T.bg, color: T.ink,
}
const openBtn = {
  padding: "6px 12px", borderRadius: 7,
  background: T.accentTint, color: T.accent, border: `1px solid ${T.lineStrong}`,
  fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", gap: 5,
}
const errorBox = {
  padding: "10px 14px", background: T.redBg, border: `1px solid ${T.red}33`,
  color: T.red, borderRadius: 9, fontSize: 12.5,
  display: "inline-flex", gap: 8, alignItems: "center",
}