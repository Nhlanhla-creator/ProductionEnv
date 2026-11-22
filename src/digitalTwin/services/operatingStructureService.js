import { collection, doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { getOnboardingState } from "./onboardingState"
import { getTenant, listNodes } from "./hierarchyService"
import { listGroups, listResources, prepareGroup, prepareResource } from "./resourceService"
import { getPack } from "./taxonomyService"
import { inventoryForDiagram } from "../models/structureInventory"
import { structureOptions } from "../models/operatingStructure"
import { listPeople } from "./teamService"
import { createEmptyAssignment } from "../models/assetSchema"

const ref = (tenantId, path, id) => doc(db, "digitalTwinTenants", tenantId, path, id)
export const structureId = () => doc(collection(db, "digitalTwinTenants")).id

export async function loadOperatingStructure(tenantId) {
  const [state, tenant, profile, nodes, groups, assets, roster] = await Promise.all([
    getOnboardingState(tenantId),
    getTenant(tenantId),
    getDoc(doc(db, "universalProfiles", tenantId)),
    listNodes(tenantId, { status: null }),
    listGroups(tenantId),
    listResources(tenantId, { resourceKind: "asset", includeOutsideStructure: true }),
    listPeople(tenantId),
  ])
  const activeNodes = nodes.filter((node) => node.status === "active")
  const company = activeNodes.find((node) => node.id === state.companyNodeId) || activeNodes.find((node) => node.nodeType === "company")
  const name = profile.data()?.entityOverview?.registeredName || tenant?.displayName || company?.name || "Your organisation"
  const root = { id: company?.id || structureId(), nodeType: "company", name, attributes: company?.attributes || {}, _root: true }
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]))
  const saved = state.form?.operatingDiagram
  const diagram = saved ? {
    ...saved,
    nodes: saved.nodes.map((node) => {
      if (node._root) return { ...node, name }
      const asset = node.nodeType === "asset" && !node.attributes?.instances && assetsById.get(node.attributes?.registerId)
      return asset?.name ? { ...node, name: asset.name } : node
    }),
  } : { nodes: [root], relations: [] }
  return { state, tenant, company, diagram, nodes: activeNodes, allNodes: nodes, groups, assets, roster }
}

function ancestorContext(id, nodes, edges) {
  const context = {}
  const seen = new Set()
  const paths = { site: "siteId", contract: "contractId", facility: "facilityId",
    process_area: "processAreaId", service: "serviceId", activity: "activityId", equipment_group: "groupId" }
  while (!seen.has(id)) {
    seen.add(id)
    const link = edges.find((edge) => edge.isPrimary && edge.toId === id)
    const parent = nodes.find((node) => node.id === link?.fromId)
    if (!parent) break
    const field = paths[parent.nodeType]
    if (field && !context[field]) context[field] = parent.attributes?.registerId || parent.attributes?.hierarchyId || parent.id
    id = parent.id
  }
  return context
}

