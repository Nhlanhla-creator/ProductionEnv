"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Loader2, AlertTriangle, ArrowUpDown, Filter, ExternalLink,
  Eye, Sparkles, Calendar, HelpCircle, ChevronLeft,
} from "lucide-react"

import { getMatches } from "../../services/apiClient"
import { loadRequest } from "../../services/fundingRequestService"
import { getInstrumentLabel } from "../../models/instruments"

import ScoreBridgeModal from "./ScoreBridgeModal"
import EligibilityPanel from "./EligibilityPanel"
import { EligibilityBadge, MatchFitBadge, ScorePill, T } from "./Badges"

/**
 * SME matching table — Brief §5, p.46.
 *
 * Columns: investor + opportunity, instrument, ticket, deadline,
 *          Original BIG Score, Adjusted BIG Score (+delta),
 *          Eligibility, Match Score, task counts, actions.
 *
 * Actions: "Why this score?" (bridge modal), "View rationale" (eligibility panel),
 *          "View requirements" / "Apply" (Phase 5).
 */

const SORT_FIELDS = [
  { id: "adjustedBigScore", label: "Adjusted BIG Score" },
  { id: "matchScore",       label: "Match Score" },
  { id: "deadline",         label: "Deadline" },
  { id: "mandatoryTasks",   label: "Tasks remaining" },
]

const ELIGIBILITY_FILTERS = ["all", "eligible", "provisional", "ineligible"]

