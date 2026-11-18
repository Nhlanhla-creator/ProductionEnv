import { collection, doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { getOnboardingState } from "./onboardingState"
import { getTenant, listNodes } from "./hierarchyService"
import { listGroups, listResources, prepareGroup, prepareResource } from "./resourceService"
import { getPack } from "./taxonomyService"
import { listPeople, personPayload } from "./teamService"
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
    listResources(tenantId, { resourceKind: "asset" }),
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
      const asset = node.nodeType === "asset" && assetsById.get(node.attributes?.registerId)
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
  const actor = { uid: user.uid, email: user.email || null }
  const now = new Date().toISOString()
  const day = now.slice(0, 10)
  const yesterday = new Date(Date.parse(`${day}T00:00:00Z`) - 86400000).toISOString().slice(0, 10)
  const timestamp = serverTimestamp()
  const newRecord = { createdAt: timestamp, updatedAt: timestamp, createdBy: actor }
  const editRecord = { updatedAt: timestamp, updatedBy: actor }
  const resourceAudit = { createdAt: now, updatedAt: now, createdBy: actor, updatedBy: actor }
  const onboarding = ref(tenantId, "onboarding", "state")
  const expected = loaded.state.form?.operatingDiagram
  const previousNodes = new Map((expected?.nodes || []).map((node) => [node.id, node]))
  const previousEdges = new Map((expected?.relations || []).map((edge) => [edge.id, edge]))
  const root = diagram.nodes.find((node) => node._root)
  const writes = []
  const set = (path, id, data) => writes.push([ref(tenantId, path, id), data, false])
  const update = (path, id, data) => writes.push([ref(tenantId, path, id), data, true])
  const closePlacement = (attributes) => {
    if (attributes?.assignmentId) update("assignments", attributes.assignmentId, {
      state: "closed", effectiveTo: attributes.assignmentStart === day ? null : yesterday,
      updatedAt: now, updatedBy: actor,
    })
  }
  const groupIds = new Map((loaded.state.form?.equipmentGroupLinks || []).map(({ choiceId, id }) => [choiceId, id]))
  const newGroups = new Set()
  for (const choice of form.equipmentGroups) {
    const existing = loaded.groups.find((group) => group.id === groupIds.get(choice.id) ||
      group.name.trim().toLowerCase() === choice.name.trim().toLowerCase())
    if (existing) {
      groupIds.set(choice.id, existing.id)
    } else {
      const id = structureId()
      groupIds.set(choice.id, id)
      newGroups.add(id)
      set("groups", id, prepareGroup(tenantId, { name: choice.name }, id, now))
    }
  }

  const assetsById = new Map(loaded.assets.map((asset) => [asset.id, asset]))
  const loadedNodes = new Map(loaded.diagram.nodes.map((node) => [node.id, node]))
  const resourceEdits = []
  const assetsByNumber = new Set(loaded.assets.map((asset) => String(asset.internalNumber || "").trim().toUpperCase()))
  const reservations = []
  const newPeople = new Map()
  const nodes = diagram.nodes.map((node) => {
    const attributes = { ...node.attributes }
    if (node.nodeType === "equipment_group") {
      const groupChoice = form.equipmentGroups.find(({ name }) => name.toLowerCase() === node.name.toLowerCase())
      attributes.registerId ||= groupIds.get(attributes.taxonomyId || groupChoice?.id) || node.id
      const id = attributes.registerId
      if (!newGroups.has(id) && !loaded.groups.some((group) => group.id === id) && !previousNodes.has(node.id)) {
        newGroups.add(id)
        set("groups", id, prepareGroup(tenantId, { name: node.name }, id, now))
      }
    }
    if (node.nodeType === "asset") attributes.registerId ||= node.id
    for (const person of attributes.people || []) {
      if (!loaded.roster.some((item) => item.id === person.id) && person.name) newPeople.set(person.id, person)
    }
    if (attributes.people) attributes.people = attributes.people.map(({ id }) => ({ id }))
    return { id: node.id, nodeType: node.nodeType, name: node.name.trim(), attributes, ...(node._root ? { _root: true } : {}) }
  })
  const seenRegisterIds = new Set()
  for (const node of nodes) {
    const id = node.attributes.registerId
    if (!id) continue
    if (seenRegisterIds.has(id)) throw new Error(`${node.name} appears more than once. Keep one node and use Connect to link it to other nodes.`)
    seenRegisterIds.add(id)
  }
  const edges = diagram.relations.map(({ id, fromId, toId, relationType, isPrimary }) => ({
    id, fromId, toId, relationType, isPrimary: !!isPrimary,
  }))
  const idInHierarchy = (id) => {
    const node = nodes.find((entry) => entry.id === id)
    return node?.attributes.registerId || node?.attributes.hierarchyId || id
  }

  for (const node of nodes) {
    if (!node.name) throw new Error("Give every node a name.")
    const previous = previousNodes.get(node.id)
    const { attributes } = node
    if (node.nodeType === "asset" && !previous && attributes.registerId === node.id) {
      const context = ancestorContext(node.id, nodes, edges)
      const selectedGroup = (form.equipment || []).find(({ id }) => id === attributes.taxonomyId)?.equipmentGroupChoiceId
      const defaultGroup = groupIds.get(selectedGroup)
      if (defaultGroup) attributes.defaultEquipmentGroupId = defaultGroup
      const asset = prepareResource(tenantId, {
        name: node.name,
        internalNumber: attributes.internalNumber,
        equipmentTypeId: attributes.taxonomyId || attributes.equipmentType,
        equipmentGroupId: context.groupId || defaultGroup || null,
        siteId: context.siteId || null,
      }, node.id, now)
      if (assetsByNumber.has(asset.internalNumber)) throw new Error(`Asset ID ${asset.internalNumber} is already registered.`)
      assetsByNumber.add(asset.internalNumber)
      reservations.push(asset)
      set("resources", node.id, asset)
    }
    if (node.nodeType === "asset") {
      const registered = assetsById.get(attributes.registerId)
      const originalName = loadedNodes.get(node.id)?.name ?? registered?.name
      const patch = {}
      if (registered && node.name !== originalName && node.name !== registered.name) patch.name = node.name

      if (attributes.registerId === node.id) {
        const context = ancestorContext(node.id, nodes, edges)
        const oldContext = previous ? ancestorContext(node.id, expected.nodes, expected.relations) : {}
        if (JSON.stringify(oldContext) !== JSON.stringify(context)) {
          if (attributes.assignmentId) {
            closePlacement(attributes)
            delete attributes.assignmentId
            delete attributes.assignmentStart
          }
          if (Object.keys(context).length) {
            const assignmentId = structureId()
            attributes.assignmentId = assignmentId
            attributes.assignmentStart = day
            set("assignments", assignmentId, createEmptyAssignment(tenantId, node.id, {
              ...context, assignmentId, state: "active", isPrimary: true, ...resourceAudit,
            }))
          }
          // The diagram owns placement of its new assets. Preserve independently edited register fields.
          if (registered) {
            for (const [field, key] of [["equipmentGroupId", "groupId"], ["siteId", "siteId"]]) {
              const fallback = key === "groupId" ? attributes.defaultEquipmentGroupId ?? null : null
              const oldValue = oldContext[key] ?? fallback
              const newValue = context[key] ?? fallback
              if ((registered[field] ?? null) === oldValue && newValue !== oldValue) patch[field] = newValue
            }
          }
        }
      }

      if (registered && Object.keys(patch).length) {
        resourceEdits.push(registered)
        update("resources", registered.id, { ...patch, resourceVersion: (registered.resourceVersion || 0) + 1,
          updatedAt: now, updatedBy: actor })
      }
    }
    if (attributes.hierarchyId) continue
    const recordId = idInHierarchy(node.id)
    const existing = loaded.allNodes.find((entry) => entry.id === recordId)
    const core = { name: node.name, attributes }
    if (existing?.status === "retired") {
      update("nodes", recordId, { ...core, ...editRecord, status: "active", effectiveTo: null })
    } else if (previous || existing) {
      if (!previous || JSON.stringify(core) !== JSON.stringify({ name: previous.name, attributes: previous.attributes })) {
        update("nodes", recordId, { ...core, ...editRecord })
      }
    } else {
      set("nodes", recordId, { ...core, nodeType: node.nodeType, code: null,
        effectiveFrom: day, effectiveTo: null, status: "active", ...newRecord })
    }
  }
  for (const person of newPeople.values()) {
    set("people", person.id, personPayload(person, true))
  }
  for (const previous of previousNodes.values()) {
    if (nodes.some(({ id }) => id === previous.id)) continue
    closePlacement(previous.attributes)
    if (!previous.attributes?.hierarchyId && !previous.attributes?.registerId) {
      update("nodes", previous.id, { status: "retired", effectiveTo: day, ...editRecord })
    }
  }
  for (const edge of edges) {
    if (previousEdges.has(edge.id)) continue
    const fromId = idInHierarchy(edge.fromId), toId = idInHierarchy(edge.toId)
    if (fromId === toId) throw new Error("Choose two different records to connect.")
    set("relations", edge.id, { fromId, toId, relationType: edge.relationType, isPrimary: edge.isPrimary,
      attributes: {}, allocation: null, effectiveFrom: day, effectiveTo: null, status: "active", ...newRecord })
  }
  for (const edge of previousEdges.values()) {
    if (!edges.some(({ id }) => id === edge.id)) {
      update("relations", edge.id, { status: "closed", effectiveTo: day, ...editRecord })
    }
  }
  const sectorPack = getPack(form.sectorPack)
  if (sectorPack) {
    set("activePacks", form.sectorPack, {
      packKey: form.sectorPack, version: sectorPack.version, activatedAt: now, activatedBy: user.uid,
      deactivatedAt: null, deactivatedBy: null,
    })
  }
  if (writes.length + reservations.length + 2 > 500) {
    throw new Error("Save a smaller set of diagram changes first.")
  }

  await runTransaction(db, async (tx) => {
    const tenantRef = doc(db, "digitalTwinTenants", tenantId)
    const [snapshot, tenant, reserved, registeredSnapshots] = await Promise.all([
      tx.get(onboarding),
      tx.get(tenantRef),
      Promise.all(reservations.map((asset) => tx.get(ref(tenantId, "assetIdentifiers", asset.internalNumber)))),
      Promise.all(resourceEdits.map((asset) => tx.get(ref(tenantId, "resources", asset.id)))),
    ])
    const old = snapshot.data() || {}
    if ((old.form?.operatingDiagram?.revision || null) !== (expected?.revision || null)) {
      throw new Error("This diagram was saved in another session. Reopen Operating structure to load the latest version.")
    }
    const used = reserved.findIndex((entry) => entry.exists())
    if (used >= 0) throw new Error(`Asset ID ${reservations[used].internalNumber} is already reserved.`)
    registeredSnapshots.forEach((snapshot, index) => {
      const asset = resourceEdits[index]
      const current = snapshot.data()
      if (!current || current.updatedAt !== asset.updatedAt || (current.resourceVersion || 0) !== (asset.resourceVersion || 0)) {
        throw new Error(`${asset.name} changed in the Asset Register. Reopen Operating structure and try again.`)
      }
    })
    if (!tenant.exists()) {
      tx.set(tenantRef, { displayName: root.name, legalName: null, registrationNumber: null,
        createdAt: timestamp, createdBy: actor, status: "active", schemaVersion: 1 })
    }
    for (const [target, payload, editing] of writes) {
      if (editing) tx.update(target, payload)
      else tx.set(target, payload)
    }
    for (const asset of reservations) {
      tx.set(ref(tenantId, "assetIdentifiers", asset.internalNumber), {
        resourceId: asset.assetId, internalNumber: asset.internalNumber, createdAt: now, createdBy: actor,
      })
    }
    tx.set(onboarding, {
      ...old,
      currentStep: 3,
      completed: true,
      startedAt: old.startedAt || now,
      completedAt: now,
      lastUpdated: timestamp,
      objective: old.objective || null,
      sectorPack: form.sectorPack,
      dismissals: old.dismissals || {},
      form: {
        ...old.form,
        structureDraft: form,
        companyNodeId: root.id,
        equipmentGroupLinks: [...groupIds].map(([choiceId, id]) => ({ choiceId, id })),
        operatingDiagram: { nodes, relations: edges, revision: structureId() },
      },
    })
  })
}