export async function saveOperatingStructure(tenantId, form, diagram, loaded) {
  const user = auth.currentUser
  if (!user) throw new Error("Sign in to save the operating structure.")
  const actor = { uid: user.uid, email: user.email || null }, now = new Date().toISOString()
  const day = now.slice(0, 10), timestamp = serverTimestamp()
  const newRecord = { createdAt: timestamp, updatedAt: timestamp, createdBy: actor }
  const editRecord = { updatedAt: timestamp, updatedBy: actor }
  const resourceAudit = { createdAt: now, updatedAt: now, createdBy: actor, updatedBy: actor }
  const expected = loaded.state.form?.operatingDiagram
  const previousNodes = new Map((expected?.nodes || []).map((node) => [node.id, node]))
  const previousEdges = new Map((expected?.relations || []).map((edge) => [edge.id, edge]))
  const root = diagram.nodes.find((node) => node._root)
  if (!root) throw new Error("The organisation node is required.")
  const options = structureOptions(form.sectorPack, form.valueChains)
  const selectedChains = new Set(form.valueChains.map((item) => item.id))
  for (const node of diagram.nodes) {
    if (node.nodeType === "value_chain" && node.attributes?.taxonomyId && !selectedChains.has(node.attributes.taxonomyId)) throw new Error(`${node.name}: select this value chain in Step 2, or edit its selection in the diagram.`)
    if (node.nodeType === "service" && node.attributes?.taxonomyId && !options.services.some((item) => item.id === node.attributes.taxonomyId)) throw new Error(`${node.name}: choose a relevant Support Service or use Other.`)
    if (node.nodeType === "activity" && node.attributes?.taxonomyId) {
      const choice = options.activities.find((item) => item.id === node.attributes.taxonomyId)
      let parentId = node.id, chain, seen = new Set()
      while (parentId && !seen.has(parentId)) {
        seen.add(parentId)
        const parent = diagram.nodes.find((item) => item.id === parentId)
        if (parent?.nodeType === "value_chain") { chain = parent; break }
        parentId = diagram.relations.find((edge) => edge.isPrimary && edge.toId === parentId)?.fromId
      }
      if (!choice || (chain?.attributes?.taxonomyId && !choice.valueChainIds.includes(chain.attributes.taxonomyId))) throw new Error(`${node.name}: edit this activity to match its selected value chain.`)
    }
  }
  const writes = [], reservations = [], resourceEdits = new Map()
  const set = (path, id, data) => writes.push([ref(tenantId, path, id), data, false])
  const update = (path, id, data) => writes.push([ref(tenantId, path, id), data, true])
  const groupIds = new Map((loaded.state.form?.equipmentGroupLinks || []).map(({ choiceId, id }) => [choiceId, id]))
  const inventory = inventoryForDiagram(diagram, loaded.assets, structureId)
  const nodes = inventory.nodes.map((node) => {
    const attributes = { ...node.attributes }
    if (attributes.people?.length) {
      const roles = [...(attributes.roles || []), ...attributes.people.map((person) => loaded.roster.find((item) => item.id === person.id) || person)
        .filter((person) => person.role).map((person) => ({ id: structureId(), role: person.role, category: person.category || "nonTechnical" }))]
      attributes.roles = [...new Map(roles.map((role) => [`${role.category}:${role.role.toLowerCase()}`, role])).values()]
      attributes.people = []
    }
    return { ...node, name: node.name.trim(), attributes }
  })
  const edges = diagram.relations.map(({ id, fromId, toId, relationType, isPrimary }) => ({ id, fromId, toId, relationType, isPrimary: !!isPrimary }))
  const validIds = new Set(nodes.map((node) => node.id))
  if (validIds.size !== nodes.length || edges.some((edge) => !validIds.has(edge.fromId) || !validIds.has(edge.toId))) throw new Error("The diagram contains an invalid node or connection.")
  const groupRecords = new Map(loaded.groups.map((group) => [group.id, group]))
  for (const node of nodes.filter((item) => item.nodeType === "equipment_group")) {
    const id = node.attributes.registerId || groupIds.get(node.attributes.taxonomyId) || node.id
    node.attributes.registerId = id
    if (node.attributes.taxonomyId) groupIds.set(node.attributes.taxonomyId, id)
    if (!groupRecords.has(id)) {
      set("groups", id, prepareGroup(tenantId, { name: node.name }, id, now))
      groupRecords.set(id, { id, name: node.name })
    }
  }
  // A selected group is materialised only when equipment in the hierarchy uses it.
  for (const node of nodes.filter((item) => item.nodeType === "asset")) {
    const choiceId = structureOptions(form.sectorPack).asset.find((item) => item.id === node.attributes.taxonomyId)?.equipmentGroupChoiceId || node.attributes.equipmentGroupChoiceId
    if (choiceId && !groupIds.has(choiceId)) {
      const group = [...form.equipmentGroups, ...structureOptions(form.sectorPack).equipmentGroups].find((item) => item.id === choiceId)
      if (group) { const id = structureId(); groupIds.set(choiceId, id); set("groups", id, prepareGroup(tenantId, { name: group.name }, id, now)) }
    }
    node.attributes.defaultEquipmentGroupId = groupIds.get(choiceId) || node.attributes.defaultEquipmentGroupId || null
  }
  const closePlacement = (instance) => {
    if (instance.assignmentId) update("assignments", instance.assignmentId, {
      state: "closed", effectiveTo: instance.assignmentStart === day ? null : new Date(Date.parse(`${day}T00:00:00Z`) - 86400000).toISOString().slice(0, 10), updatedAt: now, updatedBy: actor,
    })
  }
  const idInHierarchy = (id) => {
    const node = nodes.find((item) => item.id === id)
    return node?.attributes.hierarchyId || (node?.nodeType !== "asset" && node?.attributes.registerId) || id
  }
  // Every equipment row uses the same resource ID in Asset Setup, downtime and KPI capture.
  for (const entry of inventory.entries) {
    const node = nodes.find((item) => item.id === entry.nodeId)
    const instance = node.attributes.instances[entry.index]
    const context = ancestorContext(node.id, nodes, edges)
    context.groupId ||= node.attributes.defaultEquipmentGroupId
    const oldNode = previousNodes.get(node.id)
    const oldContext = oldNode ? ancestorContext(oldNode.id, expected.nodes, expected.relations) : {}
    oldContext.groupId ||= oldNode?.attributes?.defaultEquipmentGroupId || null
    const equipmentTypeId = node.attributes.taxonomyId || node.attributes.equipmentType || node.name
    const existing = entry.existing
    let payload
    if (!existing) {
      payload = prepareResource(tenantId, { name: node.name, internalNumber: instance.internalNumber,
        equipmentTypeId, equipmentGroupId: context.groupId || null, siteId: context.siteId || null,
        currentStructureAsset: true, structureNodeId: node.id, structureUnitIndex: entry.index,
      }, instance.id, now)
      if (loaded.assets.some((asset) => String(asset.internalNumber || "").trim().toUpperCase() === payload.internalNumber)) throw new Error(`Asset ID ${payload.internalNumber} is already registered.`)
      reservations.push(payload)
    } else {
      payload = { currentStructureAsset: true, structureNodeId: node.id, structureUnitIndex: entry.index,
        equipmentTypeId, equipmentGroupId: context.groupId || null, siteId: context.siteId || null,
        resourceVersion: (existing.resourceVersion || 0) + 1, updatedAt: now, updatedBy: actor }
      if (oldNode && existing.name === oldNode.name) payload.name = node.name
      resourceEdits.set(existing.id, existing)
    }
    if (!instance.assignmentId || JSON.stringify(context) !== JSON.stringify(oldContext)) {
      closePlacement(instance)
      instance.assignmentId = structureId(); instance.assignmentStart = day
      set("assignments", instance.assignmentId, createEmptyAssignment(tenantId, instance.id, {
        ...context, assignmentId: instance.assignmentId, state: "active", isPrimary: true, ...resourceAudit,
      }))
    }
    if (instance.id !== node.id) {
      const physicalNode = loaded.allNodes.find((item) => item.id === instance.id)
      const core = { name: existing?.name || node.name, attributes: { registerId: instance.id, structureNodeId: node.id } }
      if (physicalNode) update("nodes", instance.id, { ...core, status: "active", effectiveTo: null, ...editRecord })
      else set("nodes", instance.id, { ...core, nodeType: "asset", code: null, effectiveFrom: day, effectiveTo: null, status: "active", ...newRecord })
      const linkId = `unit_${node.id}_${instance.id}`
      if (!oldNode?.attributes?.instances?.some((item) => item.id === instance.id)) set("relations", linkId, {
        fromId: node.id, toId: instance.id, relationType: "contains", isPrimary: true, attributes: {}, allocation: null,
        effectiveFrom: day, effectiveTo: null, status: "active", ...newRecord,
      })
    }
    if (existing) update("resources", instance.id, payload)
    else set("resources", instance.id, payload)
  }
  // Exclude unrelated legacy rows from the current register without deleting their history.
  for (const asset of loaded.assets) {
    if (inventory.resourceIds.has(asset.id) || asset.currentStructureAsset === false) continue
    resourceEdits.set(asset.id, asset)
    update("resources", asset.id, { currentStructureAsset: false,
      resourceVersion: (asset.resourceVersion || 0) + 1, updatedAt: now, updatedBy: actor })
    const oldNode = [...previousNodes.values()].find((node) => node.attributes?.registerId === asset.id || node.attributes?.instances?.some((item) => item.id === asset.id))
    const instance = oldNode?.attributes?.instances?.find((item) => item.id === asset.id) || oldNode?.attributes
    if (instance) closePlacement(instance)
    if (asset.structureNodeId && asset.structureNodeId !== asset.id) {
      if (loaded.allNodes.some((node) => node.id === asset.id)) update("nodes", asset.id, { status: "retired", effectiveTo: day, ...editRecord })
      update("relations", `unit_${asset.structureNodeId}_${asset.id}`, { status: "closed", effectiveTo: day, ...editRecord })
    }
  }
  for (const node of nodes.filter((item) => item.nodeType === "value_chain")) {
    const descendants = new Set([node.id])
    for (let i = 0; i < nodes.length; i++) for (const edge of edges) if (edge.isPrimary && descendants.has(edge.fromId)) descendants.add(edge.toId)
    node.attributes.structureResourceIds = inventory.entries.filter((entry) => descendants.has(entry.nodeId)).map((entry) => entry.instance.id)
  }
  for (const node of nodes) {
    if (!node.name) throw new Error("Give every node a name.")
    const core = { name: node.name, attributes: node.attributes }
    const recordId = idInHierarchy(node.id), existing = loaded.allNodes.find((item) => item.id === recordId)
    if (existing) update("nodes", recordId, { ...core, status: "active", effectiveTo: null, ...editRecord })
    else set("nodes", recordId, { ...core, nodeType: node.nodeType, code: null, effectiveFrom: day, effectiveTo: null, status: "active", ...newRecord })
  }
  for (const old of previousNodes.values()) {
    if (!validIds.has(old.id) && loaded.allNodes.some((node) => node.id === old.id)) update("nodes", old.id, { status: "retired", effectiveTo: day, ...editRecord })
  }
  for (const edge of edges) {
    if (!previousEdges.has(edge.id)) set("relations", edge.id, {
      fromId: idInHierarchy(edge.fromId), toId: idInHierarchy(edge.toId), relationType: edge.relationType, isPrimary: edge.isPrimary,
      attributes: {}, allocation: null, effectiveFrom: day, effectiveTo: null, status: "active", ...newRecord,
    })
  }
  for (const edge of previousEdges.values()) if (!edges.some(({ id }) => id === edge.id)) update("relations", edge.id, { status: "closed", effectiveTo: day, ...editRecord })
  const pack = getPack(form.sectorPack)
  if (pack) set("activePacks", form.sectorPack, { packKey: form.sectorPack, version: pack.version, activatedAt: now, activatedBy: user.uid, deactivatedAt: null, deactivatedBy: null })
  if (writes.length + reservations.length + 2 > 450) throw new Error("This save exceeds the transaction size. Reduce equipment quantities and save in smaller stages.")
  await runTransaction(db, async (tx) => {
    const onboarding = ref(tenantId, "onboarding", "state"), tenantRef = doc(db, "digitalTwinTenants", tenantId)
    const edits = [...resourceEdits.values()]
    const [snapshot, tenant, reserved, registered] = await Promise.all([
      tx.get(onboarding), tx.get(tenantRef),
      Promise.all(reservations.map((asset) => tx.get(ref(tenantId, "assetIdentifiers", asset.internalNumber)))),
      Promise.all(edits.map((asset) => tx.get(ref(tenantId, "resources", asset.id)))),
    ])
    const old = snapshot.data() || {}
    if ((old.form?.operatingDiagram?.revision || null) !== (expected?.revision || null)) throw new Error("This diagram changed in another session. Reopen Operating structure before saving.")
    if (reserved.some((item) => item.exists())) throw new Error("An Asset ID is already reserved. Reopen Operating structure and try again.")
    registered.forEach((snapshot, index) => {
      const asset = edits[index], current = snapshot.data()
      if (!current || current.updatedAt !== asset.updatedAt || (current.resourceVersion || 0) !== (asset.resourceVersion || 0)) throw new Error(`${asset.name} changed in Asset Setup. Reopen the diagram before saving.`)
    })
    if (!tenant.exists()) tx.set(tenantRef, { displayName: root.name, legalName: null, registrationNumber: null, createdAt: timestamp, createdBy: actor, status: "active", schemaVersion: 1 })
    for (const [target, payload, editing] of writes) editing ? tx.update(target, payload) : tx.set(target, payload)
    for (const asset of reservations) tx.set(ref(tenantId, "assetIdentifiers", asset.internalNumber), { resourceId: asset.assetId, internalNumber: asset.internalNumber, createdAt: now, createdBy: actor })
    tx.set(onboarding, { ...old, currentStep: 3, completed: true, startedAt: old.startedAt || now, completedAt: now,
      lastUpdated: timestamp, objective: old.objective || null, sectorPack: form.sectorPack, dismissals: old.dismissals || {},
      form: { ...old.form, structureDraft: form, companyNodeId: root.id,
        equipmentGroupLinks: [...groupIds].map(([choiceId, id]) => ({ choiceId, id })),
        operatingDiagram: { nodes, relations: edges, revision: structureId() } },
    })
  })
}
