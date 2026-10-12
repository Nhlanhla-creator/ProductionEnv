/**
 * digitalTwin/models/assetSchema.js
 *
 * Canonical asset master schema (Brief Section 6.1) plus a resource model
 * that also supports non-asset resources — teams, consumables, logical
 * resources (Section 4.4, Brief out-of-scope rule 11).
 *
 * The schema is the source of truth for:
 *   - default values on create
 *   - which fields are required vs optional
 *   - canonical field groups shown in the UI
 *   - import template column generation
 */

import { ASSET_STATUS, DATA_CONFIDENCE, ALLOCATION_BASIS } from "./enums";
import { CANONICAL_UNIT, UNITS } from "./units";

// ── Resource kinds ────────────────────────────────────────────────────────
export const RESOURCE_KIND = Object.freeze({
  ASSET:      "asset",       // physical equipment with identity, capacity, metering
  TEAM:       "team",        // non-asset people-based resource (Section 4.4)
  CONSUMABLE: "consumable",  // fuel, explosives, reagents
  LOGICAL:    "logical",     // abstract resource (e.g. a virtual production line)
});

export const OWNERSHIP_TYPE = Object.freeze({
  OWNED:       "owned",
  LEASED:      "leased",
  RENTED:      "rented",
  CLIENT_OWNED: "client_owned",
  SPV:         "spv",
  FINANCE:     "finance_arrangement",
});

export const CRITICALITY = Object.freeze({
  CRITICAL:  "critical",
  HIGH:      "high",
  MEDIUM:    "medium",
  LOW:       "low",
});

export const CONDITION = Object.freeze({
  EXCELLENT: "excellent",
  GOOD:      "good",
  FAIR:      "fair",
  POOR:      "poor",
  UNKNOWN:   "unknown",
});

// ── Field groups — mirrors Brief Section 6.1 exactly ─────────────────────
export const ASSET_FIELD_GROUPS = Object.freeze({
  identity: {
    label: "Identity",
    fields: ["assetId", "internalNumber", "serialNumber", "registration", "barcodeOrQr", "name"],
  },
  classification: {
    label: "Classification",
    fields: ["equipmentTypeId", "equipmentGroupId", "make", "model", "year", "configuration", "criticality"],
  },
  ownership: {
    label: "Ownership & commercial",
    fields: ["owner", "ownershipType", "lessor", "financeOrSpv", "acquisitionDate", "bookOrReplacementValue"],
  },
  capacity: {
    label: "Capacity",
    fields: ["nameplateCapacity", "canonicalUnit", "currentDeratedCapacity", "deratingReason"],
  },
  lifecycle: {
    label: "Lifecycle",
    fields: ["commissionedDate", "status", "condition", "expectedEndOfLife", "disposalDate"],
  },
  metering: {
    label: "Metering",
    fields: ["hourMeter", "odometer", "cycleMeter", "fuelMeter", "lastMeterReadingDate"],
  },
  maintenance: {
    label: "Maintenance",
    fields: ["maintenanceStrategy", "serviceIntervalHours", "lastServiceDate", "nextServiceDueDate", "warrantyExpiryDate", "responsibleParty"],
  },
  compliance: {
    label: "Compliance",
    fields: ["licenceNumber", "inspectionExpiryDate", "certificateExpiryDate", "siteEligibility", "evidenceStatus"],
  },
  dataQuality: {
    label: "Data quality",
    fields: ["sourceSystem", "confidence", "verificationStatus", "steward"],
  },
});

