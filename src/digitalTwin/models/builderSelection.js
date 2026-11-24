import { BUILDER_REFERENCE as catalogue } from "../taxonomy/builderReference"

export const builderTerm = (id) => [catalogue.environments, catalogue.valueChains, catalogue.activities, catalogue.supportFunctions, catalogue.equipmentGroups, catalogue.equipmentTypes].flat().find((item) => item.id === id)
const ids = (items = []) => new Set(items.map((item) => item.id))
const unique = (items) => [...new Map(items.map((item) => [item.id, item])).values()]
export function environmentChoices(sectorKey) { return catalogue.environments.filter((item) => item.sectorKey === sectorKey) }
export function migrateEnvironment(item, sectorKey) {
  if (builderTerm(item.id)?.sectorKey === sectorKey) return builderTerm(item.id)
  const aliases = { open_pit: 'surface_open_pit_open_cast', quarry: 'surface_quarry', underground_hard_rock: 'underground_hard_rock', underground_coal: 'underground_coal', mineral_processing: 'mineral_processing_plant_only', exploration: 'exploration_development_services', open_field: 'open_field_cropping', greenhouse: 'protected_cropping', discrete: 'discrete_manufacturing', continuous: 'process_manufacturing', assembly: 'assembly_fabrication' }
  const tail = item.id?.split('.').pop()
  return environmentChoices(sectorKey).find((choice) => choice.id.endsWith(`.${aliases[tail] || tail}`)) || (item.custom ? item : null)
}
export function builderOptions(form) {
  const environments = ids((form.operatingEnvironments || []).map((item) => migrateEnvironment(item, form.sectorPack)).filter(Boolean))
  const inEnvironment = (item) => item.sectorKey === form.sectorPack && environments.has(item.environmentId)
  const valueChains = catalogue.valueChains.filter(inEnvironment)
  const services = catalogue.supportFunctions.filter(inEnvironment)
  const selectedParents = ids([...(form.valueChains || []), ...(form.services || [])])
  const eligibleActivities = catalogue.activities.filter((item) => inEnvironment(item) && item.parentIds.some((id) => selectedParents.has(id)))
  const selectedActivities = ids([...(form.activities || []), ...(form.supportActivities || [])])
  const mappings = catalogue.mappings.filter((item) => environments.has(item.environmentId) && selectedParents.has(item.valueChainId) && selectedActivities.has(item.activityId))
  const equipmentGroups = unique(mappings.map((mapping) => ({ ...builderTerm(mapping.equipmentGroupId),
    activityIds: mappings.filter((item) => item.equipmentGroupId === mapping.equipmentGroupId).map((item) => item.activityId) })))
  const chosenGroups = ids(form.equipmentGroups)
  const asset = catalogue.equipmentTypes.filter((item) => inEnvironment(item) && item.parentIds.some((id) => chosenGroups.has(id) && equipmentGroups.some((group) => group.id === id)))
    .flatMap((item) => item.parentIds.filter((id) => chosenGroups.has(id) && equipmentGroups.some((group) => group.id === id)).map((groupId) => ({ ...item, equipmentGroupChoiceId: groupId })))
  const activityChoice = (item) => ({ ...item, valueChainIds: item.parentIds, category: item.environmentId.split('.').pop().replace(/_/g, ' ') })
  return { valueChains, services, activities: eligibleActivities.filter((item) => !item.support).map(activityChoice),
    supportActivities: eligibleActivities.filter((item) => item.support).map(activityChoice), equipmentGroups, asset: unique(asset), mappings }
}
export function reconcileBuilderForm(form) {
  const next = { ...form, operatingEnvironments: (form.operatingEnvironments || []).map((item) => migrateEnvironment(item, form.sectorPack)).filter(Boolean) }
  const keep = (key, choices) => { const valid = ids(choices); next[key] = (next[key] || []).filter((item) => valid.has(item.id)) }
  let available = builderOptions(next)
  keep('valueChains', available.valueChains); keep('services', available.services)
  available = builderOptions(next)
  keep('activities', available.activities); keep('supportActivities', available.supportActivities)
  available = builderOptions(next); keep('equipmentGroups', available.equipmentGroups)
  available = builderOptions(next); keep('equipment', available.asset)
  return next
}
export function equipmentMapping(form, typeId, activityId, groupId) {
  const term = builderTerm(typeId)
  if (!term || !catalogue.equipmentTypes.some((item) => item.id === typeId)) return null
  const available = builderOptions(form)
  return available.mappings.find((mapping) => mapping.activityId === activityId && term.parentIds.includes(mapping.equipmentGroupId) && (!groupId || mapping.equipmentGroupId === groupId)) || null
}

export function pruneDiagramSelections(diagram, form) {
  const permitted = { value_chain: ids(form.valueChains), service: ids(form.services),
    activity: ids([...(form.activities || []), ...(form.supportActivities || [])]),
    equipment_group: ids(form.equipmentGroups), asset: ids(form.equipment) }
  const remove = new Set(diagram.nodes.filter((node) => node.attributes?.taxonomyId && permitted[node.nodeType] && !permitted[node.nodeType].has(node.attributes.taxonomyId)).map((node) => node.id))
  for (let i = 0; i < diagram.nodes.length; i++) for (const edge of diagram.relations) if (edge.isPrimary && remove.has(edge.fromId)) remove.add(edge.toId)
  const nodes = diagram.nodes.filter((node) => node._root || !remove.has(node.id))
  const kept = new Set(nodes.map((node) => node.id))
  return { ...diagram, nodes, relations: diagram.relations.filter((edge) => kept.has(edge.fromId) && kept.has(edge.toId)), removed: diagram.nodes.filter((node) => remove.has(node.id)) }
}
