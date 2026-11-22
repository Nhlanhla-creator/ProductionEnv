"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Plus, Link2, Trash2, ZoomIn, ZoomOut, Maximize2,
  Building2, MapPin, FileText, Wrench, Boxes, Activity,
  Layers, Zap, MousePointerClick,
} from "lucide-react"
import { visibleHierarchyNodes } from "../models/structureInventory"
import { workLabel } from "../models/operatingStructure"
import { structureId } from "../services/operatingStructureService"

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
  value_chain:     { icon: Layers,    accent: "#4a352f", soft: "#f4efec", label: "Value chain" },
  asset:           { icon: Zap,       accent: "#1e40af", soft: "#eff6ff", label: "Equipment" },
  company:         { icon: Building2, accent: "#4a352f", soft: "#f4efec", label: "Company" },
  site:            { icon: MapPin,    accent: "#0e7490", soft: "#ecfeff", label: "Site" },
  contract:        { icon: FileText,  accent: "#b45309", soft: "#fffbeb", label: "Contract" },
  service:         { icon: Wrench,    accent: "#166534", soft: "#f0fdf4", label: "Support Service" },
  activity:        { icon: Activity,  accent: "#6d28d9", soft: "#f5f3ff", label: "Activity" },
  equipment_group: { icon: Boxes,     accent: "#1e40af", soft: "#eff6ff", label: "Equipment group" },
  process_area:    { icon: Layers,    accent: "#0e7490", soft: "#ecfeff", label: "Process area" },
  facility:        { icon: Zap,       accent: "#b45309", soft: "#fffbeb", label: "Facility" },
}

const NODE_W = 200
const NODE_H = 68
const H_GAP = 52
const V_GAP = 54

const relationTypeFor = (source, target) => {
  if (source === "service" && target === "activity") return "realized_by"
  if (source === "contract" && target === "service") return "scopes"
  return "contains"
}

const sameConnection = (relation, from, to) =>
  (relation.fromId === from && relation.toId === to) ||
  (relation.fromId === to && relation.toId === from)

function collectConnections(relations) {
  const byPair = new Map()
  for (const relation of relations) {
    const key = JSON.stringify([relation.fromId, relation.toId].sort())
    const existing = byPair.get(key)
    if (!existing || relation.isPrimary) byPair.set(key, relation)
  }
  return [...byPair.values()]
}

function computeLayout(nodes, relations, horizontal) {
  if (!nodes.length) return { positions: {}, width: 0, height: 0 }
  const ids = new Set(nodes.map(({ id }) => id))
  const parents = new Map()
  const children = new Map()
  for (const edge of relations) {
    if (!edge.isPrimary || !ids.has(edge.fromId) || !ids.has(edge.toId) || parents.has(edge.toId)) continue
    parents.set(edge.toId, edge.fromId)
    const branch = children.get(edge.fromId) || []
    branch.push(edge.toId)
    children.set(edge.fromId, branch)
  }

  const visited = new Set()
  const positions = {}
  const lanes = []
  for (const root of [...nodes.filter(({ id }) => !parents.has(id)), ...nodes]) {
    if (visited.has(root.id)) continue
    const queue = [{ id: root.id, depth: 0 }]
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const { id, depth } = queue[cursor]
      if (visited.has(id)) continue
      visited.add(id)
      const lane = (lanes[depth] ||= [])
      lane.push(id)
      for (const child of children.get(id) || []) queue.push({ id: child, depth: depth + 1 })
    }
  }
  const largestLane = Math.max(...lanes.map((lane) => lane.length))
  lanes.forEach((lane, depth) => lane.forEach((id, index) => {
    const offset = index + (largestLane - lane.length) / 2
    positions[id] = horizontal
      ? { x: depth * (NODE_W + H_GAP), y: offset * (NODE_H + V_GAP) }
      : { x: offset * (NODE_W + H_GAP), y: depth * (NODE_H + V_GAP) }
  }))
  return {
    positions,
    width: (horizontal ? lanes.length - 1 : largestLane - 1) * (NODE_W + H_GAP) + NODE_W,
    height: (horizontal ? largestLane - 1 : lanes.length - 1) * (NODE_H + V_GAP) + NODE_H,
  }
}

