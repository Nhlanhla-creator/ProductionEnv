"use client"

import { useEffect, useState } from "react"
import { Loader2, AlertTriangle, ChevronLeft, Sparkles, User, Building2 } from "lucide-react"
import { T } from "../matching/Badges"
import ScoreBridgeModal from "../matching/ScoreBridgeModal"
import DownloadBar from "../shared/DownloadBar"
import EvidenceViewer from "../shared/EvidenceViewer"
import RevisionHistory from "../RevisionHistory"
import {
  loadSubmission, getEvidenceIndex,
} from "../../services/submissionReader"
import { getInstrumentLabel } from "../../models/instruments"

/**
 * Full submission case view — Brief §4, p.44.
 *
 * Phase 7 additions:
 *   - Revision history panel showing every version in the chain.
 */

export default function InvestorCaseView({ submissionId, onBack }) {
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [bridgeOpen, setBridgeOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const s = await loadSubmission(submissionId)
        if (!cancelled) setSub(s)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [submissionId])

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: T.muted }}>
        <Loader2 size={22} className="animate-spin" />
      </div>
    )
  }

  if (error || !sub) {
    return (
      <div style={{ padding: 40, maxWidth: 700, margin: "0 auto" }}>
        <div style={errorBox}>
          <AlertTriangle size={14} /> {error || "Submission not found."}
        </div>
        {onBack && (
          <button onClick={onBack} style={{ marginTop: 14, ...ghostBtn }}>
            <ChevronLeft size={13} /> Back to submissions
          </button>
        )}
      </div>
    )
  }

  const evidence = getEvidenceIndex(sub)
  const restrictedCount = evidence.filter((e) => e.status === "restricted").length

  const generic = sub.genericApplication || {}
  const uses = generic.usesOfFunds || []
  const outcomes = generic.outcomes || []
  const supplement = sub.supplementAnswers || {}
  const declarations = sub.declarations || []
  const consent = sub.consent || {}

  return (
    <div style={{ padding: "20px 20px 40px", maxWidth: 1100, margin: "0 auto" }}>
      {onBack && (
        <button onClick={onBack} style={backBtn}>
          <ChevronLeft size={15} /> Back to submissions
        </button>
      )}

      {/* Header */}
      <div style={{
        padding: "18px 20px", borderRadius: 12,
        background: T.panel, border: `1px solid ${T.lineSoft}`, marginBottom: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Submission case
            </div>
            <h1 style={{ margin: "4px 0 4px", fontSize: 20, fontWeight: 700, color: T.accent, letterSpacing: -0.2 }}>
              {sub.smeName || "SME submission"}
            </h1>
            <div style={{ fontSize: 12.5, color: T.body }}>
              {sub.opportunityName || "—"}
              {sub.instrumentId && <> · {getInstrumentLabel(sub.instrumentId)}</>}
              {sub.requestedAmount && <> · {sub.currency || "ZAR"} {Number(sub.requestedAmount).toLocaleString("en-ZA")}</>}
            </div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 4 }}>
              <code style={codeStyle}>{sub.submissionId}</code> · version {sub.version ?? 1} · frozen {fmt(sub.frozenAt || sub.submittedAt)}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {sub.originalBigScore != null && (
              <ScoreChip label="Original" value={sub.originalBigScore} />
            )}
            {sub.adjustedBigScore != null && (
              <ScoreChip label="Adjusted" value={sub.adjustedBigScore} delta={sub.adjustedDelta} highlight />
            )}
            {sub.scoreId && (
              <button onClick={() => setBridgeOpen(true)} style={ghostBtn}>
                <Sparkles size={12} /> Why this score?
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Download bar */}
      <div style={{ marginBottom: 16 }}>
        <DownloadBar
          submissionId={sub.submissionId}
          version={sub.version}
          variant="investor"
          canZip={true}
          evidence={evidence}
          restrictedCount={restrictedCount}
        />
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Left: application */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Section title="Entity and contact">
            <KV label="SME ID" value={sub.smeId} mono />
            <KV label="Opportunity" value={sub.opportunityName} />
            <KV label="Programme" value={sub.programmeId} mono />
          </Section>

          <Section title="Funding need">
            <KV label="Purpose" value={generic.purpose?.replace(/_/g, " ")} />
            <KV label="Sub-purpose" value={generic.subpurpose} />
            <KV
              label="Requested amount"
              value={generic.requestedAmount
                ? `${generic.currency || "ZAR"} ${Number(generic.requestedAmount).toLocaleString("en-ZA")}`
                : null}
            />
            <KV label="Needed by" value={generic.neededBy} />
            <KV label="Delivery timing" value={generic.deliveryTiming} />
            <KV label="SME contribution" value={fmtMoney(generic.contribution, generic.currency)} />
          </Section>

          <Section title="Uses of funds">
            {uses.length === 0 ? (
              <Empty>No uses of funds recorded.</Empty>
            ) : (
              <Table
                cols={["Description", "Amount"]}
                rows={uses.map((u) => [u.label || "—", fmtMoney(u.amount, generic.currency)])}
              />
            )}
          </Section>

          <Section title="Terms and security">
            <KV label="Instrument" value={getInstrumentLabel(generic.instrumentId)} />
            <KV label="Preferred provider" value={generic.preferredProvider} />
            {generic.termsAnswers && Object.entries(generic.termsAnswers).map(([k, v]) =>
              v ? <KV key={k} label={labelFor(k)} value={String(v)} /> : null
            )}
            {(generic.securityRights || []).length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Subhead>Security rights offered</Subhead>
                <Table
                  cols={["Type", "Counterparty", "Value"]}
                  rows={generic.securityRights.map((s) => [s.type || "—", s.counterparty || "—", fmtMoney(s.value, generic.currency)])}
                />
              </div>
            )}
          </Section>

          <Section title="Outcomes">
            {outcomes.length === 0 ? (
              <Empty>No outcomes recorded.</Empty>
            ) : (
              <Table
                cols={["Metric", "Baseline", "Target", "Unit"]}
                rows={outcomes.map((o) => [o.metric || "—", o.baseline || "—", o.target || "—", o.unit || "—"])}
              />
            )}
          </Section>
        </div>

        {/* Right: supplement + evidence + audit */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Section title="Opportunity supplement (this funder only)">
            {Object.keys(supplement).length === 0 ? (
              <Empty>No additional answers were required.</Empty>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {Object.entries(supplement).map(([k, v]) => (
                  <KV key={k} label={k} value={String(v)} />
                ))}
              </div>
            )}
          </Section>

          <Section title="Evidence index">
            <EvidenceViewer items={evidence} />
          </Section>

          <Section title="Declarations and consent">
            {declarations.map((d) => (
              <KV key={d.id} label={d.label} value={d.accepted ? "Accepted" : "Not accepted"} />
            ))}
            {consent?.acceptedAt && (
              <KV label="Consent recorded" value={fmt(consent.acceptedAt)} />
            )}
            {sub.submissionRoute && (
              <KV label="Submission route" value={sub.submissionRoute} />
            )}
          </Section>

          <Section title="Provenance">
            <KV label="Methodology" value={sub.scoreRefs?.methodology} />
            <KV label="Rule registry version" value={sub.scoreRefs?.ruleRegistryVersion} />
            <KV label="Scoring profile" value={sub.scoreRefs?.scoringProfileId} mono />
            <KV label="Frozen at" value={fmt(sub.frozenAt)} />
            <KV label="Frozen by" value={sub.frozenBy} mono />
          </Section>

          {/* Phase 7 — revision history */}
          <Section title="Revision history">
            <RevisionHistory
              chainId={sub.chainId}
              currentSubmissionId={sub.submissionId}
              onOpenVersion={(id) => {
                window.location.href = `/investor-submissions/${id}`
              }}
            />
          </Section>
        </div>
      </div>

      {bridgeOpen && sub.scoreId && (
        <ScoreBridgeModal scoreId={sub.scoreId} onClose={() => setBridgeOpen(false)} />
      )}
    </div>
  )
}