// ── Default factory ───────────────────────────────────────────────────────
export const createEmptyResource = (tenantId, overrides = {}) => {
  const nowIso = new Date().toISOString();
  const today = nowIso.split("T")[0];
  return {
    tenantId,
    resourceKind: overrides.resourceKind || RESOURCE_KIND.ASSET,

    // Identity
    assetId: null,               // assigned by service
    internalNumber: "",
    serialNumber: "",
    registration: "",
    barcodeOrQr: "",
    name: "",

    // Classification
    equipmentTypeId: null,       // canonical taxonomy ID (e.g. eqtype.rigid_haul_truck)
    equipmentGroupId: null,
    make: "",
    model: "",
    year: null,
    configuration: "",
    criticality: CRITICALITY.MEDIUM,

    // Ownership
    owner: "",
    ownershipType: OWNERSHIP_TYPE.OWNED,
    lessor: "",
    financeOrSpv: "",
    acquisitionDate: null,
    bookOrReplacementValue: null,

    // Capacity
    nameplateCapacity: null,
    canonicalUnit: CANONICAL_UNIT.mass,          // sensible default
    currentDeratedCapacity: null,
    deratingReason: "",

    // Lifecycle
    commissionedDate: null,
    status: ASSET_STATUS.PLANNED,
    condition: CONDITION.UNKNOWN,
    expectedEndOfLife: null,
    disposalDate: null,

    // Metering
    hourMeter: null,
    odometer: null,
    cycleMeter: null,
    fuelMeter: null,
    lastMeterReadingDate: null,

    // Maintenance
    maintenanceStrategy: "",     // "preventive" | "predictive" | "run_to_failure" | "condition_based"
    serviceIntervalHours: null,
    lastServiceDate: null,
    nextServiceDueDate: null,
    warrantyExpiryDate: null,
    responsibleParty: "",

    // Compliance
    licenceNumber: "",
    inspectionExpiryDate: null,
    certificateExpiryDate: null,
    siteEligibility: [],         // array of site node IDs the asset is cleared to operate at
    evidenceStatus: "missing",   // "missing" | "pending" | "verified"

    // Data quality
    sourceSystem: "manual",      // "manual" | "import" | "telematics" | "cmmis" | "erp"
    confidence: DATA_CONFIDENCE.MANUAL_ACTUAL,
    verificationStatus: "unverified",
    steward: "",

    // Effective dating
    effectiveFrom: today,
    effectiveTo: null,

    // Audit
    createdAt: nowIso,
    createdBy: null,
    updatedAt: nowIso,
    updatedBy: null,

    // Non-asset specific (only used when resourceKind !== "asset")
    teamSize: null,
    outputUnitOverride: null,    // for team/consumable resources

    ...overrides,
  };
};

// ── Validation ────────────────────────────────────────────────────────────

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
const isPositiveNumber = (v) => Number.isFinite(Number(v)) && Number(v) > 0;
const isIsoDate = (v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v);

export const validateResource = (resource, { isCreate = false } = {}) => {
  const errors = [];
  const warnings = [];

  // Required always
  if (!isNonEmptyString(resource.name)) errors.push({ field: "name", message: "Name is required." });

  // Asset-only rules
  if (resource.resourceKind === RESOURCE_KIND.ASSET) {
    if (!resource.equipmentTypeId) {
      errors.push({ field: "equipmentTypeId", message: "Canonical equipment type is required for physical assets." });
    }
    if (resource.nameplateCapacity !== null && !isPositiveNumber(resource.nameplateCapacity)) {
      errors.push({ field: "nameplateCapacity", message: "Nameplate capacity must be a positive number." });
    }
    if (resource.currentDeratedCapacity !== null && !isPositiveNumber(resource.currentDeratedCapacity)) {
      errors.push({ field: "currentDeratedCapacity", message: "Derated capacity must be a positive number." });
    }
    if (resource.currentDeratedCapacity !== null && resource.nameplateCapacity !== null
        && Number(resource.currentDeratedCapacity) > Number(resource.nameplateCapacity)) {
      warnings.push({ field: "currentDeratedCapacity", message: "Derated capacity is higher than nameplate capacity — confirm." });
    }
    if (!resource.canonicalUnit || !UNITS[resource.canonicalUnit]) {
      errors.push({ field: "canonicalUnit", message: "Canonical unit is required and must exist in the unit registry." });
    }
    if (resource.deratingReason && resource.currentDeratedCapacity === null) {
      warnings.push({ field: "deratingReason", message: "Derating reason set but no derated capacity given." });
    }
  }

  // Date sanity
  ["acquisitionDate", "commissionedDate", "expectedEndOfLife", "disposalDate",
   "lastServiceDate", "nextServiceDueDate", "warrantyExpiryDate",
   "inspectionExpiryDate", "certificateExpiryDate", "lastMeterReadingDate"].forEach((f) => {
    if (!isIsoDate(resource[f])) {
      errors.push({ field: f, message: `${f} must be a valid ISO date (YYYY-MM-DD) or empty.` });
    }
  });

  if (resource.commissionedDate && resource.disposalDate && resource.disposalDate < resource.commissionedDate) {
    errors.push({ field: "disposalDate", message: "Disposal date cannot precede commissioning date." });
  }
  if (resource.commissionedDate && resource.expectedEndOfLife && resource.expectedEndOfLife < resource.commissionedDate) {
    errors.push({ field: "expectedEndOfLife", message: "Expected end of life cannot precede commissioning date." });
  }

  // Ownership sanity
  if (resource.ownershipType === OWNERSHIP_TYPE.LEASED || resource.ownershipType === OWNERSHIP_TYPE.RENTED) {
    if (!resource.lessor) warnings.push({ field: "lessor", message: "Leased/rented assets should name the lessor." });
  }
  if (resource.ownershipType === OWNERSHIP_TYPE.SPV || resource.ownershipType === OWNERSHIP_TYPE.FINANCE) {
    if (!resource.financeOrSpv) warnings.push({ field: "financeOrSpv", message: "SPV/finance arrangement should be named." });
  }

  return { ok: errors.length === 0, errors, warnings };
};

