"use client"

/**
 * digitalTwin/components/TwinFlowDiagram.jsx
 *
 * Professional flow diagram for the operating twin structure.
 *
 * Renders nodes on a layered graph with:
 *   - SVG bezier arrows between connected nodes
 *   - Directional arrowheads and coloured edge labels
 *   - Drag-to-connect: click a node, then click a target to link them
 *   - Auto hierarchical layout (roots at top, children below)
 *   - Pan, zoom, fit-to-view
 *   - Hover highlighting of a node and its incident edges
 *   - Node selection, rename inline, add children, remove
 *
 * The parent (FirstRunWizard) supplies `nodes` and `relations` arrays and
 * receives edits via `onChange({ nodes, relations })`.
 */

import {
  useCallback, useEffect, useMemo, useRef, useState,
} from "react"
import {
  Plus, X, Link2, Trash2, ZoomIn, ZoomOut, Maximize2,
  Building2, MapPin, FileText, Wrench, Boxes, Activity,
  Layers, Zap, MousePointerClick,
} from "lucide-react"

// ── Design tokens ─────────────────────────────────────────────────────────
const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", faint: "#8a7a74",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec", canvas: "#fbfaf9",
  accent: "#4a352f", accentSoft: "#6b4f47", accentTint: "#f4efec",
  green: "#166534", greenBg: "#f0fdf4",
  amber: "#92400e", amberBg: "#fffbeb",
  red: "#991b1b", redBg: "#fef2f2",
  blue: "#1e40af", blueBg: "#eff6ff",
  purple: "#6d28d9", purpleBg: "#f5f3ff",
}

// ── Node visual config ────────────────────────────────────────────────────
const NODE_VISUALS = {
  company:         { icon: Building2, accent: "#4a352f", soft: "#f4efec", label: "Company" },
  site:            { icon: MapPin,    accent: "#0e7490", soft: "#ecfeff", label: "Site" },
  contract:        { icon: FileText,  accent: "#b45309", soft: "#fffbeb", label: "Contract" },
  service:         { icon: Wrench,    accent: "#166534", soft: "#f0fdf4", label: "Service" },
  activity:        { icon: Activity,  accent: "#6d28d9", soft: "#f5f3ff", label: "Activity" },
  equipment_group: { icon: Boxes,     accent: "#1e40af", soft: "#eff6ff", label: "Equipment group" },
  process_area:    { icon: Layers,    accent: "#0e7490", soft: "#ecfeff", label: "Process area" },
  facility:        { icon: Zap,       accent: "#b45309", soft: "#fffbeb", label: "Facility" },
}

// ── Valid relation types per source node type ─────────────────────────────
const VALID_CONNECTIONS = {
  company:         ["contains", "owns_or_controls", "scopes"],
  site:            ["contains", "delivered_at", "has_area"],
  contract:        ["scopes", "realized_by", "delivered_at"],
  service:         ["realized_by"],
  activity:        ["performed_in", "supports"],
  equipment_group: ["member_of", "supports"],
  process_area:    ["contains"],
  facility:        ["has_area", "contains"],
}

// ── Relation type colour palette ──────────────────────────────────────────
const RELATION_COLORS = {
  contains:         "#4a352f",
  owns_or_controls: "#4a352f",
  scopes:           "#b45309",
  delivered_at:     "#0e7490",
  has_area:         "#0e7490",
  realized_by:      "#166534",
  performed_in:     "#6d28d9",
  supports:         "#1e40af",
  member_of:        "#1e40af",
}

const RELATION_LABELS = {
  contains: "contains",
  owns_or_controls: "owns / controls",
  scopes: "scopes",
  delivered_at: "delivered at",
  has_area: "has area",
  realized_by: "realized by",
  performed_in: "performed in",
  supports: "supports",
  member_of: "member of",
}

// ── Layout constants ──────────────────────────────────────────────────────
const NODE_W = 200
const NODE_H = 68
const H_GAP = 40
const V_GAP = 90

// ── Layout algorithm: hierarchical top-down tree ──────────────────────────
/**
 * Assigns (x, y) to each node so the graph reads top-down.
 * Levels are computed from a BFS rooted at all roots (nodes with no parent).
 * Within a level, nodes are ordered so children stay near their parent.
 */
