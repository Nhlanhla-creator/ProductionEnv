"use client"

/**
 * digitalTwin/components/OperationsSetupCard.jsx
 *
 * The dashboard-facing entry point to the digital twin. Shows a
 * setup prompt for users who haven't started, a resume banner for users
 * mid-setup, and a quiet quick-access card once setup is complete.
 */

import { useEffect, useState } from "react"
import { Boxes, Check, ChevronRight, TrendingUp, Sparkles } from "lucide-react"
import { auth } from "../../firebaseConfig"
import { getOnboardingState } from "../services/onboardingState"

const T = {
  accent: "#4a352f", accentSoft: "#6b4f47", accentTint: "#f4efec",
  body: "#3b2b26", muted: "#6b5b55",
  line: "#ded8d4", lineSoft: "#e9e3df",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  green: "#166534",
}

export default function OperationsSetupCard({ onNavigate }) {
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = auth.currentUser
    if (!user?.uid) { setLoading(false); return }
    (async () => {
      const s = await getOnboardingState(user.uid)
      setState(s)
      setLoading(false)
    })()
  }, [])

  if (loading || !state) return null

  // If the user explicitly dismissed the card, hide it
  if (state.dismissals?.dashboardCard) return null

  const started = !!state.startedAt
  const completed = state.completed
  const currentStep = state.currentStep || 0
  const totalSteps = 7

  const handleClick = (target) => {
    onNavigate?.(target)
  }

  // ── Variant 1: Setup not started ──
  if (!started) {
    return (
      <div
        style={{
          marginBottom: "24px",
          background: "linear-gradient(135deg, #3E2723 0%, #5D4037 60%, #4E342E 100%)",
          borderRadius: "16px",
          padding: "24px 26px",
          color: "#fff",
          boxShadow: "0 8px 28px rgba(62, 39, 35, 0.28)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "20px", flexWrap: "wrap",
          position: "relative", overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flex: 1, minWidth: "280px" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "14px",
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Boxes size={26} color="#D7CCC8" />
          </div>
          <div>
            <h3 style={{
              margin: "0 0 6px", fontSize: "18px",
              fontWeight: 700, color: "#EFEBE9", letterSpacing: "-0.2px",
            }}>
              Set up your Operations Command Centre
            </h3>
            <p style={{ margin: 0, fontSize: "13.5px", color: "#D7CCC8", lineHeight: 1.55, maxWidth: "520px" }}>
              Track availability, utilisation, productivity and cost across your fleet or
              circuit. Guided setup — takes about 5 minutes, and you can pause at any time.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleClick("setup")}
          style={{
            padding: "12px 22px",
            background: "#fff", color: T.accent,
            border: "none", borderRadius: "10px",
            fontSize: "14px", fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", gap: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            whiteSpace: "nowrap",
          }}>
          Start guided setup
          <ChevronRight size={16} />
        </button>
      </div>
    )
  }

  // ── Variant 2: Setup in progress ──
  if (started && !completed) {
    return (
      <div
        style={{
          marginBottom: "24px",
          background: T.panel,
          border: `1.5px solid ${T.accent}`,
          borderRadius: "14px",
          padding: "18px 22px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "16px", flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: "240px" }}>
          <div style={{
            width: 42, height: 42, borderRadius: "11px",
            background: T.accentTint,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Sparkles size={20} color={T.accent} />
          </div>
          <div>
            <div style={{
              fontSize: "11px", fontWeight: 700,
              color: T.muted, textTransform: "uppercase",
              letterSpacing: "0.5px", marginBottom: "3px",
            }}>
              Setup in progress
            </div>
            <div style={{
              fontSize: "14.5px", fontWeight: 600,
              color: T.accent, marginBottom: "2px",
            }}>
              You're on step {currentStep + 1} of {totalSteps}
            </div>
            <div style={{ fontSize: "12.5px", color: T.muted }}>
              Pick up where you left off — nothing is saved until the final step.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleClick("setup")}
          style={{
            padding: "10px 18px",
            background: T.accent, color: "#fff",
            border: `1px solid ${T.accent}`, borderRadius: "9px",
            fontSize: "13.5px", fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", gap: "6px",
            whiteSpace: "nowrap",
          }}>
          Resume setup
          <ChevronRight size={15} />
        </button>
      </div>
    )
  }

  // ── Variant 3: Setup complete — quiet quick-access ──
  return (
    <div
      style={{
        marginBottom: "24px",
        background: T.panel,
        border: `1px solid ${T.lineSoft}`,
        borderRadius: "12px",
        padding: "14px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "16px", flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "220px" }}>
        <div style={{
          width: 34, height: 34, borderRadius: "9px",
          background: T.green + "18",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Check size={16} color={T.green} />
        </div>
        <div>
          <div style={{ fontSize: "13.5px", fontWeight: 600, color: T.accent }}>
            Operations Command Centre is live
          </div>
          <div style={{ fontSize: "12px", color: T.muted }}>
            Review your asset performance, capacity and downtime.
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => handleClick("dashboard")}
        style={{
          padding: "9px 16px",
          background: T.accent, color: "#fff",
          border: `1px solid ${T.accent}`, borderRadius: "9px",
          fontSize: "13px", fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
          display: "inline-flex", alignItems: "center", gap: "6px",
          whiteSpace: "nowrap",
        }}>
        <TrendingUp size={14} />
        Open command centre
      </button>
    </div>
  )
}