function buildEdgePath(from, to, horizontal) {
  const source = horizontal
    ? { x: from.x + (to.x >= from.x ? NODE_W : 0), y: from.y + NODE_H / 2 }
    : { x: from.x + NODE_W / 2, y: from.y + (to.y >= from.y ? NODE_H : 0) }
  const target = horizontal
    ? { x: to.x + (to.x >= from.x ? 0 : NODE_W), y: to.y + NODE_H / 2 }
    : { x: to.x + NODE_W / 2, y: to.y + (to.y >= from.y ? 0 : NODE_H) }
  if (horizontal && from.x === to.x) {
    const x = from.x + NODE_W / 2
    return `M ${x} ${from.y + (to.y > from.y ? NODE_H : 0)} L ${x} ${to.y + (to.y > from.y ? 0 : NODE_H)}`
  }
  if (!horizontal && from.y === to.y) {
    const y = from.y + NODE_H / 2
    return `M ${from.x + (to.x > from.x ? NODE_W : 0)} ${y} L ${to.x + (to.x > from.x ? 0 : NODE_W)} ${y}`
  }
  const midX = (source.x + target.x) / 2
  const midY = (source.y + target.y) / 2
  return horizontal
    ? `M ${source.x} ${source.y} C ${midX} ${source.y}, ${midX} ${target.y}, ${target.x} ${target.y}`
    : `M ${source.x} ${source.y} C ${source.x} ${midY}, ${target.x} ${midY}, ${target.x} ${target.y}`
}

