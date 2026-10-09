"use client"

/**
 * digitalTwin/components/FirstRunWizard.jsx
 *
 * Guided first-run setup. Turns the blank tile grid into a walk-through
 * that builds the user's operating structure step by step.
 *
 * Steps:
 *   1. Objective             — what do you want to improve?
 *   2. Context               — sector pack + environment
 *   3. Delivery              — site + contract (separately)
 *   4. Service               — service + first activity
 *   5. Resources             — equipment group suggestion (asset-based only)
 *   6. Period & target       — reporting month + optional KPI target
 *   7. Preview & create      — confirm before writing anything
 *
 * Nothing is committed to Firestore until step 7. Pause and resume are
 * supported via onboardingState.
 */

import { useEffect, useMemo, useState } from "react"
import {
  ChevronLeft, ChevronRight, Check, AlertTriangle, Loader2,
  Target, MapPin, Wrench, Boxes, Calendar, Eye, Sparkles,
} from "lucide-react"
import { auth, db } from "../../firebaseConfig"
import { doc, getDoc } from "firebase/firestore"
import { ensureTenant, createNode, createRelation, getTenant } from "../services/hierarchyService"
import { createGroup } from "../services/resourceService"
import { getOnboardingState, saveOnboardingState, completeOnboarding } from "../services/onboardingState"
import { listPacks, optionsFor } from "../services/taxonomyService"
import { NODE_TYPES, RELATION_TYPES } from "../models/enums"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", faint: "#8a7a74",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#4a352f", accentSoft: "#6b4f47", accentTint: "#f4efec",
  green: "#166534", greenBg: "#f0fdf4",
  amber: "#92400e", amberBg: "#fffbeb",
  red: "#991b1b", redBg: "#fef2f2",
}

const inputS = {
  width: "100%", padding: "10px 12px",
  border: `1px solid ${T.lineStrong}`, borderRadius: "9px",
  fontSize: "14px", fontFamily: "inherit",
  boxSizing: "border-box", color: T.ink,
  background: T.bg, outline: "none",
}
const labelS = {
  display: "block", fontSize: "12.5px", fontWeight: 600,
  color: T.accent, marginBottom: "6px",
}
const cardS = {
  background: T.bg, border: `1px solid ${T.line}`,
  borderRadius: "14px", padding: "24px", marginBottom: "14px",
}

const STEPS = [
  { id: "objective", title: "What do you want to improve?", icon: Target },
  { id: "context",   title: "What kind of operation is this?", icon: Sparkles },
  { id: "delivery",  title: "Where is the work delivered?", icon: MapPin },
  { id: "service",   title: "What work is performed?", icon: Wrench },
  { id: "resources", title: "What resources deliver the work?", icon: Boxes },
  { id: "period",    title: "How will you measure success?", icon: Calendar },
  { id: "preview",   title: "Review and create", icon: Eye },
]

const OBJECTIVES = [
  {
    id: "asset_performance",
    title: "Improve asset performance",
    description: "Track availability, utilisation, productivity and downtime across your fleet or circuit.",
    hint: "Best for: mining contractors, plant operators, equipment hire, maintenance providers.",
  },
  {
    id: "tender_readiness",
    title: "Prove readiness for a tender",
    description: "Show verified capacity, compliance and credentials against a specific contract opportunity.",
    hint: "Best for: any SME responding to a procurement or ESD opportunity.",
  },
]

