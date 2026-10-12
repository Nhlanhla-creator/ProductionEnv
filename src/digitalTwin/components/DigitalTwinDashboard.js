"use client"

/**
 * digitalTwin/components/DigitalTwinDashboard.jsx
 *
 * Top-level shell for the dashboard layer. Allows switching between the
 * Asset Performance command centre and the Capacity & Readiness panel, and
 * exposes the drill-down and lineage flows.
 *
 * Add this to your router as `/digital-twin/dashboard` — the module is now
 * feature-complete from Phases 1 to 5.
 */

import { useEffect, useState } from "react"
import { BarChart3, Boxes } from "lucide-react"
import AssetPerformanceCommandCentre from "./AssetPerformanceCommandCentre"
import CapacityReadinessPanel from "./CapacityReadinessPanel"
import { getTenant } from "../services/hierarchyService"
import { auth } from "../../firebaseConfig"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#4a352f", accentSoft: "#6b4f47", accentTint: "#f4efec",
  red: "#991b1b", redBg: "#fef2f2",
}

const btnBase = { padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "inherit" }

const TABS = [
  { id: "command", label: "Command centre", icon: BarChart3 },
  { id: "capacity", label: "Capacity & readiness", icon: Boxes },
]

export default function DigitalTwinDashboard() {
  const [tab, setTab] = useState("command")
  const [tenant, setTenant] = useState(null)
  const [loadingTenant, setLoadingTenant] = useState(true)

  const user = auth.currentUser

  useEffect(() => {
    (async () => {
      if (!user?.uid) { setLoadingTenant(false); return }
      try {
        const t = await getTenant(user.uid)
        setTenant(t)
      } finally { setLoadingTenant(false) }
    })()
  }, [user?.uid])

  if (loadingTenant) {
    return <div style={{ padding: "80px", textAlign: "center", color: T.muted }}>Loading digital twin…</div>
  }

  if (!tenant) {
    return (
      <div style={{ padding: "32px", maxWidth: "820px", margin: "0 auto" }}>
        <div style={{ padding: "18px 20px", background: T.redBg, border: `1px solid ${T.red}33`, borderRadius: "10px", color: T.red, fontSize: "13.5px" }}>
          No digital twin tenant found. Open the Digital Twin home page to activate the module first.
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", padding: "28px", background: T.bg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Tab bar */}
        <div style={{ display: "flex", gap: "4px", borderBottom: `1px solid ${T.lineStrong}`, marginBottom: "18px", alignItems: "center" }}>
          {TABS.map((t) => {
            const Icon = t.icon
            const on = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  padding: "12px 20px", background: "none", border: "none", cursor: "pointer",
                  fontSize: "14.5px", fontWeight: on ? 600 : 500,
                  color: on ? T.accent : T.body,
                  borderBottom: on ? `2px solid ${T.accent}` : "2px solid transparent",
                  display: "flex", alignItems: "center", gap: "9px", fontFamily: "inherit", marginBottom: "-1px",
                }}>
                <Icon size={16} /> {t.label}
              </button>
            )
          })}
          <button onClick={() => { window.location.href = "/digital-twin" }}
            style={{ ...btnBase, background: "transparent", color: T.muted, border: "none", marginLeft: "auto" }}>
            Module home →
          </button>
        </div>

        {tab === "command" && <AssetPerformanceCommandCentre tenantId={user.uid} />}
        {tab === "capacity" && <CapacityReadinessPanel tenantId={user.uid} />}
      </div>
    </div>
  )
}