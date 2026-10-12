"use client"

/**
 * digitalTwin/components/AssetPerformanceCommandCentre.jsx
 *
 * Screen 4 from the brief: outcome-led, exception-driven command centre.
 * Hero tiles (Availability, Utilisation, Accepted output, Cost per tonne),
 * availability-loss-by-category panel, Attention required + Recommended
 * next step.
 *
 * Every number is a real KPI calculation — click any tile to open its
 * lineage.
 */

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, XCircle, Info, TrendingUp, TrendingDown, ChevronRight } from "lucide-react"
import {
  commandCentreTiles, availabilityLossByCategory, attentionRequired, periodToWindow,
} from "../services/aggregationService"
import { getAncestryPath, listNodes } from "../services/hierarchyService"
import { NODE_TYPES } from "../models/enums"
import KpiLineageModal from "./KpiLineageModal"
import DrillDownView from "./DrillDownView"
import { auth } from "../../firebaseConfig"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", faint: "#8a7a74",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#4a352f", accentSoft: "#6b4f47", accentTint: "#f4efec",
  header: "#33231e",
  green: "#166534", greenBg: "#f0fdf4",
  amber: "#92400e", amberBg: "#fffbeb",
  red: "#991b1b", redBg: "#fef2f2",
  blue: "#1e40af", blueBg: "#eff6ff",
}

const btnBase = { padding: "9px 16px", borderRadius: "8px", fontSize: "13.5px", fontWeight: 500,
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: "inherit" }
const btnGhost = { ...btnBase, background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}` }
const cardS = { background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "16px" }

const currentMonthKey = () => {
  const d = new Date()
  return `M:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

const CATEGORY_COLORS = {
  unplanned_mechanical:       "#1e3a8a",
  operational_delay:          "#0e7490",
  planned_maintenance:        "#8a7a74",
  supply_dependency:          "#b45309",
  safety_or_regulatory:       "#991b1b",
  unplanned_electrical_or_control: "#6d28d9",
  process_dependency:         "#4d7c0f",
  weather_and_environment:    "#0369a1",
  external_or_client_delay:   "#be185d",
  commercial_or_strategic_standby: "#57534e",
}