// ── Small helpers ────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{
      padding: "14px 16px", background: T.bg, borderRadius: 11,
      border: `1px solid ${T.lineSoft}`,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: T.muted,
        textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10,
      }}>{title}</div>
      {children}
    </div>
  )
}

function KV({ label, value, mono = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "4px 0", fontSize: 12.5 }}>
      <span style={{ color: T.muted, flexShrink: 0 }}>{label}</span>
      <span style={{
        color: T.ink, fontWeight: 500, textAlign: "right",
        wordBreak: "break-word",
        fontFamily: mono ? "ui-monospace, monospace" : "inherit",
        fontSize: mono ? 11.5 : 12.5,
      }}>{value || "—"}</span>
    </div>
  )
}

function Subhead({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 6 }}>{children}</div>
}

function Table({ cols, rows }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
      <thead>
        <tr>
          {cols.map((c, i) => (
            <th key={i} style={{
              textAlign: i === cols.length - 1 && c.toLowerCase().includes("amount") ? "right" : "left",
              padding: "4px 6px 6px 0",
              fontSize: 10.5, fontWeight: 700, color: T.muted,
              textTransform: "uppercase", letterSpacing: 0.4,
            }}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderTop: `1px solid ${T.lineSoft}` }}>
            {r.map((cell, j) => (
              <td key={j} style={{
                padding: "5px 6px 5px 0",
                textAlign: j === cols.length - 1 && cols[j].toLowerCase().includes("amount") ? "right" : "left",
                color: T.ink,
              }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Empty({ children }) {
  return (
    <div style={{
      padding: "12px 14px", background: T.panel, borderRadius: 8,
      fontSize: 12, color: T.muted, fontStyle: "italic",
    }}>{children}</div>
  )
}

function ScoreChip({ label, value, delta, highlight }) {
  return (
    <div style={{
      padding: "6px 12px", borderRadius: 9,
      background: highlight ? T.accentTint : T.bg,
      border: `1px solid ${T.lineSoft}`,
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: T.muted, letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.accent, lineHeight: 1.1 }}>
        {value}
        {typeof delta === "number" && delta !== 0 && (
          <span style={{ fontSize: 11, color: delta > 0 ? T.green : T.red, marginLeft: 6, fontWeight: 700 }}>
            {delta > 0 ? "+" : ""}{delta}
          </span>
        )}
      </div>
    </div>
  )
}

const backBtn = {
  display: "inline-flex", alignItems: "center", gap: 6,
  background: "none", border: "none", padding: "6px 0",
  color: T.accentSoft, cursor: "pointer", fontFamily: "inherit",
  fontSize: 13, fontWeight: 500, marginBottom: 10,
}
const ghostBtn = {
  padding: "8px 14px", borderRadius: 8,
  background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}`,
  fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 5,
}
const errorBox = {
  padding: "10px 14px", background: T.redBg, border: `1px solid ${T.red}33`,
  color: T.red, borderRadius: 9, fontSize: 12.5,
  display: "flex", gap: 8, alignItems: "flex-start",
}
const codeStyle = {
  fontSize: 11, background: T.raised, padding: "1px 6px", borderRadius: 4,
  fontFamily: "ui-monospace, monospace",
}

function fmt(iso) {
  if (!iso) return "—"
  try { return new Date(iso).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }) }
  catch { return iso }
}
function fmtMoney(v, currency = "ZAR") {
  if (v == null || v === "") return "—"
  return `${currency || "ZAR"} ${Number(v).toLocaleString("en-ZA")}`
}
function labelFor(k) {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())
}