const computeLayout = (nodes, relations) => {
  if (nodes.length === 0) return { positions: {}, width: 0, height: 0 }

  const childrenOf = {}
  const parentOf = {}
  relations.forEach((r) => {
    if (!childrenOf[r.fromId]) childrenOf[r.fromId] = []
    childrenOf[r.fromId].push(r.toId)
    parentOf[r.toId] = r.fromId
  })

  // Roots = nodes with no parent relation (and that exist in the node list)
  const nodeIds = new Set(nodes.map((n) => n.id))
  const roots = nodes
    .filter((n) => !parentOf[n.id] || !nodeIds.has(parentOf[n.id]))
    .map((n) => n.id)

  // BFS to assign levels. Multi-parent nodes go to the level of their
  // earliest (shallowest) parent so they read naturally.
  const level = {}
  const queue = []
  roots.forEach((id) => { level[id] = 0; queue.push(id) })

  const visited = new Set()
  while (queue.length > 0) {
    const id = queue.shift()
    if (visited.has(id)) continue
    visited.add(id)
    const kids = childrenOf[id] || []
    kids.forEach((kid) => {
      if (level[kid] === undefined || level[kid] < level[id] + 1) {
        level[kid] = level[id] + 1
      }
      queue.push(kid)
    })
  }

  // Any node not reached (isolated) gets level 0
  nodes.forEach((n) => {
    if (level[n.id] === undefined) level[n.id] = 0
  })

  // Group nodes by level
  const levels = {}
  nodes.forEach((n) => {
    const l = level[n.id]
    if (!levels[l]) levels[l] = []
    levels[l].push(n.id)
  })

  // Position within each level.
  // Use a running X cursor, and stagger children so they cluster near parent.
  const positions = {}
  const levelKeys = Object.keys(levels).map(Number).sort((a, b) => a - b)

  // Simple, robust layout: order each level by parent's X where possible.
  // We do two passes: (1) assign provisional X by index in level,
  // (2) nudge children toward their parent's average X.
  const byIndex = {}
  levelKeys.forEach((l) => {
    levels[l].forEach((id, idx) => {
      byIndex[id] = idx
    })
  })

  // Provisional X: index * (NODE_W + H_GAP)
  levelKeys.forEach((l) => {
    levels[l].forEach((id, idx) => {
      positions[id] = {
        x: idx * (NODE_W + H_GAP),
        y: l * (NODE_H + V_GAP),
      }
    })
  })

  // Nudge: for each non-root level, sort nodes by their parent's provisional X
  for (let i = 1; i < levelKeys.length; i++) {
    const l = levelKeys[i]
    const ids = levels[l]
    ids.sort((a, b) => {
      const pa = parentOf[a] ? positions[parentOf[a]].x : 0
      const pb = parentOf[b] ? positions[parentOf[b]].x : 0
      return pa - pb
    })
    ids.forEach((id, idx) => {
      positions[id].x = idx * (NODE_W + H_GAP)
    })
  }

  // Compute bounds
  const xs = Object.values(positions).map((p) => p.x)
  const ys = Object.values(positions).map((p) => p.y)
  const minX = Math.min(...xs, 0)
  const maxX = Math.max(...xs, 0) + NODE_W
  const maxY = Math.max(...ys, 0) + NODE_H

  // Normalise so minX is 0
  Object.keys(positions).forEach((id) => {
    positions[id].x -= minX
  })

  return {
    positions,
    width: maxX - minX,
    height: maxY,
  }
}

