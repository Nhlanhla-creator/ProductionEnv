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
      { id: "eq.exploration_rigs", code: "exploration_drill_rigs", name: "Exploration drill rigs",
        types: [
          { id: "eq.exploration_rigs.diamond_core_rig", code: "diamond_core_rig", name: "Diamond core rig" },
          { id: "eq.exploration_rigs.reverse_circulation_rig", code: "reverse_circulation_rig", name: "Reverse-circulation rig" },
        ],
      },
      { id: "eq.support_vehicles", code: "support_vehicles", name: "Support vehicles",
        types: [
          { id: "eq.support_vehicles.service_truck", code: "service_truck", name: "Service truck" },
          { id: "eq.support_vehicles.crew_transport_vehicle", code: "crew_transport_vehicle", name: "Crew transport vehicle" },
        ],
      },
      { id: "eq.survey_equipment", code: "survey_and_sampling_equipment", name: "Survey and sampling equipment",
        types: [
          { id: "eq.survey_equipment.total_station", code: "total_station", name: "Total station" },
          { id: "eq.survey_equipment.gnss_rover", code: "gnss_rover", name: "GNSS rover" },
        ],
      },
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
      { id: "eq.dozers", code: "dozers", name: "Dozers",
        types: [
          { id: "eq.dozers.crawler_dozer", code: "crawler_dozer", name: "Crawler dozer" },
          { id: "eq.dozers.wheel_dozer", code: "wheel_dozer", name: "Wheel dozer" },
        ],
      },
      { id: "eq.excavators", code: "excavators", name: "Excavators",
        types: [
          { id: "eq.excavators.tracked_excavator", code: "tracked_excavator", name: "Tracked excavator" },
          { id: "eq.excavators.wheeled_excavator", code: "wheeled_excavator", name: "Wheeled excavator" },
        ],
      },
      { id: "eq.bolters", code: "roof_bolters", name: "Roof bolters",
        types: [
          { id: "eq.bolters.single_boom_roof_bolter", code: "single_boom_roof_bolter", name: "Single-boom roof bolter" },
          { id: "eq.bolters.twin_boom_roof_bolter", code: "twin_boom_roof_bolter", name: "Twin-boom roof bolter" },
        ],
      },
      { id: "eq.jumbos", code: "jumbos", name: "Jumbos",
        types: [
          { id: "eq.jumbos.single_boom_jumbo", code: "single_boom_jumbo", name: "Single-boom jumbo" },
          { id: "eq.jumbos.twin_boom_jumbo", code: "twin_boom_jumbo", name: "Twin-boom jumbo" },
        ],
      },
      { id: "eq.graders", code: "graders", name: "Graders",
        types: [
          { id: "eq.graders.articulated_motor_grader", code: "articulated_motor_grader", name: "Articulated motor grader" },
          { id: "eq.graders.rigid_frame_motor_grader", code: "rigid_frame_motor_grader", name: "Rigid-frame motor grader" },
        ],
      },
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
      { id: "eq.rotary_drills", code: "rotary_drills", name: "Rotary blast-hole drills",
        types: [
          { id: "eq.rotary_drills.track_mounted_rotary_drill", code: "track_mounted_rotary_drill", name: "Track-mounted rotary drill" },
        ],
      },
      { id: "eq.dth_drills", code: "dth_drills", name: "Down-the-hole (DTH) drills",
        types: [
          { id: "eq.dth_drills.crawler_mounted_dth_drill", code: "crawler_mounted_dth_drill", name: "Crawler-mounted DTH drill" },
        ],
      },
      { id: "eq.tophammer_drills", code: "tophammer_drills", name: "Top-hammer drills",
        types: [
          { id: "eq.tophammer_drills.cab_mounted_top_hammer_rig", code: "cab_mounted_top_hammer_rig", name: "Cab-mounted top-hammer rig" },
        ],
      },
      { id: "eq.ug_drill_rigs", code: "underground_drill_rigs", name: "Underground drill rigs",
        types: [
          { id: "eq.ug_drill_rigs.underground_production_drill", code: "underground_production_drill", name: "Underground production drill" },
          { id: "eq.ug_drill_rigs.underground_development_rig", code: "underground_development_rig", name: "Underground development rig" },
        ],
      },
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
      { id: "eq.mmu_trucks", code: "mmu_trucks", name: "Mobile manufacturing units (MMU)",
        types: [
          { id: "eq.mmu_trucks.truck_mounted_mmu", code: "truck_mounted_mmu", name: "Truck-mounted MMU" },
        ],
      },
      { id: "eq.charging_units", code: "charging_units", name: "Charging units",
        types: [
          { id: "eq.charging_units.truck_mounted_charging_unit", code: "truck_mounted_charging_unit", name: "Truck-mounted charging unit" },
          { id: "eq.charging_units.underground_charging_vehicle", code: "underground_charging_vehicle", name: "Underground charging vehicle" },
        ],
      },
      { id: "eq.stemming_units", code: "stemming_units", name: "Stemming units",
        types: [
          { id: "eq.stemming_units.truck_mounted_stemming_unit", code: "truck_mounted_stemming_unit", name: "Truck-mounted stemming unit" },
        ],
      },
      { id: "eq.monitoring_equipment", code: "blast_monitoring_equipment", name: "Blast monitoring equipment",
        types: [
          { id: "eq.monitoring_equipment.vibration_monitor", code: "vibration_monitor", name: "Vibration monitor" },
          { id: "eq.monitoring_equipment.air_overpressure_monitor", code: "air_overpressure_monitor", name: "Air-overpressure monitor" },
        ],
      },
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
      { id: "eq.excavators_load", code: "hydraulic_excavators", name: "Hydraulic excavators",
        types: [
          { id: "eq.excavators_load.hydraulic_mining_shovel", code: "hydraulic_mining_shovel", name: "Hydraulic mining shovel" },
          { id: "eq.excavators_load.hydraulic_backhoe_excavator", code: "hydraulic_backhoe_excavator", name: "Hydraulic backhoe excavator" },
        ],
      },
      { id: "eq.shovels", code: "electric_rope_shovels", name: "Electric rope shovels",
        types: [
          { id: "eq.shovels.crawler_mounted_electric_rope_shovel", code: "crawler_mounted_electric_rope_shovel", name: "Crawler-mounted electric rope shovel" },
        ],
      },
      { id: "eq.loaders", code: "front_end_loaders", name: "Front-end loaders",
        types: [
          { id: "eq.loaders.wheel_loader", code: "wheel_loader", name: "Wheel loader" },
          { id: "eq.loaders.tracked_loader", code: "tracked_loader", name: "Tracked loader" },
        ],
      },
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
      { id: "eq.adts", code: "adts", name: "Articulated dump trucks (ADT)",
        types: [
          { id: "eq.adts.three_axle_articulated_dumper", code: "three_axle_articulated_dumper", name: "Three-axle articulated dumper" },
        ],
      },
      { id: "eq.lhds", code: "lhds", name: "Load-haul-dump (LHD) machines",
        types: [
          { id: "eq.lhds.diesel_lhd", code: "diesel_lhd", name: "Diesel LHD" },
          { id: "eq.lhds.battery_electric_lhd", code: "battery_electric_lhd", name: "Battery-electric LHD" },
        ],
      },
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
      { id: "eq.continuous_miners", code: "continuous_miners", name: "Continuous miners",
        types: [
          { id: "eq.continuous_miners.track_mounted_continuous_miner", code: "track_mounted_continuous_miner", name: "Track-mounted continuous miner" },
        ],
      },
      { id: "eq.roadheaders", code: "roadheaders", name: "Roadheaders",
        types: [
          { id: "eq.roadheaders.transverse_head_roadheader", code: "transverse_head_roadheader", name: "Transverse-head roadheader" },
          { id: "eq.roadheaders.longitudinal_head_roadheader", code: "longitudinal_head_roadheader", name: "Longitudinal-head roadheader" },
        ],
      },
      { id: "eq.surface_miners", code: "surface_miners", name: "Surface miners",
        types: [
          { id: "eq.surface_miners.crawler_surface_miner", code: "crawler_surface_miner", name: "Crawler surface miner" },
        ],
      },
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
      { id: "eq.jaw_crushers", code: "jaw_crushers", name: "Jaw crushers",
        types: [
          { id: "eq.jaw_crushers.single_toggle_jaw_crusher", code: "single_toggle_jaw_crusher", name: "Single-toggle jaw crusher" },
          { id: "eq.jaw_crushers.double_toggle_jaw_crusher", code: "double_toggle_jaw_crusher", name: "Double-toggle jaw crusher" },
        ],
      },
      { id: "eq.gyratory_crushers", code: "gyratory_crushers", name: "Gyratory crushers",
        types: [
          { id: "eq.gyratory_crushers.primary_gyratory_crusher", code: "primary_gyratory_crusher", name: "Primary gyratory crusher" },
        ],
      },
      { id: "eq.cone_crushers", code: "cone_crushers", name: "Cone crushers",
        types: [
          { id: "eq.cone_crushers.hydraulic_cone_crusher", code: "hydraulic_cone_crusher", name: "Hydraulic cone crusher" },
        ],
      },
      { id: "eq.impact_crushers", code: "impact_crushers", name: "Impact crushers",
        types: [
          { id: "eq.impact_crushers.horizontal_shaft_impact_crusher", code: "horizontal_shaft_impact_crusher", name: "Horizontal-shaft impact crusher" },
          { id: "eq.impact_crushers.vertical_shaft_impact_crusher", code: "vertical_shaft_impact_crusher", name: "Vertical-shaft impact crusher" },
        ],
      },
      { id: "eq.screens", code: "screens", name: "Screens",
        types: [
          { id: "eq.screens.vibrating_screen", code: "vibrating_screen", name: "Vibrating screen" },
          { id: "eq.screens.trommel_screen", code: "trommel_screen", name: "Trommel screen" },
        ],
      },
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
      { id: "eq.sag_mills", code: "sag_mills", name: "SAG mills",
        types: [
          { id: "eq.sag_mills.gearless_drive_sag_mill", code: "gearless_drive_sag_mill", name: "Gearless-drive SAG mill" },
          { id: "eq.sag_mills.geared_drive_sag_mill", code: "geared_drive_sag_mill", name: "Geared-drive SAG mill" },
        ],
      },
      { id: "eq.ball_mills", code: "ball_mills", name: "Ball mills",
        types: [
          { id: "eq.ball_mills.overflow_ball_mill", code: "overflow_ball_mill", name: "Overflow ball mill" },
          { id: "eq.ball_mills.grate_discharge_ball_mill", code: "grate_discharge_ball_mill", name: "Grate-discharge ball mill" },
        ],
      },
      { id: "eq.rod_mills", code: "rod_mills", name: "Rod mills",
        types: [
          { id: "eq.rod_mills.overflow_rod_mill", code: "overflow_rod_mill", name: "Overflow rod mill" },
          { id: "eq.rod_mills.end_peripheral_discharge_rod_mill", code: "end_peripheral_discharge_rod_mill", name: "End-peripheral discharge rod mill" },
        ],
      },
      { id: "eq.cyclones", code: "cyclones", name: "Cyclones",
        types: [
          { id: "eq.cyclones.classification_hydrocyclone", code: "classification_hydrocyclone", name: "Classification hydrocyclone" },
        ],
      },
      { id: "eq.classifiers", code: "classifiers", name: "Classifiers",
        types: [
          { id: "eq.classifiers.spiral_classifier", code: "spiral_classifier", name: "Spiral classifier" },
          { id: "eq.classifiers.hydraulic_classifier", code: "hydraulic_classifier", name: "Hydraulic classifier" },
        ],
      },
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
      { id: "eq.dms_modules", code: "dms_modules", name: "DMS modules",
        types: [
          { id: "eq.dms_modules.cyclone_dms_module", code: "cyclone_dms_module", name: "Cyclone DMS module" },
          { id: "eq.dms_modules.drum_dms_module", code: "drum_dms_module", name: "Drum DMS module" },
        ],
      },
      { id: "eq.flotation_cells", code: "flotation_cells", name: "Flotation cells",
        types: [
          { id: "eq.flotation_cells.mechanical_flotation_cell", code: "mechanical_flotation_cell", name: "Mechanical flotation cell" },
          { id: "eq.flotation_cells.column_flotation_cell", code: "column_flotation_cell", name: "Column flotation cell" },
        ],
      },
      { id: "eq.leach_tanks", code: "leach_tanks", name: "Leach tanks",
        types: [
          { id: "eq.leach_tanks.agitated_leach_tank", code: "agitated_leach_tank", name: "Agitated leach tank" },
        ],
      },
      { id: "eq.separators", code: "separators", name: "Separators",
        types: [
          { id: "eq.separators.magnetic_separator", code: "magnetic_separator", name: "Magnetic separator" },
          { id: "eq.separators.gravity_separator", code: "gravity_separator", name: "Gravity separator" },
        ],
      },
      { id: "eq.concentrators", code: "concentrators", name: "Concentrators",
        types: [
          { id: "eq.concentrators.spiral_concentrator", code: "spiral_concentrator", name: "Spiral concentrator" },
          { id: "eq.concentrators.centrifugal_concentrator", code: "centrifugal_concentrator", name: "Centrifugal concentrator" },
        ],
      },
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
      { id: "eq.thickeners", code: "thickeners", name: "Thickeners",
        types: [
          { id: "eq.thickeners.high_rate_thickener", code: "high_rate_thickener", name: "High-rate thickener" },
          { id: "eq.thickeners.paste_thickener", code: "paste_thickener", name: "Paste thickener" },
        ],
      },
      { id: "eq.filters", code: "filters", name: "Filters",
        types: [
          { id: "eq.filters.filter_press", code: "filter_press", name: "Filter press" },
          { id: "eq.filters.vacuum_belt_filter", code: "vacuum_belt_filter", name: "Vacuum belt filter" },
        ],
      },
      { id: "eq.dryers", code: "dryers", name: "Dryers",
        types: [
          { id: "eq.dryers.rotary_dryer", code: "rotary_dryer", name: "Rotary dryer" },
          { id: "eq.dryers.fluid_bed_dryer", code: "fluid_bed_dryer", name: "Fluid-bed dryer" },
        ],
      },
      { id: "eq.blenders", code: "blenders", name: "Blenders",
        types: [
          { id: "eq.blenders.paddle_blender", code: "paddle_blender", name: "Paddle blender" },
          { id: "eq.blenders.ribbon_blender", code: "ribbon_blender", name: "Ribbon blender" },
        ],
      },
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
      { id: "eq.conveyors", code: "conveyors", name: "Conveyors",
        types: [
          { id: "eq.conveyors.belt_conveyor", code: "belt_conveyor", name: "Belt conveyor" },
          { id: "eq.conveyors.apron_conveyor", code: "apron_conveyor", name: "Apron conveyor" },
        ],
      },
      { id: "eq.stackers", code: "stackers", name: "Stackers",
        types: [
          { id: "eq.stackers.radial_stacker", code: "radial_stacker", name: "Radial stacker" },
          { id: "eq.stackers.travelling_stacker", code: "travelling_stacker", name: "Travelling stacker" },
        ],
      },
      { id: "eq.reclaimers", code: "reclaimers", name: "Reclaimers",
        types: [
          { id: "eq.reclaimers.bucket_wheel_reclaimer", code: "bucket_wheel_reclaimer", name: "Bucket-wheel reclaimer" },
          { id: "eq.reclaimers.scraper_reclaimer", code: "scraper_reclaimer", name: "Scraper reclaimer" },
        ],
      },
      { id: "eq.feeders", code: "feeders", name: "Feeders",
        types: [
          { id: "eq.feeders.apron_feeder", code: "apron_feeder", name: "Apron feeder" },
          { id: "eq.feeders.vibrating_feeder", code: "vibrating_feeder", name: "Vibrating feeder" },
        ],
      },
      { id: "eq.ship_loaders", code: "ship_loaders", name: "Ship loaders",
        types: [
          { id: "eq.ship_loaders.travelling_ship_loader", code: "travelling_ship_loader", name: "Travelling ship loader" },
          { id: "eq.ship_loaders.fixed_ship_loader", code: "fixed_ship_loader", name: "Fixed ship loader" },
        ],
      },
      { id: "eq.rail_loaders", code: "rail_loaders", name: "Rail loaders",
        types: [
          { id: "eq.rail_loaders.rapid_rail_wagon_loader", code: "rapid_rail_wagon_loader", name: "Rapid rail wagon loader" },
        ],
      },
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
      { id: "eq.pumps", code: "pumps", name: "Pumps",
        types: [
          { id: "eq.pumps.centrifugal_slurry_pump", code: "centrifugal_slurry_pump", name: "Centrifugal slurry pump" },
          { id: "eq.pumps.submersible_dewatering_pump", code: "submersible_dewatering_pump", name: "Submersible dewatering pump" },
        ],
      },
      { id: "eq.fans", code: "fans", name: "Fans and ventilation",
        types: [
          { id: "eq.fans.axial_ventilation_fan", code: "axial_ventilation_fan", name: "Axial ventilation fan" },
          { id: "eq.fans.centrifugal_ventilation_fan", code: "centrifugal_ventilation_fan", name: "Centrifugal ventilation fan" },
        ],
      },
      { id: "eq.substations", code: "substations", name: "Substations",
        types: [
          { id: "eq.substations.mobile_substation", code: "mobile_substation", name: "Mobile substation" },
          { id: "eq.substations.fixed_substation", code: "fixed_substation", name: "Fixed substation" },
        ],
      },
      { id: "eq.generators", code: "generators", name: "Generators",
        types: [
          { id: "eq.generators.diesel_generator_set", code: "diesel_generator_set", name: "Diesel generator set" },
          { id: "eq.generators.gas_generator_set", code: "gas_generator_set", name: "Gas generator set" },
        ],
      },
      { id: "eq.compressors", code: "compressors", name: "Compressors",
        types: [
          { id: "eq.compressors.rotary_screw_compressor", code: "rotary_screw_compressor", name: "Rotary screw compressor" },
          { id: "eq.compressors.reciprocating_compressor", code: "reciprocating_compressor", name: "Reciprocating compressor" },
        ],
      },
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