export default function FirstRunWizard({ tenantId, onComplete, onCancel }) {
  const [step, setStep] = useState(0)
  const [state, setState] = useState({
    objective: null,
    sectorPack: "mining",
    environment: "surface",
    siteName: "",
    contractName: "",
    clientName: "",
    serviceValueChainId: null,
    serviceId: null,
    activityName: "",
    equipmentGroupName: "",
    equipmentGroupCapacity: "",
    reportingPeriod: currentMonth(),
    targetKpiId: "kpi.physical_availability",
    targetValue: "90",
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [resumeChecked, setResumeChecked] = useState(false)

  // Load any previously-saved wizard state
  useEffect(() => {
    (async () => {
      const saved = await getOnboardingState(tenantId)
      if (saved?.objective) setState((p) => ({ ...p, ...saved }))
      if (typeof saved.currentStep === "number" && saved.currentStep > 0) setStep(saved.currentStep)
      setResumeChecked(true)
    })()
  }, [tenantId])

  // Persist on every change (debounced by React batching)
  useEffect(() => {
    if (!resumeChecked) return
    saveOnboardingState(tenantId, { ...state, currentStep: step })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, state, resumeChecked])

  const canAdvance = useMemo(() => {
    switch (STEPS[step].id) {
      case "objective": return !!state.objective
      case "context":   return !!state.sectorPack && !!state.environment
      case "delivery":  return state.siteName.trim().length > 1 || state.contractName.trim().length > 1
      case "service":   return !!state.serviceId && state.activityName.trim().length > 1
      case "resources": return true // optional
      case "period":    return !!state.reportingPeriod
      case "preview":   return true
      default: return false
    }
  }, [step, state])

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const handleCreate = async () => {
    setCreating(true); setError(null)
    try {
      // 1. Ensure tenant exists
      const user = auth.currentUser
      const profileSnap = await getDoc(doc(db, "universalProfiles", user.uid))
      const companyName = profileSnap.exists()
        ? (profileSnap.data()?.entityOverview?.registeredName || user.email)
        : user.email
      await ensureTenant({ tenantId, displayName: companyName })

      // 2. Company node
      const existingTenant = await getTenant(tenantId)
      let companyNodeId = existingTenant?.companyNodeId
      if (!companyNodeId) {
        const companies = await listNodesByType(tenantId, NODE_TYPES.COMPANY)
        if (companies.length > 0) {
          companyNodeId = companies[0].id
        } else {
          const c = await createNode(tenantId, {
            nodeType: NODE_TYPES.COMPANY,
            name: companyName,
            attributes: { objective: state.objective },
          })
          companyNodeId = c.id
          // Persist pointer on tenant root
          const { setDoc } = await import("firebase/firestore")
          await setDoc(doc(db, "digitalTwinTenants", tenantId), { companyNodeId }, { merge: true })
        }
      }

      // 3. Site
      let siteNodeId = null
      if (state.siteName.trim()) {
        const s = await createNode(tenantId, {
          nodeType: NODE_TYPES.SITE,
          name: state.siteName.trim(),
          attributes: { environment: state.environment, sectorPack: state.sectorPack },
        })
        siteNodeId = s.id
        await createRelation(tenantId, {
          fromId: companyNodeId, toId: s.id,
          relationType: RELATION_TYPES.CONTAINS, isPrimary: true,
        })
      }

      // 4. Contract
      let contractNodeId = null
      if (state.contractName.trim()) {
        const c = await createNode(tenantId, {
          nodeType: NODE_TYPES.CONTRACT,
          name: state.contractName.trim(),
          attributes: { client: state.clientName || null },
        })
        contractNodeId = c.id
        await createRelation(tenantId, {
          fromId: companyNodeId, toId: c.id,
          relationType: RELATION_TYPES.SCOPES, isPrimary: false,
        })
        if (siteNodeId) {
          await createRelation(tenantId, {
            fromId: c.id, toId: siteNodeId,
            relationType: RELATION_TYPES.DELIVERED_AT, isPrimary: true,
          })
        }
      }

      // 5. Service
      const serviceNode = await createNode(tenantId, {
        nodeType: NODE_TYPES.SERVICE,
        name: labelOfService(state.serviceId),
        attributes: { taxonomyId: state.serviceId },
      })
      const serviceParent = contractNodeId || siteNodeId
      if (serviceParent) {
        await createRelation(tenantId, {
          fromId: serviceParent, toId: serviceNode.id,
          relationType: RELATION_TYPES.SCOPES, isPrimary: true,
        })
      }

      // 6. Activity
      const activityNode = await createNode(tenantId, {
        nodeType: NODE_TYPES.ACTIVITY,
        name: state.activityName.trim(),
      })
      await createRelation(tenantId, {
        fromId: serviceNode.id, toId: activityNode.id,
        relationType: RELATION_TYPES.REALIZED_BY, isPrimary: true,
      })

      // 7. Equipment group (only if user supplied one)
      let groupId = null
      if (state.equipmentGroupName.trim()) {
        const g = await createGroup(tenantId, {
          name: state.equipmentGroupName.trim(),
          groupType: "fleet",
          nominalCapacity: state.equipmentGroupCapacity ? Number(state.equipmentGroupCapacity) : null,
          capacityUnit: "tonnes",
        })
        groupId = g.id
        await createRelation(tenantId, {
          fromId: g.id, toId: activityNode.id,
          relationType: RELATION_TYPES.SUPPORTS, isPrimary: true,
        })
      }

      // 8. Reporting period (light touch — a target row)
      const { setDoc: fsSetDoc, doc: fsDoc } = await import("firebase/firestore")
      await fsSetDoc(
        fsDoc(db, "digitalTwinTenants", tenantId, "reportingPeriods", state.reportingPeriod),
        {
          periodKey: state.reportingPeriod,
          periodType: "month",
          status: "open",
          targetKpiId: state.targetKpiId,
          targetValue: state.targetValue ? Number(state.targetValue) : null,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      )

      await completeOnboarding(tenantId, {
        objective: state.objective,
        sectorPack: state.sectorPack,
        companyNodeId,
        siteNodeId,
        contractNodeId,
        serviceNodeId: serviceNode.id,
        activityNodeId: activityNode.id,
        groupId,
      })

      onComplete?.({
        companyNodeId, siteNodeId, contractNodeId,
        serviceNodeId: serviceNode.id, activityNodeId: activityNode.id, groupId,
      })
    } catch (err) {
      console.error("Twin creation failed:", err)
      setError(err.message || "Could not create your twin. Please try again.")
    } finally {
      setCreating(false)
    }
  }

  if (!resumeChecked) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: T.muted }}>
        <Loader2 className="animate-spin" size={22} style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 13 }}>Preparing your setup…</div>
      </div>
    )
  }

  const ActiveIcon = STEPS[step].icon

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
          <div style={{
            display: "inline-flex", width: "36px", height: "36px",
            borderRadius: "10px", background: T.accentTint,
            alignItems: "center", justifyContent: "center",
          }}>
            <ActiveIcon size={18} color={T.accent} />
          </div>
          <div style={{ fontSize: "12.5px", color: T.muted, fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase" }}>
            Step {step + 1} of {STEPS.length}
          </div>
        </div>
        <h2 style={{
          margin: "0 0 6px", fontSize: "24px",
          fontWeight: 700, color: T.accent, letterSpacing: "-0.4px",
        }}>
          {STEPS[step].title}
        </h2>
        <p style={{ margin: 0, fontSize: "14px", color: T.muted, lineHeight: 1.5 }}>
          {stepCopy(STEPS[step].id)}
        </p>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "22px" }}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{
            flex: 1, height: "4px", borderRadius: "2px",
            background: i <= step ? T.accent : T.raised,
            transition: "background 0.2s",
          }} />
        ))}
      </div>

      {/* Step content */}
      <div style={cardS}>
        {STEPS[step].id === "objective" && (
          <StepObjective value={state.objective} onChange={(objective) => setState({ ...state, objective })} />
        )}
        {STEPS[step].id === "context" && (
          <StepContext
            sectorPack={state.sectorPack}
            environment={state.environment}
            onSectorChange={(sectorPack) => setState({ ...state, sectorPack })}
            onEnvironmentChange={(environment) => setState({ ...state, environment })}
          />
        )}
        {STEPS[step].id === "delivery" && (
          <StepDelivery
            value={state}
            onChange={(patch) => setState({ ...state, ...patch })}
          />
        )}
        {STEPS[step].id === "service" && (
          <StepService
            sectorPack={state.sectorPack}
            valueChainId={state.serviceValueChainId}
            serviceId={state.serviceId}
            activityName={state.activityName}
            onChange={(patch) => setState({ ...state, ...patch })}
          />
        )}
        {STEPS[step].id === "resources" && (
          <StepResources
            objective={state.objective}
            serviceId={state.serviceId}
            equipmentGroupName={state.equipmentGroupName}
            equipmentGroupCapacity={state.equipmentGroupCapacity}
            onChange={(patch) => setState({ ...state, ...patch })}
          />
        )}
        {STEPS[step].id === "period" && (
          <StepPeriod
            reportingPeriod={state.reportingPeriod}
            targetKpiId={state.targetKpiId}
            targetValue={state.targetValue}
            onChange={(patch) => setState({ ...state, ...patch })}
          />
        )}
        {STEPS[step].id === "preview" && <StepPreview state={state} />}

        {error && (
          <div style={{
            marginTop: "16px",
            padding: "12px 14px", borderRadius: "10px",
            background: T.redBg, border: `1px solid ${T.red}33`,
            color: T.red, fontSize: "13px",
            display: "flex", alignItems: "flex-start", gap: "8px",
          }}>
            <AlertTriangle size={15} style={{ marginTop: 2, flexShrink: 0 }} />
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginTop: "18px",
      }}>
        <button
          type="button"
          onClick={step === 0 ? onCancel : back}
          style={{
            padding: "10px 18px", borderRadius: "9px",
            background: T.bg, color: T.body,
            border: `1px solid ${T.lineStrong}`,
            fontSize: "13.5px", fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", gap: "6px",
          }}>
          <ChevronLeft size={14} />
          {step === 0 ? "Cancel" : "Back"}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!canAdvance}
            onClick={next}
            style={{
              padding: "10px 20px", borderRadius: "9px",
              background: T.accent, color: "#fff",
              border: `1px solid ${T.accent}`,
              fontSize: "13.5px", fontWeight: 600,
              cursor: canAdvance ? "pointer" : "not-allowed",
              opacity: canAdvance ? 1 : 0.5,
              fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", gap: "6px",
            }}>
            Continue <ChevronRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            disabled={creating}
            onClick={handleCreate}
            style={{
              padding: "10px 22px", borderRadius: "9px",
              background: T.accent, color: "#fff",
              border: `1px solid ${T.accent}`,
              fontSize: "13.5px", fontWeight: 600,
              cursor: creating ? "not-allowed" : "pointer",
              opacity: creating ? 0.6 : 1,
              fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", gap: "7px",
            }}>
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {creating ? "Creating your twin…" : "Create my twin"}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

