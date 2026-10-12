"use client"

import { useState } from "react"
import {
  X, ShieldCheck, AlertTriangle, Download, FileText,
  CheckCircle2, Loader2, Info,
} from "lucide-react"
import { T } from "../matching/Badges"

/**
 * Recipient-specific preview — Brief §5, p.49.
 *
 * Before Submit, show exactly what the funder receives:
 *   - all fields/documents to be shared
 *   - withheld restricted Vault items
 *   - mandatory task check summary
 *   - deadline, declarations, duplicate submission check
 *   - opportunity-specific consent
 *
 * Optional tasks do not block. Waivers must name approver, scope, reason.
 */

export default function RecipientPreview({
  firm, programme, opportunity, request,
  requirements, resolutions, liveSubmissions,
  onClose, onSubmit, submitting,
}) {
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState(null)

  const counts = {
    mandatoryOpen:
      (requirements?.missingAnswer?.filter((t) => !resolutions?.[t.ruleId]?.answer).length || 0) +
      (requirements?.missingEvidence?.filter((t) => !resolutions?.[t.ruleId]?.evidenceRef).length || 0),
    confirmOpen:
      (requirements?.confirm?.filter((t) => !resolutions?.[t.ruleId]?.confirmed).length || 0),
    readyCount: requirements?.ready?.length || 0,
  }

  const blockers = counts.mandatoryOpen + counts.confirmOpen
  const duplicate = liveSubmissions?.length > 0

  const handleSubmit = async () => {
    if (!consent) { setError("Please tick the consent box to proceed."); return }
    if (blockers > 0) { setError("Resolve the outstanding mandatory tasks before submitting."); return }
    if (duplicate) { setError("An active submission already exists for this opportunity."); return }
    try {
      await onSubmit()
    } catch (e) {
      setError(e.message || "Submission failed.")
    }
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={modal}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.accent }}>
              Review what {firm?.name || "the funder"} will receive
            </h2>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
              {firm?.name} · {programme?.name} · {opportunity?.name}
              {opportunity?.deadline && <> · deadline {fmtDate(opportunity.deadline)}</>}
            </div>
          </div>
          <button onClick={onClose} style={iconBtn}><X size={20} /></button>
        </div>

        {error && (
          <div style={errorBox}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* Mandatory check */}
        <Section title="Mandatory task check">
          <div style={{
            padding: "10px 12px", borderRadius: 9,
            background: blockers === 0 ? T.greenBg : T.redBg,
            color: blockers === 0 ? T.green : T.red,
            fontSize: 12.5, display: "flex", alignItems: "center", gap: 8,
          }}>
            {blockers === 0 ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            {blockers === 0
              ? "All mandatory tasks are satisfied."
              : `${blockers} mandatory task${blockers === 1 ? "" : "s"} still open.`}
          </div>
          {counts.readyCount > 0 && (
            <div style={{ marginTop: 8, fontSize: 11.5, color: T.muted }}>
              {counts.readyCount} item{counts.readyCount === 1 ? "" : "s"} resolved automatically from your profile, application, or Vault.
            </div>
          )}
        </Section>

        {/* Duplicate check */}
        {duplicate && (
          <Section title="Duplicate submission">
            <div style={{
              padding: "10px 12px", borderRadius: 9,
              background: T.amberBg, color: T.amber, fontSize: 12.5,
              display: "flex", gap: 8, alignItems: "flex-start",
            }}>
              <AlertTriangle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                You already have an active submission to this opportunity.
                A revision will create a new version while retaining the prior submission.
              </div>
            </div>
          </Section>
        )}

        {/* What's shared */}
        <Section title="Fields and documents to be shared">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <PreviewRow label="Entity and contact" value="From your Universal Profile" />
            <PreviewRow
              label="Funding need"
              value={request?.purpose
                ? `${request.purpose.replace(/_/g, " ")} · ${request.currency || "ZAR"} ${Number(request.requestedAmount || 0).toLocaleString("en-ZA")}`
                : "—"}
            />
            <PreviewRow label="Funding route" value={request?.instrumentId || "To be assessed"} />
            <PreviewRow label="Uses of funds" value={`${request?.usesOfFunds?.length || 0} line${request?.usesOfFunds?.length === 1 ? "" : "s"}`} />
            <PreviewRow label="Additional answers" value={`${Object.keys(resolutions || {}).filter((k) => resolutions[k].answer !== undefined).length} captured`} />
            <PreviewRow label="Evidence references" value={`${Object.keys(resolutions || {}).filter((k) => resolutions[k].evidenceRef).length} attached`} />
            <PreviewRow label="Original BIG Score" value="Included with methodology and calculation IDs" />
            <PreviewRow label="Adjusted BIG Score" value="Includes Fundability and approved investor weights" />
          </div>
        </Section>

        {/* Withheld items */}
        <Section title="Withheld from this funder">
          <div style={{
            padding: "10px 12px", borderRadius: 9,
            background: T.panel, border: `1px dashed ${T.line}`, fontSize: 12, color: T.muted,
          }}>
            Restricted Vault items that do not match this opportunity's consent scope are automatically excluded
            from the package and from any ZIP download.
          </div>
        </Section>

        {/* Declarations + consent */}
        <Section title="Declarations and consent">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Decl label="Information in this submission is accurate." />
            <Decl label={`Share this package with ${firm?.name || "the funder"}.`} />
          </div>

          <label style={{
            display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer",
            marginTop: 14, padding: "12px 14px",
            background: T.accentTint, borderRadius: 9,
            border: `1px solid ${T.accent}22`,
          }}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>
                I give consent for {firm?.name || "this funder"} to receive this submission package.
              </div>
              <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3, lineHeight: 1.5 }}>
                This consent applies only to <b>{opportunity?.name}</b>. Access is restricted to this funder's
                authorised reviewers. Evidence with restricted scope will not be included.
              </div>
            </div>
          </label>
        </Section>

        {/* Info banner */}
        <div style={{
          marginTop: 12, padding: "10px 12px", background: T.blueBg,
          borderRadius: 9, fontSize: 11.5, color: T.blue,
          display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <Info size={13} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            Submission is distinct from the funder's diligence or approval. You can download the submitted PDF and
            the authorised ZIP from your applications list once the package is frozen.
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={ghostBtn} disabled={submitting}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || blockers > 0 || !consent || duplicate}
            style={{
              ...primaryBtn,
              opacity: (submitting || blockers > 0 || !consent || duplicate) ? 0.5 : 1,
              cursor: (submitting || blockers > 0 || !consent || duplicate) ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
            {submitting ? "Freezing submission…" : "Confirm & submit"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Small pieces ────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function PreviewRow({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", gap: 12,
      padding: "7px 0", borderBottom: `1px solid ${T.lineSoft}`, fontSize: 12.5,
    }}>
      <span style={{ color: T.muted }}>{label}</span>
      <span style={{ color: T.ink, fontWeight: 500, textAlign: "right" }}>{value || "—"}</span>
    </div>
  )
}

function Decl({ label }) {
  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "center",
      fontSize: 12.5, color: T.body,
    }}>
      <CheckCircle2 size={13} color={T.green} />
      {label}
    </div>
  )
}

// ── Style tokens ────────────────────────────────────────────────────────
const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 210, padding: 20,
}
const modal = {
  background: T.bg, borderRadius: 14,
  maxWidth: 720, width: "100%", maxHeight: "90vh", overflowY: "auto",
  padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
}
const iconBtn = { background: "none", border: "none", cursor: "pointer", color: T.muted }
const errorBox = {
  marginBottom: 14, padding: "10px 14px",
  background: T.redBg, border: `1px solid ${T.red}33`, color: T.red,
  borderRadius: 9, fontSize: 12.5,
  display: "flex", gap: 8, alignItems: "flex-start",
}
const primaryBtn = {
  padding: "10px 20px", borderRadius: 9,
  background: T.accent, color: "#fff", border: `1px solid ${T.accent}`,
  fontSize: 13.5, fontWeight: 700, fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", gap: 6,
}
const ghostBtn = {
  padding: "10px 18px", borderRadius: 9,
  background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}`,
  fontSize: 13.5, fontWeight: 500, fontFamily: "inherit", cursor: "pointer",
}

// ── Utils ────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) }
  catch { return iso }
}