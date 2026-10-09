"use client"

import { useState } from "react"
import {
  CheckCircle2, AlertCircle, FileText, HelpCircle, Clock,
  Upload, Pencil, Loader2, Paperclip, ExternalLink,
} from "lucide-react"
import { T } from "../matching/Badges"

/**
 * One requirement row — Brief §5, p.47.
 * "Each row shows why needed, required status, acceptable file/period,
 *  current source/status and one action."
 */

const STATE_META = {
  ready:              { Icon: CheckCircle2, color: T.green, label: "Ready" },
  confirm:            { Icon: HelpCircle,   color: T.blue,  label: "Confirm" },
  missing_answer:     { Icon: AlertCircle,  color: T.amber, label: "Answer needed" },
  missing_evidence:   { Icon: FileText,     color: T.amber, label: "Evidence needed" },
  pending_validation: { Icon: Clock,        color: T.blue,  label: "Awaiting check" },
  optional:           { Icon: HelpCircle,   color: T.gray,  label: "Recommended" },
}

export default function TaskRow({
  task,                     // raw fixture task: { ruleId, label, state, source, reason, currentValue, acceptedTypes }
  draft,                    // supplement draft
  onConfirm,                // (ruleId) => void
  onAnswer,                 // (ruleId, value) => void
  onAttachEvidence,         // (ruleId, evidenceRef) => void
  onRequestWaiver,          // (ruleId, {reason, scope}) => void
  onEditProfileField,       // (fieldPath, value) => Promise<void>
  fieldPath,                // optional — if the rule resolves to a profile path
  required = true,
  waivable = false,
}) {
  const meta = STATE_META[task.state] || STATE_META.missing_answer
  const { Icon } = meta

  const confirmed = !!draft?.confirmations?.[task.ruleId]
  const answered = draft?.answers?.[task.ruleId]
  const evidence = draft?.evidenceRefs?.[task.ruleId]
  const waiver = draft?.waiverRequests?.[task.ruleId]

  // Local edit modes
  const [editing, setEditing] = useState(false)
  const [draftValue, setDraftValue] = useState(answered ?? "")

  // Determine which "one action" to show
  const showConfirm    = task.state === "confirm" && !confirmed
  const showAnswer     = task.state === "missing_answer" && !answered
  const showUpload     = task.state === "missing_evidence" && !evidence
  const showEditProfile = task.state === "missing_answer" && !!fieldPath && !answered
  const showReady      = task.state === "ready" || confirmed || answered || evidence
  const showPending    = task.state === "pending_validation"
  const showOptional   = task.state === "optional"

  return (
    <div style={{
      padding: "12px 14px", background: T.bg,
      border: `1px solid ${T.lineSoft}`, borderRadius: 10,
      display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "flex-start",
    }}>
      {/* Left: label + reason + source/status */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Icon size={13} color={meta.color} />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{task.label}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
            padding: "1px 8px", borderRadius: 999,
            background: `${meta.color}18`, color: meta.color,
          }}>{meta.label}</span>
          {!required && (
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
              padding: "1px 8px", borderRadius: 999,
              background: T.grayBg, color: T.gray, textTransform: "uppercase",
            }}>Optional</span>
          )}
        </div>

        {task.reason && (
          <div style={{ fontSize: 11.5, color: T.muted, marginTop: 4, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600, color: T.accentSoft }}>Why: </span>
            {task.reason}
          </div>
        )}

        {/* Current source/status */}
        {showReady && (
          <div style={{
            marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 11.5, color: T.green, fontWeight: 600,
          }}>
            <CheckCircle2 size={11} />
            {confirmed && "Confirmed"}
            {answered && `Answer saved: ${String(answered).slice(0, 60)}${String(answered).length > 60 ? "…" : ""}`}
            {evidence && `Evidence attached: ${evidence.name || evidence.vaultDocId}`}
            {!confirmed && !answered && !evidence && "Satisfied from profile or Vault"}
          </div>
        )}

        {evidence?.status === "pending" && (
          <div style={{ marginTop: 6, fontSize: 11.5, color: T.amber }}>
            Pending review — will be visible to the funder once verified.
          </div>
        )}

        {waiver && (
          <div style={{ marginTop: 6, fontSize: 11.5, color: T.amber }}>
            Waiver requested · awaiting funder approval ({waiver.scope})
          </div>
        )}

        {/* Accepted types hint for missing evidence */}
        {showUpload && task.acceptedTypes?.length > 0 && (
          <div style={{ marginTop: 6, fontSize: 11, color: T.muted }}>
            Accepted: {task.acceptedTypes.join(", ")}
          </div>
        )}

        {/* Inline answer input */}
        {editing && (
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <textarea
              rows={2}
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              autoFocus
              style={{
                flex: 1, minWidth: 220, padding: "8px 10px",
                border: `1px solid ${T.lineStrong}`, borderRadius: 8,
                fontSize: 13, fontFamily: "inherit", resize: "vertical",
              }}
            />
            <button
              onClick={() => { onAnswer?.(task.ruleId, draftValue); setEditing(false) }}
              disabled={!draftValue.trim()}
              style={primaryMiniStyle}
            >Save</button>
            <button
              onClick={() => { setEditing(false); setDraftValue(answered ?? "") }}
              style={ghostMiniStyle}
            >Cancel</button>
          </div>
        )}
      </div>

      {/* Right: one action */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {showConfirm && (
          <button onClick={() => onConfirm?.(task.ruleId)} style={primaryMiniStyle}>
            <CheckCircle2 size={11} /> Confirm current
          </button>
        )}
        {showEditProfile && (
          <button onClick={() => setEditing(true)} style={ghostMiniStyle}>
            <Pencil size={11} /> Edit in profile
          </button>
        )}
        {showAnswer && !showEditProfile && (
          <button onClick={() => setEditing(true)} style={primaryMiniStyle}>
            <Pencil size={11} /> Answer
          </button>
        )}
        {showUpload && (
          <label style={uploadMiniStyle}>
            <Upload size={11} /> Upload
            <input
              type="file"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                onAttachEvidence?.(task.ruleId, {
                  name: f.name,
                  type: f.type,
                  size: f.size,
                  status: "pending",
                  attachedAt: new Date().toISOString(),
                })
                e.target.value = ""
              }}
            />
          </label>
        )}
        {showPending && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11.5, color: T.blue, fontWeight: 600,
            padding: "6px 10px", borderRadius: 7, background: T.blueBg,
          }}>
            <Clock size={11} /> Awaiting check
          </span>
        )}
        {showOptional && !answered && !evidence && (
          <button onClick={() => setEditing(true)} style={ghostMiniStyle}>
            <Paperclip size={11} /> Add
          </button>
        )}
        {waivable && (showAnswer || showUpload) && !waiver && (
          <button
            onClick={() => onRequestWaiver?.(task.ruleId, { reason: "Requested from dialog", scope: "standard" })}
            style={ghostMiniStyle}
            title="Request a waiver from the funder"
          >
            <ExternalLink size={11} /> Waiver
          </button>
        )}
      </div>
    </div>
  )
}

const primaryMiniStyle = {
  padding: "6px 12px", borderRadius: 7,
  background: T.accent, color: "#fff", border: `1px solid ${T.accent}`,
  fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", gap: 5,
}
const ghostMiniStyle = {
  padding: "6px 12px", borderRadius: 7,
  background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}`,
  fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", gap: 5,
}
const uploadMiniStyle = {
  ...ghostMiniStyle,
  cursor: "pointer",
}