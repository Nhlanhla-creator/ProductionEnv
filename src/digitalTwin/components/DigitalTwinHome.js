"use client"

import { useEffect, useState } from "react"
import { Building2, Boxes, Ruler, Upload, Calendar, ListChecks, BarChart3, Wrench, Sparkles } from "lucide-react"
import AssetRegister from "./AssetRegister"
import EquipmentGroupManager from "./EquipmentGroupManager"
import MeasurementCapture from "./MeasurementCapture"
import DowntimeEventForm from "./DowntimeEventForm"
import InputSheetGrid from "./InputSheetGrid"
import ImportCentre from "./ImportCentre"
import ReportingPeriodManager from "./ReportingPeriodManager"
import FirstRunWizard from "./FirstRunWizard"
import CommandCentreHandoff from "./CommandCentreHandoff"
import { getTenant } from "../services/hierarchyService"
import { getOnboardingState } from "../services/onboardingState"
import { auth } from "../../firebaseConfig"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", line: "#ded8d4",
  lineSoft: "#e9e3df", lineStrong: "#b0a29b", bg: "#ffffff",
  panel: "#faf8f7", raised: "#f2eeec", accent: "#4a352f", accentTint: "#f4efec",
  green: "#166534", red: "#991b1b",
}

const SECTIONS = [
  { id: "assets",   label: "Asset Register",         icon: Boxes,      group: "Resources", desc: "Identity, capacity, lifecycle, compliance" },
  { id: "groups",   label: "Equipment Groups",       icon: ListChecks, group: "Resources", desc: "Fleets, circuits, pools, shared targets" },
  { id: "capture",  label: "Shift Data Capture",     icon: Ruler,      group: "Capture",   desc: "One asset per shift — time, output, fuel" },
  { id: "grid",     label: "Grid Entry",             icon: ListChecks, group: "Capture",   desc: "Multiple assets per shift, in a table" },
  { id: "downtime", label: "Downtime Events",        icon: Wrench,     group: "Capture",   desc: "Event-level downtime with classification" },
  { id: "import",   label: "Import Centre",          icon: Upload,     group: "Bulk",      desc: "Template, dry-run, atomic commit" },
  { id: "periods",  label: "Reporting Periods",      icon: Calendar,   group: "Bulk",      desc: "Open, close and freeze reporting windows" },
]

