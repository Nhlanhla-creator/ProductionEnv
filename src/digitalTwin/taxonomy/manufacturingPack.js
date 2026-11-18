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
      { id: "meq.forklifts",     code: "forklifts",     name: "Forklifts",
        types: [
          { id: "meq.forklifts.electric_counterbalance_forklift", code: "electric_counterbalance_forklift", name: "Electric counterbalance forklift" },
          { id: "meq.forklifts.diesel_counterbalance_forklift", code: "diesel_counterbalance_forklift", name: "Diesel counterbalance forklift" },
        ],
      },
      { id: "meq.reach_trucks",  code: "reach_trucks",  name: "Reach trucks",
        types: [
          { id: "meq.reach_trucks.single_reach_truck", code: "single_reach_truck", name: "Single-reach truck" },
          { id: "meq.reach_trucks.double_reach_truck", code: "double_reach_truck", name: "Double-reach truck" },
        ],
      },
      { id: "meq.conveyors",     code: "conveyors",     name: "Conveyors",
        types: [
          { id: "meq.conveyors.roller_conveyor", code: "roller_conveyor", name: "Roller conveyor" },
          { id: "meq.conveyors.belt_conveyor", code: "belt_conveyor", name: "Belt conveyor" },
        ],
      },
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
      { id: "meq.presses",     code: "presses",     name: "Presses",
        types: [
          { id: "meq.presses.hydraulic_press", code: "hydraulic_press", name: "Hydraulic press" },
          { id: "meq.presses.mechanical_press", code: "mechanical_press", name: "Mechanical press" },
        ],
      },
      { id: "meq.injection_moulding", code: "injection_moulding_machines", name: "Injection moulding machines",
        types: [
          { id: "meq.injection_moulding.hydraulic_injection_moulding_machine", code: "hydraulic_injection_moulding_machine", name: "Hydraulic injection moulding machine" },
          { id: "meq.injection_moulding.electric_injection_moulding_machine", code: "electric_injection_moulding_machine", name: "Electric injection moulding machine" },
        ],
      },
      { id: "meq.furnaces",    code: "furnaces",    name: "Furnaces",
        types: [
          { id: "meq.furnaces.induction_furnace", code: "induction_furnace", name: "Induction furnace" },
          { id: "meq.furnaces.electric_resistance_furnace", code: "electric_resistance_furnace", name: "Electric resistance furnace" },
        ],
      },
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
      { id: "meq.cnc_lathes",  code: "cnc_lathes",  name: "CNC lathes",
        types: [
          { id: "meq.cnc_lathes.two_axis_cnc_lathe", code: "two_axis_cnc_lathe", name: "Two-axis CNC lathe" },
          { id: "meq.cnc_lathes.multi_axis_turning_centre", code: "multi_axis_turning_centre", name: "Multi-axis turning centre" },
        ],
      },
      { id: "meq.cnc_mills",   code: "cnc_mills",   name: "CNC mills (3, 4, 5-axis)",
        types: [
          { id: "meq.cnc_mills.three_axis_machining_centre", code: "three_axis_machining_centre", name: "Three-axis machining centre" },
          { id: "meq.cnc_mills.five_axis_machining_centre", code: "five_axis_machining_centre", name: "Five-axis machining centre" },
        ],
      },
      { id: "meq.grinders",    code: "grinders",    name: "Grinders",
        types: [
          { id: "meq.grinders.surface_grinder", code: "surface_grinder", name: "Surface grinder" },
          { id: "meq.grinders.cylindrical_grinder", code: "cylindrical_grinder", name: "Cylindrical grinder" },
        ],
      },
      { id: "meq.drill_presses", code: "drill_presses", name: "Drill presses",
        types: [
          { id: "meq.drill_presses.bench_drill_press", code: "bench_drill_press", name: "Bench drill press" },
          { id: "meq.drill_presses.radial_drill_press", code: "radial_drill_press", name: "Radial drill press" },
        ],
      },
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
      { id: "meq.welding_machines", code: "welding_machines", name: "Welding machines",
        types: [
          { id: "meq.welding_machines.mig_welder", code: "mig_welder", name: "MIG welder" },
          { id: "meq.welding_machines.tig_welder", code: "tig_welder", name: "TIG welder" },
        ],
      },
      { id: "meq.welding_robots",   code: "welding_robots",   name: "Welding robots",
        types: [
          { id: "meq.welding_robots.arc_welding_robot", code: "arc_welding_robot", name: "Arc welding robot" },
          { id: "meq.welding_robots.spot_welding_robot", code: "spot_welding_robot", name: "Spot welding robot" },
        ],
      },
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
      { id: "meq.assembly_robots", code: "assembly_robots", name: "Assembly robots",
        types: [
          { id: "meq.assembly_robots.scara_robot", code: "scara_robot", name: "SCARA robot" },
          { id: "meq.assembly_robots.six_axis_assembly_robot", code: "six_axis_assembly_robot", name: "Six-axis assembly robot" },
        ],
      },
      { id: "meq.workstations",    code: "workstations",    name: "Assembly workstations",
        types: [
          { id: "meq.workstations.manual_assembly_bench", code: "manual_assembly_bench", name: "Manual assembly bench" },
          { id: "meq.workstations.semi_automated_assembly_station", code: "semi_automated_assembly_station", name: "Semi-automated assembly station" },
        ],
      },
      { id: "meq.torque_tools",    code: "torque_tools",    name: "Torque tools",
        types: [
          { id: "meq.torque_tools.digital_torque_wrench", code: "digital_torque_wrench", name: "Digital torque wrench" },
          { id: "meq.torque_tools.programmable_torque_driver", code: "programmable_torque_driver", name: "Programmable torque driver" },
        ],
      },
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
      { id: "meq.spray_booths",     code: "spray_booths",     name: "Spray booths",
        types: [
          { id: "meq.spray_booths.downdraft_spray_booth", code: "downdraft_spray_booth", name: "Downdraft spray booth" },
          { id: "meq.spray_booths.crossdraft_spray_booth", code: "crossdraft_spray_booth", name: "Crossdraft spray booth" },
        ],
      },
      { id: "meq.powder_lines",     code: "powder_coating_lines", name: "Powder coating lines",
        types: [
          { id: "meq.powder_lines.manual_powder_coating_booth", code: "manual_powder_coating_booth", name: "Manual powder coating booth" },
          { id: "meq.powder_lines.automated_powder_line", code: "automated_powder_line", name: "Automated powder line" },
        ],
      },
      { id: "meq.heat_treatment_ovens", code: "heat_treatment_ovens", name: "Heat treatment ovens",
        types: [
          { id: "meq.heat_treatment_ovens.batch_heat_treatment_oven", code: "batch_heat_treatment_oven", name: "Batch heat-treatment oven" },
          { id: "meq.heat_treatment_ovens.continuous_heat_treatment_furnace", code: "continuous_heat_treatment_furnace", name: "Continuous heat-treatment furnace" },
        ],
      },
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
      { id: "meq.cmm",         code: "cmm",         name: "Coordinate measuring machines",
        types: [
          { id: "meq.cmm.bridge_cmm", code: "bridge_cmm", name: "Bridge CMM" },
          { id: "meq.cmm.portable_measuring_arm", code: "portable_measuring_arm", name: "Portable measuring arm" },
        ],
      },
      { id: "meq.gauges",      code: "gauges",      name: "Gauges & metrology tools",
        types: [
          { id: "meq.gauges.digital_micrometer", code: "digital_micrometer", name: "Digital micrometer" },
          { id: "meq.gauges.bore_gauge", code: "bore_gauge", name: "Bore gauge" },
        ],
      },
      { id: "meq.vision_systems", code: "vision_systems", name: "Vision inspection systems",
        types: [
          { id: "meq.vision_systems.2d_inspection_camera", code: "2d_inspection_camera", name: "2D inspection camera" },
          { id: "meq.vision_systems.3d_vision_inspection_system", code: "3d_vision_inspection_system", name: "3D vision inspection system" },
        ],
      },
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
      { id: "meq.packaging_lines", code: "packaging_lines", name: "Packaging lines",
        types: [
          { id: "meq.packaging_lines.form_fill_seal_machine", code: "form_fill_seal_machine", name: "Form-fill-seal machine" },
          { id: "meq.packaging_lines.case_packing_machine", code: "case_packing_machine", name: "Case packing machine" },
        ],
      },
      { id: "meq.palletisers",     code: "palletisers",     name: "Palletisers",
        types: [
          { id: "meq.palletisers.robotic_palletiser", code: "robotic_palletiser", name: "Robotic palletiser" },
          { id: "meq.palletisers.layer_palletiser", code: "layer_palletiser", name: "Layer palletiser" },
        ],
      },
      { id: "meq.labellers",       code: "labellers",       name: "Labellers",
        types: [
          { id: "meq.labellers.print_and_apply_labeller", code: "print_and_apply_labeller", name: "Print-and-apply labeller" },
          { id: "meq.labellers.wrap_around_labeller", code: "wrap_around_labeller", name: "Wrap-around labeller" },
        ],
      },
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
      { id: "msvc.water_treatment", code: "water_treatment", name: "Water treatment",
        types: [
          { id: "msvc.water_treatment.reverse_osmosis_skid", code: "reverse_osmosis_skid", name: "Reverse osmosis skid" },
          { id: "msvc.water_treatment.water_softener", code: "water_softener", name: "Water softener" },
        ],
      },
    ],
    equipmentFamilies: [
      { id: "meq.compressors",  code: "compressors",  name: "Compressors",
        types: [
          { id: "meq.compressors.rotary_screw_compressor", code: "rotary_screw_compressor", name: "Rotary screw compressor" },
          { id: "meq.compressors.piston_air_compressor", code: "piston_air_compressor", name: "Piston air compressor" },
        ],
      },
      { id: "meq.boilers",      code: "boilers",      name: "Boilers",
        types: [
          { id: "meq.boilers.fire_tube_boiler", code: "fire_tube_boiler", name: "Fire-tube boiler" },
          { id: "meq.boilers.water_tube_boiler", code: "water_tube_boiler", name: "Water-tube boiler" },
        ],
      },
      { id: "meq.chillers",     code: "chillers",     name: "Chillers",
        types: [
          { id: "meq.chillers.air_cooled_chiller", code: "air_cooled_chiller", name: "Air-cooled chiller" },
          { id: "meq.chillers.water_cooled_chiller", code: "water_cooled_chiller", name: "Water-cooled chiller" },
        ],
      },
      { id: "meq.water_treatment", code: "water_treatment_plant", name: "Water treatment plant",
        types: [
          { id: "meq.water_treatment.reverse_osmosis_skid", code: "reverse_osmosis_skid", name: "Reverse osmosis skid" },
          { id: "meq.water_treatment.water_softener", code: "water_softener", name: "Water softener" },
        ],
      },
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