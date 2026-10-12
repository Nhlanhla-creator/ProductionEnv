"use client"

/**
 * digitalTwin/components/CapacityReadinessPanel.jsx
 *
 * Capacity and readiness (Brief Sections 1.3, 7.1). Shows the deployable
 * capacity of a group or site — the number of distinct active assets,
 * their derated capacity, and any readiness gaps (expired compliance,
 * criticality of unavailable assets).
 *
 * "Asset-group capacity uses distinct active assets after assignment
 * allocation; it is not the sum of repeated appearances across service
 * and contract views." — Brief §7.7 #5
 */

import { useEffect, useState } from "react"
import { CheckCircle2, AlertTriangle, XCircle, Boxes, Users } from "lucide-react"
import { listResources, listGroups, countDistinctActiveAssets } from "../services/resourceService"
import { RESOURCE_KIND, CRITICALITY } from "../models/assetSchema"
import { ASSET_STATUS } from "../models/enums"

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
const btnGhost = { ...btnBase, background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}` }
const cardS = { background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "16px" }

export default function CapacityReadinessPanel({ tenantId, onBack }) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [panelData, setPanelData] = useState({})

  useEffect(() => {
    (async () => {
      if (!tenantId) return
      setLoading(true)
      try {
        const gs = await listGroups(tenantId)
        setGroups(gs)

        // Load readiness data for each group
        const data = {}
        for (const g of gs) {
          data[g.id] = await computeGroupReadiness(tenantId, g)
        }
        setPanelData(data)
      } catch (err) {
        console.error(err)
      } finally { setLoading(false) }
    })()
  }, [tenantId])

  return (
    <div>
      {onBack && <button onClick={onBack} style={{ ...btnGhost, marginBottom: "14px" }}>← Back</button>}

      <div style={{ marginBottom: "18px" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 700, color: T.accent, letterSpacing: "-0.3px" }}>
          Capacity & readiness
        </h2>
        <p style={{ margin: 0, fontSize: "13.5px", color: T.muted }}>
          Deployable capacity per group — distinct active assets after assignment allocation, with compliance and availability gaps.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: T.muted }}>Calculating readiness…</div>
      ) : groups.length === 0 ? (
        <div style={cardS}>
          <p style={{ margin: 0, fontSize: "13.5px", color: T.muted, fontStyle: "italic" }}>
            No equipment groups yet. Create one from the Equipment Groups screen.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "14px" }}>
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} data={panelData[g.id]} />
          ))}
        </div>
      )}
    </div>
  )
}

function GroupCard({ group, data }) {
  if (!data) {
    return (
      <div style={cardS}>
        <h3 style={{ margin: "0 0 8px", fontSize: "15.5px", fontWeight: 600, color: T.accent }}>{group.name}</h3>
        <p style={{ margin: 0, fontSize: "13px", color: T.muted }}>Loading…</p>
      </div>
    )
  }

  const { assets, activeCount, compliantCount, nominalCapacity, deployableCapacity, readinessPercent } = data

  const readinessColor = readinessPercent >= 90 ? T.green : readinessPercent >= 70 ? T.amber : T.red
  const readinessBg = readinessPercent >= 90 ? T.greenBg : readinessPercent >= 70 ? T.amberBg : T.redBg

  return (
    <div style={cardS}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", gap: "12px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "15.5px", fontWeight: 600, color: T.accent }}>{group.name}</h3>
          <div style={{ fontSize: "12px", color: T.muted, textTransform: "capitalize", marginTop: "2px" }}>{group.groupType}</div>
        </div>
        <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "12.5px", fontWeight: 700,
          background: readinessBg, color: readinessColor }}>
          {readinessPercent}% ready
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
        <Stat label="Active assets" value={`${activeCount} of ${assets.length}`} icon={<Boxes size={13} />} />
        <Stat label="Compliant" value={`${compliantCount} of ${activeCount}`} icon={<CheckCircle2 size={13} />} />
        <Stat label="Nominal capacity" value={nominalCapacity !== null ? `${nominalCapacity} ${group.capacityUnit}` : "—"} />
        <Stat label="Deployable capacity" value={deployableCapacity !== null ? `${deployableCapacity} ${group.capacityUnit}` : "—"} />
      </div>

      {/* Compliance summary */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px" }}>
        <AlertRow icon={<CheckCircle2 size={13} color={T.green} />} label="Available & compliant" value={data.statusCounts.available} />
        {data.statusCounts.standby > 0 && <AlertRow icon={<AlertTriangle size={13} color={T.amber} />} label="Standby" value={data.statusCounts.standby} />}
        {data.statusCounts.planned_maintenance > 0 && <AlertRow icon={<AlertTriangle size={13} color={T.amber} />} label="Planned maintenance" value={data.statusCounts.planned_maintenance} />}
        {data.statusCounts.unplanned_downtime > 0 && <AlertRow icon={<XCircle size={13} color={T.red} />} label="Unplanned downtime" value={data.statusCounts.unplanned_downtime} />}
        {data.complianceIssues.length > 0 && (
          <div style={{ marginTop: "6px", padding: "8px 10px", background: T.redBg, borderRadius: "6px",
            border: `1px solid ${T.red}33`, color: T.red, fontSize: "12px" }}>
            <strong>{data.complianceIssues.length} compliance issue{data.complianceIssues.length === 1 ? "" : "s"}:</strong> {data.complianceIssues.slice(0, 3).join(", ")}{data.complianceIssues.length > 3 ? ` +${data.complianceIssues.length - 3} more` : ""}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, icon }) {
  return (
    <div style={{ padding: "10px 12px", background: T.panel, borderRadius: "8px", border: `1px solid ${T.lineSoft}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10.5px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "3px" }}>
        {icon}{label}
      </div>
      <div style={{ fontSize: "14.5px", fontWeight: 600, color: T.ink, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  )
}

function AlertRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: T.body }}>{icon}{label}</span>
      <span style={{ fontWeight: 600, color: T.ink, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  )
}

// ── Readiness computation ─────────────────────────────────────────────────
const computeGroupReadiness = async (tenantId, group) => {
  const assets = await listResources(tenantId, { groupId: group.id, resourceKind: RESOURCE_KIND.ASSET, pageSize: 2000 })

  // Distinct active count — Section 7.7 #5
  const distinctActive = await countDistinctActiveAssets(tenantId, { groupId: group.id })

  const statusCounts = {
    available: 0, operating: 0, standby: 0, planned_maintenance: 0,
    unplanned_downtime: 0, commissioning: 0, suspended: 0, planned: 0,
    retired: 0, disposed: 0,
  }
  let compliantCount = 0
  let deployableCapacity = 0
  let nominalCapacity = 0
  const complianceIssues = []
  const now = new Date()

  assets.forEach((a) => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1

    const isCompliant =
      (!a.inspectionExpiryDate || new Date(a.inspectionExpiryDate) >= now)
      && (!a.certificateExpiryDate || new Date(a.certificateExpiryDate) >= now)

    if (isCompliant) compliantCount += 1
    else {
      const name = a.name || a.internalNumber || a.id.slice(0, 6)
      complianceIssues.push(name)
    }

    if (a.nameplateCapacity != null) nominalCapacity += Number(a.nameplateCapacity)

    // Deployable: available OR operating, and compliant
    if ((a.status === ASSET_STATUS.AVAILABLE || a.status === ASSET_STATUS.OPERATING) && isCompliant) {
      const cap = a.currentDeratedCapacity != null ? Number(a.currentDeratedCapacity)
        : a.nameplateCapacity != null ? Number(a.nameplateCapacity) : 0
      deployableCapacity += cap
    }
  })

  const activeCount = distinctActive
  const readinessPercent = activeCount > 0 ? Math.round((compliantCount / activeCount) * 100) : 0

  return {
    assets,
    activeCount,
    compliantCount,
    nominalCapacity: Math.round(nominalCapacity),
    deployableCapacity: Math.round(deployableCapacity),
    readinessPercent,
    statusCounts,
    complianceIssues,
  }
}