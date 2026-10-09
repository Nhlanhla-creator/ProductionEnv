/**
 * digitalTwin/taxonomy/constructionPack.js
 *
 * Construction & infrastructure sector pack — proves the core model is not
 * mining-only (Brief Section 5.2, 15 Slice 5).
 *
 * Same shape as the mining pack. Loading this pack into a tenant requires
 * zero code changes to the core engine.
 *
 * Version: 1.0.0
 */

export const CONSTRUCTION_PACK_VERSION = "1.0.0";

export const CONSTRUCTION_SECTOR = {
  id: "sector.construction",
  code: "construction",
  name: "Construction & infrastructure",
  children: [
    { id: "sector.construction.building", code: "building", name: "Building construction" },
    { id: "sector.construction.civil",    code: "civil",    name: "Civil works" },
    { id: "sector.construction.roads",    code: "roads",    name: "Roads & earthworks" },
    { id: "sector.construction.mep",      code: "mep",      name: "Mechanical, electrical & plumbing" },
    { id: "sector.construction.specialist", code: "specialist", name: "Specialist subcontractor" },
  ],
};

export const CONSTRUCTION_VALUE_CHAIN = [
  {
    id: "cvc.site_establishment",
    code: "site_establishment",
    name: "Site establishment",
    services: [
      { id: "csvc.mobilisation", code: "mobilisation", name: "Mobilisation" },
      { id: "csvc.temporary_works", code: "temporary_works", name: "Temporary works" },
      { id: "csvc.site_clearing", code: "site_clearing", name: "Site clearing" },
    ],
    equipmentFamilies: [
      { id: "ceq.temporary_fencing", code: "temporary_fencing", name: "Temporary fencing" },
      { id: "ceq.site_offices", code: "site_offices", name: "Site offices & ablutions" },
    ],
  },
  {
    id: "cvc.earthworks",
    code: "earthworks",
    name: "Earthworks",
    services: [
      {
        id: "csvc.excavation",
        code: "excavation",
        name: "Excavation",
        activities: [
          { id: "cact.bulk_excavation", code: "bulk_excavation", name: "Bulk excavation" },
          { id: "cact.trenching",       code: "trenching",       name: "Trenching" },
          { id: "cact.detailed_excavation", code: "detailed_excavation", name: "Detailed excavation" },
        ],
      },
      { id: "csvc.cut_fill", code: "cut_and_fill", name: "Cut and fill" },
      { id: "csvc.compaction", code: "compaction", name: "Compaction" },
      { id: "csvc.grading",    code: "grading",    name: "Grading" },
    ],
    equipmentFamilies: [
      { id: "ceq.excavators", code: "excavators", name: "Excavators" },
      { id: "ceq.bulldozers", code: "bulldozers", name: "Bulldozers" },
      { id: "ceq.graders",    code: "graders",    name: "Graders" },
      { id: "ceq.compactors", code: "compactors", name: "Compactors & rollers" },
      { id: "ceq.tlb",        code: "tlb",        name: "TLBs (tractor-loader-backhoe)" },
      { id: "ceq.trucks",     code: "tipper_trucks", name: "Tipper trucks" },
    ],
  },
  {
    id: "cvc.civil_works",
    code: "civil_works",
    name: "Civil works",
    services: [
      { id: "csvc.concrete", code: "concrete_works", name: "Concrete works" },
      { id: "csvc.drainage", code: "drainage", name: "Stormwater & drainage" },
      { id: "csvc.pipelines", code: "pipelines", name: "Pipelines" },
      { id: "csvc.structures", code: "structures", name: "Structures" },
    ],
    equipmentFamilies: [
      { id: "ceq.concrete_pumps", code: "concrete_pumps", name: "Concrete pumps" },
      { id: "ceq.concrete_mixers", code: "concrete_mixers", name: "Concrete mixers" },
      { id: "ceq.formwork", code: "formwork", name: "Formwork systems" },
    ],
  },
  {
    id: "cvc.structural",
    code: "structural_works",
    name: "Structural steel & roofing",
    services: [
      { id: "csvc.steel_erection", code: "steel_erection", name: "Steel erection" },
      { id: "csvc.roofing", code: "roofing", name: "Roofing & cladding" },
      { id: "csvc.welding", code: "welding_fabrication", name: "Welding & fabrication" },
    ],
    equipmentFamilies: [
      { id: "ceq.cranes", code: "cranes", name: "Cranes" },
      { id: "ceq.welding_machines", code: "welding_machines", name: "Welding machines" },
      { id: "ceq.access_equipment", code: "access_equipment", name: "Access & scaffolding" },
    ],
  },
  {
    id: "cvc.mep",
    code: "mep",
    name: "Mechanical, electrical & plumbing",
    services: [
      { id: "csvc.electrical_install", code: "electrical_installation", name: "Electrical installation" },
      { id: "csvc.plumbing", code: "plumbing", name: "Plumbing & sanitary" },
      { id: "csvc.hvac", code: "hvac_install", name: "HVAC installation" },
      { id: "csvc.fire_protection", code: "fire_protection", name: "Fire protection" },
    ],
    equipmentFamilies: [
      { id: "ceq.electrical_tooling", code: "electrical_tooling", name: "Electrical tooling" },
      { id: "ceq.plumbing_tooling", code: "plumbing_tooling", name: "Plumbing tooling" },
      { id: "ceq.test_equipment", code: "test_equipment", name: "Test equipment" },
    ],
  },
  {
    id: "cvc.fitout",
    code: "fitout",
    name: "Fit-out & finishes",
    services: [
      { id: "csvc.drywall", code: "drywall", name: "Drywall & partitioning" },
      { id: "csvc.painting", code: "painting", name: "Painting & coatings" },
      { id: "csvc.flooring", code: "flooring", name: "Flooring" },
      { id: "csvc.joinery", code: "joinery", name: "Joinery & cabinetry" },
    ],
    equipmentFamilies: [
      { id: "ceq.finishing_tools", code: "finishing_tools", name: "Finishing tools" },
    ],
  },
  {
    id: "cvc.commissioning",
    code: "commissioning",
    name: "Commissioning & handover",
    services: [
      { id: "csvc.testing", code: "testing_and_commissioning", name: "Testing & commissioning" },
      { id: "csvc.snagging", code: "snagging", name: "Snagging & closeout" },
      { id: "csvc.documentation", code: "as_built_documentation", name: "As-built documentation" },
    ],
    equipmentFamilies: [],
  },
];