async function listNodesByType(tenantId, nodeType) {
  const { listNodes } = await import("../services/hierarchyService")
  return listNodes(tenantId, { nodeType, status: "active" })
}

function labelOfService(serviceId) {
  if (!serviceId) return "New service"
  const { getTerm } = require("../services/taxonomyService")
  return getTerm(serviceId)?.name || serviceId
}

function stepCopy(stepId) {
  const map = {
    objective: "We'll configure the smallest useful workspace around your goal.",
    context: "This determines the recommended services, equipment and KPIs we'll suggest.",
    delivery: "A site is a physical location. A contract is commercial scope. They are separate — you can have one, the other, or both.",
    service: "Tell us what work is performed here. We'll pull the canonical taxonomy so your data lines up with the rest of the platform.",
    resources: "If this service uses physical equipment, name the fleet. Skip if it's people, teams or consumables only.",
    period: "We'll open a reporting period for you. This drives monthly KPI calculation.",
    preview: "Nothing has been saved yet. Review everything before we create your operating structure.",
  }
  return map[stepId] || ""
}

// ── Step components ─────────────────────────────────────────────────────────

function StepObjective({ value, onChange }) {
  return (
    <div style={{ display: "grid", gap: "10px" }}>
      {OBJECTIVES.map((o) => {
        const active = value === o.id
        return (
          <button key={o.id} type="button" onClick={() => onChange(o.id)}
            style={{
              textAlign: "left", padding: "16px 18px",
              border: `1.5px solid ${active ? T.accent : T.line}`,
              background: active ? T.accentTint : T.bg,
              borderRadius: "12px", cursor: "pointer",
              fontFamily: "inherit", transition: "all 0.12s",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "15.5px", fontWeight: 600, color: T.accent, marginBottom: "4px" }}>
                  {o.title}
                </div>
                <div style={{ fontSize: "13px", color: T.body, lineHeight: 1.5 }}>
                  {o.description}
                </div>
                <div style={{ fontSize: "11.5px", color: T.muted, marginTop: "6px", fontStyle: "italic" }}>
                  {o.hint}
                </div>
              </div>
              {active && (
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: T.accent, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Check size={12} />
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function StepContext({ sectorPack, environment, onSectorChange, onEnvironmentChange }) {
  const packs = listPacks()
  const envs = [
    { id: "surface",      label: "Surface operations" },
    { id: "underground",  label: "Underground" },
    { id: "plant",        label: "Processing plant" },
    { id: "workshop",     label: "Workshop or depot" },
    { id: "remote_field", label: "Remote field work" },
  ]
  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <label style={labelS}>Sector pack</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {packs.map((p) => {
            const active = sectorPack === p.key
            return (
              <button key={p.key} type="button" onClick={() => onSectorChange(p.key)}
                style={{
                  textAlign: "left", padding: "12px 14px",
                  border: `1.5px solid ${active ? T.accent : T.line}`,
                  background: active ? T.accentTint : T.bg,
                  borderRadius: "10px", cursor: "pointer",
                  fontFamily: "inherit",
                }}>
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: T.accent }}>
                  {humanizePack(p.key)}
                </div>
                <div style={{ fontSize: "11.5px", color: T.muted, marginTop: "2px" }}>
                  v{p.version}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label style={labelS}>Environment</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {envs.map((e) => {
            const active = environment === e.id
            return (
              <button key={e.id} type="button" onClick={() => onEnvironmentChange(e.id)}
                style={{
                  padding: "8px 14px", borderRadius: "999px",
                  border: `1.5px solid ${active ? T.accent : T.lineStrong}`,
                  background: active ? T.accent : T.bg,
                  color: active ? "#fff" : T.body,
                  fontSize: "13px", fontWeight: 500,
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                {e.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StepDelivery({ value, onChange }) {
  return (
    <div style={{ display: "grid", gap: "14px" }}>
      <div>
        <label style={labelS}>Site name</label>
        <input
          value={value.siteName}
          onChange={(e) => onChange({ siteName: e.target.value })}
          placeholder="e.g. Northern Pit"
          style={inputS}
        />
        <p style={{ margin: "5px 0 0", fontSize: "11.5px", color: T.muted }}>
          A physical location. Skip if the work isn't tied to one place.
        </p>
      </div>

      <div>
        <label style={labelS}>Contract name (optional)</label>
        <input
          value={value.contractName}
          onChange={(e) => onChange({ contractName: e.target.value })}
          placeholder="e.g. Northern Pit Load and Haul Contract"
          style={inputS}
        />
        <p style={{ margin: "5px 0 0", fontSize: "11.5px", color: T.muted }}>
          Commercial scope. A contract can span multiple sites — they are separate in the twin.
        </p>
      </div>

      <div>
        <label style={labelS}>Client (optional)</label>
        <input
          value={value.clientName}
          onChange={(e) => onChange({ clientName: e.target.value })}
          placeholder="e.g. Northern Pit Mine"
          style={inputS}
        />
      </div>
    </div>
  )
}

function StepService({ sectorPack, valueChainId, serviceId, activityName, onChange }) {
  const valueChains = optionsFor({ packKey: sectorPack, domain: "value_chain" })
  const services = valueChainId
    ? optionsFor({ packKey: sectorPack, domain: "service", parentId: valueChainId })
    : []

  return (
    <div style={{ display: "grid", gap: "14px" }}>
      <div>
        <label style={labelS}>Value chain stage</label>
        <select
          value={valueChainId || ""}
          onChange={(e) => onChange({ serviceValueChainId: e.target.value || null, serviceId: null })}
          style={inputS}>
          <option value="">— Select a stage —</option>
          {valueChains.map((vc) => <option key={vc.id} value={vc.id}>{vc.name}</option>)}
        </select>
      </div>

      {valueChainId && (
        <div>
          <label style={labelS}>Service</label>
          <select
            value={serviceId || ""}
            onChange={(e) => onChange({ serviceId: e.target.value || null })}
            style={inputS}>
            <option value="">— Select a service —</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      <div>
        <label style={labelS}>First activity</label>
        <input
          value={activityName}
          onChange={(e) => onChange({ activityName: e.target.value })}
          placeholder="e.g. Haul ore from loading area to primary crusher"
          style={inputS}
        />
        <p style={{ margin: "5px 0 0", fontSize: "11.5px", color: T.muted }}>
          The operational work that produces the service output. You can add more later.
        </p>
      </div>
    </div>
  )
}

function StepResources({ objective, serviceId, equipmentGroupName, equipmentGroupCapacity, onChange }) {
  const isAssetBased = objective === "asset_performance"

  if (!isAssetBased) {
    return (
      <div style={{
        padding: "16px 18px", background: T.panel,
        borderRadius: "10px", border: `1px solid ${T.lineSoft}`,
        fontSize: "13.5px", color: T.body, lineHeight: 1.6,
      }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <Boxes size={15} style={{ marginTop: 2, flexShrink: 0, color: T.muted }} />
          <div>
            This objective doesn't require an equipment fleet. Your twin will track
            people, teams and service outputs. You can add equipment later if your
            delivery model changes.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "grid", gap: "14px" }}>
      <div>
        <label style={labelS}>Equipment group name</label>
        <input
          value={equipmentGroupName}
          onChange={(e) => onChange({ equipmentGroupName: e.target.value })}
          placeholder="e.g. 100 tonne haul fleet"
          style={inputS}
        />
      </div>

      <div>
        <label style={labelS}>Nominal capacity (optional)</label>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="number"
            value={equipmentGroupCapacity}
            onChange={(e) => onChange({ equipmentGroupCapacity: e.target.value })}
            placeholder="e.g. 200"
            style={{ ...inputS, flex: 1 }}
          />
          <div style={{
            padding: "10px 14px", borderRadius: "9px",
            background: T.panel, border: `1px solid ${T.lineSoft}`,
            fontSize: "13px", color: T.muted, display: "flex", alignItems: "center",
          }}>tonnes</div>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: "12px", color: T.muted, lineHeight: 1.5 }}>
        You'll add individual assets (trucks, rigs, etc.) to this group after setup.
        You can skip this step and import your fleet later.
      </p>
    </div>
  )
}

function StepPeriod({ reportingPeriod, targetKpiId, targetValue, onChange }) {
  return (
    <div style={{ display: "grid", gap: "14px" }}>
      <div>
        <label style={labelS}>First reporting period</label>
        <input
          type="month"
          value={reportingPeriod}
          onChange={(e) => onChange({ reportingPeriod: e.target.value })}
          style={inputS}
        />
      </div>

      <div>
        <label style={labelS}>Primary target KPI</label>
        <select
          value={targetKpiId || ""}
          onChange={(e) => onChange({ targetKpiId: e.target.value })}
          style={inputS}>
          <option value="kpi.physical_availability">Physical availability</option>
          <option value="kpi.utilisation">Utilisation of available time</option>
          <option value="kpi.productivity">Productivity</option>
          <option value="kpi.cost_per_unit">Cost per tonne</option>
          <option value="kpi.pm_adherence">PM adherence</option>
        </select>
      </div>

      <div>
        <label style={labelS}>Target value</label>
        <input
          type="number"
          value={targetValue}
          onChange={(e) => onChange({ targetValue: e.target.value })}
          placeholder="e.g. 90"
          style={inputS}
        />
        <p style={{ margin: "5px 0 0", fontSize: "11.5px", color: T.muted }}>
          We'll compare everything you capture against this target and flag when you drift.
        </p>
      </div>
    </div>
  )
}

function StepPreview({ state }) {
  const serviceLabel = state.serviceId
    ? labelOfService(state.serviceId)
    : null

  return (
    <div>
      <div style={{ fontSize: "13px", color: T.body, lineHeight: 1.6, marginBottom: "16px" }}>
        Nothing has been saved yet. When you click <strong>Create my twin</strong>,
        we'll write these records under your organisation.
      </div>

      <TreeRow label="Organisation" value="Your registered company name" depth={0} />
      {state.siteName && <TreeRow label="Site" value={state.siteName} depth={1} />}
      {state.contractName && <TreeRow label="Contract" value={state.contractName} depth={1} />}
      {serviceLabel && <TreeRow label="Service" value={serviceLabel} depth={2} />}
      {state.activityName && <TreeRow label="Activity" value={state.activityName} depth={3} />}
      {state.equipmentGroupName && <TreeRow label="Equipment group" value={state.equipmentGroupName} depth={3} />}
      {state.reportingPeriod && (
        <TreeRow label="Reporting period" value={`${state.reportingPeriod} — ${state.targetValue}% on ${state.targetKpiId?.split(".").pop()}`} depth={1} />
      )}

      <div style={{
        marginTop: "20px", padding: "14px 16px",
        background: T.panel, borderRadius: "10px",
        border: `1px solid ${T.lineSoft}`,
        fontSize: "12.5px", color: T.body, lineHeight: 1.6,
      }}>
        <strong style={{ color: T.accent }}>A note on what happens next:</strong> after
        creation, you'll see the Operations Command Centre. It'll be empty until you
        add assets and capture shift data. We'll walk you through that from the
        command centre itself.
      </div>
    </div>
  )
}

function TreeRow({ label, value, depth }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      paddingLeft: `${depth * 20 + 4}px`,
      paddingTop: "6px", paddingBottom: "6px",
      fontSize: "13.5px",
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: T.accent, flexShrink: 0,
      }} />
      <span style={{ fontSize: "11px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.4px", fontWeight: 600, minWidth: "96px" }}>
        {label}
      </span>
      <span style={{ color: T.ink, fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function humanizePack(key) {
  const map = {
    mining: "Mining & mineral processing",
    industrial_support: "Industrial support services",
    construction: "Construction & infrastructure",
    manufacturing: "Manufacturing & processing",
  }
  return map[key] || key
}