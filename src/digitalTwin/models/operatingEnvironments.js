/** Sector-specific operating contexts. Other remains available for unlisted environments. */
const choices = {
  mining: [
    ['open_pit', 'Open-pit mining'], ['strip_mining', 'Strip / opencast mining'], ['quarry', 'Quarry operations'],
    ['alluvial', 'Alluvial / placer mining'], ['underground_hard_rock', 'Underground hard-rock mining'],
    ['underground_coal', 'Underground coal mining'], ['surface_works', 'Surface mining works'],
    ['mineral_processing', 'Mineral-processing plant'], ['crushing_screening', 'Crushing and screening plant'],
    ['wash_plant', 'Coal preparation / wash plant'], ['smelter_refinery', 'Smelter / refinery'],
    ['tailings', 'Tailings / residue operations'], ['exploration', 'Exploration field site'],
    ['mobile_fleet', 'Mobile fleet operations'], ['fixed_plant', 'Fixed plant operations'],
    ['workshop', 'Maintenance workshop'], ['remote_site', 'Remote mine / camp'], ['marine', 'Marine / offshore mining'],
    ['rail_port', 'Mine rail / port / stockyard'], ['rehabilitation', 'Mine rehabilitation site'],
  ],
  agriculture: [
    ['open_field', 'Open-field crop production'], ['greenhouse', 'Greenhouse / controlled environment'],
    ['nursery', 'Nursery / propagation'], ['orchard', 'Orchard'], ['vineyard', 'Vineyard'],
    ['irrigated', 'Irrigated farming'], ['dryland', 'Dryland / rain-fed farming'], ['pasture', 'Pasture / grazing land'],
    ['feedlot', 'Feedlot / livestock housing'], ['dairy', 'Dairy operation'], ['poultry', 'Poultry house'],
    ['piggery', 'Piggery'], ['aquaculture', 'Aquaculture / fish farm'], ['forestry', 'Forestry / plantation'],
    ['packhouse', 'Packhouse / grading facility'], ['silo', 'Grain silo / storage'], ['cold_storage', 'Cold storage'],
    ['processing', 'Agro-processing facility'], ['workshop', 'Farm workshop'], ['remote_farm', 'Remote / off-grid farm'],
  ],
  manufacturing: [
    ['discrete', 'Discrete manufacturing'], ['continuous', 'Continuous-process plant'], ['batch', 'Batch-production plant'],
    ['assembly', 'Assembly line'], ['job_shop', 'Job shop / custom production'], ['fabrication', 'Fabrication workshop'],
    ['machining', 'Machining workshop'], ['foundry', 'Foundry / forging plant'], ['food', 'Food and beverage plant'],
    ['pharmaceutical', 'Pharmaceutical plant'], ['chemical', 'Chemical-processing plant'], ['textile', 'Textile / clothing plant'],
    ['automotive', 'Automotive production'], ['electronics', 'Electronics production'], ['additive', 'Additive manufacturing'],
    ['cleanroom', 'Cleanroom / controlled environment'], ['outdoor', 'Outdoor production yard'],
    ['warehouse', 'Warehouse / distribution centre'], ['cold_chain', 'Cold-chain production / storage'],
    ['pilot', 'Pilot plant / research facility'], ['maintenance', 'Maintenance workshop'],
  ],
  industrial_support: [
    ['mine', 'Mine site'], ['industrial_plant', 'Industrial / processing plant'], ['factory', 'Manufacturing facility'],
    ['construction', 'Construction site'], ['commercial', 'Commercial premises'], ['residential', 'Residential facilities'],
    ['public', 'Municipal / public infrastructure'], ['healthcare', 'Healthcare facility'], ['education', 'Campus / education facility'],
    ['remote_camp', 'Remote site / camp'], ['field', 'Field-service operations'], ['mobile', 'Mobile service unit'],
    ['workshop', 'Service workshop'], ['laboratory', 'Laboratory'], ['warehouse', 'Warehouse / logistics hub'],
    ['port', 'Port / marine facilities'], ['offshore', 'Offshore facilities'], ['office', 'Corporate / office environment'],
  ],
  other: [
    ['indoor', 'Indoor operations'], ['outdoor', 'Outdoor operations'], ['mixed', 'Mixed indoor / outdoor operations'],
    ['field', 'Field operations'], ['remote', 'Remote / off-grid site'], ['mobile', 'Mobile operations'],
    ['fixed_plant', 'Fixed plant / facility'], ['workshop', 'Workshop'], ['warehouse', 'Warehouse / logistics'],
    ['office', 'Corporate / office environment'], ['marine', 'Marine / offshore operations'], ['controlled', 'Controlled environment'],
  ],
}
export function operatingEnvironmentOptions(sectorPack) {
  return (choices[sectorPack] || choices.other).map(([key, name]) => ({ id: `environment.${sectorPack || 'other'}.${key}`, name }))
}
