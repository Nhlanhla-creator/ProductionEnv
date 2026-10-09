/**
 * digitalTwin/taxonomy/industrialSupportPack.js
 *
 * Non-asset and light-asset service taxonomy for industrial support
 * businesses (Section 4.4, 5.2). Critical for proving configurable depth —
 * these services have no equipment per branch.
 *
 * Version: 1.0.0
 */

export const INDUSTRIAL_SUPPORT_PACK_VERSION = "1.0.0";

export const SUPPORT_SECTOR = {
  id: "sector.industrial_support",
  code: "industrial_support",
  name: "Industrial support services",
  children: [
    { id: "sector.support.cleaning", code: "cleaning_facilities", name: "Cleaning and facilities" },
    { id: "sector.support.catering", code: "catering", name: "Catering" },
    { id: "sector.support.security", code: "security", name: "Security services" },
    { id: "sector.support.medical", code: "occupational_medical", name: "Occupational medical" },
    { id: "sector.support.maintenance", code: "maintenance", name: "Maintenance contractor" },
    { id: "sector.support.labs", code: "laboratory", name: "Laboratory services" },
    { id: "sector.support.logistics", code: "logistics", name: "Logistics and materials handling" },
    { id: "sector.support.professional", code: "professional", name: "Professional services" },
  ],
};

// Each service declares whether it is asset-based or non-asset.
// `outputUnit` is the canonical measure of the service output — no tonnes here.
export const SUPPORT_SERVICES = [
  // Cleaning
  {
    id: "svc.accommodation_cleaning",
    code: "accommodation_block_cleaning",
    name: "Accommodation block cleaning",
    sectorChild: "sector.support.cleaning",
    assetBased: false,
    outputUnit: "square_metres",
    activities: [
      { id: "act.rooms_serviced", code: "rooms_serviced", name: "Rooms serviced" },
      { id: "act.communal_cleaning", code: "communal_area_cleaning", name: "Communal area cleaning" },
    ],
    optionalEquipmentFamily: "eq.cleaning_equipment_pool",
  },
  { id: "svc.industrial_cleaning", code: "industrial_cleaning", name: "Industrial cleaning", sectorChild: "sector.support.cleaning", assetBased: false, outputUnit: "square_metres" },
  { id: "svc.ablution_cleaning", code: "ablution_cleaning", name: "Ablution cleaning", sectorChild: "sector.support.cleaning", assetBased: false, outputUnit: "count" },

  // Catering
  { id: "svc.camp_catering", code: "camp_catering", name: "Camp catering", sectorChild: "sector.support.catering", assetBased: false, outputUnit: "count" /* meals served */ },
  { id: "svc.site_canteen", code: "site_canteen", name: "Site canteen operation", sectorChild: "sector.support.catering", assetBased: false, outputUnit: "count" },

  // Security
  { id: "svc.guarding", code: "guarding", name: "Static guarding", sectorChild: "sector.support.security", assetBased: false, outputUnit: "hours" },
  { id: "svc.access_control", code: "access_control", name: "Access control", sectorChild: "sector.support.security", assetBased: false, outputUnit: "count" /* posts covered */ },
  { id: "svc.patrol", code: "mobile_patrol", name: "Mobile patrol", sectorChild: "sector.support.security", assetBased: true, optionalEquipmentFamily: "eq.patrol_vehicles", outputUnit: "count" },

  // Occupational medical
  { id: "svc.medical_surveillance", code: "medical_surveillance", name: "Medical surveillance", sectorChild: "sector.support.medical", assetBased: false, outputUnit: "count" },
  { id: "svc.onsite_clinic", code: "onsite_clinic", name: "Onsite clinic", sectorChild: "sector.support.medical", assetBased: false, outputUnit: "hours" },
  { id: "svc.emergency_response", code: "emergency_response", name: "Emergency response", sectorChild: "sector.support.medical", assetBased: true, optionalEquipmentFamily: "eq_ambulances", outputUnit: "count" },

  // Maintenance contractor (asset-based but not the primary value chain)
  {
    id: "svc.mechanical_maintenance",
    code: "mechanical_maintenance",
    name: "Mechanical maintenance",
    sectorChild: "sector.support.maintenance",
    assetBased: true,
    equipmentFamily: "eq.maintenance_tooling",
    outputUnit: "hours",
    activities: [
      { id: "act.planned_maint", code: "planned_maintenance", name: "Planned maintenance" },
      { id: "act.corrective_maint", code: "corrective_maintenance", name: "Corrective maintenance" },
      { id: "act.shutdown_maint", code: "shutdown_maintenance", name: "Shutdown maintenance" },
    ],
  },
  { id: "svc.electrical_maintenance", code: "electrical_maintenance", name: "Electrical maintenance", sectorChild: "sector.support.maintenance", assetBased: true, equipmentFamily: "eq.electrical_tooling", outputUnit: "hours" },
  { id: "svc.instrumentation", code: "instrumentation", name: "Instrumentation and calibration", sectorChild: "sector.support.maintenance", assetBased: true, equipmentFamily: "eq.calibration_equipment", outputUnit: "hours" },

  // Laboratory
  { id: "svc.assay", code: "assay_services", name: "Assay services", sectorChild: "sector.support.labs", assetBased: true, equipmentFamily: "eq.lab_equipment", outputUnit: "count" /* samples */ },
  { id: "svc.environmental_monitoring", code: "environmental_monitoring", name: "Environmental monitoring", sectorChild: "sector.support.labs", assetBased: true, equipmentFamily: "eq_env_monitoring", outputUnit: "count" },

  // Logistics
  { id: "svc.warehousing", code: "warehousing", name: "Warehousing", sectorChild: "sector.support.logistics", assetBased: true, optionalEquipmentFamily: "eq_warehouse_equipment", outputUnit: "square_metres" },
  { id: "svc.transport_road", code: "road_transport", name: "Road transport", sectorChild: "sector.support.logistics", assetBased: true, equipmentFamily: "eq_trucks", outputUnit: "tonnes" },

  // Professional
  { id: "svc.hse_consulting", code: "hse_consulting", name: "HSE consulting", sectorChild: "sector.support.professional", assetBased: false, outputUnit: "hours" },
  { id: "svc.training", code: "training", name: "Training", sectorChild: "sector.support.professional", assetBased: false, outputUnit: "count" /* delegates trained */ },
  { id: "svc.engineering_consulting", code: "engineering_consulting", name: "Engineering consulting", sectorChild: "sector.support.professional", assetBased: false, outputUnit: "hours" },
];

// Non-asset resource pools — teams, not equipment
export const NON_ASSET_RESOURCES = [
  { id: "res.cleaning_team", code: "cleaning_team", name: "Cleaning team", outputUnit: "square_metres" },
  { id: "res.security_team", code: "security_team", name: "Security team", outputUnit: "hours" },
  { id: "res.medical_team", code: "medical_team", name: "Medical team", outputUnit: "hours" },
  { id: "res.training_facilitators", code: "training_facilitators", name: "Training facilitators", outputUnit: "count" },
];

// KPI pack for non-asset services
export const SUPPORT_KPI_PACKS = {
  cleaning_v1: [
    "kpi.service_units_per_hour",
    "kpi.cost_per_service_unit",
    "kpi.quality_score",
    "kpi.attendance_rate",
  ],
  security_v1: [
    "kpi.posts_covered_percent",
    "kpi.incident_response_time",
    "kpi.incident_closure_rate",
    "kpi.attendance_rate",
  ],
  medical_v1: [
    "kpi.medical_coverage_percent",
    "kpi.emergency_response_time",
    "kpi.statutory_compliance_percent",
  ],
};