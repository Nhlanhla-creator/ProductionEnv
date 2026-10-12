/**
 * digitalTwin/taxonomy/miningPack.js
 *
 * Mining and mineral-processing sector pack (Section 5.2, 5.3).
 * Every entry has an immutable canonical ID. Admins add via taxonomy request;
 * the pack itself is only versioned on release.
 *
 * Structure: Sector → Value chain stages → Services → Activities →
 *            Equipment families → Equipment types → KPI pack
 *
 * Version: 1.0.0
 */

export const MINING_PACK_VERSION = "1.0.0";

export const MINING_SECTOR = {
  id: "sector.mining",
  code: "mining",
  name: "Mining and mineral processing",
  children: [
    { id: "sector.mining.surface", code: "surface_mining", name: "Surface mining" },
    { id: "sector.mining.underground", code: "underground_mining", name: "Underground mining" },
    { id: "sector.mining.plant", code: "mineral_processing", name: "Mineral processing plant" },
    { id: "sector.mining.services", code: "mining_services", name: "Mining services contractor" },
  ],
};

// ── Value chain stages (Section 5.3) ─────────────────────────────────────
export const MINING_VALUE_CHAIN = [
  {
    id: "vc.exploration",
    code: "exploration_and_resource_definition",
    name: "Exploration and resource definition",
    services: [
      {
        id: "svc.exploration_drilling",
        code: "exploration_drilling",
        name: "Exploration drilling",
        activities: [
          { id: "act.core_drilling", code: "core_drilling", name: "Core drilling" },
          { id: "act.rc_drilling", code: "rc_drilling", name: "Reverse-circulation drilling" },
          { id: "act.percussion_drilling", code: "percussion_drilling", name: "Percussion drilling" },
        ],
      },
      { id: "svc.geophysics", code: "geophysics", name: "Geophysics and surveying" },
      { id: "svc.sampling", code: "sampling_and_logging", name: "Sampling and logging" },
    ],
    equipmentFamilies: [
      { id: "eq.exploration_rigs", code: "exploration_drill_rigs", name: "Exploration drill rigs" },
      { id: "eq.support_vehicles", code: "support_vehicles", name: "Support vehicles" },
      { id: "eq.survey_equipment", code: "survey_and_sampling_equipment", name: "Survey and sampling equipment" },
    ],
  },
  {
    id: "vc.mine_dev",
    code: "mine_development",
    name: "Mine development",
    services: [
      { id: "svc.clearing", code: "clearing", name: "Clearing and access" },
      { id: "svc.ground_support", code: "ground_support", name: "Ground support" },
      { id: "svc.declines", code: "declines_and_box_cuts", name: "Declines and box cuts" },
    ],
    equipmentFamilies: [
      { id: "eq.dozers", code: "dozers", name: "Dozers" },
      { id: "eq.excavators", code: "excavators", name: "Excavators" },
      { id: "eq.bolters", code: "roof_bolters", name: "Roof bolters" },
      { id: "eq.jumbos", code: "jumbos", name: "Jumbos" },
      { id: "eq.graders", code: "graders", name: "Graders" },
    ],
  },
  {
    id: "vc.production_drilling",
    code: "production_drilling",
    name: "Production drilling",
    services: [
      {
        id: "svc.blasthole_drilling",
        code: "blasthole_drilling",
        name: "Blast-hole drilling",
        activities: [
          { id: "act.surface_blasthole", code: "surface_blasthole", name: "Surface blast-hole drilling" },
          { id: "act.underground_longhole", code: "underground_longhole", name: "Underground long-hole drilling" },
        ],
      },
      { id: "svc.face_drilling", code: "face_drilling", name: "Face drilling" },
      { id: "svc.raise_boring", code: "raise_boring", name: "Raise boring" },
    ],
    equipmentFamilies: [
      { id: "eq.rotary_drills", code: "rotary_drills", name: "Rotary blast-hole drills" },
      { id: "eq.dth_drills", code: "dth_drills", name: "Down-the-hole (DTH) drills" },
      { id: "eq.tophammer_drills", code: "tophammer_drills", name: "Top-hammer drills" },
      { id: "eq.ug_drill_rigs", code: "underground_drill_rigs", name: "Underground drill rigs" },
    ],
  },
  {
    id: "vc.blasting",
    code: "blasting",
    name: "Blasting",
    services: [
      {
        id: "svc.charging",
        code: "charging",
        name: "Charging and initiation",
        activities: [
          { id: "act.charging", code: "charging", name: "Charging" },
          { id: "act.stemming", code: "stemming", name: "Stemming" },
          { id: "act.initiation", code: "initiation", name: "Initiation" },
          { id: "act.blast_monitoring", code: "blast_monitoring", name: "Blast monitoring" },
        ],
      },
    ],
    equipmentFamilies: [
      { id: "eq.mmu_trucks", code: "mmu_trucks", name: "Mobile manufacturing units (MMU)" },
      { id: "eq.charging_units", code: "charging_units", name: "Charging units" },
      { id: "eq.stemming_units", code: "stemming_units", name: "Stemming units" },
      { id: "eq.monitoring_equipment", code: "blast_monitoring_equipment", name: "Blast monitoring equipment" },
    ],
  },
  {
    id: "vc.load_haul",
    code: "load_and_haul",
    name: "Load and haul",
    services: [
      {
        id: "svc.haul_ore",
        code: "haul_ore",
        name: "Haul ore",
        activities: [
          { id: "act.loading", code: "loading", name: "Loading" },
          { id: "act.hauling", code: "hauling", name: "Hauling" },
          { id: "act.rehandling", code: "rehandling", name: "Rehandling" },
          { id: "act.waste_movement", code: "waste_movement", name: "Waste movement" },
        ],
      },
      {
        id: "svc.haul_waste",
        code: "haul_waste",
        name: "Haul waste",
        activities: [
          { id: "act.stripping", code: "stripping", name: "Overburden stripping" },
          { id: "act.stockpiling", code: "stockpiling", name: "Stockpiling" },
        ],
      },
    ],
    equipmentFamilies: [
      { id: "eq.excavators_load", code: "hydraulic_excavators", name: "Hydraulic excavators" },
      { id: "eq.shovels", code: "electric_rope_shovels", name: "Electric rope shovels" },
      { id: "eq.loaders", code: "front_end_loaders", name: "Front-end loaders" },
      {
        id: "eq.haul_trucks",
        code: "haul_trucks",
        name: "Haul trucks",
        types: [
          {
            id: "eqtype.adt",
            code: "articulated_dump_truck",
            name: "Articulated dump truck",
            examples: ["Bell B45E", "Volvo A60H", "Caterpillar 745"],
            capacityClassTonnes: [30, 60],
          },
          {
            id: "eqtype.rigid_haul_truck",
            code: "rigid_off_highway_truck",
            name: "Rigid / off-highway haul truck",
            examples: ["Caterpillar 777E", "Komatsu HD785", "Hitachi EH3500"],
            capacityClassTonnes: [70, 400],
          },
        ],
      },
      { id: "eq.adts", code: "adts", name: "Articulated dump trucks (ADT)" },
      { id: "eq.lhds", code: "lhds", name: "Load-haul-dump (LHD) machines" },
    ],
  },
  {
    id: "vc.extraction",
    code: "mechanical_extraction",
    name: "Mechanical extraction",
    services: [
      { id: "svc.cutting", code: "cutting", name: "Cutting" },
      { id: "svc.ripping", code: "ripping", name: "Ripping" },
      { id: "svc.continuous_mining", code: "continuous_mining", name: "Continuous mining" },
    ],
    equipmentFamilies: [
      { id: "eq.continuous_miners", code: "continuous_miners", name: "Continuous miners" },
      { id: "eq.roadheaders", code: "roadheaders", name: "Roadheaders" },
      { id: "eq.surface_miners", code: "surface_miners", name: "Surface miners" },
    ],
  },
  {
    id: "vc.crushing_screening",
    code: "crushing_and_screening",
    name: "Crushing and screening",
    services: [
      { id: "svc.primary_crushing", code: "primary_crushing", name: "Primary crushing" },
      { id: "svc.secondary_crushing", code: "secondary_crushing", name: "Secondary crushing" },
      { id: "svc.tertiary_crushing", code: "tertiary_crushing", name: "Tertiary crushing" },
      { id: "svc.sizing", code: "sizing_and_scalping", name: "Sizing and scalping" },
    ],
    equipmentFamilies: [
      { id: "eq.jaw_crushers", code: "jaw_crushers", name: "Jaw crushers" },
      { id: "eq.gyratory_crushers", code: "gyratory_crushers", name: "Gyratory crushers" },
      { id: "eq.cone_crushers", code: "cone_crushers", name: "Cone crushers" },
      { id: "eq.impact_crushers", code: "impact_crushers", name: "Impact crushers" },
      { id: "eq.screens", code: "screens", name: "Screens" },
    ],
  },
  {
    id: "vc.milling",
    code: "milling_and_classification",
    name: "Milling and classification",
    services: [
      { id: "svc.grinding", code: "grinding", name: "Grinding" },
      { id: "svc.classification", code: "classification", name: "Classification" },
      { id: "svc.circulating_load", code: "circulating_load", name: "Circulating load" },
    ],
    equipmentFamilies: [
      { id: "eq.sag_mills", code: "sag_mills", name: "SAG mills" },
      { id: "eq.ball_mills", code: "ball_mills", name: "Ball mills" },
      { id: "eq.rod_mills", code: "rod_mills", name: "Rod mills" },
      { id: "eq.cyclones", code: "cyclones", name: "Cyclones" },
      { id: "eq.classifiers", code: "classifiers", name: "Classifiers" },
    ],
  },
  {
    id: "vc.beneficiation",
    code: "beneficiation_and_recovery",
    name: "Beneficiation and recovery",
    services: [
      { id: "svc.dms", code: "dense_media_separation", name: "Dense-media separation" },
      { id: "svc.flotation", code: "flotation", name: "Flotation" },
      { id: "svc.leaching", code: "leaching", name: "Leaching" },
      { id: "svc.gravity", code: "gravity_separation", name: "Gravity separation" },
      { id: "svc.magnetic", code: "magnetic_separation", name: "Magnetic separation" },
    ],
    equipmentFamilies: [
      { id: "eq.dms_modules", code: "dms_modules", name: "DMS modules" },
      { id: "eq.flotation_cells", code: "flotation_cells", name: "Flotation cells" },
      { id: "eq.leach_tanks", code: "leach_tanks", name: "Leach tanks" },
      { id: "eq.separators", code: "separators", name: "Separators" },
      { id: "eq.concentrators", code: "concentrators", name: "Concentrators" },
    ],
  },
  {
    id: "vc.dewatering",
    code: "dewatering_and_product_preparation",
    name: "Dewatering and product preparation",
    services: [
      { id: "svc.thickening", code: "thickening", name: "Thickening" },
      { id: "svc.filtration", code: "filtration", name: "Filtration" },
      { id: "svc.drying", code: "drying", name: "Drying" },
      { id: "svc.blending", code: "blending", name: "Blending" },
    ],
    equipmentFamilies: [
      { id: "eq.thickeners", code: "thickeners", name: "Thickeners" },
      { id: "eq.filters", code: "filters", name: "Filters" },
      { id: "eq.dryers", code: "dryers", name: "Dryers" },
      { id: "eq.blenders", code: "blenders", name: "Blenders" },
    ],
  },
  {
    id: "vc.materials_handling",
    code: "materials_handling_and_loadout",
    name: "Materials handling and load-out",
    services: [
      { id: "svc.conveying", code: "conveying", name: "Conveying" },
      { id: "svc.stacking", code: "stacking", name: "Stacking" },
      { id: "svc.reclaiming", code: "reclaiming", name: "Reclaiming" },
      { id: "svc.loadout", code: "loadout", name: "Load-out" },
    ],
    equipmentFamilies: [
      { id: "eq.conveyors", code: "conveyors", name: "Conveyors" },
      { id: "eq.stackers", code: "stackers", name: "Stackers" },
      { id: "eq.reclaimers", code: "reclaimers", name: "Reclaimers" },
      { id: "eq.feeders", code: "feeders", name: "Feeders" },
      { id: "eq.ship_loaders", code: "ship_loaders", name: "Ship loaders" },
      { id: "eq.rail_loaders", code: "rail_loaders", name: "Rail loaders" },
    ],
  },
  {
    id: "vc.utilities",
    code: "utilities_and_infrastructure",
    name: "Utilities and infrastructure",
    services: [
      { id: "svc.pumping", code: "pumping", name: "Pumping" },
      { id: "svc.ventilation", code: "ventilation", name: "Ventilation" },
      { id: "svc.power", code: "power", name: "Power supply" },
      { id: "svc.compressed_air", code: "compressed_air", name: "Compressed air" },
      { id: "svc.water", code: "water_supply", name: "Water supply" },
    ],
    equipmentFamilies: [
      { id: "eq.pumps", code: "pumps", name: "Pumps" },
      { id: "eq.fans", code: "fans", name: "Fans and ventilation" },
      { id: "eq.substations", code: "substations", name: "Substations" },
      { id: "eq.generators", code: "generators", name: "Generators" },
      { id: "eq.compressors", code: "compressors", name: "Compressors" },
    ],
  },
];

