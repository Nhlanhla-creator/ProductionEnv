import { seedCodes } from "./downtimeCodes"
import { addEquipmentDefaults } from "./equipmentDowntime"

/** Predefined sector lists. No organisation code entry is required. */
export function sectorMasterCodes(sectorPack, equipmentTypeIds = []) {
  if (sectorPack === "mining") return addEquipmentDefaults(seedCodes(true), equipmentTypeIds)
  const labels = {
    agriculture: ['Farm maintenance', 'Field operations', 'Seasonal standby', 'Equipment failure', 'Farm operations', 'Weather and access'],
    manufacturing: ['Plant maintenance', 'Production preparation', 'Scheduled standby', 'Equipment failure', 'Process interruption', 'Utilities and demand'],
    industrial_support: ['Service equipment maintenance', 'Service preparation', 'Scheduled standby', 'Equipment failure', 'Service interruption', 'Access and demand'],
    other: ['Scheduled maintenance', 'Operational preparation', 'Scheduled standby', 'Equipment failure', 'Operational interruption', 'External interruption'],
  }[sectorPack] || ['Scheduled maintenance', 'Operational preparation', 'Scheduled standby', 'Equipment failure', 'Operational interruption', 'External interruption']
  const details = [
    ['Routine servicing', 'Scheduled service'], ['Shift preparation', 'Scheduled inspection / preparation'],
    ['Non-operating period', 'Equipment not required'], ['Mechanical / electrical systems', 'Equipment fault'],
    ['People / materials / process', 'Operational delay'], ['Weather / utilities / access', 'External disruption'],
  ]
  const nodes = seedCodes(false)
  nodes.filter((node) => node.level === 2).forEach((parent, index) => {
    const prefix = `preset-${sectorPack || 'other'}-${index}`
    const common = { active: true, canonicalId: null, standardLabel: null }
    nodes.push({ ...common, id: `${prefix}-3`, parentId: parent.id, level: 3, label: labels[index], origin: 'custom_unmapped', terminal: false, sortOrder: nodes.length })
    nodes.push({ ...common, id: `${prefix}-4`, parentId: `${prefix}-3`, level: 4, label: details[index][0], origin: 'organisation', terminal: false, sortOrder: nodes.length })
    nodes.push({ ...common, id: `${prefix}-5`, parentId: `${prefix}-4`, level: 5, label: details[index][1], origin: 'organisation', terminal: true, sortOrder: nodes.length })
  })
  return nodes
}
