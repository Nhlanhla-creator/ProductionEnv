/**
 * digitalTwin/models/enums.js
 *
 * All controlled vocabularies for the digital twin, sourced directly from the
 * Developer Brief v4 Sections 4, 5, 6, 7 and Appendix A.
 *
 * These are immutable value sets. Labels may be translated, but the codes are
 * canonical and are stored on every record. Never use display labels as keys.
 */

// ── Node types (Section 4 — canonical hierarchy) ──────────────────────────
export const NODE_TYPES = Object.freeze({
  COMPANY:      "company",           // Level 0
  DIVISION:     "division",          // Level 1 (optional)
  SITE:         "site",              // physical delivery location
  CONTRACT:     "contract",          // commercial delivery context
  FACILITY:     "facility",          // facility or operation
  PROCESS_AREA: "process_area",      // area / circuit / process stage
  SERVICE:      "service",           // Service Level 1 (what is sold)
  ACTIVITY:     "activity",          // Activity Level 2 (work performed)
  EQUIPMENT_GROUP:  "equipment_group",
  EQUIPMENT_FAMILY: "equipment_family",
  EQUIPMENT_TYPE:   "equipment_type",  // canonical taxonomy record
  ASSET:            "asset",           // business-owned/controlled master
});

// ── Relationship types (Section 13.4 — definitive canonical model) ────────
export const RELATION_TYPES = Object.freeze({
  HAS_UNIT:       "has_unit",
  OWNS_OR_CONTROLS: "owns_or_controls",
  DELIVERED_AT:   "delivered_at",
  CONTAINS:       "contains",
  HAS_AREA:       "has_area",
  SCOPES:         "scopes",
  REALIZED_BY:    "realized_by",
  PERFORMED_IN:   "performed_in",
  SUPPORTS:       "supports",
  MEMBER_OF:      "member_of",
  CLASSIFIED_AS:  "classified_as",
  ASSIGNS:        "assigns",
});

// ── Asset lifecycle statuses (Appendix A2) ────────────────────────────────
export const ASSET_STATUS = Object.freeze({
  PLANNED:              "planned",
  COMMISSIONING:        "commissioning",
  AVAILABLE:            "available",
  OPERATING:            "operating",
  STANDBY:              "standby",
  PLANNED_MAINTENANCE:  "planned_maintenance",
  UNPLANNED_DOWNTIME:   "unplanned_downtime",
  SUSPENDED:            "suspended",
  RETIRED:              "retired",
  DISPOSED:             "disposed",
});

// ── Data confidence (Appendix A3) ─────────────────────────────────────────
export const DATA_CONFIDENCE = Object.freeze({
  INTEGRATED_VERIFIED: "integrated_verified",
  VERIFIED_EVIDENCE:   "verified_evidence",
  MANUAL_ACTUAL:       "manual_actual",
  ESTIMATE:            "estimate",
  CALCULATED:          "calculated",
  UNKNOWN:             "unknown",
});

// Source precedence order — higher index wins (Section 8.5.1)
export const CONFIDENCE_PRECEDENCE = [
  DATA_CONFIDENCE.UNKNOWN,
  DATA_CONFIDENCE.ESTIMATE,
  DATA_CONFIDENCE.MANUAL_ACTUAL,
  DATA_CONFIDENCE.CALCULATED,
  DATA_CONFIDENCE.VERIFIED_EVIDENCE,
  DATA_CONFIDENCE.INTEGRATED_VERIFIED,
];

// ── Workflow states (Section 9.8) ─────────────────────────────────────────
export const MEASUREMENT_STATE = Object.freeze({
  DRAFT:     "draft",
  SUBMITTED: "submitted",
  RETURNED:  "returned",
  APPROVED:  "approved",
  CORRECTED: "corrected",
  VOIDED:    "voided",
});

export const IMPORT_BATCH_STATE = Object.freeze({
  UPLOADED:      "uploaded",
  MAPPED:        "mapped",
  VALIDATING:    "validating",
  ERRORS_FOUND:  "errors_found",
  READY:         "ready",
  COMMITTED:     "committed",
  FAILED:        "failed",
  ROLLED_BACK:   "rolled_back",
});

export const SETUP_SESSION_STATE = Object.freeze({
  DRAFT:             "draft",
  VALIDATION_REQUIRED: "validation_required",
  READY:             "ready",
  ACTIVE:            "active",
  ARCHIVED:          "archived",
});

// ── Assignment ────────────────────────────────────────────────────────────
export const ASSIGNMENT_STATE = Object.freeze({
  PLANNED:   "planned",
  ACTIVE:    "active",
  CLOSED:    "closed",
  CANCELLED: "cancelled",
});

export const ALLOCATION_BASIS = Object.freeze({
  HOURS:              "hours",
  TONNES:             "tonnes",
  TRIPS:              "trips",
  METRES:             "metres",
  COST:               "cost",
  APPROVED_PERCENTAGE: "approved_percentage",
});

