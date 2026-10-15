"use client"

/**
 * digitalTwin/components/OperationsSetupCard.jsx
 *
 * The dashboard-facing entry point to the digital twin setup wizard.
 * Shows:
 *   - Setup not started  → call-to-action card
 *   - Setup in progress  → resume banner with step counter
 *   - Setup complete     → quick-action card
 *
 * variants:
 *   "full"    — always render the full-size card (used in the Setup tab)
 *   "compact" — slim completed bar (used elsewhere)
 *   default   — original behaviour
 */

import { useEffect, useState } from "react"
import { Boxes, Check, ChevronRight, TrendingUp, Sparkles, ArrowRight } from "lucide-react"
import { auth } from "../../firebaseConfig"
import { getOnboardingState } from "../services/onboardingState"

const T = {
  accent: "#4a352f", accentSoft: "#6b4f47", accentTint: "#f4efec",
  body: "#3b2b26", muted: "#6b5b55",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  green: "#166534", greenBg: "#f0fdf4",
}

export default function OperationsSetupCard({ onNavigate, variant = "default" }) {
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

  if (state.dismissals?.dashboardCard && variant !== "full") return null

  const started = !!state.startedAt
  const completed = state.completed
  const currentStep = state.currentStep || 0
  const totalSteps = 7

  const handleClick = (target) => {
    onNavigate?.(target)
  }

  // ── Full variant: always render the large card (used inside the Setup tab)
  if (variant === "full") {
    return (
      <div>
        {/* ── Status header card ── */}
        <div style={{
          background: "linear-gradient(135deg, #3E2723 0%, #5D4037 60%, #4E342E 100%)",
          borderRadius: "16px",
          padding: "28px 30px",
          color: "#fff",
          boxShadow: "0 8px 28px rgba(62, 39, 35, 0.28)",
          marginBottom: "20px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "18px", flexWrap: "wrap" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "15px",
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {completed
                ? <Check size={28} color="#C8E6C9" />
                : <Boxes size={28} color="#D7CCC8" />}
            </div>
            <div style={{ flex: 1, minWidth: "260px" }}>
              <h3 style={{
                margin: "0 0 8px", fontSize: "20px",
                fontWeight: 700, color: "#EFEBE9", letterSpacing: "-0.3px",
              }}>
                {completed
                  ? "Your operational twin is live"
                  : started
                    ? "Resume your setup"
                    : "Set up your operating structure"}
              </h3>
              <p style={{ margin: 0, fontSize: "14px", color: "#D7CCC8", lineHeight: 1.55, maxWidth: "620px" }}>
                {completed
                  ? "Your sites, contracts, services and equipment groups are configured. You can re-run the wizard to add more structure, or jump straight to the command centre."
                  : started
                    ? `You're on step ${currentStep + 1} of ${totalSteps}. Nothing is saved until the final step — pick up where you left off.`
                    : "The guided setup takes about 5 minutes and builds your sites, contracts, services and equipment groups. You can pause at any time."}
              </p>

              {/* Progress bar */}
              {started && !completed && (
                <div style={{ marginTop: "14px", maxWidth: "480px" }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    fontSize: "11.5px", color: "#D7CCC8", marginBottom: "6px",
                    fontWeight: 600, letterSpacing: "0.3px",
                  }}>
                    <span>Step {currentStep + 1} of {totalSteps}</span>
                    <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
                  </div>
                  <div style={{
                    height: "6px", background: "rgba(255,255,255,0.15)",
                    borderRadius: "3px", overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${((currentStep + 1) / totalSteps) * 100}%`,
                      height: "100%", background: "#D7CCC8",
                      borderRadius: "3px", transition: "width 0.3s",
                    }} />
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "18px", flexWrap: "wrap" }}>
                {!completed ? (
                  <button
                    type="button"
                    onClick={() => handleClick("setup")}
                    style={{
                      padding: "11px 22px",
                      background: "#fff", color: T.accent,
                      border: "none", borderRadius: "10px",
                      fontSize: "13.5px", fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                      display: "inline-flex", alignItems: "center", gap: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}>
                    {started ? "Resume setup" : "Start guided setup"}
                    <ChevronRight size={15} />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleClick("dashboard")}
                      style={{
                        padding: "11px 22px",
                        background: "#fff", color: T.accent,
                        border: "none", borderRadius: "10px",
                        fontSize: "13.5px", fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                        display: "inline-flex", alignItems: "center", gap: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      }}>
                      <TrendingUp size={15} />
                      Go to command centre
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClick("setup")}
                      style={{
                        padding: "11px 22px",
                        background: "transparent", color: "#EFEBE9",
                        border: "1px solid rgba(255,255,255,0.3)", borderRadius: "10px",
                        fontSize: "13.5px", fontWeight: 500,
                        cursor: "pointer", fontFamily: "inherit",
                        display: "inline-flex", alignItems: "center", gap: "8px",
                      }}>
                      Add more structure
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── What gets built ── */}
        <div style={{
          background: T.panel, borderRadius: "14px",
          border: `1px solid ${T.lineSoft}`,
          padding: "20px 22px", marginBottom: "20px",
        }}>
          <div style={{
            fontSize: "11.5px", fontWeight: 700,
            color: T.muted, textTransform: "uppercase",
            letterSpacing: "0.5px", marginBottom: "14px",
          }}>
            What the wizard builds
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "12px",
          }}>
            <SetupItem
              num={1}
              title="Objective & context"
              description="What you want to improve, which sector pack applies, and what environment you operate in."
              done={completed || currentStep > 1}
            />
            <SetupItem
              num={2}
              title="Site & contract"
              description="Where the work happens and which commercial scope it sits under. You can have one, the other, or both."
              done={completed || currentStep > 2}
            />
            <SetupItem
              num={3}
              title="Service & activity"
              description="The canonical service and the operational activity it delivers, pulled from the sector taxonomy."
              done={completed || currentStep > 3}
            />
            <SetupItem
              num={4}
              title="Equipment groups"
              description="If your service uses physical equipment, name the fleet. Skip if it's people, teams or consumables only."
              done={completed || currentStep > 4}
            />
            <SetupItem
              num={5}
              title="Reporting period & target"
              description="The first reporting month and the KPI target the dashboard will compare against."
              done={completed || currentStep > 5}
            />
            <SetupItem
              num={6}
              title="Review & create"
              description="See the full structure as an interactive flow diagram, add connections, then create everything."
              done={completed}
            />
          </div>
        </div>

        {/* ── Recommended next steps (only after completed) ── */}
        {completed && (
          <div style={{
            background: T.panel, borderRadius: "14px",
            border: `1px solid ${T.lineSoft}`,
            padding: "20px 22px",
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
              action={{ label: "Add asset", onClick: () => handleClick("assets"), icon: Boxes }}
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
              action={{ label: "Open command centre", onClick: () => handleClick("dashboard"), icon: TrendingUp }}
              noBorder
            />
          </div>
        )}
      </div>
    )
  }

  // ── Compact variant: slim completed bar ──
  if (completed && variant === "compact") {
    return (
      <div style={{
        marginBottom: "18px",
        background: T.panel,
        border: `1px solid ${T.lineSoft}`,
        borderRadius: "10px",
        padding: "10px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "12px", flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "200px" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "8px",
            background: T.greenBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Check size={14} color={T.green} />
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: T.accent }}>
              Operations Command Centre is live
            </div>
            <div style={{ fontSize: "11.5px", color: T.muted }}>
              Add assets and capture shift data to populate your KPIs.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleClick("assets")}
          style={{
            padding: "7px 14px",
            background: T.accent, color: "#fff",
            border: `1px solid ${T.accent}`, borderRadius: "8px",
            fontSize: "12.5px", fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", gap: "5px",
            whiteSpace: "nowrap",
          }}>
          <Boxes size={13} />
          Add asset
        </button>
      </div>
    )
  }

  // ── Default variant: original behaviour (unchanged) ──
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
          background: T.greenBg,
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

// ── Sub-components ─────────────────────────────────────────────────────────

function SetupItem({ num, title, description, done }) {
  return (
    <div style={{
      display: "flex", gap: "12px",
      padding: "12px 14px",
      background: T.bg, borderRadius: "10px",
      border: `1px solid ${T.lineSoft}`,
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: "7px",
        background: done ? T.greenBg : T.accentTint,
        color: done ? T.green : T.accent,
        fontSize: "12px", fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginTop: "2px",
      }}>
        {done ? <Check size={12} /> : num}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "13px", fontWeight: 600,
          color: T.accent, marginBottom: "3px",
        }}>
          {title}
        </div>
        <div style={{
          fontSize: "12px", color: T.muted,
          lineHeight: 1.5,
        }}>
          {description}
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