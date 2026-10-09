"use client"

import { useState } from "react"
import { Loader2, AlertTriangle, ChevronLeft, Save, Send, CheckCircle2, Download } from "lucide-react"

import useOpportunityDialog from "../../hooks/useOpportunityDialog"
import useRuleVersionCheck from "../../hooks/useRuleVersionCheck"
import { T } from "../matching/Badges"
import TaskGroup from "./TaskGroup"
import RecipientPreview from "./RecipientPreview"
import RuleVersionBanner from "../RuleVersionBanner"

/**
 * The opportunity requirements dialog — Brief §5, p.47.
 *
 * Phase 7 additions:
 *   - Rule version banner when the funder republishes mid-draft.
 */

export default function OpportunityDialog({ requestId, opportunityId, onBack, onSubmitted }) {
  const d = useOpportunityDialog({ requestId, opportunityId })
  const [previewOpen, setPreviewOpen] = useState(false)

  // Phase 7 — rule version staleness
  const versionStatus = useRuleVersionCheck({
    requestId,
    opportunityId,
    draft: d.draft,
  })

  if (d.loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: T.muted }}>
        <Loader2 size={22} className="animate-spin" style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 13 }}>Loading opportunity requirements…</div>
      </div>
    )
  }

  if (d.error) {
    return (
      <div style={{ padding: 40, maxWidth: 700, margin: "0 auto" }}>
        <div style={errorBox}>
          <AlertTriangle size={14} /> {d.error}
        </div>
      </div>
    )
  }

  // ── Submitted state ──────────────────────────────────────────────────
  if (d.submitted) {
    return (
      <div style={{ padding: "40px 20px", maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <CheckCircle2 size={44} color={T.green} style={{ marginBottom: 12 }} />
        <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: T.accent }}>
          Submission complete
        </h1>
        <p style={{ margin: "0 0 20px", fontSize: 13.5, color: T.muted, lineHeight: 1.6 }}>
          Your package is frozen at version <b>{d.submitted.version ?? 1}</b> and identified by{" "}
          <code style={codeStyle}>{d.submitted.submissionId}</code>. The funder sees only this snapshot — later
          profile changes will not alter what was submitted.
        </p>

        <div style={{ display: "inline-flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => { onSubmitted?.(d.submitted); onBack?.() }}
            style={primaryBtn}
          >Back to matches</button>
          <button
            onClick={() => alert("PDF/ZIP download arrives in Phase 6.")}
            style={ghostBtn}
          >
            <Download size={13} /> Download PDF (Phase 6)
          </button>
        </div>
      </div>
    )
  }

  const r = d.requirements || {}

  const pathForRule = (task) => task.canonicalFieldPath || null

  const hasAnyTask =
    (r.ready?.length || 0) + (r.confirm?.length || 0) +
    (r.missingAnswer?.length || 0) + (r.missingEvidence?.length || 0) +
    (r.pendingValidation?.length || 0) + (r.recommended?.length || 0) > 0

  return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "20px 20px 40px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {onBack && (
          <button onClick={onBack} style={backBtnStyle}>
            <ChevronLeft size={15} /> Back
          </button>
        )}

        {/* Header */}
        <div style={{
          padding: "18px 20px", borderRadius: 12,
          background: T.panel, border: `1px solid ${T.lineSoft}`,
          marginBottom: 18,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Opportunity requirements
          </div>
          <h1 style={{ margin: "4px 0 6px", fontSize: 20, fontWeight: 700, color: T.accent, letterSpacing: -0.2 }}>
            {d.opportunity?.name || r.opportunityName || "Opportunity"}
          </h1>
          <div style={{ fontSize: 12.5, color: T.body, lineHeight: 1.6 }}>
            {d.firm?.name || "Funder"}
            {d.programme?.name && <> · {d.programme.name}</>}
            {d.request?.instrumentId && <> · {d.request.instrumentId.replace(/_/g, " ")}</>}
            {d.opportunity?.deadline && <> · deadline {fmtDate(d.opportunity.deadline)}</>}
            {r.ruleVersion && <> · rule version {r.ruleVersion}</>}
          </div>

          <div style={{
            display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12,
            padding: "10px 12px", background: T.bg, borderRadius: 9,
            border: `1px solid ${T.lineSoft}`,
          }}>
            <Stat label="Ready" value={d.counts.readyCount} color={T.green} />
            <Stat label="To confirm" value={d.counts.confirmNeeded} color={T.blue} />
            <Stat label="Required" value={d.counts.required} color={d.counts.required > 0 ? T.amber : T.green} />
            <Stat label="Optional" value={d.counts.optional} color={T.gray} />
            {d.counts.pendingCount > 0 && <Stat label="Pending" value={d.counts.pendingCount} color={T.blue} />}
          </div>
        </div>

        {/* Phase 7 — rule version banner */}
        <RuleVersionBanner
          status={versionStatus}
          onReview={() => { window.location.reload() }}
        />

        {/* Duplicate submission banner */}
        {d.liveSubmissions?.length > 0 && (
          <div style={{ ...errorBox, background: T.amberBg, borderColor: `${T.amber}33`, color: T.amber }}>
            <AlertTriangle size={14} />
            You already have an active submission to this opportunity. Submitting again will create a new version.
          </div>
        )}

        {/* Task groups */}
        {!hasAnyTask && (
          <div style={{
            padding: "32px 24px", borderRadius: 12, background: T.panel,
            border: `1px dashed ${T.lineStrong}`, textAlign: "center", color: T.muted, fontSize: 13,
          }}>
            This opportunity has no additional requirements beyond your generic application.
          </div>
        )}

        <TaskGroup
          title="Ready from your profile, application, or Vault"
          tone="ok"
          description="These are already satisfied. They will be included in the submission automatically."
          tasks={r.ready || []}
          draft={d.draft}
          pathForRule={pathForRule}
          onConfirm={d.confirmRule}
          onAnswer={d.setAnswer}
          onAttachEvidence={d.attachEvidence}
          onRequestWaiver={d.requestWaiver}
          onEditProfileField={d.editProfileField}
        />

        <TaskGroup
          title="Confirm current values"
          tone="confirm"
          description="These facts live in your Universal Profile. Confirm that they are still correct before submitting."
          tasks={r.confirm || []}
          draft={d.draft}
          pathForRule={pathForRule}
          onConfirm={d.confirmRule}
          onAnswer={d.setAnswer}
          onAttachEvidence={d.attachEvidence}
          onRequestWaiver={d.requestWaiver}
          onEditProfileField={d.editProfileField}
        />

        <TaskGroup
          title="Additional answers needed"
          tone="warn"
          description="These answers are specific to this opportunity. They do not change your profile or BIG Score."
          tasks={r.missingAnswer || []}
          draft={d.draft}
          pathForRule={pathForRule}
          onConfirm={d.confirmRule}
          onAnswer={d.setAnswer}
          onAttachEvidence={d.attachEvidence}
          onRequestWaiver={d.requestWaiver}
          onEditProfileField={d.editProfileField}
        />

        <TaskGroup
          title="Additional evidence needed"
          tone="warn"
          description="Upload the specific files this funder asks for. Vault items with matching type and freshness will be reused."
          tasks={r.missingEvidence || []}
          draft={d.draft}
          pathForRule={pathForRule}
          onConfirm={d.confirmRule}
          onAnswer={d.setAnswer}
          onAttachEvidence={d.attachEvidence}
          onRequestWaiver={d.requestWaiver}
          onEditProfileField={d.editProfileField}
        />

        <TaskGroup
          title="Pending validation"
          tone="info"
          description="Evidence you already uploaded that is awaiting the funder's check."
          tasks={r.pendingValidation || []}
          draft={d.draft}
          pathForRule={pathForRule}
          onConfirm={d.confirmRule}
          onAnswer={d.setAnswer}
          onAttachEvidence={d.attachEvidence}
          onRequestWaiver={d.requestWaiver}
          onEditProfileField={d.editProfileField}
        />

        <TaskGroup
          title="Recommended"
          tone="muted"
          description="Optional items that improve your match. They do not block submission."
          tasks={r.recommended || []}
          draft={d.draft}
          pathForRule={pathForRule}
          onConfirm={d.confirmRule}
          onAnswer={d.setAnswer}
          onAttachEvidence={d.attachEvidence}
          onRequestWaiver={d.requestWaiver}
          onEditProfileField={d.editProfileField}
        />

        {/* Footer actions */}
        <div style={{
          position: "sticky", bottom: 20, zIndex: 10,
          marginTop: 24, padding: "12px 16px",
          background: T.bg, border: `1px solid ${T.line}`,
          borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap",
        }}>
          <div style={{ fontSize: 11.5, color: d.dirty || d.saving ? T.amber : T.green, fontWeight: 600 }}>
            {d.saving ? "Saving draft…" : d.dirty ? "Unsaved changes" : "Draft saved"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPreviewOpen(true)} disabled={d.submitting} style={ghostBtn}>
              <Save size={13} /> Save for later
            </button>
            <button onClick={() => setPreviewOpen(true)} disabled={d.submitting} style={primaryBtn}>
              <Send size={13} /> Submit to funder
            </button>
          </div>
        </div>
      </div>

      {previewOpen && (
        <RecipientPreview
          firm={d.firm}
          programme={d.programme}
          opportunity={d.opportunity}
          request={d.request}
          requirements={d.requirements}
          resolutions={d.resolutions}
          liveSubmissions={d.liveSubmissions}
          submitting={d.submitting}
          onClose={() => setPreviewOpen(false)}
          onSubmit={async () => {
            const res = await d.submit()
            setPreviewOpen(false)
            return res
          }}
        />
      )}
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span style={{ fontSize: 16, fontWeight: 800, color: color || T.ink }}>{value}</span>
      <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{label}</span>
    </div>
  )
}

const backBtnStyle = {
  display: "inline-flex", alignItems: "center", gap: 6,
  background: "none", border: "none", padding: "6px 0",
  color: T.accentSoft, cursor: "pointer", fontFamily: "inherit",
  fontSize: 13, fontWeight: 500, marginBottom: 10,
}
const primaryBtn = {
  padding: "10px 18px", borderRadius: 9,
  background: T.accent, color: "#fff", border: `1px solid ${T.accent}`,
  fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
}
const ghostBtn = {
  padding: "10px 18px", borderRadius: 9,
  background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}`,
  fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
}
const errorBox = {
  marginBottom: 14, padding: "10px 14px",
  background: T.redBg, border: `1px solid ${T.red}33`, color: T.red,
  borderRadius: 9, fontSize: 12.5,
  display: "flex", gap: 8, alignItems: "flex-start",
}
const codeStyle = {
  fontSize: 11.5, background: T.raised, padding: "2px 8px", borderRadius: 4,
  fontFamily: "ui-monospace, monospace",
}
function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) }
  catch { return iso }
}