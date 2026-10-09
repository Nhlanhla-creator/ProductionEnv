/**
 * digitalTwin/models/inputSheets.js
 *
 * Canonical definitions for input sheets IS01–IS11 (Brief Section 8.5.2).
 *
 * Every sheet declares:
 *   - grain (one row per what)
 *   - frequency (on-create, per shift, per event, per month)
 *   - required columns (locked — cannot be renamed or removed without a
 *     contract version bump)
 *   - optional/context columns
 *   - validation rules that fire on dry-run and on commit
 *
 * The `canonicalField` on every column is the key on the Firestore record.
 * Display labels may be translated; the canonical field is invariant.
 */

// ── Column data types ────────────────────────────────────────────────────
export const COLUMN_TYPE = Object.freeze({
  TEXT:      "text",
  NUMBER:    "number",
  INTEGER:   "integer",
  DATE:      "date",
  DATETIME:  "datetime",
  ENUM:      "enum",
  BOOLEAN:   "boolean",
  CANONICAL_ID: "canonical_id",   // must resolve to a taxonomy term
  REFERENCE: "reference",          // must exist in tenant data (e.g. assetId)
});

// ── Sheet identifiers ────────────────────────────────────────────────────
export const SHEET_IDS = Object.freeze({
  IS01: "IS01",
  IS02: "IS02",
  IS03: "IS03",
  IS04: "IS04",
  IS05: "IS05",
  IS06: "IS06",
  IS07: "IS07",
  IS08: "IS08",
  IS09: "IS09",
  IS10: "IS10",
  IS11: "IS11",
});

// ── Column builder helper ────────────────────────────────────────────────
const col = (id, label, type, { required = false, canonicalField = null, options = null, unit = null, hint = null } = {}) => ({
  id, label, type, required,
  canonicalField: canonicalField || id,
  options, unit, hint,
});

// ── Sheet definitions ────────────────────────────────────────────────────

