"use client"

import { Check, ChevronRight, TrendingUp, Boxes, Plus } from "lucide-react"

const T = {
  accent: "#4a352f", accentSoft: "#6b4f47", accentTint: "#f4efec",
  body: "#3b2b26", muted: "#6b5b55",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  green: "#166534", greenBg: "#f0fdf4",
}

export default function CommandCentreHandoff({ tenantId, onOpenCommandCentre, onOpenAssets }) {
  return (
    <div style={{
      minHeight: "100vh", padding: "40px 24px",
      background: T.bg, fontFamily: "'Inter', -apple-system, sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ maxWidth: "560px", width: "100%", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", width: "72px", height: "72px",
          borderRadius: "20px", background: T.greenBg,
          alignItems: "center", justifyContent: "center",
          marginBottom: "20px",
        }}>
          <Check size={34} color={T.green} />
        </div>

        <h1 style={{
          margin: "0 0 10px", fontSize: "28px",
          fontWeight: 700, color: T.accent, letterSpacing: "-0.4px",
        }}>
          Your twin is live
        </h1>

        <p style={{
          margin: "0 0 28px", fontSize: "15px",
          color: T.body, lineHeight: 1.6, maxWidth: "440px",
          marginLeft: "auto", marginRight: "auto",
        }}>
          We've built your operating structure. The next step is adding the
          equipment and work that fills it — then your command centre starts
          producing insights.
        </p>

        <div style={{
          background: T.panel, borderRadius: "14px",
          padding: "20px 22px", marginBottom: "24px",
          textAlign: "left",
        }}>
          <div style={{
            fontSize: "11.5px", fontWeight: 700,
            color: T.muted, textTransform: "uppercase",
            letterSpacing: "0.5px", marginBottom: "12px",
          }}>
            Recommended next steps
          </div>

          <StepItem
            num={1}
            title="Add your first asset"
            description="Register a truck, rig or machine so we can track its availability, utilisation and cost."
            action={{ label: "Add asset", onClick: onOpenAssets, icon: Plus }}
          />

          <StepItem
            num={2}
            title="Record a shift"
            description="Capture one shift of time and production. Takes about 30 seconds."
            muted
          />

          <StepItem
            num={3}
            title="View your command centre"
            description="Your KPI tiles will populate as soon as there's data to calculate from."
            action={{ label: "Open command centre", onClick: onOpenCommandCentre, icon: TrendingUp }}
            noBorder
          />
        </div>

        <div style={{
          display: "flex", gap: "10px", justifyContent: "center",
          flexWrap: "wrap",
        }}>
          <button
            type="button"
            onClick={onOpenAssets}
            style={{
              padding: "12px 22px",
              background: T.accent, color: "#fff",
              border: `1px solid ${T.accent}`, borderRadius: "10px",
              fontSize: "14px", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", gap: "7px",
            }}>
            <Boxes size={15} />
            Add your first asset
          </button>
          <button
            type="button"
            onClick={onOpenCommandCentre}
            style={{
              padding: "12px 22px",
              background: T.bg, color: T.body,
              border: `1px solid ${T.lineStrong}`, borderRadius: "10px",
              fontSize: "14px", fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", gap: "7px",
            }}>
            Skip for now
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function StepItem({ num, title, description, action, muted, noBorder }) {
  return (
    <div style={{
      display: "flex", gap: "14px",
      paddingBottom: noBorder ? 0 : "14px",
      marginBottom: noBorder ? 0 : "14px",
      borderBottom: noBorder ? "none" : `1px solid ${T.lineSoft}`,
      opacity: muted ? 0.7 : 1,
    }}>
      <div style={{
        width: "26px", height: "26px", borderRadius: "8px",
        background: muted ? T.raised : T.accentTint,
        color: muted ? T.muted : T.accent,
        fontSize: "12.5px", fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginTop: "2px",
      }}>
        {num}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: T.accent, marginBottom: "3px" }}>
          {title}
        </div>
        <div style={{ fontSize: "12.5px", color: T.muted, lineHeight: 1.5, marginBottom: action ? "8px" : 0 }}>
          {description}
        </div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            style={{
              padding: "6px 12px",
              background: "transparent", color: T.accent,
              border: `1px solid ${T.lineStrong}`, borderRadius: "7px",
              fontSize: "12.5px", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", gap: "5px",
            }}>
            {action.icon && <action.icon size={12} />}
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}