import { getPack, optionsFor } from "../services/taxonomyService"

export const STRUCTURE_STEPS = ["Sector pack", "What work is performed?", "Asset structure", "Diagram"]

export const EMPTY_STRUCTURE = {
  sectorPack: "",
  sectorName: "",
  valueChains: [],
  activities: [],
  services: [],
  equipmentGroups: [],
  technical: [],
  nonTechnical: [],
}

const roles = {
  mining: [["Equipment operator", "Driller", "Mine surveyor", "Maintenance technician"], ["Site administrator", "HR officer", "Procurement officer", "Safety administrator"]],
  agriculture: [["Farm equipment operator", "Agronomist", "Irrigation technician", "Livestock technician"], ["Farm administrator", "Logistics coordinator", "Sales coordinator"]],
  manufacturing: [["Machine operator", "Production technician", "Quality technician", "Maintenance technician"], ["Production planner", "Warehouse administrator", "Procurement officer"]],
  industrial_support: [["Field technician", "Maintenance technician", "Site supervisor"], ["Service coordinator", "Account manager", "Administrator"]],
}
const choice = (term) => ({ id: term.id, name: term.name })
export const uniqueChoices = (values) => [...new Map(values.map((value) => [value.id, value])).values()]

export function structureOptions(packKey, selectedChains, selectedActivities) {
  const pack = getPack(packKey)
  const chains = pack?.valueChain || (pack?.services ? [{
    id: pack.sector.id, name: pack.sector.name, services: pack.services,
  }] : [])
  const stages = chains.filter((chain) => selectedChains.some(({ id }) => id === chain.id))
  // Some packs define a service without named activities. Use its work label
  // as the activity in that case and retain the canonical service ID.
  const work = stages.flatMap((stage) => (stage.services || []).flatMap((service) => {
    const activities = service.activities?.length ? service.activities : [{ id: `${service.id}.work`, name: service.name }]
    return activities.map((activity) => ({ ...choice(activity), service }))
  }))
  const [technical, nonTechnical] = roles[packKey] || [[], []]
  const equipment = optionsFor({ packKey, domain: "equipment_family" })
  return {
    valueChains: chains.map(choice),
    activities: uniqueChoices(work.map(choice)),
    services: uniqueChoices(work.filter((activity) => selectedActivities.some(({ id }) => id === activity.id))
      .map(({ service }) => choice(service))),
    equipmentGroups: uniqueChoices(equipment.map(choice)),
    asset: uniqueChoices(equipment.flatMap((family) => {
      const types = optionsFor({ packKey, domain: "equipment_type", parentId: family.id })
      return (types.length ? types : [family]).map(choice)
    })),
    technical: technical.map((name) => ({ id: `technical:${name}`, name })),
    nonTechnical: nonTechnical.map((name) => ({ id: `nonTechnical:${name}`, name })),
  }
}

export function changeWorkSelection(form, key, values) {
  const next = { ...form, [key]: values }
  if (key === "valueChains") {
    const available = structureOptions(next.sectorPack, values, []).activities
    next.activities = next.activities.filter((value) => value.custom || available.some(({ id }) => id === value.id))
  }
  if (key === "valueChains" || key === "activities") {
    const available = structureOptions(next.sectorPack, next.valueChains, next.activities).services
    next.services = next.services.filter((value) => value.custom || available.some(({ id }) => id === value.id))
  }
  return next
}