// ── Edge path builder: smooth bezier from bottom of source to top of target
const buildEdgePath = (from, to) => {
  const x1 = from.x + NODE_W / 2
  const y1 = from.y + NODE_H
  const x2 = to.x + NODE_W / 2
  const y2 = to.y

  // Route down, then across. Two control points give a clean S-curve.
  const dy = Math.max(30, Math.abs(y2 - y1) / 2)
  const c1x = x1
  const c1y = y1 + dy
  const c2x = x2
  const c2y = y2 - dy

  return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`
}

// ── Main component ────────────────────────────────────────────────────────
export default function TwinFlowDiagram({
  nodes = [],
  relations = [],
  onChange,
  readOnly = false,
}) {
  const [selectedNode, setSelectedNode] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [linkingFrom, setLinkingFrom] = useState(null)
  const [linkRelationType, setLinkRelationType] = useState("")
  const [showAddNode, setShowAddNode] = useState(null) // parentId | "root" | null
  const [newNodeType, setNewNodeType] = useState("activity")
  const [newNodeName, setNewNodeName] = useState("")
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 20, y: 20 })
  const [dragging, setDragging] = useState(null)
  const [hoveredEdge, setHoveredEdge] = useState(null)
  const [confirmRemoveNode, setConfirmRemoveNode] = useState(null)

  const canvasRef = useRef(null)
  const isPanningRef = useRef(false)
  const panStartRef = useRef(null)

  // ── Layout
  const layout = useMemo(() => computeLayout(nodes, relations), [nodes, relations])

  const nodeById = useMemo(() => {
    const map = {}
    nodes.forEach((n) => { map[n.id] = n })
    return map
  }, [nodes])

  // ── Fit-to-view on first render and when node count changes drastically
  useEffect(() => {
    if (layout.width === 0 || layout.height === 0) return
    const el = canvasRef.current
    if (!el) return
    const pad = 40
    const availW = el.clientWidth - pad * 2
    const availH = el.clientHeight - pad * 2
    if (availW <= 0 || availH <= 0) return
    const sx = availW / layout.width
    const sy = availH / layout.height
    const s = Math.min(1, Math.max(0.35, Math.min(sx, sy)))
    setZoom(s)
    setPan({
      x: (el.clientWidth - layout.width * s) / 2,
      y: pad,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout.width, layout.height, nodes.length])

  // ── Panning via middle-click or space+drag or background drag
  const onCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current || e.target.dataset?.canvas === "true") {
      isPanningRef.current = true
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    }
  }
  useEffect(() => {
    const onMove = (e) => {
      if (isPanningRef.current && panStartRef.current) {
        setPan({
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        })
      }
    }
    const onUp = () => { isPanningRef.current = false; panStartRef.current = null }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [pan.x, pan.y])

  // ── Zoom via wheel
  const onWheel = (e) => {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    const delta = -e.deltaY * 0.0015
    setZoom((z) => Math.max(0.3, Math.min(2.5, z + delta)))
  }

  const fitToView = () => {
    const el = canvasRef.current
    if (!el || layout.width === 0) return
    const pad = 40
    const availW = el.clientWidth - pad * 2
    const availH = el.clientHeight - pad * 2
    const s = Math.min(1.2, Math.max(0.35, Math.min(availW / layout.width, availH / layout.height)))
    setZoom(s)
    setPan({
      x: (el.clientWidth - layout.width * s) / 2,
      y: pad,
    })
  }

  // ── Mutations ────────────────────────────────────────────────────────────
  const handleRename = (id, name) => {
    onChange?.({
      nodes: nodes.map((n) => (n.id === id ? { ...n, name } : n)),
      relations,
    })
  }

  const handleAddNode = (parentId) => {
    if (!newNodeName.trim()) return
    const newNode = {
      id: `new_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      nodeType: newNodeType,
      name: newNodeName.trim(),
      _new: true,
    }
    const updatedNodes = [...nodes, newNode]
    let updatedRelations = relations

    if (parentId && parentId !== "root") {
      const parent = nodeById[parentId]
      const validTypes = VALID_CONNECTIONS[parent?.nodeType] || []
      const relType = validTypes[0] || "contains"
      updatedRelations = [
        ...relations,
        {
          id: `rel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          fromId: parentId,
          toId: newNode.id,
          relationType: relType,
          isPrimary: false,
          _new: true,
        },
      ]
    }

    onChange?.({ nodes: updatedNodes, relations: updatedRelations })
    setNewNodeName("")
    setShowAddNode(null)
  }

  const doRemoveNode = (id) => {
    const updatedNodes = nodes.filter((n) => n.id !== id)
    const updatedRelations = relations.filter((r) => r.fromId !== id && r.toId !== id)
    onChange?.({ nodes: updatedNodes, relations: updatedRelations })
    setConfirmRemoveNode(null)
    setSelectedNode(null)
  }

  const handleRemoveRelation = (relId) => {
    onChange?.({ nodes, relations: relations.filter((r) => r.id !== relId) })
  }

  const handleStartLink = (nodeId) => {
    setLinkingFrom(nodeId)
    const node = nodeById[nodeId]
    const validTypes = VALID_CONNECTIONS[node?.nodeType] || []
    setLinkRelationType(validTypes[0] || "contains")
  }

  const handleCompleteLink = (targetId) => {
    if (!linkingFrom || linkingFrom === targetId) {
      setLinkingFrom(null)
      return
    }
    const relType = linkRelationType || "contains"
    const exists = relations.some(
      (r) => r.fromId === linkingFrom && r.toId === targetId && r.relationType === relType
    )
    if (exists) {
      setLinkingFrom(null)
      return
    }
    const newRel = {
      id: `rel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fromId: linkingFrom,
      toId: targetId,
      relationType: relType,
      isPrimary: false,
      _new: true,
    }
    onChange?.({ nodes, relations: [...relations, newRel] })
    setLinkingFrom(null)
  }

  const onNodeClick = (node) => {
    if (readOnly) return
    if (linkingFrom && linkingFrom !== node.id) {
      handleCompleteLink(node.id)
      return
    }
    if (linkingFrom === node.id) {
      setLinkingFrom(null)
      return
    }
    setSelectedNode(selectedNode === node.id ? null : node.id)
  }

  // ── Render helpers ───────────────────────────────────────────────────────
  const isNodeHighlighted = (id) => {
    if (hoveredNode === id) return true
    if (!hoveredNode) return false
    return relations.some(
      (r) => (r.fromId === hoveredNode && r.toId === id) || (r.toId === hoveredNode && r.fromId === id)
    )
  }

  const isEdgeHighlighted = (rel) => {
    if (hoveredEdge === rel.id) return true
    if (!hoveredNode) return false
    return rel.fromId === hoveredNode || rel.toId === hoveredNode
  }

  return (
    <div style={{ fontFamily: "inherit" }}>

      {/* ── Toolbar ── */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center",
        padding: "10px 14px", background: T.panel,
        border: `1px solid ${T.lineSoft}`, borderRadius: "10px 10px 0 0",
        borderBottom: "none",
      }}>
        {!readOnly && (
          <>
            <button
              onClick={() => { setShowAddNode("root"); setNewNodeName(""); setNewNodeType("site") }}
              style={toolbarBtn}
            >
              <Plus size={13} /> Add node
            </button>
            <span style={{ width: 1, height: 20, background: T.lineSoft }} />
          </>
        )}

        <button onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))} style={toolbarIconBtn} title="Zoom in">
          <ZoomIn size={14} />
        </button>
        <button onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))} style={toolbarIconBtn} title="Zoom out">
          <ZoomOut size={14} />
        </button>
        <button onClick={fitToView} style={toolbarIconBtn} title="Fit to view">
          <Maximize2 size={14} />
        </button>
        <span style={{ fontSize: "11.5px", color: T.muted, marginLeft: "4px", fontVariantNumeric: "tabular-nums" }}>
          {Math.round(zoom * 100)}%
        </span>

        <span style={{ marginLeft: "auto", fontSize: "11.5px", color: T.muted }}>
          <strong style={{ color: T.ink }}>{nodes.length}</strong> nodes ·{" "}
          <strong style={{ color: T.ink }}>{relations.length}</strong> links
        </span>
      </div>

      {/* ── Linking banner ── */}
      {linkingFrom && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
          padding: "10px 14px", background: T.accentTint,
          border: `1px solid ${T.accent}`, borderTop: "none",
        }}>
          <MousePointerClick size={15} color={T.accent} />
          <span style={{ fontSize: "13px", color: T.accent }}>
            Connecting from <strong>{nodeById[linkingFrom]?.name}</strong> — click any other node to link
          </span>
          <select
            value={linkRelationType}
            onChange={(e) => setLinkRelationType(e.target.value)}
            style={{ ...miniInput, marginLeft: "auto" }}
          >
            {(VALID_CONNECTIONS[nodeById[linkingFrom]?.nodeType] || []).map((rt) => (
              <option key={rt} value={rt}>{RELATION_LABELS[rt] || rt}</option>
            ))}
          </select>
          <button onClick={() => setLinkingFrom(null)} style={toolbarBtn}>
            Cancel
          </button>
        </div>
      )}

      {/* ── Add-node form ── */}
      {showAddNode !== null && (
        <div style={{
          display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center",
          padding: "10px 14px", background: T.accentTint,
          border: `1px solid ${T.accent}`, borderTop: "none",
        }}>
          <Plus size={14} color={T.accent} />
          <span style={{ fontSize: "13px", color: T.accent }}>
            {showAddNode === "root" ? "Add standalone node" : `Add child under "${nodeById[showAddNode]?.name}"`}
          </span>
          <select
            value={newNodeType}
            onChange={(e) => setNewNodeType(e.target.value)}
            style={miniInput}
          >
            <option value="site">Site</option>
            <option value="contract">Contract</option>
            <option value="service">Service</option>
            <option value="activity">Activity</option>
            <option value="equipment_group">Equipment group</option>
            <option value="process_area">Process area</option>
            <option value="facility">Facility</option>
          </select>
          <input
            value={newNodeName}
            onChange={(e) => setNewNodeName(e.target.value)}
            placeholder="Node name…"
            style={{ ...miniInput, flex: 1, minWidth: "180px" }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddNode(showAddNode)
              if (e.key === "Escape") setShowAddNode(null)
            }}
          />
          <button onClick={() => handleAddNode(showAddNode)} style={toolbarPrimaryBtn}>Add</button>
          <button onClick={() => setShowAddNode(null)} style={toolbarBtn}>Cancel</button>
        </div>
      )}

      {/* ── Canvas ── */}
      <div
        ref={canvasRef}
        data-canvas="true"
        onMouseDown={onCanvasMouseDown}
        onWheel={onWheel}
        style={{
          position: "relative",
          height: "520px",
          background: `radial-gradient(circle, ${T.lineSoft} 1px, transparent 1px) 0 0 / 24px 24px, ${T.canvas}`,
          border: `1px solid ${T.lineSoft}`,
          borderTop: "none",
          borderRadius: "0 0 10px 10px",
          overflow: "hidden",
          cursor: isPanningRef.current ? "grabbing" : "grab",
        }}
      >
        {/* Empty state */}
        {nodes.length === 0 && (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            color: T.muted, fontSize: "13px", fontStyle: "italic",
          }}>
            No nodes yet — click <strong style={{ margin: "0 4px" }}>Add node</strong> to start.
          </div>
        )}

        {/* Transformed layer */}
        <div style={{
          position: "absolute",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          transition: isPanningRef.current ? "none" : "transform 0.12s ease-out",
        }}>

          {/* SVG edges layer */}
          <svg
            width={Math.max(1, layout.width + 200)}
            height={Math.max(1, layout.height + 200)}
            style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", overflow: "visible" }}
          >
            <defs>
              {Object.entries(RELATION_COLORS).map(([type, color]) => (
                <marker
                  key={type}
                  id={`arrow-${type}`}
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
                </marker>
              ))}
              <marker
                id="arrow-highlight"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={T.accent} />
              </marker>
            </defs>

            {relations.map((rel) => {
              const from = layout.positions[rel.fromId]
              const to = layout.positions[rel.toId]
              if (!from || !to) return null

              const path = buildEdgePath(from, to)
              const isHi = isEdgeHighlighted(rel)
              const baseColor = RELATION_COLORS[rel.relationType] || T.accentSoft
              const color = isHi ? T.accent : baseColor
              const strokeW = isHi ? 2.5 : 1.6
              const midX = (from.x + to.x) / 2 + NODE_W / 2
              const midY = (from.y + NODE_H + to.y) / 2

              return (
                <g key={rel.id} style={{ pointerEvents: "auto" }}>
                  <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeW}
                    strokeLinecap="round"
                    markerEnd={`url(#arrow-${isHi ? "highlight" : rel.relationType})`}
                    opacity={isHi ? 1 : 0.75}
                  />

                  {/* Edge label */}
                  <g
                    transform={`translate(${midX}, ${midY})`}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHoveredEdge(rel.id)}
                    onMouseLeave={() => setHoveredEdge(null)}
                  >
                    <rect
                      x={-RELATION_LABELS[rel.relationType].length * 3.4 - 10}
                      y={-9}
                      width={RELATION_LABELS[rel.relationType].length * 6.8 + 20}
                      height={18}
                      rx={9}
                      fill={T.bg}
                      stroke={color}
                      strokeWidth={1}
                      opacity={0.98}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="10"
                      fontWeight={600}
                      fill={color}
                      style={{ letterSpacing: "0.2px", userSelect: "none" }}
                    >
                      {RELATION_LABELS[rel.relationType] || rel.relationType}
                    </text>
                  </g>

                  {/* Remove button on hover */}
                  {isHi && !readOnly && (
                    <g
                      transform={`translate(${midX + RELATION_LABELS[rel.relationType].length * 3.4 + 16}, ${midY})`}
                      style={{ cursor: "pointer" }}
                      onClick={(e) => { e.stopPropagation(); handleRemoveRelation(rel.id) }}
                    >
                      <circle r={8} fill={T.redBg} stroke={T.red} strokeWidth={1} />
                      <path
                        d="M -3 -3 L 3 3 M 3 -3 L -3 3"
                        stroke={T.red}
                        strokeWidth={1.6}
                        strokeLinecap="round"
                      />
                    </g>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Nodes layer */}
          {nodes.map((node) => {
            const pos = layout.positions[node.id]
            if (!pos) return null
            const visual = NODE_VISUALS[node.nodeType] || NODE_VISUALS.activity
            const Icon = visual.icon
            const isSelected = selectedNode === node.id
            const isHovered = hoveredNode === node.id
            const isRelated = hoveredNode && hoveredNode !== node.id && isNodeHighlighted(node.id)
            const isLinkSource = linkingFrom === node.id
            const isLinkTarget = linkingFrom && linkingFrom !== node.id

            return (
              <div
                key={node.id}
                style={{
                  position: "absolute",
                  left: pos.x,
                  top: pos.y,
                  width: NODE_W,
                  height: NODE_H,
                  cursor: readOnly ? "default" : (linkingFrom ? "crosshair" : "pointer"),
                  userSelect: "none",
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={(e) => { e.stopPropagation(); onNodeClick(node) }}
              >
                <div style={{
                  position: "absolute", inset: 0,
                  background: isSelected || isLinkSource ? visual.soft : T.bg,
                  border: `2px solid ${
                    isLinkSource ? T.accent :
                    isSelected ? visual.accent :
                    isLinkTarget ? T.green :
                    isHovered ? visual.accent :
                    isRelated ? visual.accent :
                    T.line
                  }`,
                  borderRadius: "10px",
                  boxShadow: isSelected || isHovered
                    ? `0 6px 20px ${visual.accent}22, 0 2px 6px rgba(45,32,28,0.08)`
                    : "0 1px 3px rgba(45,32,28,0.06)",
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 12px",
                  transition: "box-shadow 0.15s, border-color 0.15s",
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "8px",
                    background: visual.soft, color: visual.accent,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "10px", color: visual.accent, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.4px",
                      marginBottom: "2px",
                    }}>
                      {visual.label}
                    </div>
                    <div style={{
                      fontSize: "12.5px", fontWeight: 600, color: T.ink,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }} title={node.name}>
                      {node.name}
                    </div>
                  </div>

                  {/* NEW badge */}
                  {node._new && (
                    <span style={{
                      position: "absolute", top: -6, right: -6,
                      padding: "1px 6px", borderRadius: "999px",
                      background: T.green, color: "#fff",
                      fontSize: "9px", fontWeight: 700, letterSpacing: "0.3px",
                    }}>NEW</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Node action popover (floating above canvas) ── */}
        {selectedNode && !readOnly && !linkingFrom && (() => {
          const pos = layout.positions[selectedNode]
          if (!pos) return null
          // Position the popover below the node in screen space
          const screenX = pan.x + (pos.x + NODE_W / 2) * zoom
          const screenY = pan.y + (pos.y + NODE_H) * zoom + 6
          const node = nodeById[selectedNode]
          const canDelete = node?.nodeType !== "company"

          return (
            <div style={{
              position: "absolute",
              left: screenX,
              top: screenY,
              transform: "translateX(-50%)",
              display: "flex", gap: "4px", flexWrap: "nowrap",
              background: T.bg,
              border: `1px solid ${T.lineStrong}`,
              borderRadius: "8px",
              padding: "5px",
              boxShadow: "0 6px 20px rgba(45,32,28,0.14)",
              zIndex: 10,
            }}>
              <button
                onClick={() => handleStartLink(selectedNode)}
                style={popoverBtn}
              >
                <Link2 size={11} /> Connect
              </button>
              <button
                onClick={() => { setShowAddNode(selectedNode); setNewNodeName("") }}
                style={popoverBtn}
              >
                <Plus size={11} /> Add child
              </button>
              {canDelete && (
                <button
                  onClick={() => setConfirmRemoveNode(selectedNode)}
                  style={{ ...popoverBtn, color: T.red, borderColor: `${T.red}33` }}
                >
                  <Trash2 size={11} /> Delete
                </button>
              )}
            </div>
          )
        })()}

        {/* ── Confirm remove node ── */}
        {confirmRemoveNode && (() => {
          const node = nodeById[confirmRemoveNode]
          return (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(45,32,28,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 20,
            }} onClick={() => setConfirmRemoveNode(null)}>
              <div onClick={(e) => e.stopPropagation()} style={{
                background: T.bg, borderRadius: "12px", padding: "20px 22px",
                maxWidth: "360px",
                boxShadow: "0 16px 48px rgba(45,32,28,0.28)",
              }}>
                <div style={{ fontSize: "14.5px", fontWeight: 700, color: T.accent, marginBottom: "6px" }}>
                  Remove "{node?.name}"?
                </div>
                <div style={{ fontSize: "12.5px", color: T.body, lineHeight: 1.5, marginBottom: "14px" }}>
                  This removes the node and all its connections. Any children become standalone.
                </div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button onClick={() => setConfirmRemoveNode(null)} style={toolbarBtn}>Cancel</button>
                  <button
                    onClick={() => doRemoveNode(confirmRemoveNode)}
                    style={{ ...toolbarBtn, background: T.red, color: "#fff", borderColor: T.red }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* ── Legend ── */}
      <div style={{
        marginTop: "12px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
      }}>
        {/* Node types */}
        <div style={{
          padding: "12px 14px", background: T.panel,
          borderRadius: "10px", border: `1px solid ${T.lineSoft}`,
        }}>
          <div style={{
            fontSize: "11px", fontWeight: 700, color: T.muted,
            textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px",
          }}>
            Node types
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {Object.entries(NODE_VISUALS).map(([key, v]) => {
              const Icon = v.icon
              return (
                <span key={key} style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  fontSize: "11.5px", color: T.body,
                }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: "5px",
                    background: v.soft, color: v.accent,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={11} />
                  </span>
                  {v.label}
                </span>
              )
            })}
          </div>
        </div>

        {/* Relation types */}
        <div style={{
          padding: "12px 14px", background: T.panel,
          borderRadius: "10px", border: `1px solid ${T.lineSoft}`,
        }}>
          <div style={{
            fontSize: "11px", fontWeight: 700, color: T.muted,
            textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px",
          }}>
            Connection types
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {Object.entries(RELATION_LABELS).map(([key, label]) => {
              const color = RELATION_COLORS[key] || T.accentSoft
              return (
                <span key={key} style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  fontSize: "11.5px", color: T.body,
                }}>
                  <span style={{
                    display: "inline-block", width: 20, height: 0,
                    borderTop: `2px solid ${color}`,
                    position: "relative",
                  }}>
                    <span style={{
                      position: "absolute", right: -3, top: -3.5,
                      width: 0, height: 0,
                      borderLeft: `5px solid ${color}`,
                      borderTop: "3px solid transparent",
                      borderBottom: "3px solid transparent",
                    }} />
                  </span>
                  {label}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────
const toolbarBtn = {
  padding: "6px 12px", borderRadius: "6px",
  background: T.bg, color: T.body,
  border: `1px solid ${T.lineStrong}`,
  fontSize: "12px", fontWeight: 500,
  cursor: "pointer", fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", gap: "5px",
}
const toolbarPrimaryBtn = {
  ...toolbarBtn,
  background: T.accent, color: "#fff",
  borderColor: T.accent, fontWeight: 600,
}
const toolbarIconBtn = {
  width: 30, height: 30, borderRadius: "6px",
  background: T.bg, color: T.body,
  border: `1px solid ${T.lineStrong}`,
  cursor: "pointer", fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  padding: 0,
}
const miniInput = {
  padding: "6px 10px", borderRadius: "6px",
  border: `1px solid ${T.lineStrong}`,
  background: T.bg, color: T.ink,
  fontSize: "12.5px", fontFamily: "inherit",
  outline: "none",
}
const popoverBtn = {
  padding: "5px 10px", borderRadius: "6px",
  background: T.bg, color: T.body,
  border: `1px solid ${T.lineStrong}`,
  fontSize: "11.5px", fontWeight: 500,
  cursor: "pointer", fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", gap: "4px",
  whiteSpace: "nowrap",
}