// ── Assignment validation ────────────────────────────────────────────────

export const createEmptyAssignment = (tenantId, resourceId, overrides = {}) => {
  const today = new Date().toISOString().split("T")[0];
  return {
    tenantId,
    resourceId,
    assignmentId: null,          // assigned by service

    // Context — any of these may be set; at least one is required
    siteId: null,
    contractId: null,
    workPackageId: null,
    facilityId: null,
    processAreaId: null,
    serviceId: null,
    activityId: null,
    groupId: null,

    // Allocation (Section 6.2)
    isPrimary: false,
    allocationBasis: null,       // ALLOCATION_BASIS value
    allocationValue: null,       // e.g. 60 for 60%, or 12.5 for 12.5 hours
    allocationUnit: null,        // e.g. "percent" or "hours"

    // Effective dating
    effectiveFrom: today,
    effectiveTo: null,
    state: "planned",            // ASSIGNMENT_STATE

    // Evidence & provenance
    evidenceUrl: "",
    notes: "",

    // Audit
    createdAt: new Date().toISOString(),
    createdBy: null,
    updatedAt: new Date().toISOString(),
    updatedBy: null,

    ...overrides,
  };
};

export const validateAssignment = (assignment, { existingAssignmentsForResource = [] } = {}) => {
  const errors = [];
  const warnings = [];

  if (!assignment.resourceId) errors.push({ field: "resourceId", message: "Resource is required." });

  const contextFields = [
    "siteId", "contractId", "workPackageId", "facilityId", "processAreaId",
    "serviceId", "activityId", "groupId",
  ];
  const hasContext = contextFields.some((f) => assignment[f]);
  if (!hasContext) errors.push({ field: "_context", message: "At least one assignment context is required (site, contract, activity, etc.)." });

  if (!isIsoDate(assignment.effectiveFrom)) errors.push({ field: "effectiveFrom", message: "Effective from must be a valid ISO date." });
  if (!isIsoDate(assignment.effectiveTo))   errors.push({ field: "effectiveTo",   message: "Effective to must be a valid ISO date or empty." });
  if (assignment.effectiveTo && assignment.effectiveFrom && assignment.effectiveTo < assignment.effectiveFrom) {
    errors.push({ field: "effectiveTo", message: "Effective to cannot precede effective from." });
  }

  // Allocation sanity
  if (assignment.isPrimary && !assignment.allocationBasis) {
    // OK — implicit 100%
  } else if (assignment.allocationBasis) {
    if (!Object.values(ALLOCATION_BASIS).includes(assignment.allocationBasis)) {
      errors.push({ field: "allocationBasis", message: `Unknown allocation basis: ${assignment.allocationBasis}` });
    }
    if (!isPositiveNumber(assignment.allocationValue)) {
      errors.push({ field: "allocationValue", message: "Allocation value must be a positive number." });
    }
  }

  // Overlap check against existing assignments on the same resource
  const overlap = findOverlap(existingAssignmentsForResource, assignment);
  if (overlap && assignment.isPrimary && overlap.isPrimary) {
    errors.push({
      field: "_overlap",
      message: `Primary assignment overlaps an existing primary assignment (${overlap.effectiveFrom} → ${overlap.effectiveTo || "open"}). Close it first.`,
    });
  } else if (overlap && !assignment.isPrimary && !overlap.isPrimary) {
    warnings.push({
      field: "_overlap",
      message: `Non-primary assignment overlaps another non-primary assignment — verify allocation totals.`,
    });
  }

  // Allocation sum for same context + period must be ≤ 100% when basis is percentage
  if (!assignment.isPrimary && assignment.allocationBasis === ALLOCATION_BASIS.APPROVED_PERCENTAGE) {
    const existing = existingAssignmentsForResource.filter((a) =>
      a.status !== "closed"
      && a.allocationBasis === ALLOCATION_BASIS.APPROVED_PERCENTAGE
      && periodsOverlap(a, assignment)
      && sameContext(a, assignment)
    );
    const existingSum = existing.reduce((s, a) => s + (Number(a.allocationValue) || 0), 0);
    const newSum = existingSum + Number(assignment.allocationValue || 0);
    if (newSum > 100) {
      errors.push({
        field: "allocationValue",
        message: `Allocation totals would reach ${newSum}% in this context/period. Max is 100%. Close or reduce another assignment.`,
      });
    }
    if (newSum < 100) {
      warnings.push({
        field: "_unallocated",
        message: `This resource will be ${100 - newSum}% unallocated in this context/period. This is permitted but tracked.`,
      });
    }
  }

  return { ok: errors.length === 0, errors, warnings };
};