export default function MatchingPage({ requestId, onBack, onApply }) {
  const [matches, setMatches] = useState(null)
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [sortField, setSortField] = useState("adjustedBigScore")
  const [sortDir, setSortDir] = useState("desc")
  const [eligibilityFilter, setEligibilityFilter] = useState("all")

  const [bridgeScoreId, setBridgeScoreId] = useState(null)
  const [eligibilityRow, setEligibilityRow] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [m, r] = await Promise.all([
          getMatches(requestId),
          loadRequest(requestId).catch(() => null),
        ])
        if (!cancelled) {
          setMatches(m)
          setRequest(r)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [requestId])

  const rows = useMemo(() => {
    if (!matches?.rows) return []
    let r = [...matches.rows]
    if (eligibilityFilter !== "all") r = r.filter((x) => x.eligibility === eligibilityFilter)
    r.sort((a, b) => {
      const av = a[sortField] ?? 0
      const bv = b[sortField] ?? 0
      if (av === bv) return 0
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
    return r
  }, [matches, sortField, sortDir, eligibilityFilter])

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortField(field); setSortDir("desc") }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: T.muted }}>
        <Loader2 size={22} className="animate-spin" style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 13 }}>Matching opportunities…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <div style={errorBoxStyle}>
          <AlertTriangle size={14} /> {error}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: 1200, margin: "0 auto" }}>
      {onBack && (
        <button onClick={onBack} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "none", border: "none", padding: "6px 0",
          color: T.accentSoft, cursor: "pointer", fontFamily: "inherit",
          fontSize: 13, fontWeight: 500, marginBottom: 10,
        }}>
          <ChevronLeft size={15} /> Back to request
        </button>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: T.accent, letterSpacing: -0.3 }}>
            Matching opportunities
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: T.muted }}>
            {request?.purpose ? `For: ${request.purpose.replace(/_/g, " ")} · ` : ""}
            {request?.requestedAmount ? `${request.currency || "ZAR"} ${Number(request.requestedAmount).toLocaleString("en-ZA")} · ` : ""}
            {rows.length} live {rows.length === 1 ? "opportunity" : "opportunities"}
          </p>
        </div>

        {matches?.originalBigScore != null && (
          <div style={{
            padding: "10px 18px", background: T.accentTint, borderRadius: 10,
            border: `1px solid ${T.accent}22`, textAlign: "center",
          }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Original BIG Score
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: T.accent, lineHeight: 1.1 }}>
              {matches.originalBigScore}
            </div>
            <div style={{ fontSize: 10.5, color: T.muted, marginTop: 2 }}>same in every row</div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: 12, flexWrap: "wrap", marginBottom: 12,
      }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <Filter size={13} color={T.muted} />
          {ELIGIBILITY_FILTERS.map((f) => {
            const active = eligibilityFilter === f
            return (
              <button key={f} onClick={() => setEligibilityFilter(f)} style={{
                padding: "5px 12px", borderRadius: 999,
                border: `1.5px solid ${active ? T.accent : T.line}`,
                background: active ? T.accent : T.bg,
                color: active ? "#fff" : T.body,
                fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                textTransform: "capitalize",
              }}>{f === "all" ? "All eligibility" : f}</button>
            )
          })}
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <ArrowUpDown size={13} color={T.muted} />
          {SORT_FIELDS.map((sf) => {
            const active = sortField === sf.id
            return (
              <button key={sf.id} onClick={() => toggleSort(sf.id)} style={{
                padding: "5px 12px", borderRadius: 999,
                border: `1.5px solid ${active ? T.accent : T.line}`,
                background: active ? T.accent : T.bg,
                color: active ? "#fff" : T.body,
                fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
                {sf.label}{active ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
              </button>
            )
          })}
        </div>
      </div>

      {/* Empty */}
      {rows.length === 0 && (
        <div style={{
          padding: "40px 24px", background: T.panel, borderRadius: 12,
          border: `1px dashed ${T.lineStrong}`, textAlign: "center", color: T.muted,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.body, marginBottom: 4 }}>
            No opportunities match your filters
          </div>
          <div style={{ fontSize: 12.5 }}>
            {eligibilityFilter !== "all"
              ? "Try changing the eligibility filter."
              : "New opportunities will appear here as funders publish them."}
          </div>
        </div>
      )}

      {/* Table */}
      {rows.length > 0 && (
        <div style={{ overflowX: "auto", border: `1px solid ${T.line}`, borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 980 }}>
            <thead>
              <tr style={{ background: T.panel }}>
                <Th>Opportunity</Th>
                <Th>Instrument</Th>
                <Th>Ticket</Th>
                <Th>Deadline</Th>
                <Th align="right">Original</Th>
                <Th align="right">Adjusted</Th>
                <Th align="center">Eligibility</Th>
                <Th align="center">Match</Th>
                <Th align="center">Tasks</Th>
                <Th align="center">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Row
                  key={r.opportunityId}
                  row={r}
                  onOpenBridge={() => setBridgeScoreId(r.scoreId)}
                  onOpenEligibility={() => setEligibilityRow(r)}
                  onApply={() => onApply?.(r.opportunityId)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {bridgeScoreId && (
        <ScoreBridgeModal scoreId={bridgeScoreId} onClose={() => setBridgeScoreId(null)} />
      )}
      {eligibilityRow && (
        <EligibilityPanel row={eligibilityRow} onClose={() => setEligibilityRow(null)} />
      )}
    </div>
  )
}

// ── Row ──────────────────────────────────────────────────────────────────
function Row({ row, onOpenBridge, onOpenEligibility, onApply }) {
  const daysLeft = row.deadline ? daysUntil(row.deadline) : null
  const deadlineColor = daysLeft == null ? T.muted : daysLeft < 14 ? T.red : daysLeft < 45 ? T.amber : T.green

  return (
    <tr style={{ borderTop: `1px solid ${T.lineSoft}` }}>
      <td style={{ padding: "12px 10px", verticalAlign: "top", minWidth: 240 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, lineHeight: 1.35 }}>
          {row.opportunityName}
        </div>
        <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>
          {row.investorName}
          {row.programmeName && <> · {row.programmeName}</>}
        </div>
        <button onClick={onOpenEligibility} style={linkBtnStyle}>
          <HelpCircle size={11} /> Why does this fit?
        </button>
      </td>

      <td style={{ padding: "12px 10px", verticalAlign: "top", fontSize: 12, color: T.body }}>
        {row.instrument ? getInstrumentLabel(row.instrument) : "—"}
      </td>

      <td style={{ padding: "12px 10px", verticalAlign: "top", fontSize: 12, color: T.body, whiteSpace: "nowrap" }}>
        {row.ticketMin != null && row.ticketMax != null
          ? `${row.currency || "ZAR"} ${compactNumber(row.ticketMin)} – ${compactNumber(row.ticketMax)}`
          : "—"}
      </td>

      <td style={{ padding: "12px 10px", verticalAlign: "top", fontSize: 12 }}>
        {row.deadline ? (
          <>
            <div style={{ color: T.ink, fontWeight: 600 }}>
              <Calendar size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
              {fmtDate(row.deadline)}
            </div>
            <div style={{ fontSize: 11, color: deadlineColor, marginTop: 2 }}>
              {daysLeft >= 0 ? `${daysLeft} days left` : "closed"}
            </div>
          </>
        ) : "—"}
      </td>

      <td style={{ padding: "12px 10px", verticalAlign: "top", textAlign: "right", fontSize: 13 }}>
        <span style={{ color: T.ink, fontWeight: 600 }}>{row.originalBigScore ?? "—"}</span>
        <div style={{ fontSize: 10.5, color: T.muted, marginTop: 2 }}>same in all rows</div>
      </td>

      <td style={{ padding: "12px 10px", verticalAlign: "top", textAlign: "right" }}>
        <ScorePill value={row.adjustedBigScore} delta={row.adjustedDelta} />
        <button onClick={onOpenBridge} style={linkBtnStyle}>
          <Sparkles size={11} /> Why this score?
        </button>
      </td>

      <td style={{ padding: "12px 10px", verticalAlign: "top", textAlign: "center" }}>
        <EligibilityBadge status={row.eligibility} onExplain={onOpenEligibility} />
      </td>

      <td style={{ padding: "12px 10px", verticalAlign: "top", textAlign: "center" }}>
        <MatchFitBadge fit={row.matchFit} score={row.matchScore} onExplain={onOpenEligibility} />
      </td>

      <td style={{ padding: "12px 10px", verticalAlign: "top", textAlign: "center", fontSize: 11.5 }}>
        {row.mandatoryTasks > 0 ? (
          <div style={{ color: T.amber, fontWeight: 700 }}>
            {row.mandatoryTasks} required
          </div>
        ) : (
          <div style={{ color: T.green, fontWeight: 600 }}>Ready</div>
        )}
        {row.recommendedTasks > 0 && (
          <div style={{ color: T.muted, marginTop: 2 }}>{row.recommendedTasks} optional</div>
        )}
      </td>

      <td style={{ padding: "12px 10px", verticalAlign: "top", textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "stretch" }}>
          <button onClick={onOpenEligibility} style={ghostBtnStyle}>
            <Eye size={11} /> Requirements
          </button>
          <button
            onClick={onApply}
            disabled={row.eligibility === "ineligible"}
            title={row.eligibility === "ineligible" ? "Cannot apply — hard eligibility failed" : undefined}
            style={{
              ...primaryBtnStyle,
              opacity: row.eligibility === "ineligible" ? 0.45 : 1,
              cursor: row.eligibility === "ineligible" ? "not-allowed" : "pointer",
            }}
          >
            Apply <ExternalLink size={11} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Small components ─────────────────────────────────────────────────────
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

// ── Styles ───────────────────────────────────────────────────────────────
const linkBtnStyle = {
  display: "inline-flex", alignItems: "center", gap: 4,
  padding: 0, marginTop: 6, background: "none", border: "none",
  color: T.accentSoft, fontSize: 11.5, fontWeight: 600,
  cursor: "pointer", fontFamily: "inherit",
}
const ghostBtnStyle = {
  padding: "6px 10px", borderRadius: 7,
  border: `1px solid ${T.lineStrong}`, background: T.bg, color: T.body,
  fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
}
const primaryBtnStyle = {
  padding: "6px 10px", borderRadius: 7,
  border: `1px solid ${T.accent}`, background: T.accent, color: "#fff",
  fontSize: 11.5, fontWeight: 600, fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
}
const errorBoxStyle = {
  padding: "10px 14px", background: T.redBg, border: `1px solid ${T.red}33`,
  color: T.red, borderRadius: 9, fontSize: 12.5,
  display: "inline-flex", gap: 8, alignItems: "center",
}

// ── Utilities ────────────────────────────────────────────────────────────
function compactNumber(n) {
  const v = Number(n) || 0
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 0)}k`
  return String(v)
}
function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })
  } catch { return iso }
}
function daysUntil(iso) {
  try {
    const d = new Date(iso).getTime() - Date.now()
    return Math.ceil(d / (1000 * 60 * 60 * 24))
  } catch { return null }
}