export const INPUT_SHEETS = Object.freeze({
  // ── IS01: Operating Context ──────────────────────────────────────────
  IS01: {
    id: "IS01",
    name: "Operating Context",
    grain: "One row per site/contract/facility configuration",
    frequency: "on_create_or_change",
    targetCollection: "contexts",
    columns: [
      col("contextId", "Context ID", COLUMN_TYPE.TEXT, { hint: "Auto-generated; leave blank on create." }),
      col("organisationId", "Organisation", COLUMN_TYPE.REFERENCE, { required: true }),
      col("siteId", "Site", COLUMN_TYPE.REFERENCE),
      col("contractId", "Contract", COLUMN_TYPE.REFERENCE),
      col("facilityId", "Facility / Operation", COLUMN_TYPE.REFERENCE),
      col("timezone", "Timezone", COLUMN_TYPE.TEXT, { required: true, hint: "e.g. Africa/Johannesburg" }),
      col("effectiveFrom", "Effective from", COLUMN_TYPE.DATE, { required: true }),
      col("effectiveTo", "Effective to", COLUMN_TYPE.DATE),
      col("status", "Status", COLUMN_TYPE.ENUM, { required: true, options: ["active", "planned", "retired"] }),
      col("client", "Client", COLUMN_TYPE.TEXT),
      col("commodity", "Commodity", COLUMN_TYPE.CANONICAL_ID),
      col("productionMethod", "Production method", COLUMN_TYPE.CANONICAL_ID),
      col("environment", "Environment", COLUMN_TYPE.ENUM, { options: ["surface", "underground", "plant", "workshop", "remote_field", "process"] }),
      col("processArea", "Process area", COLUMN_TYPE.CANONICAL_ID),
      col("acceptedOutputBoundary", "Accepted output boundary", COLUMN_TYPE.TEXT, { hint: "Nominated boundary per §7.7" }),
    ],
  },

  // ── IS02: Equipment and Resource Register ────────────────────────────
  IS02: {
    id: "IS02",
    name: "Equipment and Resource Register",
    grain: "One row per asset/resource",
    frequency: "on_create_or_change",
    targetCollection: "resources",
    columns: [
      col("assetId", "Asset ID", COLUMN_TYPE.TEXT, { hint: "Auto-generated for new assets." }),
      col("externalSourceId", "External ID", COLUMN_TYPE.TEXT, { required: true, canonicalField: "externalSourceId", hint: "Unique key from your register." }),
      col("resourceKind", "Resource kind", COLUMN_TYPE.ENUM, { required: true, options: ["asset", "team", "consumable", "logical"], canonicalField: "resourceKind" }),
      col("equipmentTypeId", "Canonical equipment type", COLUMN_TYPE.CANONICAL_ID, { required: true, canonicalField: "equipmentTypeId" }),
      col("name", "Name", COLUMN_TYPE.TEXT, { required: true }),
      col("internalNumber", "Internal number", COLUMN_TYPE.TEXT),
      col("ownershipType", "Ownership", COLUMN_TYPE.ENUM, { options: ["owned", "leased", "rented", "client_owned", "spv", "finance_arrangement"] }),
      col("status", "Status", COLUMN_TYPE.ENUM, { required: true, options: ["planned", "commissioning", "available", "operating", "standby", "planned_maintenance", "unplanned_downtime", "suspended", "retired", "disposed"] }),
      col("effectiveFrom", "Effective from", COLUMN_TYPE.DATE, { required: true }),
      col("make", "Make", COLUMN_TYPE.TEXT),
      col("model", "Model", COLUMN_TYPE.TEXT),
      col("serialNumber", "Serial number", COLUMN_TYPE.TEXT),
      col("registration", "Registration", COLUMN_TYPE.TEXT),
      col("year", "Year", COLUMN_TYPE.INTEGER),
      col("nameplateCapacity", "Nameplate capacity", COLUMN_TYPE.NUMBER),
      col("canonicalUnit", "Capacity unit", COLUMN_TYPE.ENUM, { options: ["tonnes", "hours", "cubic_metres", "count", "kilowatt_hours", "square_metres"] }),
      col("currentDeratedCapacity", "Current derated capacity", COLUMN_TYPE.NUMBER),
      col("condition", "Condition", COLUMN_TYPE.ENUM, { options: ["excellent", "good", "fair", "poor", "unknown"] }),
      col("criticality", "Criticality", COLUMN_TYPE.ENUM, { options: ["critical", "high", "medium", "low"] }),
    ],
  },

  // ── IS03: Resource Assignment ────────────────────────────────────────
  IS03: {
    id: "IS03",
    name: "Resource Assignment",
    grain: "One row per resource-context assignment period",
    frequency: "on_create_or_change",
    targetCollection: "assignments",
    columns: [
      col("externalSourceId", "External ID", COLUMN_TYPE.TEXT, { required: true, hint: "Unique key for this assignment." }),
      col("resourceId", "Resource", COLUMN_TYPE.REFERENCE, { required: true }),
      col("siteId", "Site", COLUMN_TYPE.REFERENCE),
      col("contractId", "Contract", COLUMN_TYPE.REFERENCE),
      col("facilityId", "Facility", COLUMN_TYPE.REFERENCE),
      col("processAreaId", "Process area", COLUMN_TYPE.REFERENCE),
      col("serviceId", "Service", COLUMN_TYPE.REFERENCE),
      col("activityId", "Activity", COLUMN_TYPE.REFERENCE),
      col("groupId", "Equipment group", COLUMN_TYPE.REFERENCE),
      col("effectiveFrom", "Effective from", COLUMN_TYPE.DATE, { required: true }),
      col("effectiveTo", "Effective to", COLUMN_TYPE.DATE),
      col("state", "State", COLUMN_TYPE.ENUM, { required: true, options: ["planned", "active", "closed", "cancelled"] }),
      col("isPrimary", "Primary", COLUMN_TYPE.BOOLEAN, { required: true }),
      col("allocationBasis", "Allocation basis", COLUMN_TYPE.ENUM, { options: ["hours", "tonnes", "trips", "metres", "cost", "approved_percentage"] }),
      col("allocationValue", "Allocation value", COLUMN_TYPE.NUMBER),
      col("allocationUnit", "Allocation unit", COLUMN_TYPE.TEXT),
      col("workPackageId", "Work package", COLUMN_TYPE.REFERENCE),
    ],
  },

  // ── IS04: Reporting Calendar and Targets ─────────────────────────────
  IS04: {
    id: "IS04",
    name: "Reporting Calendar and Targets",
    grain: "One row per scope/KPI/period or target series",
    frequency: "period_open",
    targetCollection: "reportingPeriods",
    columns: [
      col("externalSourceId", "External ID", COLUMN_TYPE.TEXT, { required: true }),
      col("scopeKey", "Scope key", COLUMN_TYPE.TEXT, { required: true, hint: "e.g. site:NORTH_PIT or contract:NORTH_LH" }),
      col("periodType", "Period type", COLUMN_TYPE.ENUM, { required: true, options: ["day", "week", "month", "quarter", "year"] }),
      col("startDate", "Start date", COLUMN_TYPE.DATE, { required: true }),
      col("endDate", "End date", COLUMN_TYPE.DATE, { required: true }),
      col("timezone", "Timezone", COLUMN_TYPE.TEXT, { required: true }),
      col("workingCalendar", "Working calendar", COLUMN_TYPE.ENUM, { options: ["24_7", "day_shift_only", "weekdays", "custom"] }),
      col("periodStatus", "Period status", COLUMN_TYPE.ENUM, { required: true, options: ["planned", "open", "closed"] }),
      col("shiftPattern", "Shift pattern", COLUMN_TYPE.TEXT),
      col("scheduledDays", "Scheduled days", COLUMN_TYPE.INTEGER),
      col("scheduledHours", "Scheduled hours", COLUMN_TYPE.NUMBER),
      col("targetKpiId", "KPI", COLUMN_TYPE.CANONICAL_ID),
      col("targetValue", "Target value", COLUMN_TYPE.NUMBER),
      col("targetUnit", "Target unit", COLUMN_TYPE.TEXT),
      col("warningValue", "Warning threshold", COLUMN_TYPE.NUMBER),
      col("criticalValue", "Critical threshold", COLUMN_TYPE.NUMBER),
      col("approver", "Approver", COLUMN_TYPE.TEXT),
    ],
  },

  // ── IS05: Equipment Time Sheet ───────────────────────────────────────
  IS05: {
    id: "IS05",
    name: "Equipment Time Sheet",
    grain: "One row per asset per shift/day",
    frequency: "shift_or_daily",
    targetCollection: "measurements",
    columns: [
      col("recordDate", "Date", COLUMN_TYPE.DATE, { required: true }),
      col("shiftId", "Shift", COLUMN_TYPE.ENUM, { required: false, options: ["day", "night", "afternoon", "full_day"] }),
      col("assetId", "Asset", COLUMN_TYPE.REFERENCE, { required: true }),
      col("scheduledHours", "Scheduled hours", COLUMN_TYPE.NUMBER, { required: true, unit: "hours", canonicalField: "scheduled_time" }),
      col("availableHours", "Available hours", COLUMN_TYPE.NUMBER, { required: true, unit: "hours", canonicalField: "available_time" }),
      col("operatingHours", "Operating hours", COLUMN_TYPE.NUMBER, { required: true, unit: "hours", canonicalField: "operating_time" }),
      col("excludedHours", "Excluded hours", COLUMN_TYPE.NUMBER, { unit: "hours", canonicalField: "excluded_time" }),
      col("plannedDowntime", "Planned downtime", COLUMN_TYPE.NUMBER, { unit: "hours", canonicalField: "planned_downtime" }),
      col("standbyHours", "Standby hours", COLUMN_TYPE.NUMBER, { unit: "hours", canonicalField: "standby_time" }),
      col("delayHours", "Delay hours", COLUMN_TYPE.NUMBER, { unit: "hours", canonicalField: "utilisation_loss_time" }),
      col("meterStart", "Meter start", COLUMN_TYPE.NUMBER),
      col("meterEnd", "Meter end", COLUMN_TYPE.NUMBER),
      col("operatorOrCrew", "Operator / crew", COLUMN_TYPE.TEXT),
      col("notes", "Notes", COLUMN_TYPE.TEXT),
      col("source", "Source", COLUMN_TYPE.TEXT, { required: true, hint: "e.g. manual, import" }),
      col("confidence", "Confidence", COLUMN_TYPE.ENUM, { required: true, options: ["integrated_verified", "verified_evidence", "manual_actual", "estimate", "calculated"] }),
      col("externalSourceId", "External ID", COLUMN_TYPE.TEXT, { required: true, hint: "Natural key for deduplication." }),
    ],
  },

  // ── IS06: Production and Activity Output ─────────────────────────────
  IS06: {
    id: "IS06",
    name: "Production and Activity Output",
    grain: "One row per asset/group/activity per shift/day",
    frequency: "shift_or_daily",
    targetCollection: "measurements",
    columns: [
      col("recordDate", "Date", COLUMN_TYPE.DATE, { required: true }),
      col("shiftId", "Shift", COLUMN_TYPE.ENUM, { options: ["day", "night", "afternoon", "full_day"] }),
      col("assetId", "Asset", COLUMN_TYPE.REFERENCE),
      col("groupId", "Equipment group", COLUMN_TYPE.REFERENCE),
      col("activityId", "Activity", COLUMN_TYPE.REFERENCE, { required: true }),
      col("scopeKey", "Scope key", COLUMN_TYPE.TEXT, { hint: "Composed key when asset/group/activity are ambiguous." }),
      col("outputQuantity", "Output quantity", COLUMN_TYPE.NUMBER, { required: true, canonicalField: "accepted_output" }),
      col("outputUnit", "Output unit", COLUMN_TYPE.ENUM, { required: true, options: ["tonnes", "cubic_metres", "count", "metres", "square_metres"] }),
      col("acceptedOrIntermediate", "Accepted / intermediate", COLUMN_TYPE.ENUM, { required: true, options: ["accepted", "intermediate"], hint: "Intermediate tonnes remain available for process analysis but do not count toward accepted output." }),
      col("source", "Source", COLUMN_TYPE.TEXT, { required: true }),
      col("rejectsOrRework", "Rejects / rework", COLUMN_TYPE.NUMBER),
      col("distance", "Distance", COLUMN_TYPE.NUMBER, { unit: "metres" }),
      col("trips", "Trips", COLUMN_TYPE.INTEGER),
      col("cycles", "Cycles", COLUMN_TYPE.INTEGER),
      col("holes", "Holes", COLUMN_TYPE.INTEGER),
      col("destination", "Destination", COLUMN_TYPE.TEXT),
      col("notes", "Notes", COLUMN_TYPE.TEXT),
      col("confidence", "Confidence", COLUMN_TYPE.ENUM, { required: true, options: ["integrated_verified", "verified_evidence", "manual_actual", "estimate", "calculated"] }),
      col("externalSourceId", "External ID", COLUMN_TYPE.TEXT, { required: true }),
    ],
  },

  // ── IS07: Downtime Event Log ─────────────────────────────────────────
  IS07: {
    id: "IS07",
    name: "Downtime Event Log",
    grain: "One row per event",
    frequency: "event_or_shift_close",
    targetCollection: "downtimeEvents",
    columns: [
      col("assetId", "Asset", COLUMN_TYPE.REFERENCE),
      col("groupId", "Equipment group", COLUMN_TYPE.REFERENCE),
      col("eventStart", "Start", COLUMN_TYPE.DATETIME, { required: true }),
      col("eventEnd", "End", COLUMN_TYPE.DATETIME, { hint: "Leave blank for open events." }),
      col("categoryLevel1", "Category", COLUMN_TYPE.ENUM, { required: true, options: ["planned_maintenance", "unplanned_mechanical", "unplanned_electrical_or_control", "operational_delay", "process_dependency", "supply_dependency", "external_or_client_delay", "weather_and_environment", "safety_or_regulatory", "commercial_or_strategic_standby"] }),
      col("categoryLevel2", "Subcategory", COLUMN_TYPE.TEXT),
      col("failureMode", "Failure mode", COLUMN_TYPE.TEXT),
      col("causeCode", "Cause code", COLUMN_TYPE.TEXT),
      col("responsibility", "Responsibility", COLUMN_TYPE.ENUM, { options: ["internal", "supplier", "client", "utility", "weather", "regulatory", "other"] }),
      col("lostOperatingHours", "Lost operating hours", COLUMN_TYPE.NUMBER, { unit: "hours" }),
      col("estimatedLostOutput", "Estimated lost output", COLUMN_TYPE.NUMBER),
      col("workOrderId", "Work order", COLUMN_TYPE.TEXT),
      col("actionTaken", "Action taken", COLUMN_TYPE.TEXT),
      col("evidenceUrl", "Evidence URL", COLUMN_TYPE.TEXT),
      col("confidence", "Confidence", COLUMN_TYPE.ENUM, { required: true, options: ["integrated_verified", "verified_evidence", "manual_actual", "estimate"] }),
      col("externalSourceId", "External ID", COLUMN_TYPE.TEXT, { required: true }),
    ],
  },

  // ── IS08: Fuel and Energy ────────────────────────────────────────────
  IS08: {
    id: "IS08",
    name: "Fuel and Energy",
    grain: "One row per asset/process-area per period",
    frequency: "daily_or_monthly",
    targetCollection: "measurements",
    columns: [
      col("recordDate", "Date", COLUMN_TYPE.DATE, { required: true }),
      col("assetId", "Asset", COLUMN_TYPE.REFERENCE),
      col("processAreaId", "Process area", COLUMN_TYPE.REFERENCE),
      col("period", "Period", COLUMN_TYPE.TEXT, { required: true, hint: "e.g. 2026-04 or shift key." }),
      col("quantity", "Quantity", COLUMN_TYPE.NUMBER, { required: true }),
      col("unit", "Unit", COLUMN_TYPE.ENUM, { required: true, options: ["litres", "kilowatt_hours", "cubic_metres"] }),
      col("energyOrFuelType", "Type", COLUMN_TYPE.ENUM, { required: true, options: ["diesel", "petrol", "electricity", "gas", "other"] }),
      col("source", "Source", COLUMN_TYPE.TEXT, { required: true }),
      col("meterStart", "Meter start", COLUMN_TYPE.NUMBER),
      col("meterEnd", "Meter end", COLUMN_TYPE.NUMBER),
      col("supplierRecord", "Supplier record", COLUMN_TYPE.TEXT),
      col("distance", "Distance", COLUMN_TYPE.NUMBER, { unit: "metres" }),
      col("outputLinkage", "Output linkage", COLUMN_TYPE.TEXT, { hint: "Component ID this fuel was used to produce." }),
      col("cost", "Cost", COLUMN_TYPE.NUMBER),
      col("evidenceUrl", "Evidence URL", COLUMN_TYPE.TEXT),
      col("confidence", "Confidence", COLUMN_TYPE.ENUM, { required: true, options: ["integrated_verified", "verified_evidence", "manual_actual", "estimate"] }),
      col("externalSourceId", "External ID", COLUMN_TYPE.TEXT, { required: true }),
    ],
  },

  // ── IS09: Maintenance Summary ────────────────────────────────────────
  IS09: {
    id: "IS09",
    name: "Maintenance Summary",
    grain: "One row per work order/event or approved period summary",
    frequency: "event_week_or_month",
    targetCollection: "maintenanceEvents",
    columns: [
      col("assetId", "Asset", COLUMN_TYPE.REFERENCE, { required: true }),
      col("workOrderId", "Work order ID", COLUMN_TYPE.TEXT, { required: true }),
      col("maintenanceType", "Type", COLUMN_TYPE.ENUM, { required: true, options: ["preventive", "corrective", "predictive", "statutory", "shutdown"] }),
      col("openedTimestamp", "Opened", COLUMN_TYPE.DATETIME, { required: true }),
      col("completedTimestamp", "Completed", COLUMN_TYPE.DATETIME),
      col("state", "State", COLUMN_TYPE.ENUM, { required: true, options: ["open", "in_progress", "completed", "cancelled"] }),
      col("failureFlag", "Failure flag", COLUMN_TYPE.BOOLEAN, { required: true, hint: "Counts toward functional failures for MTBF." }),
      col("activeRepairHours", "Active repair hours", COLUMN_TYPE.NUMBER, { unit: "hours" }),
      col("labourHours", "Labour hours", COLUMN_TYPE.NUMBER, { unit: "hours" }),
      col("partsCost", "Parts cost", COLUMN_TYPE.NUMBER, { unit: "ZAR" }),
      col("labourCost", "Labour cost", COLUMN_TYPE.NUMBER, { unit: "ZAR" }),
      col("totalCost", "Total cost", COLUMN_TYPE.NUMBER, { unit: "ZAR" }),
      col("pmDueOnTime", "PM completed on time", COLUMN_TYPE.BOOLEAN, { hint: "True/false for PM adherence." }),
      col("cause", "Cause", COLUMN_TYPE.TEXT),
      col("externalSourceId", "External ID", COLUMN_TYPE.TEXT, { required: true }),
    ],
  },

  // ── IS10: Cost Input ─────────────────────────────────────────────────
  IS10: {
    id: "IS10",
    name: "Cost Input",
    grain: "One row per cost item/category/scope/period",
    frequency: "month",
    targetCollection: "costInputs",
    columns: [
      col("period", "Period", COLUMN_TYPE.TEXT, { required: true, hint: "e.g. 2026-04" }),
      col("scopeKey", "Scope key", COLUMN_TYPE.TEXT, { required: true }),
      col("costCategory", "Cost category", COLUMN_TYPE.ENUM, { required: true, options: ["labour", "fuel", "maintenance", "rental", "consumables", "overhead", "other"] }),
      col("amount", "Amount", COLUMN_TYPE.NUMBER, { required: true, unit: "ZAR" }),
      col("currency", "Currency", COLUMN_TYPE.ENUM, { required: true, options: ["ZAR", "USD", "EUR", "GBP"] }),
      col("source", "Source", COLUMN_TYPE.TEXT, { required: true }),
      col("assetId", "Asset", COLUMN_TYPE.REFERENCE),
      col("activityId", "Activity", COLUMN_TYPE.REFERENCE),
      col("supplier", "Supplier", COLUMN_TYPE.TEXT),
      col("directIndirect", "Direct / indirect", COLUMN_TYPE.ENUM, { options: ["direct", "indirect"] }),
      col("allocationBasis", "Allocation basis", COLUMN_TYPE.TEXT),
      col("invoiceReference", "Invoice reference", COLUMN_TYPE.TEXT),
      col("ledgerReference", "Ledger reference", COLUMN_TYPE.TEXT),
      col("externalSourceId", "External ID", COLUMN_TYPE.TEXT, { required: true }),
    ],
  },

  // ── IS11: Issues and Actions ─────────────────────────────────────────
  IS11: {
    id: "IS11",
    name: "Issues and Actions",
    grain: "One row per exception/action",
    frequency: "event_or_week",
    targetCollection: "issuesActions",
    columns: [
      col("linkedObjectType", "Linked object type", COLUMN_TYPE.ENUM, { required: true, options: ["asset", "measurement", "kpi", "contract", "site", "action", "process"] }),
      col("linkedObjectId", "Linked object ID", COLUMN_TYPE.TEXT, { required: true }),
      col("issueType", "Issue type", COLUMN_TYPE.ENUM, { required: true, options: ["exception", "risk", "improvement", "audit_finding", "safety"] }),
      col("title", "Title", COLUMN_TYPE.TEXT, { required: true }),
      col("description", "Description", COLUMN_TYPE.TEXT),
      col("owner", "Owner", COLUMN_TYPE.TEXT, { required: true }),
      col("dueDate", "Due date", COLUMN_TYPE.DATE, { required: true }),
      col("state", "State", COLUMN_TYPE.ENUM, { required: true, options: ["open", "assigned", "in_progress", "awaiting_evidence", "closed", "reopened"] }),
      col("rootCause", "Root cause", COLUMN_TYPE.TEXT),
      col("priority", "Priority", COLUMN_TYPE.ENUM, { options: ["critical", "high", "medium", "low"] }),
      col("evidenceUrl", "Evidence URL", COLUMN_TYPE.TEXT),
      col("completionResult", "Completion result", COLUMN_TYPE.TEXT),
      col("verification", "Verification", COLUMN_TYPE.ENUM, { options: ["pending", "verified", "rejected"] }),
      col("externalSourceId", "External ID", COLUMN_TYPE.TEXT, { required: true }),
    ],
  },
});