// ── Downtime classification (Section 7.8 starter taxonomy) ────────────────
export const DOWNTIME_LEVEL_1 = Object.freeze({
  PLANNED_MAINTENANCE:  "planned_maintenance",
  UNPLANNED_MECHANICAL: "unplanned_mechanical",
  UNPLANNED_ELECTRICAL: "unplanned_electrical_or_control",
  OPERATIONAL_DELAY:    "operational_delay",
  PROCESS_DEPENDENCY:   "process_dependency",
  SUPPLY_DEPENDENCY:    "supply_dependency",
  EXTERNAL_DELAY:       "external_or_client_delay",
  WEATHER_ENVIRONMENT:  "weather_and_environment",
  SAFETY_REGULATORY:    "safety_or_regulatory",
  COMMERCIAL_STANDBY:   "commercial_or_strategic_standby",
});

export const DOWNTIME_LOSS_TYPE = Object.freeze({
  AVAILABILITY_LOSS: "availability_loss",
  UTILISATION_LOSS:  "utilisation_loss",
});

export const DOWNTIME_RESPONSIBILITY = Object.freeze({
  INTERNAL:   "internal",
  SUPPLIER:   "supplier",
  CLIENT:     "client",
  UTILITY:    "utility",
  WEATHER:    "weather",
  REGULATORY: "regulatory",
  OTHER:      "other",
});

// ── KPI categories (Section 7.1) ──────────────────────────────────────────
export const KPI_CATEGORY = Object.freeze({
  CAPACITY_READINESS:   "capacity_and_readiness",
  TIME_UTILISATION:     "time_and_utilisation",
  PRODUCTION:           "production_and_productivity",
  RELIABILITY:          "reliability",
  MAINTENANCE:          "maintenance",
  ENERGY_FUEL:          "energy_and_fuel",
  QUALITY:              "quality_and_recovery",
  COST:                 "cost_and_commercial",
  SAFETY:               "safety_and_environment",
  PEOPLE:               "people_and_capability",
  PROCUREMENT:          "procurement_and_supplier",
});

// ── Aggregation methods (Section 7.3 / 7.4) ──────────────────────────────
export const AGGREGATION_METHOD = Object.freeze({
  SUM:              "sum",
  AVERAGE:          "average",
  WEIGHTED_AVERAGE: "weighted_average",
  RECOMPUTE:        "recompute",
  MINIMUM:          "minimum",
  MAXIMUM:          "maximum",
  LAST_VALUE:       "last_value",
  PROHIBITED:       "prohibited",
});

export const KPI_DIRECTION = Object.freeze({
  HIGHER_IS_BETTER: "higher",
  LOWER_IS_BETTER:  "lower",
  WITHIN_RANGE:     "within_range",
  INFORMATIONAL:    "informational",
});

// ── Applicability decisions (Section 5.3A / 13.7) ─────────────────────────
export const APPLICABILITY_DECISION = Object.freeze({
  RECOMMENDED:  "recommended",
  COMPATIBLE:   "compatible",
  UNCOMMON:     "uncommon",
  EXCLUDED:     "excluded",
  REQUIRES_REVIEW: "requires_review",
});

// ── Optional context dimensions (Section 4.1) ─────────────────────────────
export const CONTEXT_KIND = Object.freeze({
  CLIENT:      "client",
  COMMODITY:   "commodity",
  ENVIRONMENT: "environment",
  METHOD:      "method",
  AREA:        "process_area_or_circuit",
  PROJECT:     "project",
  GEOGRAPHY:   "geography",
  SHIFT:       "shift",
  OWNERSHIP:   "ownership",
});

export const OPERATING_ENVIRONMENT = Object.freeze({
  SURFACE:  "surface",
  UNDERGROUND: "underground",
  PLANT:    "plant",
  WORKSHOP: "workshop",
  REMOTE_FIELD: "remote_field",
  MARINE:   "marine",
  PROCESS:  "process",
});

// ── Roles & permissions (Section 11) ──────────────────────────────────────
export const TWIN_ROLES = Object.freeze({
  ORGANISATION_OWNER:  "organisation_owner",
  OPERATIONS_ADMIN:    "operations_administrator",
  DATA_CAPTURER:       "data_capturer",
  APPROVER:            "approver",
  ASSET_MANAGER:       "asset_or_maintenance_manager",
  EXECUTIVE_VIEWER:    "executive_viewer",
  EXTERNAL_VERIFIER:   "external_verifier",
  SPONSOR_VIEWER:      "corporate_sponsor_or_buyer",
  TAXONOMY_STEWARD:    "taxonomy_steward",
  PLATFORM_ADMIN:      "platform_administrator",
});

// ── Target/variance status ────────────────────────────────────────────────
export const VARIANCE_STATUS = Object.freeze({
  ON_TARGET: "on_target",
  WARNING:   "warning",
  CRITICAL:  "critical",
  NO_TARGET: "no_target",
});