// ── Context rules for load-and-haul (Slice 1A seed) ──────────────────────
// Drives the guided selector engine (Section 5.3A / 5.3B).
export const MINING_CONTEXT_RULES = [
  {
    id: "rule.surface_load_haul",
    when: {
      environment: "surface",
      valueChain: "load_and_haul",
    },
    recommend: {
      equipmentFamilies: ["eq.excavators_load", "eq.shovels", "eq.haul_trucks", "eq.loaders"],
      kpiPack: "load_and_haul_v1",
      complianceItems: ["operator_competency", "site_induction", "vehicle_roadworthiness"],
    },
  },
  {
    id: "rule.underground_load_haul",
    when: {
      environment: "underground",
      valueChain: "load_and_haul",
    },
    recommend: {
      equipmentFamilies: ["eq.lhds", "eq.ug_drill_rigs"],
      kpiPack: "ug_load_and_haul_v1",
      complianceItems: ["underground_induction", "gas_monitoring_cert", "refuge_bay_training"],
    },
  },
  {
    id: "rule.wash_plant",
    when: {
      environment: "plant",
      valueChain: "beneficiation_and_recovery",
    },
    recommend: {
      equipmentFamilies: ["eq.dms_modules", "eq.cyclones", "eq.conveyors", "eq.thickeners", "eq.screens"],
      kpiPack: "wash_plant_v1",
      complianceItems: ["plant_induction", "isolation_certificate", "lifting_equipment_cert"],
    },
  },
];