// ── Helper predicates ────────────────────────────────────────────────────

const periodsOverlap = (a, b) => {
  const aFrom = a.effectiveFrom || "0000-01-01";
  const aTo   = a.effectiveTo   || "9999-12-31";
  const bFrom = b.effectiveFrom || "0000-01-01";
  const bTo   = b.effectiveTo   || "9999-12-31";
  return !(aTo < bFrom || bTo < aFrom);
};

const sameContext = (a, b) => {
  const keys = ["siteId", "contractId", "workPackageId", "facilityId", "processAreaId", "serviceId", "activityId", "groupId"];
  return keys.every((k) => (a[k] || null) === (b[k] || null));
};

const findOverlap = (existing, candidate) => {
  return existing.find((a) => {
    if (a.status === "closed" || a.state === "closed") return false;
    return periodsOverlap(a, candidate);
  });
};

// ── Equipment group schema ───────────────────────────────────────────────

export const createEmptyGroup = (tenantId, overrides = {}) => {
  const today = new Date().toISOString().split("T")[0];
  return {
    tenantId,
    groupId: null,
    name: "",
    groupType: "fleet",         // "fleet" | "circuit" | "pool" | "line"
    equipmentTypeId: null,
    sharedTargets: {},           // e.g. { availability: 90, costPerTonne: 45 }
    capacityUnit: CANONICAL_UNIT.mass,
    nominalCapacity: null,
    notes: "",
    effectiveFrom: today,
    effectiveTo: null,
    status: "active",
    createdAt: new Date().toISOString(),
    createdBy: null,
    updatedAt: new Date().toISOString(),
    updatedBy: null,
    ...overrides,
  };
};

export const validateGroup = (group) => {
  const errors = [];
  if (!isNonEmptyString(group.name)) errors.push({ field: "name", message: "Group name is required." });
  if (group.nominalCapacity !== null && !isPositiveNumber(group.nominalCapacity)) {
    errors.push({ field: "nominalCapacity", message: "Nominal capacity must be a positive number." });
  }
  return { ok: errors.length === 0, errors, warnings: [] };
};

export default {
  RESOURCE_KIND,
  OWNERSHIP_TYPE,
  CRITICALITY,
  CONDITION,
  ASSET_FIELD_GROUPS,
  createEmptyResource,
  createEmptyAssignment,
  createEmptyGroup,
  validateResource,
  validateAssignment,
  validateGroup,
};