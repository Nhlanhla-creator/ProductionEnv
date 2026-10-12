"use client"

import { AlertTriangle } from "lucide-react"
import { T } from "./matching/Badges"

/**
 * Shown at the top of the opportunity dialog when the funder republished
 * rules since the SME last edited this draft.
 *
 * See Brief §5, acceptance #7.
 */

export default function RuleVersionBanner({ status, onReview }) {
  if (!status?.changed) return null

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "12px 14px", marginBottom: 14,
      background: T.amberBg, border: `1px solid ${T.amber}33`,
      color: T.amber, borderRadius: 10,
    }}>
      <AlertTriangle size={15} style={{ marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>
          Requirements changed since you started this draft
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.55, color: T.body }}>
          The funder published a new rule version
          {status.draftVersion?.ruleVersion && status.live?.ruleVersion && (
            <> — <b>{status.draftVersion.ruleVersion}</b> → <b>{status.live.ruleVersion}</b></>
          )}.
          Review the new tasks before submitting. Your other submitted packages are not affected.
        </div>
        {onReview && (
          <button
            onClick={onReview}
            style={{
              marginTop: 8, padding: "6px 12px", borderRadius: 7,
              background: T.amber, color: "#fff", border: "none",
              fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Review changes
          </button>
        )}
      </div>
    </div>
  )
}