export const CONSTRUCTION_CONTEXT_RULES = [
  {
    id: "crule.building_construction",
    when: { valueChain: "structural_works", environment: "plant" },
    recommend: {
      equipmentFamilies: ["ceq.cranes", "ceq.welding_machines", "ceq.access_equipment"],
      kpiPack: "construction_project_v1",
      complianceItems: ["cidb_grading", "sacpcmp_registration", "site_specific_safety_file"],
    },
  },
  {
    id: "crule.civil_earthworks",
    when: { valueChain: "earthworks", environment: "surface" },
    recommend: {
      equipmentFamilies: ["ceq.excavators", "ceq.bulldozers", "ceq.graders", "ceq.compactors", "ceq.trucks"],
      kpiPack: "earthworks_v1",
      complianceItems: ["cidb_grading", "plant_operator_competency", "heritage_clearance"],
    },
  },
];

export const CONSTRUCTION_KPI_PACKS = {
  construction_project_v1: [
    "kpi.physical_availability",
    "kpi.utilisation",
    "kpi.productivity",
    "kpi.schedule_variance",
    "kpi.cost_per_unit",
    "kpi.safety_incidents",
    "kpi.pm_adherence",
  ],
  earthworks_v1: [
    "kpi.physical_availability",
    "kpi.utilisation",
    "kpi.productivity_bcm_per_hour",
    "kpi.fuel_intensity",
    "kpi.cost_per_bcm",
    "kpi.target_attainment",
  ],
};

export const CONSTRUCTION_COMMODITIES = [];

export const CONSTRUCTION_METHODS = [
  { id: "cmethod.design_bid_build", code: "design_bid_build", name: "Design-bid-build" },
  { id: "cmethod.design_build",     code: "design_build",     name: "Design-build" },
  { id: "cmethod.epc",              code: "epc",              name: "EPC (Engineer-Procure-Construct)" },
  { id: "cmethod.epcm",             code: "epcm",             name: "EPCM" },
  { id: "cmethod.turnkey",          code: "turnkey",          name: "Turnkey" },
];