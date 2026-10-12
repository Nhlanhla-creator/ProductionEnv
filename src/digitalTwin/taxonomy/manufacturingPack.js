/**
 * digitalTwin/taxonomy/manufacturingPack.js
 *
 * Manufacturing & processing sector pack — second proof of extensibility
 * (Brief Section 5.3C, 5.3D, 15 Slice 5).
 *
 * First discriminator is what the facility makes, then production mode,
 * then plant type — matching Section 5.3C exactly.
 *
 * Version: 1.0.0
 */

export const MANUFACTURING_PACK_VERSION = "1.0.0";

export const MANUFACTURING_SECTOR = {
  id: "sector.manufacturing",
  code: "manufacturing",
  name: "Manufacturing & processing",
  children: [
    { id: "sector.mfg.discrete",   code: "discrete",   name: "Discrete manufacturing" },
    { id: "sector.mfg.batch",      code: "batch",      name: "Batch processing" },
    { id: "sector.mfg.continuous", code: "continuous", name: "Continuous process" },
    { id: "sector.mfg.foundry",    code: "foundry",    name: "Foundry" },
    { id: "sector.mfg.packaging",  code: "packaging",  name: "Packaging & FMCG" },
  ],
};

export const MANUFACTURING_PRODUCTION_MODES = [
  { id: "mode.make_to_stock",   code: "make_to_stock",   name: "Make-to-stock" },
  { id: "mode.make_to_order",   code: "make_to_order",   name: "Make-to-order" },
  { id: "mode.assemble_to_order", code: "assemble_to_order", name: "Assemble-to-order" },
  { id: "mode.engineer_to_order", code: "engineer_to_order", name: "Engineer-to-order" },
  { id: "mode.job_shop",        code: "job_shop",        name: "Job shop" },
];

export const MANUFACTURING_VALUE_CHAIN = [
  {
    id: "mvc.receiving",
    code: "receiving_and_warehousing",
    name: "Receiving & warehousing",
    services: [
      { id: "msvc.goods_receiving", code: "goods_receiving", name: "Goods receiving" },
      { id: "msvc.raw_warehousing", code: "raw_material_warehousing", name: "Raw material warehousing" },
    ],
    equipmentFamilies: [
      { id: "meq.forklifts",     code: "forklifts",     name: "Forklifts" },
      { id: "meq.reach_trucks",  code: "reach_trucks",  name: "Reach trucks" },
      { id: "meq.conveyors",     code: "conveyors",     name: "Conveyors" },
    ],
  },
  {
    id: "mvc.forming",
    code: "forming",
    name: "Forming",
    services: [
      { id: "msvc.stamping",   code: "stamping",   name: "Stamping & pressing" },
      { id: "msvc.casting",    code: "casting",    name: "Casting" },
      { id: "msvc.moulding",   code: "moulding",   name: "Moulding (injection, blow, compression)" },
    ],
    equipmentFamilies: [
      { id: "meq.presses",     code: "presses",     name: "Presses" },
      { id: "meq.injection_moulding", code: "injection_moulding_machines", name: "Injection moulding machines" },
      { id: "meq.furnaces",    code: "furnaces",    name: "Furnaces" },
    ],
  },
  {
    id: "mvc.machining",
    code: "machining",
    name: "Machining",
    services: [
      {
        id: "msvc.cnc_machining",
        code: "cnc_machining",
        name: "CNC machining",
        activities: [
          { id: "mact.turning", code: "turning", name: "Turning" },
          { id: "mact.milling", code: "milling", name: "Milling" },
          { id: "mact.grinding", code: "grinding", name: "Grinding" },
        ],
      },
      { id: "msvc.drilling", code: "drilling", name: "Drilling" },
    ],
    equipmentFamilies: [
      { id: "meq.cnc_lathes",  code: "cnc_lathes",  name: "CNC lathes" },
      { id: "meq.cnc_mills",   code: "cnc_mills",   name: "CNC mills (3, 4, 5-axis)" },
      { id: "meq.grinders",    code: "grinders",    name: "Grinders" },
      { id: "meq.drill_presses", code: "drill_presses", name: "Drill presses" },
    ],
  },
  {
    id: "mvc.welding",
    code: "welding_and_fabrication",
    name: "Welding & fabrication",
    services: [
      { id: "msvc.mig_welding", code: "mig_welding", name: "MIG welding" },
      { id: "msvc.tig_welding", code: "tig_welding", name: "TIG welding" },
      { id: "msvc.spot_welding", code: "spot_welding", name: "Spot welding" },
    ],
    equipmentFamilies: [
      { id: "meq.welding_machines", code: "welding_machines", name: "Welding machines" },
      { id: "meq.welding_robots",   code: "welding_robots",   name: "Welding robots" },
    ],
  },
  {
    id: "mvc.assembly",
    code: "assembly",
    name: "Assembly",
    services: [
      {
        id: "msvc.manual_assembly",
        code: "manual_assembly",
        name: "Manual assembly",
        activities: [
          { id: "mact.subassembly", code: "subassembly", name: "Sub-assembly" },
          { id: "mact.final_assembly", code: "final_assembly", name: "Final assembly" },
        ],
      },
      { id: "msvc.automated_assembly", code: "automated_assembly", name: "Automated assembly" },
    ],
    equipmentFamilies: [
      { id: "meq.assembly_robots", code: "assembly_robots", name: "Assembly robots" },
      { id: "meq.workstations",    code: "workstations",    name: "Assembly workstations" },
      { id: "meq.torque_tools",    code: "torque_tools",    name: "Torque tools" },
    ],
  },
  {
    id: "mvc.treatment",
    code: "surface_treatment",
    name: "Surface treatment",
    services: [
      { id: "msvc.painting",     code: "painting",     name: "Painting" },
      { id: "msvc.powder_coating", code: "powder_coating", name: "Powder coating" },
      { id: "msvc.plating",      code: "plating",      name: "Plating & anodising" },
      { id: "msvc.heat_treatment", code: "heat_treatment", name: "Heat treatment" },
    ],
    equipmentFamilies: [
      { id: "meq.spray_booths",     code: "spray_booths",     name: "Spray booths" },
      { id: "meq.powder_lines",     code: "powder_coating_lines", name: "Powder coating lines" },
      { id: "meq.heat_treatment_ovens", code: "heat_treatment_ovens", name: "Heat treatment ovens" },
    ],
  },
  {
    id: "mvc.inspection",
    code: "inspection_and_quality",
    name: "Inspection & quality",
    services: [
      { id: "msvc.in_process_inspection", code: "in_process_inspection", name: "In-process inspection" },
      { id: "msvc.final_inspection", code: "final_inspection", name: "Final inspection" },
      { id: "msvc.metrology", code: "metrology", name: "Metrology & measurement" },
    ],
    equipmentFamilies: [
      { id: "meq.cmm",         code: "cmm",         name: "Coordinate measuring machines" },
      { id: "meq.gauges",      code: "gauges",      name: "Gauges & metrology tools" },
      { id: "meq.vision_systems", code: "vision_systems", name: "Vision inspection systems" },
    ],
  },
  {
    id: "mvc.packaging",
    code: "packaging",
    name: "Packaging",
    services: [
      { id: "msvc.primary_packaging", code: "primary_packaging", name: "Primary packaging" },
      { id: "msvc.secondary_packaging", code: "secondary_packaging", name: "Secondary packaging" },
      { id: "msvc.palletising", code: "palletising", name: "Palletising" },
    ],
    equipmentFamilies: [
      { id: "meq.packaging_lines", code: "packaging_lines", name: "Packaging lines" },
      { id: "meq.palletisers",     code: "palletisers",     name: "Palletisers" },
      { id: "meq.labellers",       code: "labellers",       name: "Labellers" },
    ],
  },
  {
    id: "mvc.utilities",
    code: "plant_utilities",
    name: "Plant utilities",
    services: [
      { id: "msvc.compressed_air", code: "compressed_air", name: "Compressed air" },
      { id: "msvc.steam",          code: "steam",          name: "Steam generation" },
      { id: "msvc.chilled_water",  code: "chilled_water",  name: "Chilled water" },
      { id: "msvc.water_treatment", code: "water_treatment", name: "Water treatment" },
    ],
    equipmentFamilies: [
      { id: "meq.compressors",  code: "compressors",  name: "Compressors" },
      { id: "meq.boilers",      code: "boilers",      name: "Boilers" },
      { id: "meq.chillers",     code: "chillers",     name: "Chillers" },
      { id: "meq.water_treatment", code: "water_treatment_plant", name: "Water treatment plant" },
    ],
  },
];

