import { getPack, optionsFor } from "../services/taxonomyService"

export const STRUCTURE_STEPS = ["Sector pack", "What work is performed?", "Asset structure", "Diagram"]

export const EMPTY_STRUCTURE = {
  sectorPack: "",
  sectorName: "",
  operatingEnvironments: [],
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

const SUPPORT_CATEGORIES = {
  mining: ["cleaning", "catering", "security", "medical", "maintenance", "labs", "logistics", "professional"],
  agriculture: ["cleaning", "security", "medical", "maintenance", "labs", "logistics", "professional"],
  manufacturing: ["cleaning", "catering", "security", "medical", "maintenance", "labs", "logistics", "professional"],
  industrial_support: ["cleaning", "catering", "security", "medical", "maintenance", "labs", "logistics", "professional"],
}
export function supportServices(packKey) {
  const allowed = SUPPORT_CATEGORIES[packKey] || ["cleaning", "security", "maintenance", "logistics", "professional"]
  const pack = getPack("industrial_support")
  return (pack?.services || []).filter((service) => allowed.includes(service.sectorChild?.split(".").pop()))
    .map((term) => ({ ...choice(term), category: pack.sector.children.find((item) => item.id === term.sectorChild)?.name || "Professional services" }))
}

export function structureOptions(packKey, selectedChains = []) {
  const pack = getPack(packKey)
  const chains = pack?.valueChain || (pack?.services ? [{
    id: pack.sector.id, name: pack.sector.name, services: pack.services,
  }] : [])
  const stages = selectedChains.length ? chains.filter((chain) => selectedChains.some(({ id }) => id === chain.id)) : []
  const work = stages.flatMap((stage) => (stage.services || []).flatMap((service) =>
    service.activities?.length ? service.activities : [{ id: `${service.id}.work`, name: service.name }]))
  const [technical, nonTechnical] = roles[packKey] || [[], []]
  const families = optionsFor({ packKey, domain: "equipment_family" })
  return {
    valueChains: chains.map(choice),
    activities: uniqueChoices(work.map((term) => ({ ...choice(term), valueChainIds: stages.filter((stage) => (stage.services || []).some((service) => service.activities?.some((activity) => activity.id === term.id) || `${service.id}.work` === term.id)).map((stage) => stage.id) }))),
    services: supportServices(packKey),
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
