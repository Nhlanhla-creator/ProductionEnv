"use client"

/**
 * digitalTwin/components/SectorPackLoader.jsx
 *
 * Admin view for browsing and activating sector packs (Brief Section 5.2,
 * 15 Slice 5). The core model is unchanged when a new pack is loaded — the
 * pack extends services, activities, equipment, compliance and KPI
 * applicability without touching the engine.
 *
 * Writes pack-activation records to Firestore under
 *   digitalTwinTenants/{tenantId}/activePacks/{packKey}
 * so the taxonomy service can surface the right sectors for a tenant.
 */

import { useEffect, useState } from "react"
import { Check, Info, Layers, Package } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { listPacks, getPack } from "../services/taxonomyService"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", faint: "#8a7a74",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#4a352f", accentSoft: "#6b4f47", accentTint: "#f4efec",
  green: "#166534", greenBg: "#f0fdf4",
  amber: "#92400e", amberBg: "#fffbeb",
  red: "#991b1b", redBg: "#fef2f2",
}

const btnBase = { padding: "9px 16px", borderRadius: "8px", fontSize: "13.5px", fontWeight: 500,
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: "inherit" }
const btnPrimary = { ...btnBase, background: T.accent, color: "#fff", border: `1px solid ${T.accent}`, fontWeight: 600 }
const btnGhost   = { ...btnBase, background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}` }
const cardS = { background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "16px", marginBottom: "14px" }

const PACK_META = {
  mining: {
    displayName: "Mining and mineral processing",
    description: "Full value chain from exploration through beneficiation and load-out. Includes surface and underground context rules and the Slice 1A load-and-haul KPI pack.",
    accent: "#1e3a8a",
  },
  industrial_support: {
    displayName: "Industrial support services",
    description: "Non-asset and light-asset services — cleaning, security, medical, laboratories, logistics and professional. Proves configurable depth without dummy equipment.",
    accent: "#0e7490",
  },
  construction: {
    displayName: "Construction & infrastructure",
    description: "Building, civil, roads, MEP and specialist subcontracting. Includes CIDB/SACPCMP compliance hints and earthworks KPI pack.",
    accent: "#b45309",
  },
  manufacturing: {
    displayName: "Manufacturing & processing",
    description: "Discrete, batch, continuous, foundry and packaging. Adds OEE, yield and throughput KPI packs.",
    accent: "#6d28d9",
  },
}

export default function SectorPackLoader({ tenantId, onBack }) {
  const [packs, setPacks] = useState([])
  const [activeKeys, setActiveKeys] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    (async () => {
      if (!tenantId) return
      setLoading(true)
      try {
        const listed = listPacks()      // built-in packs from the taxonomy service
        setPacks(listed)

        // Read which are active for this tenant
        const snap = await getDocs(collection(db, "digitalTwinTenants", tenantId, "activePacks"))
        const actives = new Set(snap.docs.map((d) => d.id))
        setActiveKeys(actives)
      } finally { setLoading(false) }
    })()
  }, [tenantId])

  const activate = async (packKey) => {
    setBusyKey(packKey); setError(null)
    try {
      const pack = getPack(packKey)
      if (!pack) throw new Error(`Unknown pack: ${packKey}`)
      const ref = doc(db, "digitalTwinTenants", tenantId, "activePacks", packKey)
      await setDoc(ref, {
        packKey,
        version: pack.version,
        activatedAt: new Date().toISOString(),
        activatedBy: auth.currentUser?.uid || null,
      }, { merge: true })
      setActiveKeys((prev) => new Set([...prev, packKey]))
    } catch (err) {
      setError(err.message)
    } finally { setBusyKey(null) }
  }

  const deactivate = async (packKey) => {
    if (!window.confirm(`Deactivate "${packKey}"? Existing twin data is preserved but the pack will no longer drive selectors or KPI suggestions.`)) return
    setBusyKey(packKey); setError(null)
    try {
      const ref = doc(db, "digitalTwinTenants", tenantId, "activePacks", packKey)
      await updateDoc(ref, {
        deactivatedAt: new Date().toISOString(),
        deactivatedBy: auth.currentUser?.uid || null,
      }).catch(async () => {
        // Fallback: mark as inactive via setDoc with merge
        await setDoc(ref, { deactivatedAt: new Date().toISOString(), deactivatedBy: auth.currentUser?.uid || null }, { merge: true })
      })
      setActiveKeys((prev) => {
        const next = new Set(prev)
        next.delete(packKey)
        return next
      })
    } catch (err) {
      setError(err.message)
    } finally { setBusyKey(null) }
  }

  return (
    <div>
      {onBack && <button onClick={onBack} style={{ ...btnGhost, marginBottom: "14px" }}>← Back</button>}

      <div style={{ marginBottom: "18px" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 700, color: T.accent, letterSpacing: "-0.3px" }}>
          Sector packs
        </h2>
        <p style={{ margin: 0, fontSize: "13.5px", color: T.muted }}>
          A pack extends your tenant with sectors, service and activity taxonomies, equipment classes, compliance obligations and KPI applicability. Loading a pack never modifies the core model.
        </p>
      </div>

      {error && (
        <div style={{ padding: "12px 14px", background: T.redBg, border: `1px solid ${T.red}33`, borderRadius: "10px",
          color: T.red, fontSize: "13.5px", marginBottom: "14px" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: T.muted }}>Loading packs…</div>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          {packs.map((pack) => {
            const meta = PACK_META[pack.key] || { displayName: pack.key, description: "", accent: T.accent }
            const active = activeKeys.has(pack.key)
            const fullPack = getPack(pack.key)
            const stats = computePackStats(fullPack)

            return (
              <div key={pack.key} style={{ ...cardS, borderLeft: `4px solid ${meta.accent}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 380px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <Layers size={18} color={meta.accent} />
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: T.accent }}>{meta.displayName}</h3>
                      {active && (
                        <span style={{ padding: "3px 10px", borderRadius: "999px", background: T.greenBg, color: T.green,
                          fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Check size={10} /> Active
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "0 0 10px", fontSize: "13px", color: T.body, lineHeight: 1.6 }}>
                      {meta.description}
                    </p>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12.5px", color: T.muted }}>
                      <span><Package size={12} style={{ display: "inline", marginRight: "4px" }} />{stats.valueChains} value chains</span>
                      <span>{stats.services} services</span>
                      <span>{stats.activities} activities</span>
                      <span>{stats.equipmentFamilies} equipment families</span>
                      <span>{stats.kpiPacks} KPI pack{stats.kpiPacks === 1 ? "" : "s"}</span>
                      <span style={{ color: T.faint }}>v{pack.version}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {active ? (
                      <button onClick={() => deactivate(pack.key)} disabled={busyKey === pack.key}
                        style={{ ...btnGhost, opacity: busyKey === pack.key ? 0.6 : 1 }}>
                        Deactivate
                      </button>
                    ) : (
                      <button onClick={() => activate(pack.key)} disabled={busyKey === pack.key}
                        style={{ ...btnPrimary, opacity: busyKey === pack.key ? 0.6 : 1 }}>
                        {busyKey === pack.key ? "Activating…" : "Activate pack"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Sector summary */}
                {fullPack?.sector?.children && (
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${T.lineSoft}` }}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {fullPack.sector.children.map((child) => (
                        <span key={child.id} style={{ padding: "3px 10px", borderRadius: "999px", background: T.panel,
                          color: T.body, fontSize: "11.5px", border: `1px solid ${T.lineSoft}` }}>
                          {child.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ ...cardS, background: T.panel, marginTop: "14px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "12.5px", color: T.body }}>
          <Info size={14} style={{ marginTop: "2px", flexShrink: 0, color: T.muted }} />
          <span>
            Activating a pack unlocks its sectors, service taxonomy and KPI packs for this tenant.
            Existing twin records keep their original taxonomy version — activation does not rewrite history.
          </span>
        </div>
      </div>
    </div>
  )
}

const computePackStats = (pack) => {
  if (!pack) return { valueChains: 0, services: 0, activities: 0, equipmentFamilies: 0, kpiPacks: 0 }
  const vcs = pack.valueChain || []
  let services = 0, activities = 0, equipmentFamilies = 0
  vcs.forEach((vc) => {
    services += (vc.services || []).length
    activities += (vc.services || []).reduce((sum, s) => sum + (s.activities?.length || 0), 0)
    equipmentFamilies += (vc.equipmentFamilies || []).length
  })
  return {
    valueChains: vcs.length,
    services,
    activities,
    equipmentFamilies,
    kpiPacks: Object.keys(pack.kpiPacks || {}).length,
  }
}