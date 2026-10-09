"use client"

import { FileText, ExternalLink, Download } from "lucide-react"
import { T } from "../matching/Badges"

/**
 * Evidence index of a submission — Brief §7, p.56.
 *
 * Labels: unknown, self-declared, uploaded, checked, externally verified.
 * (Brief §3, §7 — we surface those labels in every evidence listing.)
 */

const STATUS_META = {
  verified:      { label: "Verified",       color: T.green, bg: T.greenBg },
  checked:       { label: "Checked",        color: T.green, bg: T.greenBg },
  uploaded:      { label: "Uploaded",       color: T.blue,  bg: T.blueBg },
  self_declared: { label: "Self-declared",  color: T.amber, bg: T.amberBg },
  pending:       { label: "Pending",        color: T.amber, bg: T.amberBg },
  restricted:    { label: "Restricted",     color: T.gray,  bg: T.grayBg },
  unknown:       { label: "Unknown",        color: T.gray,  bg: T.grayBg },
}

export default function EvidenceViewer({ items = [], onDownload }) {
  if (!items.length) {
    return (
      <div style={{
        padding: 20, background: T.panel, borderRadius: 10,
        border: `1px dashed ${T.line}`, color: T.muted, fontSize: 12.5, textAlign: "center",
      }}>
        No evidence files were attached to this submission.
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((e) => {
        const meta = STATUS_META[e.status] || STATUS_META.unknown
        return (
          <div key={e.ruleId} style={{
            display: "flex", gap: 12, alignItems: "center",
            padding: "10px 12px", background: T.bg,
            borderRadius: 9, border: `1px solid ${T.lineSoft}`,
          }}>
            <FileText size={16} color={T.accentSoft} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {e.name}
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                {e.type}
                {e.period ? ` · ${e.period}` : ""}
                {e.vaultDocId ? ` · ${e.vaultDocId}` : ""}
              </div>
            </div>
            <span style={{
              padding: "2px 9px", borderRadius: 999,
              fontSize: 10, fontWeight: 700,
              background: meta.bg, color: meta.color,
              letterSpacing: 0.4, textTransform: "uppercase",
            }}>{meta.label}</span>
            {e.status !== "restricted" && onDownload && (
              <button onClick={() => onDownload(e)} style={iconBtn} title="Download evidence">
                <Download size={13} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

const iconBtn = {
  padding: 6, background: "none", border: "none", cursor: "pointer",
  color: T.accentSoft, borderRadius: 6,
}