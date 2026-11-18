import { getPack, optionsFor } from "../services/taxonomyService"

export const STRUCTURE_STEPS = ["Sector pack", "What work is performed?", "Asset structure", "Diagram"]

export const EMPTY_STRUCTURE = {
  sectorPack: "",
  sectorName: "",
  valueChains: [],
  activities: [],
  services: [],
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
export const workLabel = (value = "") => /blasting and drilling/i.test(value) ? value
  : value.replace(/\bdrilling\b/gi, (word) => word === "Drilling" ? "Blasting and Drilling" : "blasting and drilling")
const choice = (term) => ({ id: term.id, name: workLabel(term.name) })
export const uniqueChoices = (values) => [...new Map(values.map((value) => [value.id, value])).values()]

function packServices(pack) {
  return [...(pack?.services || []), ...(pack?.valueChain || []).flatMap((stage) => stage.services || [])]
}

export function structureOptions(packKey, selectedChains = []) {
  const pack = getPack(packKey)
  const chains = pack?.valueChain || (pack?.services ? [{
    id: pack.sector.id, name: pack.sector.name, services: pack.services,
  }] : [])
  const stages = selectedChains.length ? chains.filter((chain) => selectedChains.some(({ id }) => id === chain.id)) : chains
  const work = stages.flatMap((stage) => (stage.services || []).flatMap((service) =>
    service.activities?.length ? service.activities : [{ id: `${service.id}.work`, name: service.name }]))
  const [technical, nonTechnical] = roles[packKey] || [[], []]
  const families = optionsFor({ packKey, domain: "equipment_family" })
  return {
    valueChains: chains.map(choice),
    activities: uniqueChoices(work.map(choice)),
    services: uniqueChoices([...packServices(pack), ...packServices(getPack("industrial_support"))].map(choice)),
    equipmentGroups: uniqueChoices(families.map(choice)),
    asset: uniqueChoices(families.flatMap((family) => {
      const types = optionsFor({ packKey, domain: "equipment_type", parentId: family.id })
      return types.map((type) => ({
        id: type.id, name: type.name, equipmentGroupChoiceId: family.id,
      }))
    })),
    technical: technical.map((name) => ({ id: `technical:${name}`, name })),
    nonTechnical: nonTechnical.map((name) => ({ id: `nonTechnical:${name}`, name })),
  }
}

export function changeWorkSelection(form, key, values) {
  const next = { ...form, [key]: values }
  if (key === "valueChains") {
    const valid = new Set(structureOptions(next.sectorPack, values).activities.map(({ id }) => id))
    next.activities = next.activities.filter((value) => value.custom || valid.has(value.id))
  }
  if (key === "equipmentGroups") {
    const selected = new Set(values.filter((value) => !value.custom).map(({ id }) => id))
    if (selected.size) {
      next.equipment = (next.equipment || []).filter((value) => !value.equipmentGroupChoiceId || selected.has(value.equipmentGroupChoiceId))
    }
  }
  return next
}