export default function DigitalTwinHome({ initialActive = null }) {
  const [active, setActive] = useState(initialActive)
  const [tenant, setTenant] = useState(null)
  const [onboarding, setOnboarding] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showHandoff, setShowHandoff] = useState(false)

  const user = auth.currentUser

  const reload = async () => {
    if (!user?.uid) { setLoading(false); return }
    try {
      const [t, s] = await Promise.all([
        getTenant(user.uid),
        getOnboardingState(user.uid),
      ])
      setTenant(t)
      setOnboarding(s)
    } finally { setLoading(false) }
  }

  useEffect(() => { reload() }, [user?.uid])

  const handleWizardComplete = async (created) => {
    setShowHandoff(true)
    await reload()
  }

  const handleWizardCancel = () => {
    if (initialActive === "setup") {
      window.location.href = "/digital-twin"
    }
    setActive(null)
  }

  // ── Wizard mode ──
  if (active === "setup") {
    return (
      <div style={{ minHeight: "100vh", padding: "28px", background: T.bg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <FirstRunWizard
            tenantId={user.uid}
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
        </div>
      </div>
    )
  }

  // ── Handoff screen after wizard completes ──
  if (showHandoff) {
    return (
      <CommandCentreHandoff
        tenantId={user.uid}
        onOpenCommandCentre={() => { window.location.href = "/digital-twin/dashboard" }}
        onOpenAssets={() => { setShowHandoff(false); setActive("assets") }}
      />
    )
  }

  // ── Active sub-screen (unchanged from previous version) ──
  if (active === "assets")   return <AssetRegister tenantId={user.uid} onBack={() => setActive(null)} />
  if (active === "groups")   return <EquipmentGroupManager tenantId={user.uid} onBack={() => setActive(null)} />
  if (active === "capture")  return <MeasurementCapture tenantId={user.uid} onBack={() => setActive(null)} />
  if (active === "grid")     return <InputSheetGrid tenantId={user.uid} onBack={() => setActive(null)} />
  if (active === "downtime") return <DowntimeEventForm tenantId={user.uid} onBack={() => setActive(null)} />
  if (active === "import")   return <ImportCentre tenantId={user.uid} onBack={() => setActive(null)} />
  if (active === "periods")  return <ReportingPeriodManager tenantId={user.uid} onBack={() => setActive(null)} />

  // ── Home view ──
  return (
    <div style={{ minHeight: "100vh", padding: "28px", background: T.bg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: "28px", fontWeight: 700, color: T.accent, letterSpacing: "-0.4px" }}>
            Heavy Industry Digital Twin
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: T.muted }}>
            {tenant?.displayName || "Configure your operating structure, capture shift data, and roll it all up to governed KPIs."}
          </p>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: T.muted }}>Loading tenant…</div>
        ) : !onboarding?.completed ? (
          // Setup not completed — show a prominent CTA and the tile grid locked to read-only
          <div>
            <div style={{
              padding: "24px", borderRadius: "14px", marginBottom: "22px",
              background: "linear-gradient(135deg, #3E2723 0%, #5D4037 60%, #4E342E 100%)",
              color: "#fff", boxShadow: "0 8px 28px rgba(62,39,35,0.28)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: "20px", flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flex: 1, minWidth: "260px" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "14px",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Sparkles size={26} color="#D7CCC8" />
                </div>
                <div>
                  <h3 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 700, color: "#EFEBE9" }}>
                    {onboarding?.startedAt ? "Resume your setup" : "Set up your operating structure"}
                  </h3>
                  <p style={{ margin: 0, fontSize: "13.5px", color: "#D7CCC8", lineHeight: 1.55, maxWidth: "520px" }}>
                    The wizard takes about 5 minutes and builds your site, contract, service and equipment groups. You can pause at any time.
                  </p>
                </div>
              </div>
              <button onClick={() => setActive("setup")} style={{
                padding: "12px 22px", background: "#fff", color: T.accent,
                border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                display: "inline-flex", alignItems: "center", gap: "8px",
              }}>
                {onboarding?.startedAt ? "Resume setup" : "Start setup"}
              </button>
            </div>

            <h3 style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.6px" }}>
              Available after setup
            </h3>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "12px",
              opacity: 0.55,
              pointerEvents: "none",
            }}>
              {SECTIONS.slice(0, 4).map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.id} style={{
                    padding: "18px", border: `1px solid ${T.lineSoft}`,
                    borderRadius: "12px", background: T.panel,
                    display: "flex", flexDirection: "column", gap: "8px",
                  }}>
                    <Icon size={20} color={T.muted} />
                    <div style={{ fontSize: "14.5px", fontWeight: 600, color: T.muted }}>{s.label}</div>
                    <div style={{ fontSize: "12.5px", color: T.muted }}>{s.desc}</div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          // Setup complete — normal tile grid
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
            {["Resources", "Capture", "Bulk"].map((group) => (
              <div key={group} style={{ display: "contents" }}>
                <div style={{ gridColumn: "1 / -1", marginTop: group === "Resources" ? 0 : "10px", marginBottom: "-4px" }}>
                  <h3 style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.6px" }}>
                    {group}
                  </h3>
                </div>
                {SECTIONS.filter((s) => s.group === group).map((s) => {
                  const Icon = s.icon
                  return (
                    <button key={s.id} onClick={() => setActive(s.id)}
                      style={{
                        padding: "20px", border: `1px solid ${T.lineStrong}`, borderRadius: "12px",
                        background: T.bg, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                        display: "flex", flexDirection: "column", gap: "10px",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = T.accentTint }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.lineStrong; e.currentTarget.style.background = T.bg }}>
                      <span style={{ color: T.accent }}><Icon size={22} /></span>
                      <span style={{ fontSize: "15.5px", fontWeight: 600, color: T.accent }}>{s.label}</span>
                      <span style={{ fontSize: "13px", color: T.body, lineHeight: 1.5 }}>{s.desc}</span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}