// ── Default KPI packs (Section 7) ─────────────────────────────────────────
export const MINING_KPI_PACKS = {
  load_and_haul_v1: [
    "kpi.physical_availability",
    "kpi.utilisation",
    "kpi.productivity_tonnes_per_hour",
    "kpi.downtime_hours",
    "kpi.mtbf",
    "kpi.mttr",
    "kpi.pm_adherence",
    "kpi.fuel_intensity_l_per_tonne",
    "kpi.cost_per_tonne",
    "kpi.target_attainment",
  ],
  ug_load_and_haul_v1: [
    "kpi.physical_availability",
    "kpi.utilisation",
    "kpi.productivity_tonnes_per_hour",
    "kpi.downtime_hours",
    "kpi.mtbf",
    "kpi.mttr",
  ],
  wash_plant_v1: [
    "kpi.physical_availability",
    "kpi.throughput_tph",
    "kpi.yield_percent",
    "kpi.energy_intensity_kwh_per_tonne",
    "kpi.downtime_hours",
    "kpi.cost_per_tonne",
  ],
};

// ── Commodity list (Section 5.3) ──────────────────────────────────────────
export const MINING_COMMODITIES = [
  { id: "commodity.coal", code: "coal", name: "Coal" },
  { id: "commodity.manganese", code: "manganese", name: "Manganese" },
  { id: "commodity.gold", code: "gold", name: "Gold" },
  { id: "commodity.iron_ore", code: "iron_ore", name: "Iron ore" },
  { id: "commodity.platinum", code: "platinum_group_metals", name: "Platinum group metals" },
  { id: "commodity.copper", code: "copper", name: "Copper" },
  { id: "commodity.chrome", code: "chrome", name: "Chrome" },
  { id: "commodity.diamonds", code: "diamonds", name: "Diamonds" },
  { id: "commodity.vanadium", code: "vanadium", name: "Vanadium" },
  { id: "commodity.uranium", code: "uranium", name: "Uranium" },
  { id: "commodity.other", code: "other", name: "Other" },
];

// ── Operating methods ─────────────────────────────────────────────────────
export const MINING_METHODS = [
  { id: "method.surface_open_pit", code: "surface_open_pit", name: "Surface open pit" },
  { id: "method.surface_strip", code: "surface_strip", name: "Surface strip mining" },
  { id: "method.underground_bord_pillar", code: "underground_bord_and_pillar", name: "Underground bord-and-pillar" },
  { id: "method.underground_longwall", code: "underground_longwall", name: "Underground longwall" },
  { id: "method.shaft", code: "shaft", name: "Shaft mining" },
  { id: "method.decline", code: "decline", name: "Decline mining" },
  { id: "method.plant", code: "plant", name: "Plant / processing" },
];