export default function AssetPerformanceCommandCentre({ tenantId, onBack, onOpenLineage }) {
  const [loading, setLoading] = useState(true)
  const [anchor, setAnchor] = useState(null)              // root node for the current view
  const [tiles, setTiles] = useState([])
  const [lossByCategory, setLossByCategory] = useState(null)
  const [attention, setAttention] = useState([])
  const [periodLabel, setPeriodLabel] = useState(currentMonthKey())
  const [lineageKpi, setLineageKpi] = useState(null)
  const [drillKpiId, setDrillKpiId] = useState("kpi.physical_availability")
  const [showDrill, setShowDrill] = useState(false)
  const [recommendedAction, setRecommendedAction] = useState(null)

  // ── Find an anchor node — the first company node, else first site
  useEffect(() => {
    (async () => {
      if (!tenantId) return
      setLoading(true)
      try {
        const companies = await listNodes(tenantId, { nodeType: NODE_TYPES.COMPANY })
        if (companies.length > 0) { setAnchor(companies[0]); return }
        const sites = await listNodes(tenantId, { nodeType: NODE_TYPES.SITE })
        if (sites.length > 0) setAnchor(sites[0])
      } finally { setLoading(false) }
    })()
  }, [tenantId])

  // ── Load all dashboard data when anchor or period changes
  useEffect(() => {
    if (!tenantId || !anchor) return
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, anchor?.id, periodLabel])

  const loadAll = async () => {
    setLoading(true)
    try {
      const scope = anchor.nodeType === NODE_TYPES.SITE ? { siteId: anchor.id }
                   : anchor.nodeType === NODE_TYPES.CONTRACT ? { contractId: anchor.id }
                   : {}
      const [t, l, a] = await Promise.all([
        commandCentreTiles(tenantId, { scope, periodLabel }),
        availabilityLossByCategory(tenantId, { scope, periodLabel }),
        attentionRequired(tenantId, { kpiId: "kpi.physical_availability", scope, periodLabel }),
      ])
      setTiles(t)
      setLossByCategory(l)
      setAttention(a)
      setRecommendedAction(buildRecommendation(l))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !anchor) {
    return <div style={{ padding: "40px", textAlign: "center", color: T.muted }}>Loading command centre…</div>
  }

  if (!anchor) {
    return (
      <div style={{ padding: "24px", maxWidth: "820px", margin: "0 auto" }}>
        <div style={{ ...cardS, background: T.amberBg, borderColor: `${T.amber}33` }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", color: T.amber }}>
            <AlertTriangle size={18} style={{ marginTop: "2px", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: "4px" }}>No operating structure yet</div>
              <div style={{ fontSize: "13.5px" }}>Create a company and at least one site or contract first, then come back to the command centre.</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showDrill) {
    return (
      <DrillDownView
        tenantId={tenantId}
        kpiId={drillKpiId}
        rootNodeId={anchor.id}
        periodLabel={periodLabel}
        onBack={() => setShowDrill(false)}
        onOpenLineage={(k) => setLineageKpi(k)}
      />
    )
  }

  // Compute the KPI for the top tile to show status
  const availabilityTile = tiles[0]
  const availabilityValue = availabilityTile?.current?.value
  const availabilityTarget = availabilityTile?.current?.thresholds?.target
  const availabilityStatus = availabilityTile?.current?.status

  return (
    <div>
      {onBack && <button onClick={onBack} style={{ ...btnGhost, marginBottom: "14px" }}>← Back</button>}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "14px", marginBottom: "18px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: 700, color: T.accent, letterSpacing: "-0.4px" }}>
            Asset performance command centre
          </h2>
          <p style={{ margin: 0, fontSize: "13.5px", color: T.muted }}>
            {anchor.name} · {periodLabel.slice(2)} · every figure recomputed from source records
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: T.muted, marginBottom: "4px" }}>Period</label>
            <input type="month" value={periodLabel.slice(2)}
              onChange={(e) => setPeriodLabel(`M:${e.target.value}`)}
              style={{ padding: "8px 11px", border: `1px solid ${T.lineStrong}`, borderRadius: "8px",
                fontSize: "13.5px", fontFamily: "inherit", color: T.ink, background: T.bg }} />
          </div>
          <button onClick={() => { setDrillKpiId("kpi.physical_availability"); setShowDrill(true) }} style={btnGhost}>
            Open drill-down <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Hero tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "18px" }}>
        {tiles.map((tile) => <HeroTile key={tile.kpiId} tile={tile} onClick={() => setLineageKpi(tile.current)} />)}
      </div>

      {/* Two-column: category chart + side panels */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "14px" }}>

        {/* Availability loss by category */}
        <div style={cardS}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <h3 style={{ margin: 0, fontSize: "15.5px", fontWeight: 600, color: T.accent }}>
              Availability loss by category
            </h3>
            {lossByCategory && (
              <span style={{ fontSize: "12.5px", color: T.muted }}>
                {Math.round(lossByCategory.totalHours)} h total · {lossByCategory.eventCount} events
              </span>
            )}
          </div>

          {!lossByCategory || lossByCategory.rows.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: T.muted, fontSize: "13.5px", fontStyle: "italic" }}>
              No downtime recorded in this period.
            </div>
          ) : (
            <CategoryBars rows={lossByCategory.rows} totalHours={lossByCategory.totalHours} />
          )}
        </div>

        {/* Right side panels */}
        <div>
          {attention.length > 0 && (
            <div style={{ ...cardS, background: T.amberBg, borderColor: `${T.amber}33`, marginBottom: "12px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <AlertTriangle size={17} color={T.amber} style={{ marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, color: T.amber, fontSize: "14px", marginBottom: "4px" }}>
                    Attention required
                  </div>
                  {attention.map((f, i) => (
                    <div key={i} style={{ fontSize: "13px", color: T.body, lineHeight: 1.5 }}>
                      {f.title}. {f.message}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {recommendedAction && (
            <div style={{ ...cardS, background: T.accentTint, borderColor: T.lineStrong, marginBottom: "12px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <Info size={17} color={T.accentSoft} style={{ marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, color: T.accent, fontSize: "14px", marginBottom: "4px" }}>
                    Recommended next step
                  </div>
                  <div style={{ fontSize: "13px", color: T.body, lineHeight: 1.5 }}>{recommendedAction}</div>
                  <button onClick={() => { setDrillKpiId("kpi.downtime_hours"); setShowDrill(true) }}
                    style={{ ...btnGhost, marginTop: "10px", padding: "6px 12px", fontSize: "12.5px" }}>
                    Review contributors
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Category legend + share */}
          {lossByCategory && lossByCategory.rows.length > 0 && (
            <div style={cardS}>
              <h4 style={{ margin: "0 0 12px", fontSize: "12.5px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Loss composition
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <CompositionRow label="Planned maintenance" hours={lossByCategory.plannedHours} total={lossByCategory.totalHours} color={CATEGORY_COLORS.planned_maintenance} />
                <CompositionRow label="Unplanned" hours={lossByCategory.unplannedHours} total={lossByCategory.totalHours} color={CATEGORY_COLORS.unplanned_mechanical} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lineage modal */}
      {lineageKpi && (
        <KpiLineageModal
          tenantId={tenantId}
          calculationResult={lineageKpi}
          onClose={() => setLineageKpi(null)}
          onOpenAsset={(assetId) => { /* could navigate in the future */ }}
        />
      )}
    </div>
  )
}

// ── Hero tile ─────────────────────────────────────────────────────────────
function HeroTile({ tile, onClick }) {
  const { label, current, delta, deltaPercent, trend } = tile
  const status = current?.status || "no_target"
  const value = current?.value
  const target = current?.thresholds?.target
  const unit = current?.unit || ""

  const statusColor = status === "green" ? T.green : status === "amber" ? T.amber : status === "red" ? T.red : T.muted
  const statusBg = status === "green" ? T.greenBg : status === "amber" ? T.amberBg : status === "red" ? T.redBg : T.raised

  // For "lower is better" KPIs (cost per tonne) the delta sign flips
  const direction = current?.direction || "higher"
  const fav = delta === null ? null
    : direction === "higher" ? delta >= 0 : delta <= 0

  const Icon = status === "green" ? CheckCircle2 : status === "amber" ? AlertTriangle : status === "red" ? XCircle : Info

  return (
    <button onClick={onClick}
      style={{
        background: T.bg, border: `1px solid ${T.line}`, borderRadius: "12px",
        padding: "18px", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
        transition: "border-color 0.15s, background 0.15s", position: "relative", overflow: "hidden",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accentSoft }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.line }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "10px" }}>
        <span style={{ fontSize: "12.5px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {label}
        </span>
        <Icon size={16} color={statusColor} />
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px" }}>
        <span style={{ fontSize: "30px", fontWeight: 700, color: T.ink, letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums" }}>
          {formatTileValue(value, unit)}
        </span>
        <span style={{ fontSize: "13px", color: T.muted }}>{shortUnit(unit)}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", minHeight: "18px" }}>
        {target !== null && target !== undefined && (
          <span style={{ fontSize: "12px", color: T.muted }}>
            Target {formatTileValue(target, unit)}{shortUnit(unit)}
          </span>
        )}
        {delta !== null && (
          <span style={{ fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px",
            color: fav === null ? T.muted : fav ? T.green : T.red }}>
            {delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {delta >= 0 ? "+" : ""}{formatTileDelta(delta, unit)}
          </span>
        )}
      </div>

      {trend && trend.length > 1 && (
        <Sparkline points={trend} color={statusColor} />
      )}

      <span style={{ position: "absolute", bottom: "12px", right: "14px", fontSize: "11px", color: T.faint, display: "inline-flex", alignItems: "center", gap: "3px" }}>
        Lineage <Info size={11} />
      </span>
    </button>
  )
}

const formatTileValue = (v, unit) => {
  if (v === null || v === undefined) return "—"
  if (unit === "percent") return Number(v).toFixed(1)
  if (unit === "tonnes_per_hour") return Number(v).toLocaleString("en-ZA", { maximumFractionDigits: 1 })
  if (unit === "ZAR_per_tonne") return Number(v).toFixed(2)
  if (unit === "hours") return Number(v).toFixed(1)
  return Number(v).toLocaleString("en-ZA", { maximumFractionDigits: 2 })
}

const shortUnit = (unit) => {
  if (unit === "percent") return "%"
  if (unit === "tonnes_per_hour") return "t/h"
  if (unit === "ZAR_per_tonne") return "R/t"
  if (unit === "hours") return "h"
  return unit
}

const formatTileDelta = (delta, unit) => {
  if (unit === "percent") return `${Math.abs(delta).toFixed(1)}pp`
  return formatTileValue(Math.abs(delta), unit)
}

function Sparkline({ points, color }) {
  const valid = points.filter((p) => p.value !== null)
  if (valid.length < 2) return <div style={{ height: "26px" }} />
  const min = Math.min(...valid.map((p) => p.value))
  const max = Math.max(...valid.map((p) => p.value))
  const range = max - min || 1
  const w = 220, h = 26
  const step = w / (points.length - 1)
  const path = points.map((p, i) => {
    if (p.value === null) return null
    const x = i * step
    const y = h - ((p.value - min) / range) * h
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).filter(Boolean).join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: `${h}px`, overflow: "visible" }}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      {points.map((p, i) => {
        if (p.value === null) return null
        const x = i * step
        const y = h - ((p.value - min) / range) * h
        return <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 2.8 : 1.6} fill={color} />
      })}
    </svg>
  )
}

// ── Category bars ─────────────────────────────────────────────────────────
function CategoryBars({ rows, totalHours }) {
  const max = Math.max(...rows.map((r) => r.hours), 1)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {rows.map((r) => {
        const pct = (r.hours / max) * 100
        const color = CATEGORY_COLORS[r.category] || T.accentSoft
        const share = totalHours > 0 ? (r.hours / totalHours) * 100 : 0
        return (
          <div key={r.category} style={{ display: "grid", gridTemplateColumns: "180px 1fr 90px", gap: "12px", alignItems: "center" }}>
            <div style={{ fontSize: "13px", color: T.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.label}>
              {r.label}
            </div>
            <div style={{ height: "22px", background: T.raised, borderRadius: "4px", position: "relative", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: color, opacity: 0.85, borderRadius: "4px", transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: "12.5px", color: T.body, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              <strong>{Math.round(r.hours)} h</strong>
              <span style={{ color: T.muted, marginLeft: "6px" }}>{share.toFixed(0)}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CompositionRow({ label, hours, total, color }) {
  const pct = total > 0 ? (hours / total) * 100 : 0
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
        <span style={{ fontSize: "12.5px", color: T.body }}>{label}</span>
        <span style={{ fontSize: "13px", fontWeight: 600, color: T.ink, fontVariantNumeric: "tabular-nums" }}>
          {Math.round(hours)} h <span style={{ color: T.muted, fontWeight: 500 }}>({pct.toFixed(0)}%)</span>
        </span>
      </div>
      <div style={{ height: "8px", background: T.raised, borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "4px" }} />
      </div>
    </div>
  )
}

// ── Recommendation builder ────────────────────────────────────────────────
const buildRecommendation = (lossByCategory) => {
  if (!lossByCategory || lossByCategory.rows.length === 0) return null
  const top = lossByCategory.rows[0]
  const topShare = lossByCategory.totalHours > 0 ? (top.hours / lossByCategory.totalHours) * 100 : 0

  if (top.category === "unplanned_mechanical") {
    return `Review the assets causing mechanical downtime — it accounts for ${Math.round(topShare)}% of availability loss this period (${Math.round(top.hours)} h across ${top.eventCount} events).`
  }
  if (top.category === "operational_delay") {
    return `Operational delay is the largest contributor at ${Math.round(topShare)}%. Investigate queueing, shift handovers and scheduling.`
  }
  if (top.category === "supply_dependency") {
    return `Supply dependency is dominating at ${Math.round(topShare)}%. Review parts, fuel and consumable availability.`
  }
  if (top.category === "planned_maintenance") {
    return `Planned maintenance is the largest block at ${Math.round(topShare)}%. This is expected — the opportunity is reducing duration without dropping scope.`
  }
  return `${top.label} accounts for ${Math.round(topShare)}% of availability loss. Review the contributing assets.`
}