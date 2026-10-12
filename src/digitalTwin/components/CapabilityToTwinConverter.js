"use client"

/**
 * digitalTwin/components/CapabilityToTwinConverter.jsx
 *
 * The Section 9.5 conversion wizard.
 *
 * A capability profile lists what the SME offers. This wizard converts a
 * selected offering into a full operational twin setup:
 *   1. Select the offering from the profile
 *   2. Describe the delivery context (site, contract, client)
 *   3. Review and edit the auto-drafted structure
 *   4. Confirm — creates the twin nodes, relations and groups
 *
 * The capability profile itself is untouched. If the user changes their
 * mind, nothing has been written anywhere until step 4.
 */

import { useEffect, useState } from "react"
import { ChevronRight, ChevronLeft, Check, AlertTriangle, Info } from "lucide-react"
import { draftTwinFromCapability, createTwinFromDraft } from "../services/capabilityBridge"
import { auth, db } from "../../firebaseConfig"
import { doc, getDoc } from "firebase/firestore"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", faint: "#8a7a74",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#4a352f", accentSoft: "#6b4f47", accentTint: "#f4efec",
  header: "#33231e",
  green: "#166534", greenBg: "#f0fdf4",
  amber: "#92400e", amberBg: "#fffbeb",
  red: "#991b1b", redBg: "#fef2f2",
}

