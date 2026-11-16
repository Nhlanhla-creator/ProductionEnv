export const AGRICULTURE_SECTOR = {
  id: "sector.agriculture",
  code: "agriculture",
  name: "Agriculture",
}

const stage = (id, name, serviceNames, equipmentNames) => ({
  id: `ag.vc.${id}`,
  code: id,
  name,
  services: serviceNames.map(([code, label, activities]) => ({
    id: `ag.svc.${code}`,
    code,
    name: label,
    activities: activities.map(([key, description]) => ({
      id: `ag.act.${key}`, code: key, name: description,
    })),
  })),
  equipmentFamilies: equipmentNames.map(([code, label]) => ({
    id: `ag.eq.${code}`, code, name: label,
  })),
})

export const AGRICULTURE_VALUE_CHAIN = [
  stage("establishment", "Land preparation and planting", [
    ["establishment", "Crop establishment", [["soil_preparation", "Soil preparation"], ["planting", "Planting"]]],
  ], [["tractors", "Tractors"], ["planters", "Planters and seed drills"], ["tillage", "Tillage equipment"]]),
  stage("crop_production", "Crop production", [
    ["crop_management", "Crop management", [["irrigation", "Irrigation"], ["crop_protection", "Crop protection"], ["fertilising", "Fertilising"]]],
  ], [["irrigation", "Irrigation pumps and systems"], ["sprayers", "Sprayers and spreaders"]]),
  stage("livestock", "Livestock production", [
    ["animal_husbandry", "Animal husbandry", [["feeding", "Feeding"], ["animal_health", "Animal health"], ["milking", "Milking"]]],
  ], [["feeding", "Feeding equipment"], ["handling", "Livestock handling equipment"], ["milking", "Milking systems"]]),
  stage("harvest", "Harvest and post-harvest", [
    ["harvest", "Harvesting", [["harvesting", "Harvesting"], ["field_loading", "Field loading"]]],
    ["post_harvest", "Post-harvest handling", [["grading", "Sorting and grading"], ["packing", "Packing"], ["storage", "Storage"]]],
  ], [["harvesters", "Harvesters"], ["trailers", "Trailers and loaders"], ["sorting", "Sorting and packing equipment"], ["cold_storage", "Cold storage equipment"]]),
  stage("distribution", "Distribution and sales", [
    ["distribution", "Produce distribution", [["dispatch", "Order preparation and dispatch"], ["transport", "Transport"]]],
  ], [["vehicles", "Delivery vehicles"], ["handling_equipment", "Material handling equipment"]]),
]
