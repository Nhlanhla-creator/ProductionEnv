"use client"

import { useState } from "react"
import { CheckCircle2, AlertCircle, FileText, HelpCircle, Clock } from "lucide-react"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55",
  line: "#ded8d4", lineSoft: "#e9e3df",
  bg: "#ffffff", panel: "#faf8f7",
  accent: "#5D4037", accentTint: "#EFEBE9",
  green: "#166534", greenBg: "#f0fdf4",
  amber: "#92400e", amberBg: "#fffbeb",
  blue: "#1e40af", blueBg: "#eff6ff",
  gray: "#6b7280", grayBg: "#f3f4f6",
}

const STATE_META = {
  ready:              { label: "Ready from profile",        Icon: CheckCircle2, color: T.green, bg: T.greenBg },
  confirm:            { label: "Confirm current",           Icon: HelpCircle,   color: T.blue,  bg: T.blueBg },
  missing_answer:     { label: "Missing answer",            Icon: AlertCircle,  color: T.amber, bg: T.amberBg },
  missing_evidence:   { label: "Missing evidence",          Icon: FileText,     color: T.amber, bg: T.amberBg },
  pending_validation: { label: "Pending validation",        Icon: Clock,        color: T.blue,  bg: T.blueBg },
  optional:           { label: "Recommended",               Icon: HelpCircle,   color: T.gray,  bg: T.grayBg },
}

/**
 * Read-only preview of what the SME will see in the requirements dialog
 * (Brief §4, p.41: "Show a preview of the SME dialog and resulting checklist").
 */
export default function SmeDialogPreview({ rules }) {
  const [tab, setTab] = useState("all")

  const buckets = {
    ready: [],
    confirm: [],
    missing_answer: [],
    missing_evidence: [],
    pending_validation: [],
    optional: [],
  }

  for (const r of rules || []) {
    const state = r.state || "missing_answer"
    const bucket = buckets[state] ? state : "missing_answer"
    buckets[bucket].push(r)
  }

  const total = (rules || []).length
  const blockers = buckets.missing_answer.length + buckets.missing_evidence.length

  const visible = tab === "all"
    ? rules
    : (buckets[tab] || [])

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: T.accent }}>
          Preview — how SMEs will see this opportunity
        </h3>
        <p style={{ margin: 0, fontSize: 12.5, color: T.muted }}>
          {total} requirement{total === 1 ? "" : "s"} · {blockers} mandatory blocker{blockers === 1 ? "" : "s"}
        </p>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        <TabBtn active={tab === "all"} onClick={() => setTab("all")} label="All" count={total} />
        {Object.keys(buckets).map((k) => (
          <TabBtn key={k} active={tab === k} onClick={() => setTab(k)} label={STATE_META[k].label} count={buckets[k].length} color={STATE_META[k].color} />
        ))}
      </div>

      {visible.length === 0 ? (
        <div style={{ padding: 20, textAlign: "center", background: T.panel, borderRadius: 10, border: `1px dashed ${T.line}`, color: T.muted, fontSize: 13 }}>
          Nothing in this bucket.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {visible.map((r, i) => {
            const meta = STATE_META[r.state || "missing_answer"] || STATE_META.missing_answer
            const Icon = meta.Icon
            return (
              <div key={r.ruleId || i} style={{
                padding: "12px 14px", background: T.bg, border: `1px solid ${T.lineSoft}`, borderRadius: 10,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{r.label}</div>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "2px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                    background: meta.bg, color: meta.color,
                  }}>
                    <Icon size={10} /> {meta.label}
                  </span>
                </div>
                {r.reason && <div style={{ fontSize: 12, color: T.muted }}>{r.reason}</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TabBtn({ active, onClick, label, count, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 12px", borderRadius: 999,
      border: `1.5px solid ${active ? T.accent : T.line}`,
      background: active ? T.accent : T.bg,
      color: active ? "#fff" : (color || T.body),
      fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      {label} <span style={{ opacity: 0.7 }}>({count})</span>
    </button>
  )
}