const btnBase = { padding: "9px 16px", borderRadius: "8px", fontSize: "13.5px", fontWeight: 500,
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: "inherit" }
const btnPrimary = { ...btnBase, background: T.accent, color: "#fff", border: `1px solid ${T.accent}`, fontWeight: 600 }
const btnGhost   = { ...btnBase, background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}` }
const inputS = { width: "100%", padding: "9px 11px", border: `1px solid ${T.lineStrong}`,
  borderRadius: "8px", fontSize: "13.5px", fontFamily: "inherit",
  boxSizing: "border-box", color: T.ink, background: T.bg, outline: "none" }
const labelS = { display: "block", fontSize: "12px", fontWeight: 600, color: T.accent, marginBottom: "5px" }
const cardS = { background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "16px", marginBottom: "14px" }

const STEPS = ["Select offering", "Delivery context", "Review structure", "Confirm"]

export default function CapabilityToTwinConverter({ tenantId, onBack, onComplete }) {
  const [step, setStep] = useState(0)
  const [offerings, setOfferings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOffering, setSelectedOffering] = useState(null)
  const [deliveryContext, setDeliveryContext] = useState({
    siteName: "", contractName: "", client: "", environment: "surface", commodity: "", productionMethod: "",
  })
  const [draft, setDraft] = useState(null)
  const [draftEdits, setDraftEdits] = useState({})
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Load the user's offerings from the capability profile
  useEffect(() => {
    (async () => {
      const user = auth.currentUser
      if (!user?.uid) { setLoading(false); return }
      try {
        const ref = doc(db, "universalProfiles", user.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const ps = snap.data()?.productsServices || {}
          const all = Array.isArray(ps.offerings) ? ps.offerings : []
          setOfferings(all.filter((o) => o.name && o.name.trim().length > 0))
        }
      } finally { setLoading(false) }
    })()
  }, [])

  const next = async () => {
    if (step === 0) {
      if (!selectedOffering) return
      setStep(1)
    } else if (step === 1) {
      if (!deliveryContext.siteName && !deliveryContext.contractName) return
      // Generate the draft
      try {
        const d = await draftTwinFromCapability({
          tenantId,
          offering: selectedOffering,
          deliveryContext,
          sectorPackKey: inferSectorPack(selectedOffering),
        })
        setDraft(d)
        setDraftEdits(JSON.parse(JSON.stringify(d)))  // clone for editing
        setStep(2)
      } catch (err) {
        setError(err.message)
      }
    } else if (step === 2) {
      setStep(3)
    }
  }

  const back = () => {
    if (step === 0) return onBack?.()
    setStep((s) => s - 1)
  }

  const confirm = async () => {
    setCreating(true); setError(null)
    try {
      const res = await createTwinFromDraft(tenantId, draft, { confirmedEdits: draftEdits })
      setResult(res)
      setStep(4)
    } catch (err) {
      setError(err.message)
    } finally { setCreating(false) }
  }

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", color: T.muted }}>Loading capability profile…</div>
  }

  return (
    <div>
      {onBack && <button onClick={back} style={{ ...btnGhost, marginBottom: "14px" }}>← Back</button>}

      <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 700, color: T.accent, letterSpacing: "-0.3px" }}>
        Convert a capability into an operational twin
      </h2>
      <p style={{ margin: "0 0 18px", fontSize: "13.5px", color: T.muted }}>
        Pick what your business offers, describe where it is delivered, and we will draft the operating structure for you to confirm.
      </p>

      {/* Progress */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "22px", flexWrap: "wrap" }}>
        {STEPS.map((label, i) => {
          const done = i < step
          const active = i === step
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "24px", height: "24px", borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700,
                background: done ? T.green : active ? T.accent : T.raised,
                color: done || active ? "#fff" : T.muted,
                border: `1px solid ${done ? T.green : active ? T.accent : T.lineStrong}`,
              }}>
                {done ? <Check size={12} /> : i + 1}
              </div>
              <span style={{ fontSize: "12.5px", fontWeight: active ? 600 : 500, color: active ? T.accent : done ? T.green : T.muted }}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <ChevronRight size={14} color={T.line} style={{ marginLeft: "4px" }} />
              )}
            </div>
          )
        })}
      </div>

      {error && (
        <div style={{ padding: "12px 14px", background: T.redBg, border: `1px solid ${T.red}33`, borderRadius: "10px",
          color: T.red, fontSize: "13.5px", marginBottom: "14px",
          display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <AlertTriangle size={15} style={{ marginTop: "2px", flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Step 0 — Select offering */}
      {step === 0 && (
        <div style={cardS}>
          {offerings.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center" }}>
              <p style={{ margin: "0 0 12px", fontSize: "13.5px", color: T.muted }}>
                You have not declared any products or services yet.
              </p>
              <a href="/profile?section=productsServices"
                style={{ ...btnPrimary, textDecoration: "none", display: "inline-flex" }}>
                Go to Products & Services
              </a>
            </div>
          ) : (
            <>
              <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600, color: T.accent }}>
                Which offering are you turning into an operational twin?
              </h3>
              <div style={{ display: "grid", gap: "8px" }}>
                {offerings.map((o) => {
                  const selected = selectedOffering?.id === o.id
                  return (
                    <button key={o.id} onClick={() => setSelectedOffering(o)}
                      style={{
                        padding: "14px 16px", borderRadius: "8px", textAlign: "left",
                        border: `1.5px solid ${selected ? T.accent : T.line}`, background: selected ? T.accentTint : T.bg,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: "14.5px", fontWeight: 600, color: T.accent }}>{o.name}</span>
                        <span style={{ fontSize: "11px", color: T.muted, padding: "2px 8px", borderRadius: "999px", background: T.raised, textTransform: "capitalize" }}>
                          {o.offeringType}
                        </span>
                      </div>
                      {o.breadcrumb && (
                        <div style={{ fontSize: "12px", color: T.muted, marginTop: "4px" }}>{o.breadcrumb}</div>
                      )}
                      {o.description && (
                        <div style={{ fontSize: "12.5px", color: T.body, marginTop: "6px", lineHeight: 1.5 }}>
                          {o.description.slice(0, 180)}{o.description.length > 180 ? "…" : ""}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 1 — Delivery context */}
      {step === 1 && (
        <div style={cardS}>
          <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: 600, color: T.accent }}>
            Where is this delivered?
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelS}>Site name</label>
              <input value={deliveryContext.siteName} onChange={(e) => setDeliveryContext({ ...deliveryContext, siteName: e.target.value })}
                style={inputS} placeholder="e.g. Northern Pit" />
            </div>
            <div>
              <label style={labelS}>Contract name</label>
              <input value={deliveryContext.contractName} onChange={(e) => setDeliveryContext({ ...deliveryContext, contractName: e.target.value })}
                style={inputS} placeholder="e.g. Northern Pit Load and Haul Contract" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelS}>Client</label>
              <input value={deliveryContext.client} onChange={(e) => setDeliveryContext({ ...deliveryContext, client: e.target.value })}
                style={inputS} placeholder="e.g. Northern Pit Mine" />
            </div>
            <div>
              <label style={labelS}>Environment</label>
              <select value={deliveryContext.environment} onChange={(e) => setDeliveryContext({ ...deliveryContext, environment: e.target.value })} style={inputS}>
                <option value="surface">Surface</option>
                <option value="underground">Underground</option>
                <option value="plant">Plant</option>
                <option value="workshop">Workshop</option>
                <option value="remote_field">Remote field</option>
                <option value="process">Process</option>
              </select>
            </div>
            <div>
              <label style={labelS}>Commodity</label>
              <input value={deliveryContext.commodity} onChange={(e) => setDeliveryContext({ ...deliveryContext, commodity: e.target.value })}
                style={inputS} placeholder="e.g. commodity.iron_ore" />
            </div>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: "12px", color: T.muted }}>
            Site and contract are separate entities in the twin — a contract can span multiple sites, and a site can host multiple contracts.
          </p>
        </div>
      )}

      {/* Step 2 — Review and edit */}
      {step === 2 && draft && (
        <div>
          <div style={cardS}>
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600, color: T.accent }}>
              Structure to create
            </h3>
            <p style={{ margin: "0 0 14px", fontSize: "12.5px", color: T.muted }}>
              We drafted this from your capability. Edit anything that needs changing before creating.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <DraftRow label="Company" value={draftEdits.company?.name}
                onChange={(v) => setDraftEdits({ ...draftEdits, company: { ...draftEdits.company, name: v } })} />
              {draftEdits.site && (
                <DraftRow label="Site" value={draftEdits.site.name}
                  onChange={(v) => setDraftEdits({ ...draftEdits, site: { ...draftEdits.site, name: v } })} />
              )}
              {draftEdits.contract && (
                <DraftRow label="Contract" value={draftEdits.contract.name}
                  onChange={(v) => setDraftEdits({ ...draftEdits, contract: { ...draftEdits.contract, name: v } })} />
              )}
              <DraftRow label="Service" value={draftEdits.service?.name}
                onChange={(v) => setDraftEdits({ ...draftEdits, service: { ...draftEdits.service, name: v } })} />
            </div>

            <div style={{ marginTop: "14px" }}>
              <label style={labelS}>Activities</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {(draftEdits.service?.activities || []).map((act, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px" }}>
                    <input value={act}
                      onChange={(e) => {
                        const next = [...draftEdits.service.activities]
                        next[i] = e.target.value
                        setDraftEdits({ ...draftEdits, service: { ...draftEdits.service, activities: next } })
                      }}
                      style={inputS} />
                    <button onClick={() => {
                      const next = draftEdits.service.activities.filter((_, idx) => idx !== i)
                      setDraftEdits({ ...draftEdits, service: { ...draftEdits.service, activities: next } })
                    }} style={{ ...btnGhost, padding: "6px 10px", color: T.red }}>Remove</button>
                  </div>
                ))}
                <button onClick={() => setDraftEdits({ ...draftEdits, service: { ...draftEdits.service, activities: [...(draftEdits.service.activities || []), ""] } })}
                  style={{ ...btnGhost, alignSelf: "flex-start", padding: "6px 12px", fontSize: "12.5px" }}>
                  + Add activity
                </button>
              </div>
            </div>

            {draftEdits.equipmentGroups?.length > 0 && (
              <div style={{ marginTop: "14px" }}>
                <label style={labelS}>Equipment groups</label>
                {draftEdits.equipmentGroups.map((g, i) => (
                  <div key={i} style={{ padding: "10px 12px", background: T.panel, borderRadius: "8px", marginBottom: "6px",
                    border: `1px solid ${T.lineSoft}`, fontSize: "13px", color: T.body }}>
                    {g.name}
                  </div>
                ))}
                <p style={{ margin: "4px 0 0", fontSize: "11.5px", color: T.muted }}>
                  You can add specific assets to each group from the Asset Register after this setup.
                </p>
              </div>
            )}

            {(!draftEdits.equipmentGroups || draftEdits.equipmentGroups.length === 0) && (
              <div style={{ marginTop: "14px", padding: "10px 12px", background: T.panel, borderRadius: "8px",
                border: `1px solid ${T.lineSoft}`, fontSize: "12.5px", color: T.body,
                display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <Info size={13} style={{ marginTop: "2px", flexShrink: 0, color: T.muted }} />
                <span>This is a non-asset service. The twin will use people, teams and service-output measures — no dummy equipment will be created.</span>
              </div>
            )}
          </div>

          {draft.complianceHints?.length > 0 && (
            <div style={{ ...cardS, background: T.amberBg, borderColor: `${T.amber}33` }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "12.5px", fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Compliance items to consider
              </h4>
              <ul style={{ margin: 0, paddingLeft: "18px", color: T.body, fontSize: "13px", lineHeight: 1.7 }}>
                {draft.complianceHints.map((h) => <li key={h}>{h}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Confirm */}
      {step === 3 && (
        <div style={cardS}>
          <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600, color: T.accent }}>
            Ready to create
          </h3>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13.5px", color: T.body, lineHeight: 1.8 }}>
            <li>Company: <strong>{draftEdits.company?.name}</strong></li>
            {draftEdits.site && <li>Site: <strong>{draftEdits.site.name}</strong></li>}
            {draftEdits.contract && <li>Contract: <strong>{draftEdits.contract.name}</strong></li>}
            <li>Service: <strong>{draftEdits.service?.name}</strong></li>
            <li>{draftEdits.service?.activities?.length || 0} activit{draftEdits.service?.activities?.length === 1 ? "y" : "ies"}</li>
            <li>{draftEdits.equipmentGroups?.length || 0} equipment group{draftEdits.equipmentGroups?.length === 1 ? "" : "s"}</li>
          </ul>
          <p style={{ margin: "14px 0 0", fontSize: "12.5px", color: T.muted }}>
            Your capability profile is not modified by this step. If a site or contract with the same name already exists, the twin will reuse it rather than duplicate it.
          </p>
        </div>
      )}

      {/* Step 4 — Result */}
      {step === 4 && result && (
        <div style={{ ...cardS, background: T.greenBg, borderColor: `${T.green}33` }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <Check size={20} color={T.green} style={{ marginTop: "2px", flexShrink: 0 }} />
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 600, color: T.green }}>
                Operational twin created
              </h3>
              <p style={{ margin: "0 0 10px", fontSize: "13.5px", color: T.body }}>
                {result.summary.nodesCreated} nodes, {result.summary.relationsCreated} relations, {result.summary.groupsCreated} group{result.summary.groupsCreated === 1 ? "" : "s"} created.
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={() => onComplete?.()} style={btnPrimary}>Open command centre</button>
                <button onClick={() => { setStep(0); setSelectedOffering(null); setDraft(null); setResult(null); setDraftEdits({}) }}
                  style={btnGhost}>Convert another offering</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {step < 4 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px" }}>
          <button onClick={back} style={btnGhost}>
            <ChevronLeft size={14} /> {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < 3 && (
            <button onClick={next}
              disabled={(step === 0 && !selectedOffering) || (step === 1 && !deliveryContext.siteName && !deliveryContext.contractName)}
              style={{ ...btnPrimary,
                opacity: ((step === 0 && !selectedOffering) || (step === 1 && !deliveryContext.siteName && !deliveryContext.contractName)) ? 0.6 : 1 }}>
              {step === 1 ? "Generate structure" : "Continue"} <ChevronRight size={14} />
            </button>
          )}
          {step === 3 && (
            <button onClick={confirm} disabled={creating} style={{ ...btnPrimary, opacity: creating ? 0.6 : 1 }}>
              {creating ? "Creating…" : "Create twin"} <Check size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function DraftRow({ label, value, onChange }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "12px", alignItems: "center" }}>
      <span style={{ fontSize: "12.5px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.4px" }}>
        {label}
      </span>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} style={inputS} />
    </div>
  )
}

const inferSectorPack = (offering) => {
  const industries = (offering.industries || []).map((i) => String(i).toLowerCase())
  if (industries.some((i) => i.includes("construction") || i.includes("infrastructure"))) return "construction"
  if (industries.some((i) => i.includes("manufactur"))) return "manufacturing"
  if (industries.some((i) => i.includes("mining"))) return "mining"
  return "mining"
}