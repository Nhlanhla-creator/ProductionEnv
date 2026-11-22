/** Equipment-specific extensions never replace the fixed Planned/Unplanned hierarchy. */
export function codeAppliesToEquipment(node, equipmentTypeId) {
  return !equipmentTypeId || !node.equipmentTypeIds?.length || node.equipmentTypeIds.includes(equipmentTypeId)
}

export function equipmentComponents(typeId = '') {
  if (/conveyor|belt/.test(typeId)) return [['Conveyor belt', 'Belt damage'], ['Drive system', 'Drive failure'], ['Idlers and rollers', 'Roller failure']]
  if (/crusher|mill|screen/.test(typeId)) return [['Drive system', 'Drive failure'], ['Wear components', 'Worn liners'], ['Feed system', 'Feed blockage']]
  if (/rig|drill|bolter/.test(typeId)) return [['Drill string', 'Drill string failure'], ['Rotation system', 'Rotation failure'], ['Flushing system', 'Flushing failure']]
  if (/pump|irrigation/.test(typeId)) return [['Pump assembly', 'Pump failure'], ['Seals', 'Seal leak'], ['Pipework', 'Pipe blockage']]
  if (/truck|adt|haul|loader|excavator|dozer|grader|tractor|vehicle/.test(typeId)) return [['Tyres and wheels', 'Tyre damage'], ['Steering system', 'Steering failure'], ['Suspension', 'Suspension failure']]
  return []
}

export function addEquipmentDefaults(nodes, equipmentTypeIds = []) {
  const result = nodes.map((node) => ({ ...node }))
  const mechanical = result.find((node) => node.level === 3 && node.standardLabel === 'Mechanical')
  if (!mechanical) return result
  for (const typeId of equipmentTypeIds) {
    for (const [label, reason] of equipmentComponents(typeId)) {
      const id = `equipment-${typeId}-${label}`.replace(/[^a-zA-Z0-9._-]/g, '_')
      if (result.some((node) => node.id === id)) continue
      const common = { canonicalId: null, standardLabel: null, origin: 'organisation', active: true, equipmentTypeIds: [typeId] }
      result.push({ ...common, id, parentId: mechanical.id, level: 4, label, terminal: false, sortOrder: result.length })
      result.push({ ...common, id: `${id}-reason`, parentId: id, level: 5, label: reason, terminal: true, sortOrder: result.length })
    }
  }
  mechanical.terminal = false
  return result
}

export function restoreMiningDefaults(previous, baseNodes, equipmentTypeIds = []) {
  const defaults = addEquipmentDefaults(baseNodes, equipmentTypeIds)
  const ids = new Set(defaults.map((node) => node.id))
  return [...defaults.map((node) => {
    const old = previous.find((item) => item.id === node.id)
    return old ? { ...node, ...(node.level === 3 ? { label: old.label } : {}), active: true } : node
  }), ...previous.filter((node) => !ids.has(node.id))]
}