// ── Lookup helpers ───────────────────────────────────────────────────────
export const getSheetDefinition = (sheetId) => INPUT_SHEETS[sheetId] || null;

export const getSheetColumns = (sheetId) => INPUT_SHEETS[sheetId]?.columns || [];

export const getRequiredColumns = (sheetId) =>
  getSheetColumns(sheetId).filter((c) => c.required);

export const getCanonicalField = (sheetId, columnId) => {
  const sheet = INPUT_SHEETS[sheetId];
  if (!sheet) return null;
  const column = sheet.columns.find((c) => c.id === columnId);
  return column?.canonicalField || columnId;
};

// ── Versioning (Brief Section 8.5.4) ─────────────────────────────────────
export const INPUT_SHEET_CONTRACT_VERSION = "1.0.0";

export const describeSheetContract = () => ({
  version: INPUT_SHEET_CONTRACT_VERSION,
  sheets: Object.values(INPUT_SHEETS).map((s) => ({
    id: s.id,
    name: s.name,
    grain: s.grain,
    frequency: s.frequency,
    requiredColumns: s.columns.filter((c) => c.required).map((c) => c.id),
    optionalColumns: s.columns.filter((c) => !c.required).map((c) => c.id),
  })),
});

export default {
  COLUMN_TYPE,
  SHEET_IDS,
  INPUT_SHEETS,
  INPUT_SHEET_CONTRACT_VERSION,
  getSheetDefinition,
  getSheetColumns,
  getRequiredColumns,
  getCanonicalField,
  describeSheetContract,
};