// ── Main component ────────────────────────────────────────────────────────
export default function TwinFlowDiagram({
  nodes = [],
  relations = [],
  onChange,
  readOnly = false,
  choices = {},
  roster = [],
  peopleRoles = {},
}) {
  const diagramRef = useRef(null)
  const [localCollapsed, setLocalCollapsed] = useState({})
  const [selectedNode, setSelectedNode] = useState(null)
  const [renaming, setRenaming] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [linkingFrom, setLinkingFrom] = useState(null)
  const [direction, setDirection] = useState("vertical")
  const [showAddNode, setShowAddNode] = useState(null) // parentId | "root" | null
  const [newNodeType, setNewNodeType] = useState("activity")
  const [newNodeName, setNewNodeName] = useState("")
  const [choiceId, setChoiceId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [equipmentType, setEquipmentType] = useState("")
  const [personRole, setPersonRole] = useState("")
  const [personCategory, setPersonCategory] = useState("nonTechnical")
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 20, y: 20 })
  const [confirmRemoveNode, setConfirmRemoveNode] = useState(null)

  useEffect(() => {
    const dismiss = (event) => {
      if (event.key === "Escape") { setSelectedNode(null); setLinkingFrom(null); setShowAddNode(null); setRenaming(null) }
    }
    const outside = (event) => {
      if (diagramRef.current && !diagramRef.current.contains(event.target)) { setSelectedNode(null); setLinkingFrom(null) }
    }
    window.addEventListener("keydown", dismiss)
    window.addEventListener("pointerdown", outside)
    return () => { window.removeEventListener("keydown", dismiss); window.removeEventListener("pointerdown", outside) }
  }, [])

  const canvasRef = useRef(null)
  const isPanningRef = useRef(false)
  const panStartRef = useRef(null)

  // ── Layout
  const horizontal = direction === "horizontal"
  const visibleNodes = useMemo(() => visibleHierarchyNodes(nodes.map((node) => readOnly && Object.hasOwn(localCollapsed, node.id) ? { ...node, attributes: { ...node.attributes, collapsed: localCollapsed[node.id] } } : node), relations), [nodes, relations, readOnly, localCollapsed])
  const layout = useMemo(() => computeLayout(visibleNodes, relations, horizontal), [visibleNodes, relations, horizontal])
  const connections = useMemo(() => collectConnections(relations), [relations])

  const nodeById = useMemo(() => {
    const map = {}
    nodes.forEach((n) => { map[n.id] = n })
    return map
  }, [nodes])

  const fitToView = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !layout.width || !layout.height) return
    const scale = Math.min(1, Math.max(1, canvas.clientWidth - 52) / layout.width,
      Math.max(1, canvas.clientHeight - 52) / layout.height)
    setZoom(scale)
    setPan({ x: (canvas.clientWidth - layout.width * scale) / 2,
      y: (canvas.clientHeight - layout.height * scale) / 2 })
  }, [layout.width, layout.height])

  useEffect(() => { fitToView() }, [fitToView, direction])

  // ── Panning via middle-click or space+drag or background drag
  const onCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current || e.target.dataset?.canvas === "true") {
      setSelectedNode(null)
      setLinkingFrom(null)
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
    setZoom((z) => Math.max(Math.min(0.03, z), Math.min(2.5, z * Math.exp(delta))))
  }

  // ── Mutations ────────────────────────────────────────────────────────────
  const handleRename = (event) => {
    event.preventDefault()
    const name = renaming.name.trim()
    if (!name) return
    onChange?.({ nodes: nodes.map((node) => node.id === renaming.id ? { ...node, name,
      attributes: { ...node.attributes, ...(["value_chain", "activity", "service", "asset"].includes(node.nodeType) ? { taxonomyId: renaming.choiceId || null, ...(node.nodeType === "asset" && !renaming.choiceId ? { equipmentType: name } : {}) } : {}),
        ...(node.nodeType === "asset" ? { quantity: Number(renaming.quantity) } : {}) } } : node), relations })
    setRenaming(null)
  }

  const companyId = nodes.find((node) => node.nodeType === "company")?.id
  const parentId = showAddNode === "root" ? companyId : showAddNode
  const selectedPeople = nodeById[selectedNode]?.attributes?.roles ||
    [...new Map((nodeById[selectedNode]?.attributes?.people || []).map((person) => {
      const record = roster.find(({ id }) => id === person.id) || person
      return [`${record.category}:${record.role}`, { id: person.id, role: record.role || "Unspecified role", category: record.category || "nonTechnical" }]
    })).values()]
  const ancestorChain = (id) => {
    const seen = new Set()
    while (id && !seen.has(id)) {
      seen.add(id)
      const node = nodeById[id]
      if (node?.nodeType === "value_chain") return node.attributes?.taxonomyId || null
      id = relations.find((edge) => edge.isPrimary && edge.toId === id)?.fromId
    }
    return null
  }
  const chainId = ancestorChain(parentId)
  const parent = nodeById[parentId]
  const parentGroupChoice = parent?.nodeType === "equipment_group"
    ? parent.attributes?.taxonomyId || choices.equipment_group?.find((item) => item.registerId === parent.attributes?.registerId)?.equipmentGroupChoiceId
    : null
  const nodeOptions = newNodeType === "person"
    ? []
    : (choices[newNodeType] || []).filter((choice) =>
      (newNodeType !== "activity" || !chainId || choice.custom || choice.valueChainIds?.includes(chainId)) &&
      (newNodeType !== "asset" || !parentGroupChoice || !choice.equipmentGroupChoiceId || choice.equipmentGroupChoiceId === parentGroupChoice) &&
      !nodes.some((node) =>
        (choice.registerId && (node.attributes?.registerId === choice.registerId || node.attributes?.instances?.some((item) => item.id === choice.registerId))) ||
        (choice.hierarchyId && node.attributes?.hierarchyId === choice.hierarchyId) ||
        (newNodeType === "equipment_group" && node.attributes?.taxonomyId === choice.id)))
  const picked = nodeOptions.find((choice) => choice.id === choiceId)
  const newAsset = newNodeType === "asset" && !picked?.registerId
  const canAdd = newNodeType === "person" ? !!personRole.trim() :
    (picked || ((newNodeType === "site" || choiceId === "__other__") && newNodeName.trim()))
    && (!newAsset || (Number.isInteger(Number(quantity)) && Number(quantity) > 0 && Number(quantity) <= 50 && (picked || equipmentType.trim())))

  const openAdd = (parent, type = "site") => {
    setSelectedNode(null)
    setShowAddNode(parent)
    setNewNodeType(type)
    setChoiceId("")
    setNewNodeName("")
    setQuantity(1)
    setEquipmentType("")
    setPersonRole("")
    setPersonCategory("nonTechnical")
  }

  const handleAddNode = () => {
    if (!canAdd) return
    const name = (newAsset && newNodeName.trim()) || picked?.name || newNodeName.trim()
    if (newNodeType === "person") {
      const role = { id: structureId(), role: personRole.trim(), category: personCategory }
      const people = nodeById[parentId]?.attributes?.roles || []
      if (!people.some((item) => item.role.toLowerCase() === role.role.toLowerCase() && item.category === role.category)) updatePeople(parentId, [...people, role])
    } else {
      const attributes = {}
      if (picked?.registerId) attributes.registerId = picked.registerId
      else if (picked?.hierarchyId) attributes.hierarchyId = picked.hierarchyId
      else if (picked) attributes.taxonomyId = picked.id
      if (newAsset) {
        if (picked?.equipmentGroupChoiceId) attributes.equipmentGroupChoiceId = picked.equipmentGroupChoiceId
        attributes.quantity = Number(quantity)
        if (!picked) attributes.equipmentType = equipmentType.trim()
      }
      const newNode = { id: structureId(), nodeType: newNodeType, name, attributes }
      const relType = relationTypeFor(nodeById[parentId]?.nodeType, newNodeType)
      const edge = parentId ? [{
        id: structureId(), fromId: parentId, toId: newNode.id, relationType: relType, isPrimary: true,
      }] : []
      onChange?.({ nodes: [...nodes, newNode], relations: [...relations, ...edge] })
    }
    setSelectedNode(null)
    setShowAddNode(null)
  }

  const updatePeople = (id, people) => {
    onChange?.({ nodes: nodes.map((node) => node.id === id
      ? { ...node, attributes: { ...node.attributes, roles: people, people: [] } } : node), relations })
  }

  const doRemoveNode = (id) => {
    const updatedNodes = nodes.filter((n) => n.id !== id)
    const updatedRelations = relations.filter((r) => r.fromId !== id && r.toId !== id)
    onChange?.({ nodes: updatedNodes, relations: updatedRelations })
    setConfirmRemoveNode(null)
    setSelectedNode(null)
  }

  const handleCompleteLink = (targetId) => {
    const fromId = linkingFrom
    setLinkingFrom(null)
    if (!fromId || fromId === targetId || relations.some((edge) => sameConnection(edge, fromId, targetId))) return
    const primaryParents = new Map(relations.filter((edge) => edge.isPrimary).map((edge) => [edge.toId, edge.fromId]))
    const ancestors = new Set([fromId])
    let parent = primaryParents.get(fromId)
    while (parent && !ancestors.has(parent)) {
      ancestors.add(parent)
      parent = primaryParents.get(parent)
    }
    const target = nodeById[targetId]
    const isPrimary = target.nodeType !== "company" && !primaryParents.has(targetId) && !ancestors.has(targetId)
    const edge = { id: structureId(), fromId, toId: targetId,
      relationType: relationTypeFor(nodeById[fromId].nodeType, target.nodeType), isPrimary }
    onChange?.({ nodes, relations: [...relations, edge] })
  }

  const onNodeClick = (node) => {
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

  return (
    <div ref={diagramRef} style={{ fontFamily: "inherit" }}>

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
              onClick={() => openAdd("root")}
              style={toolbarBtn}
            >
              <Plus size={13} /> Add node
            </button>
            <span style={{ width: 1, height: 20, background: T.lineSoft }} />
          </>
        )}

        <div role="group" aria-label="Diagram view" className="dt-actions">
          {[["vertical", "Top to bottom"], ["horizontal", "Left to right"]].map(([value, label]) =>
            <button type="button" key={value} aria-pressed={direction === value}
              className={`dt-button dt-button-small ${direction === value ? "dt-button-primary" : ""}`}
              onClick={() => setDirection(value)}>{label}</button>)}
        </div>
        <button onClick={() => setZoom((z) => Math.min(2.5, z * 1.25))} style={toolbarIconBtn} title="Zoom in">
          <ZoomIn size={14} />
        </button>
        <button onClick={() => setZoom((z) => Math.max(Math.min(0.03, z), z / 1.25))} style={toolbarIconBtn} title="Zoom out">
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
          <strong style={{ color: T.ink }}>{connections.length}</strong> links
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
            Add under <strong>{nodeById[parentId]?.name || "Organisation"}</strong>
          </span>
          <select aria-label="Node type" value={newNodeType}
            onChange={(event) => openAdd(showAddNode, event.target.value)} style={miniInput}>
            {Object.entries(NODE_VISUALS).filter(([kind]) => kind !== "company")
              .map(([kind, visual]) => <option value={kind} key={kind}>{visual.label}</option>)}
            <option value="person">People</option>
          </select>
          {newNodeType === "person" ? <>
            <select aria-label="Role category" style={miniInput} value={personCategory} onChange={(event) => {
              setPersonCategory(event.target.value); setPersonRole("")
            }}><option value="technical">Technical</option><option value="nonTechnical">Non-Technical</option></select>
            <input aria-label="Role" list="dt-structure-person-roles" style={miniInput} placeholder="Select or specify a role"
              value={personRole} maxLength={120} onChange={(event) => setPersonRole(event.target.value)} />
            <datalist id="dt-structure-person-roles">{(peopleRoles[personCategory] || []).map((role) => <option key={role.id} value={role.name} />)}</datalist>
            <span className="dt-muted">Add employee names in Team Setup.</span>
          </> : newNodeType === "site" ? <input aria-label="Site name" value={newNodeName} maxLength={120}
            onChange={(event) => setNewNodeName(event.target.value)} placeholder="Enter site name" style={miniInput} /> : <>
            <select aria-label="Available options" value={choiceId} onChange={(event) => setChoiceId(event.target.value)} style={miniInput}>
              <option value="">Choose an option</option>{nodeOptions.map((option) => <option key={option.id} value={option.id}>{option.label || option.name}</option>)}
              <option value="__other__">Other (specify)</option>
            </select>
            {choiceId === "__other__" && <input aria-label="Name" value={newNodeName} maxLength={120}
              onChange={(event) => setNewNodeName(event.target.value)} placeholder="Name" style={miniInput} />}
          </>}
          {newAsset && choiceId && <>
            <label>Quantity <input aria-label="Equipment quantity" type="number" min="1" max="50" step="1" value={quantity}
              onChange={(event) => setQuantity(event.target.value)} style={{ ...miniInput, width: 75 }} /></label>
            {choiceId === "__other__" && <input aria-label="Equipment type" value={equipmentType} maxLength={120}
              onChange={(event) => setEquipmentType(event.target.value)} placeholder="Equipment type" style={miniInput} />}
            <small>Each unit gets a separate row and an editable Asset ID in Asset Setup.</small>
          </>}
          <button disabled={!canAdd} onClick={handleAddNode} style={toolbarPrimaryBtn}>Add</button>
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
            {connections.map((edge) => {
              const from = layout.positions[edge.fromId]
              const to = layout.positions[edge.toId]
              if (!from || !to || edge.fromId === edge.toId) return null
              const highlighted = [edge.fromId, edge.toId].some((id) => id === hoveredNode || id === selectedNode)
              return <path key={edge.id} d={buildEdgePath(from, to, horizontal)} fill="none"
                stroke={highlighted ? T.accent : T.lineStrong} strokeWidth={highlighted ? 2.6 : 2}
                strokeLinecap="round" />
            })}
          </svg>

          {/* Nodes layer */}
          {visibleNodes.map((node) => {
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
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onNodeClick(node)
                  }
                }}
                style={{
                  position: "absolute",
                  left: pos.x,
                  top: pos.y,
                  width: NODE_W,
                  height: NODE_H,
                  cursor: linkingFrom ? "crosshair" : "pointer",
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
                    }} title={["activity", "service", "value_chain"].includes(node.nodeType) ? workLabel(node.name) : node.name}>
                      {["activity", "service", "value_chain"].includes(node.nodeType) ? workLabel(node.name) : node.name}{node.nodeType === "asset" && Number(node.attributes?.quantity || 1) > 1 ? ` × ${node.attributes.quantity}` : ""}
                    </div>
                  </div>

                  {relations.some((edge) => edge.isPrimary && edge.fromId === node.id) && <button type="button"
                    aria-label={`${node.attributes?.collapsed ? "Expand" : "Collapse"} ${node.name}`} aria-expanded={!node.attributes?.collapsed}
                    style={{ ...toolbarIconBtn, position: "absolute", bottom: -15, right: 4 }} onClick={(event) => {
                      event.stopPropagation()
                      if (readOnly) setLocalCollapsed((current) => ({ ...current, [node.id]: !node.attributes?.collapsed }))
                      else onChange?.({ nodes: nodes.map((item) => item.id === node.id ? { ...item, attributes: { ...item.attributes, collapsed: !item.attributes?.collapsed } } : item), relations })
                    }}>{node.attributes?.collapsed ? "+" : "−"}</button>}
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
          const width = canvasRef.current?.clientWidth || 330
          const height = canvasRef.current?.clientHeight || 450
          const half = Math.min(width, 340) / 2
          const screenX = Math.max(half, Math.min(width - half, pan.x + (pos.x + NODE_W / 2) * zoom))
          const screenY = Math.max(0, Math.min(height - 78, pan.y + (pos.y + NODE_H) * zoom + 6))
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
              <button type="button" aria-label="Close node actions" style={popoverBtn} onClick={() => setSelectedNode(null)}>×</button>
              <button
                onClick={() => { setLinkingFrom(selectedNode); setSelectedNode(null) }}
                style={popoverBtn}
              >
                <Link2 size={11} /> Connect
              </button>
              <button
                onClick={() => openAdd(selectedNode)}
                style={popoverBtn}
              >
                <Plus size={11} /> Add child
              </button>
              <button onClick={() => openAdd(selectedNode, "person")} style={popoverBtn}>People</button>
              {canDelete && <button type="button" onClick={() => { setRenaming({ id: selectedNode, name: node.name, choiceId: node.attributes?.taxonomyId || "", quantity: node.attributes?.quantity || 1 }); setSelectedNode(null) }}
                style={popoverBtn}>Edit</button>}
              {relations.some((edge) => edge.isPrimary && edge.fromId === selectedNode) && <button type="button" style={popoverBtn}
                onClick={() => { onChange?.({ nodes: nodes.map((item) => item.id === selectedNode ? { ...item, attributes: { ...item.attributes, collapsed: !item.attributes?.collapsed } } : item), relations }); setSelectedNode(null) }}>
                {node.attributes?.collapsed ? "Expand" : "Collapse"}</button>}
              {canDelete && (
                <button
                  onClick={() => { setConfirmRemoveNode(selectedNode); setSelectedNode(null) }}
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

      <p className="dt-muted">Click a node to show its actions. Click it again, click the canvas, press Escape or use × to hide them.</p>
      {renaming && <form className="dt-panel dt-actions" onSubmit={handleRename}>
        {["value_chain", "activity", "service", "asset"].includes(nodeById[renaming.id]?.nodeType) && <label className="dt-field"><span>Selection</span>
          <select value={renaming.choiceId} onChange={(event) => {
            const option = (choices[nodeById[renaming.id].nodeType] || []).find((item) => item.id === event.target.value)
            setRenaming({ ...renaming, choiceId: event.target.value, name: option?.name || renaming.name })
          }}><option value="">Other (specify)</option>{(choices[nodeById[renaming.id].nodeType] || [])
            .filter((item) => nodeById[renaming.id].nodeType !== "activity" || !ancestorChain(renaming.id) || item.custom || item.valueChainIds?.includes(ancestorChain(renaming.id)))
            .map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
        {nodeById[renaming.id]?.nodeType === "asset" && <label className="dt-field"><span>Quantity</span><input required type="number" min="1" max="50" step="1"
          value={renaming.quantity} onChange={(event) => setRenaming({ ...renaming, quantity: event.target.value })} /></label>}
        <label className="dt-field"><span>Node name</span><input required maxLength={120} value={renaming.name}
          onChange={(event) => setRenaming({ ...renaming, name: event.target.value })} /></label>
        <button type="submit" className="dt-button dt-button-primary">Save name</button>
        <button type="button" className="dt-button" onClick={() => setRenaming(null)}>Cancel</button>
      </form>}

      {selectedPeople.length > 0 &&
        <details key={`people:${selectedNode}`} className="dt-panel dt-people-list">
          <summary>Roles · {nodeById[selectedNode].name} ({selectedPeople.length})</summary>
          <div className="dt-table-wrap"><table className="dt-table">
            <thead><tr><th>Role</th><th>Category</th>{!readOnly && <th>Actions</th>}</tr></thead>
            <tbody>{selectedPeople.map((person) => {
              const record = roster.find(({ id }) => id === person.id) || person
              return <tr key={person.id}><td>{record.role || "—"}</td>
                <td>{record.category === "technical" ? "Technical" : "Non-technical"}</td>
                {!readOnly && <td><button type="button" className="dt-button dt-button-small"
                  onClick={() => updatePeople(selectedNode, selectedPeople.filter(({ id }) => id !== person.id))}>Remove from node</button></td>}
              </tr>
            })}</tbody>
          </table></div>
        </details>}



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