export const MANUFACTURING_CONTEXT_RULES = [
  {
    id: "mrule.discrete_assembly",
    when: { productionMode: "discrete", valueChain: "assembly" },
    recommend: {
      equipmentFamilies: ["meq.assembly_robots", "meq.workstations", "meq.torque_tools"],
      kpiPack: "discrete_mfg_v1",
      complianceItems: ["iso_9001", "iso_45001", "machine_guarding_certificate"],
    },
  },
  {
    id: "mrule.batch_processing",
    when: { productionMode: "batch", valueChain: "forming" },
    recommend: {
      equipmentFamilies: ["meq.presses", "meq.furnaces"],
      kpiPack: "batch_process_v1",
      complianceItems: ["iso_9001", "atex_zone_certification", "pressure_vessel_certificate"],
    },
  },
];

export const MANUFACTURING_KPI_PACKS = {
  discrete_mfg_v1: [
    "kpi.physical_availability",
    "kpi.oee",
    "kpi.throughput_units_per_hour",
    "kpi.first_pass_yield",
    "kpi.scrap_rate",
    "kpi.cost_per_unit",
    "kpi.pm_adherence",
  ],
  batch_process_v1: [
    "kpi.physical_availability",
    "kpi.yield_percent",
    "kpi.batch_cycle_time",
    "kpi.energy_intensity_kwh_per_tonne",
    "kpi.quality_conformance",
    "kpi.cost_per_tonne",
  ],
};

export const MANUFACTURING_COMMODITIES = [
  { id: "mfg.product.automotive_components", code: "automotive_components", name: "Automotive components" },
  { id: "mfg.product.food_beverage",         code: "food_and_beverage",     name: "Food and beverage" },
  { id: "mfg.product.cement",                code: "cement",                name: "Cement" },
  { id: "mfg.product.steel_products",        code: "steel_products",        name: "Steel products" },
  { id: "mfg.product.chemicals",             code: "chemicals",             name: "Chemicals" },
  { id: "mfg.product.pharmaceuticals",       code: "pharmaceuticals",       name: "Pharmaceuticals" },
  { id: "mfg.product.packaging",             code: "packaging",             name: "Packaging" },
  { id: "mfg.product.building_materials",    code: "building_materials",    name: "Building materials" },
  { id: "mfg.product.other",                 code: "other",                 name: "Other" },
];

export const MANUFACTURING_METHODS = MANUFACTURING_PRODUCTION_MODES;