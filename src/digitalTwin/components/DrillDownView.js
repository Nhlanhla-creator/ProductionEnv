"use client"

/**
 * digitalTwin/components/DrillDownView.jsx
 *
 * Screen 5 from the brief: "Why is availability below target?"
 *
 * Every level preserves the same formula and exposes its contributing time
 * components. The percentages are recomputed from components at every level
 * — never averaged from children.
 *
 * Also shows a side panel explaining the leaf asset's specific
 * contribution, matching the brief's "TRK 014 explanation" box.
 */

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ChevronRight, ChevronDown, Info, AlertTriangle } from "lucide-react"
import { drillDown, periodToWindow } from "../services/aggregationService"
import { listDowntimeEvents, DOWNTIME_TAXONOMY } from "../services/downtimeService"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", faint: "#8a7a74",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#4a352f", accentSoft: "#6b4f47", accentTint: "#f4efec",
  header: "#33231e",
  green: "#166534", greenBg: "#f0fdf4",
  amber: "#92400e", amberBg: "#fffbeb",
  red: "#991b1b", redBg: "#fef2f2",
  blue: "#1e40af",
}

const btnBase = { padding: "9px 16px", borderRadius: "8px", fontSize: "13.5px", fontWeight: 500,
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: "inherit" }
const btnGhost = { ...btnBase, background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}` }
const cardS = { background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "16px" }

const NODE_TYPE_LABEL = {
  company: "Company",
  division: "Division",
  site: "Site",
  contract: "Contract",
  facility: "Facility",
  process_area: "Process area",
  service: "Service",
  activity: "Activity",
  equipment_group: "Equipment group",
  equipment_family: "Equipment family",
  equipment_type: "Equipment type",
  asset: "Asset",
}

export default function DrillDownView({
  tenantId,
  kpiId,
  rootNodeId,
  periodLabel,
  onBack,
  onOpenLineage,
}) {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [expanded, setExpanded] = useState({})
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedDowntime, setSelectedDowntime] = useState([])
  const [loadingDowntime, setLoadingDowntime] = useState(false)

  useEffect(() => {
    (async () => {
      if (!tenantId || !rootNodeId) return
      setLoading(true)
      try {
        const { rows: drillRows } = await drillDown(tenantId, { kpiId, rootNodeId, periodLabel, maxDepth: 8 })
        setRows(drillRows)
        // Expand all by default
        const e = {}
        drillRows.forEach((r) => { e[r.nodeId] = true })
        setExpanded(e)
        // Default-select the deepest row that has a value
        const deepest = [...drillRows].reverse().find((r) => r.kpiResult?.value !== null)
        if (deepest) handleSelectNode(deepest)
      } catch (err) {
        console.error("Drill-down failed:", err)
      } finally { setLoading(false) }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, kpiId, rootNodeId, periodLabel])

  const handleSelectNode = async (row) => {
    setSelectedNode(row)
    // If it's a leaf asset, load its downtime events for the explanation panel
    if (row.nodeType === "asset") {
      setLoadingDowntime(true)
      try {
        const period = periodToWindow(periodLabel)
        const events = await listDowntimeEvents(tenantId, {
          assetId: row.nodeId,
          startFrom: period.startFrom,
          endTo: period.endTo,
          pageSize: 100,
        })
        // Sort by duration desc, take top 5
        const sorted = [...events].sort((a, b) => (Number(b.durationHours) || 0) - (Number(a.durationHours) || 0)).slice(0, 5)
        setSelectedDowntime(sorted)
      } catch { setSelectedDowntime([]) }
      finally { setLoadingDowntime(false) }
    } else {
      setSelectedDowntime([])
    }
  }

  // Visible rows — ancestor must be expanded
  const visibleRows = useMemo(() => {
    const out = []
    const ancestorPath = {}
    for (const row of rows) {
      const parentDepth = row.depth - 1
      const parentKey = Object.keys(ancestorPath).filter((k) => ancestorPath[k] === parentDepth).pop()
      const parentExpanded = row.depth === 0 || (parentKey ? expanded[parentKey] !== false : true)
      if (parentExpanded) {
        out.push(row)
        ancestorPath[row.nodeId] = row.depth
      }
    }
    return out
  }, [rows, expanded])

  const toggle = (nodeId) => setExpanded((p) => ({ ...p, [nodeId]: !p[nodeId] }))

  const kpi = rows[0]?.kpiResult
  const kpiName = kpi?.name || "KPI"
  const kpiFormula = describeFormula(kpi)

  return (
    <div>
      {onBack && <button onClick={onBack} style={{ ...btnGhost, marginBottom: "14px" }}>← Back to command centre</button>}

      <div style={{ marginBottom: "18px" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: 700, color: T.accent, letterSpacing: "-0.4px" }}>
          Why is {kpiName.toLowerCase()} below target?
        </h2>
        <p style={{ margin: 0, fontSize: "13.5px", color: T.muted }}>
          Each level preserves the same formula and exposes its contributing time components.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "14px" }}>
        {/* Main drill-down table */}
        <div style={cardS}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: T.muted }}>Calculating across levels…</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: T.muted, fontStyle: "italic" }}>
              No hierarchy data available for this period.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.line}` }}>
                  <th style={{ padding: "10px 8px", textAlign: "left", fontSize: "11px",
                    fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Level
                  </th>
                  <th style={{ padding: "10px 8px", textAlign: "right", fontSize: "11px",
                    fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {kpiName}
                  </th>
                  <th style={{ padding: "10px 8px", textAlign: "right", fontSize: "11px",
                    fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Downtime
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const v = row.kpiResult?.value
                  const status = row.kpiResult?.status
                  const downtime = getDowntimeHours(row.kpiResult)
                  const isSelected = selectedNode?.nodeId === row.nodeId
                  const hasChildren = rows.some((r) => r.depth === row.depth + 1 && isDirectChild(rows, row, r))
                  const isExpanded = expanded[row.nodeId] !== false

                  return (
                    <tr key={row.nodeId}
                      onClick={() => handleSelectNode(row)}
                      style={{
                        cursor: "pointer",
                        background: isSelected ? T.accentTint : "transparent",
                        borderBottom: `1px solid ${T.lineSoft}`,
                      }}>
                      <td style={{ padding: "12px 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: `${row.depth * 20}px` }}>
                          {hasChildren ? (
                            <button onClick={(e) => { e.stopPropagation(); toggle(row.nodeId) }}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: T.muted }}>
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          ) : (
                            <span style={{ width: "14px" }} />
                          )}
                          <span style={{ fontSize: "14px", fontWeight: row.depth === 0 ? 700 : 500, color: row.depth === 0 ? T.accent : T.ink }}>
                            {row.nodeName}
                          </span>
                          <span style={{ fontSize: "10.5px", color: T.faint, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                            {NODE_TYPE_LABEL[row.nodeType] || row.nodeType}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        <span style={{ fontSize: "15px", fontWeight: 700,
                          color: status === "red" ? T.red : status === "amber" ? T.amber : T.ink }}>
                          {v === null || v === undefined ? "—" : `${Number(v).toFixed(1)}%`}
                        </span>
                      </td>
                      <td style={{ padding: "12px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums",
                        fontSize: "14px", color: T.body }}>
                        {downtime === null ? "—" : `${Math.round(downtime)} h`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {kpiFormula && (
            <div style={{ marginTop: "14px", padding: "12px 14px", background: T.panel, borderRadius: "8px",
              border: `1px solid ${T.lineSoft}`, fontSize: "12.5px", color: T.body,
              display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <Info size={13} style={{ marginTop: "2px", flexShrink: 0, color: T.muted }} />
              <span><strong>{kpiName} = {kpiFormula}.</strong> Percentages are recomputed from components, not averaged.</span>
            </div>
          )}
        </div>

        {/* Explanation panel */}
        <div>
          {selectedNode ? (
            <div style={cardS}>
              <h3 style={{ margin: "0 0 4px", fontSize: "14.5px", fontWeight: 700, color: T.accent }}>
                {selectedNode.nodeName} explanation
              </h3>
              <div style={{ fontSize: "11.5px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "12px" }}>
                {NODE_TYPE_LABEL[selectedNode.nodeType] || selectedNode.nodeType}
              </div>

              {selectedNode.kpiResult?.components && (
                <div style={{ marginBottom: "14px" }}>
                  {Object.entries(selectedNode.kpiResult.components).map(([key, comp]) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
                      fontSize: "12.5px", padding: "5px 0", borderBottom: `1px solid ${T.lineSoft}` }}>
                      <span style={{ color: T.body }}>{comp.label}</span>
                      <span style={{ color: T.ink, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                        {comp.total !== null && comp.total !== undefined ? `${Number(comp.total).toFixed(1)} ${comp.unit}` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {selectedNode.nodeType === "asset" && (
                <>
                  {loadingDowntime ? (
                    <div style={{ fontSize: "12.5px", color: T.muted, padding: "10px 0" }}>Loading events…</div>
                  ) : selectedDowntime.length === 0 ? (
                    <div style={{ fontSize: "12.5px", color: T.muted, fontStyle: "italic", padding: "8px 0" }}>
                      No downtime events recorded for this asset this period.
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: "11.5px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "8px" }}>
                        Top contributing events
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {selectedDowntime.map((e) => (
                          <EventRow key={e.id} event={e} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <button
                onClick={() => onOpenLineage?.(selectedNode.kpiResult)}
                style={{ ...btnGhost, marginTop: "14px", width: "100%", justifyContent: "center" }}>
                Open full lineage
              </button>
            </div>
          ) : (
            <div style={{ ...cardS, fontSize: "13px", color: T.muted, fontStyle: "italic" }}>
              Select a row to see its explanation.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Event row in the explanation panel ────────────────────────────────────
function EventRow({ event }) {
  const label = DOWNTIME_TAXONOMY[event.categoryLevel1]?.label || event.categoryLevel1?.replace(/_/g, " ")
  const hours = Number(event.durationHours) || 0
  const hh = Math.floor(hours)
  const mm = Math.round((hours - hh) * 60)
  const durationLabel = hh > 0 ? `${hh} h ${mm} min` : `${mm} min`

  return (
    <div style={{ padding: "8px 10px", background: T.panel, borderRadius: "6px", border: `1px solid ${T.lineSoft}` }}>
      <div style={{ fontSize: "12.5px", fontWeight: 600, color: T.ink }}>{event.failureMode || label}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "3px", fontSize: "11.5px" }}>
        <span style={{ color: T.muted }}>{label}</span>
        <span style={{ color: T.body, fontWeight: 600 }}>{durationLabel}</span>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────
const isDirectChild = (rows, parent, candidate) => {
  // Approximate — checks that candidate comes after parent and is the next depth+1
  const parentIdx = rows.findIndex((r) => r.nodeId === parent.nodeId)
  const candIdx = rows.findIndex((r) => r.nodeId === candidate.nodeId)
  if (parentIdx < 0 || candIdx < 0 || candIdx <= parentIdx) return false
  // Ensure no intervening row at the same or shallower depth
  for (let i = parentIdx + 1; i < candIdx; i++) {
    if (rows[i].depth <= parent.depth) return false
  }
  return candidate.depth === parent.depth + 1
}

const getDowntimeHours = (kpiResult) => {
  if (!kpiResult?.components) return null
  // Prefer explicit downtime_duration, else compute from scheduled − available
  const dd = kpiResult.components.downtime_duration
  if (dd?.total != null) return dd.total
  const s = kpiResult.components.scheduled_time?.total
  const a = kpiResult.components.available_time?.total
  if (s != null && a != null) return s - a
  return null
}

const describeFormula = (kpiResult) => {
  if (!kpiResult?.components) return null
  const comps = Object.values(kpiResult.components)
  if (comps.length === 2) return `${comps[0].label} ÷ ${comps[1].label}`
  if (comps.length === 3) return `${comps[0].label} × ${comps[1].label} × ${comps[2].label}`
  return null
}