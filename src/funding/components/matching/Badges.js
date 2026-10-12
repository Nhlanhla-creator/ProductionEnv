"use client"

import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react"

export const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#5D4037", accentSoft: "#8D6E63", accentTint: "#EFEBE9",
  green: "#166534", greenBg: "#f0fdf4",
  amber: "#92400e", amberBg: "#fffbeb",
  red: "#991b1b", redBg: "#fef2f2",
  blue: "#1e40af", blueBg: "#eff6ff",
  gray: "#6b7280", grayBg: "#f3f4f6",
}

const ELIGIBILITY_META = {
  eligible:    { label: "Eligible",    color: T.green, bg: T.greenBg, Icon: CheckCircle2 },
  provisional: { label: "Provisional", color: T.amber, bg: T.amberBg, Icon: HelpCircle },
  ineligible:  { label: "Ineligible",  color: T.red,   bg: T.redBg,   Icon: XCircle },
}

export function EligibilityBadge({ status = "provisional", onExplain }) {
  const meta = ELIGIBILITY_META[status] || ELIGIBILITY_META.provisional
  const { Icon } = meta
  const clickable = !!onExplain
  return (
    <span
      onClick={clickable ? onExplain : undefined}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 10px", borderRadius: 999,
        fontSize: 11, fontWeight: 700,
        background: meta.bg, color: meta.color,
        cursor: clickable ? "pointer" : "default",
      }}
    >
      <Icon size={11} /> {meta.label}
    </span>
  )
}

const FIT_META = {
  high:   { label: "High fit",   color: T.green, bg: T.greenBg },
  medium: { label: "Medium fit", color: T.amber, bg: T.amberBg },
  low:    { label: "Low fit",    color: T.gray,  bg: T.grayBg },
  none:   { label: "No fit",     color: T.gray,  bg: T.grayBg },
}

export function MatchFitBadge({ fit = "low", score, onExplain }) {
  const meta = FIT_META[fit] || FIT_META.low
  const clickable = !!onExplain
  return (
    <span
      onClick={clickable ? onExplain : undefined}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px", borderRadius: 999,
        fontSize: 11, fontWeight: 700,
        background: meta.bg, color: meta.color,
        cursor: clickable ? "pointer" : "default",
      }}
    >
      {score != null ? <span>{score}</span> : null}
      <span>{meta.label}</span>
    </span>
  )
}

export function ScorePill({ value, delta, provisional = false, label }) {
  const hasDelta = typeof delta === "number" && delta !== 0
  const deltaColor = !hasDelta ? T.muted : delta > 0 ? T.green : T.red
  const deltaSign = hasDelta && delta > 0 ? "+" : ""
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>
        {value != null ? value : "—"}
      </span>
      {hasDelta && (
        <span style={{ fontSize: 11.5, fontWeight: 700, color: deltaColor }}>
          {deltaSign}{delta}
        </span>
      )}
      {provisional && (
        <span style={{
          fontSize: 9.5, fontWeight: 700, color: T.amber,
          padding: "1px 6px", borderRadius: 999, background: T.amberBg,
          letterSpacing: 0.3,
        }}>PROV</span>
      )}
      {label && <span style={{ fontSize: 10.5, color: T.muted }}>{label}</span>}
    </div>
  )
}