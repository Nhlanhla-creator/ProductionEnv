import { builderOptions, reconcileBuilderForm } from "./builderSelection"

export const STRUCTURE_STEPS = ["Sector pack", "What work is performed?", "Asset structure", "Digital Twin"]

export const EMPTY_STRUCTURE = {
  sectorPack: "",
  sectorName: "",
  operatingEnvironments: [],
  valueChains: [],
  activities: [],
  services: [],
  supportActivities: [],
  catalogueRequests: [],
  equipmentGroups: [],
  equipment: [],
  technical: [],
  nonTechnical: [],
}

const roles = {
  mining: [["Equipment operator", "Driller", "Mine surveyor", "Maintenance technician"], ["Site administrator", "HR officer", "Procurement officer", "Safety administrator"]],
  agriculture: [["Farm equipment operator", "Agronomist", "Irrigation technician", "Livestock technician"], ["Farm administrator", "Logistics coordinator", "Sales coordinator"]],
  manufacturing: [["Machine operator", "Production technician", "Quality technician", "Maintenance technician"], ["Production planner", "Warehouse administrator", "Procurement officer"]],
  industrial_support: [["Field technician", "Maintenance technician", "Site supervisor"], ["Service coordinator", "Account manager", "Administrator"]],
}
export const workLabel = (value = "") => value.replace(/blasting and drilling/gi, "Drilling & blasting")
export const uniqueChoices = (values) => [...new Map(values.map((value) => [value.id, value])).values()]
export function structureOptions(packKey, selectedChains = [], scope = {}) {
  const [technical, nonTechnical] = roles[packKey] || [[], []]
  return { ...builderOptions({ ...scope, sectorPack: packKey, valueChains: selectedChains }),
    technical: technical.map((name) => ({ id: `technical:${name}`, name })),
    nonTechnical: nonTechnical.map((name) => ({ id: `nonTechnical:${name}`, name })),
  }
}
export function changeWorkSelection(form, key, values) {
  return reconcileBuilderForm({ ...form, [key]: values })
}
