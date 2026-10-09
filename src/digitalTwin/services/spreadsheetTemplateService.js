/**
 * digitalTwin/services/spreadsheetTemplateService.js
 *
 * Context-bound spreadsheet template generation (Brief Section 8.5.4).
 *
 * Every downloaded template embeds:
 *   - template_version
 *   - taxonomy_version
 *   - tenant_id
 *   - context_id
 *   - generated_at
 *
 * Structure:
 *   README sheet      — version, sector pack, instructions
 *   LOOKUPS sheet     — canonical IDs and labels applicable to this context
 *   DATA sheet        — the editable grid with frozen headers
 *   EXAMPLE sheet     — 2–5 clearly marked example rows (excluded from import)
 *   CHANGELOG sheet   — column additions/removals between versions
 *
 * The importer rejects unsupported template_version with a migration
 * instruction rather than attempting a best-effort silent import.
 */

import * as XLSX from "xlsx";
import { INPUT_SHEETS, INPUT_SHEET_CONTRACT_VERSION } from "../models/inputSheets";
import { MINING_PACK_VERSION } from "../taxonomy/miningPack";
import { INDUSTRIAL_SUPPORT_PACK_VERSION } from "../taxonomy/industrialSupportPack";
import { optionsFor } from "./taxonomyService";

export const TEMPLATE_VERSION = "1.0.0";

// ── Template generation ──────────────────────────────────────────────────

/**
 * Build an XLSX workbook for a given sheet and context. Returns a Blob
 * ready for download, along with metadata for the caller to store on the
 * batch when the file is re-uploaded.
 */
export const generateTemplate = ({
  tenantId,
  sheetId,
  contextId = null,
  sectorPackKey = "mining",
  taxonomyVersion = null,
  prefillRows = [],
}) => {
  const sheet = INPUT_SHEETS[sheetId];
  if (!sheet) throw new Error(`Unknown sheet: ${sheetId}`);

  const wb = XLSX.utils.book_new();
  const meta = buildTemplateMeta({ tenantId, sheetId, contextId, sectorPackKey, taxonomyVersion });

  // 1. README
  const readmeRows = buildReadmeRows(sheet, meta);
  const readmeSheet = XLSX.utils.aoa_to_sheet(readmeRows);
  setColumnWidths(readmeSheet, [24, 90]);
  XLSX.utils.book_append_sheet(wb, readmeSheet, "README");

  // 2. LOOKUPS
  const lookups = buildLookups(sheet, sectorPackKey);
  const lookupsSheet = XLSX.utils.json_to_sheet(lookups);
  setColumnWidths(lookupsSheet, [24, 40, 40, 20]);
  XLSX.utils.book_append_sheet(wb, lookupsSheet, "LOOKUPS");

  // 3. DATA — headers frozen at the top
  const headers = sheet.columns.map((c) => c.id);
  const dataRows = [headers, ...prefillRows.map((r) => headers.map((h) => r[h] ?? ""))];
  const dataSheet = XLSX.utils.aoa_to_sheet(dataRows);
  setColumnWidths(dataSheet, sheet.columns.map(() => 18));
  freezeFirstRow(dataSheet);
  XLSX.utils.book_append_sheet(wb, dataSheet, "DATA");

  // 4. EXAMPLES — 2 rows, clearly marked
  const exampleRows = buildExampleRows(sheetId, headers);
  const exampleSheet = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
  setColumnWidths(exampleSheet, sheet.columns.map(() => 18));
  XLSX.utils.book_append_sheet(wb, exampleSheet, "EXAMPLES");

  // 5. CHANGELOG
  const changelogRows = [
    ["Version", "Date", "Added", "Removed", "Deprecated", "Migration note"],
    [TEMPLATE_VERSION, new Date().toISOString().slice(0, 10), "—", "—", "—", "Initial release."],
  ];
  const changelogSheet = XLSX.utils.aoa_to_sheet(changelogRows);
  setColumnWidths(changelogSheet, [12, 14, 30, 30, 30, 60]);
  XLSX.utils.book_append_sheet(wb, changelogSheet, "CHANGELOG");

  // Write out
  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  return {
    blob,
    fileName: `${sheetId}_${sanitise(contextId || tenantId)}_v${TEMPLATE_VERSION}.xlsx`,
    meta,
  };
};

/**
 * Convenience wrapper — triggers a browser download.
 */
export const downloadTemplate = (params) => {
  const { blob, fileName } = generateTemplate(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return fileName;
};

// ── Meta block (Section 8.5.4) ───────────────────────────────────────────
const buildTemplateMeta = ({ tenantId, sheetId, contextId, sectorPackKey, taxonomyVersion }) => ({
  templateVersion: TEMPLATE_VERSION,
  contractVersion: INPUT_SHEET_CONTRACT_VERSION,
  taxonomyVersion: taxonomyVersion || (sectorPackKey === "mining" ? MINING_PACK_VERSION : INDUSTRIAL_SUPPORT_PACK_VERSION),
  tenantId,
  contextId,
  sectorPackKey,
  sheetId,
  generatedAt: new Date().toISOString(),
});

// ── README rows ──────────────────────────────────────────────────────────
const buildReadmeRows = (sheet, meta) => [
  ["Template field", "Value"],
  ["Sheet ID",          sheet.id],
  ["Sheet name",        sheet.name],
  ["Grain",             sheet.grain],
  ["Frequency",         sheet.frequency],
  ["", ""],
  ["Template version",  meta.templateVersion],
  ["Contract version",  meta.contractVersion],
  ["Taxonomy version",  meta.taxonomyVersion],
  ["Tenant ID",         meta.tenantId],
  ["Context ID",        meta.contextId || "(not context-bound)"],
  ["Sector pack",       meta.sectorPackKey],
  ["Generated at",      meta.generatedAt],
  ["", ""],
  ["How to use this template", ""],
  ["1. Read this README sheet fully before editing.", ""],
  ["2. Use the LOOKUPS sheet to select canonical IDs — do not type free text.", ""],
  ["3. Enter your data on the DATA sheet. Do not rename, reorder or delete columns.", ""],
  ["4. The EXAMPLES sheet shows 2 sample rows for reference — do not edit it.", ""],
  ["5. Save the file as .xlsx and re-upload it in the Import Centre.", ""],
  ["6. The importer will dry-run your file first. No data is committed until you approve.", ""],
  ["", ""],
  ["Required columns", sheet.columns.filter((c) => c.required).map((c) => c.id).join(", ")],
  ["Optional columns", sheet.columns.filter((c) => !c.required).map((c) => c.id).join(", ")],
  ["", ""],
  ["Support", "If you have questions or need a column added, submit a taxonomy request or contact support."],
];

// ── LOOKUPS sheet ────────────────────────────────────────────────────────
/**
 * One row per canonical option the user can pick. Column headers:
 *   Column | Canonical ID | Display label | Notes
 */
const buildLookups = (sheet, sectorPackKey) => {
  const rows = [];

  // Equipment types (mining + support)
  const families = optionsFor({ packKey: sectorPackKey, domain: "equipment_family" });
  families.forEach((f) => {
    const types = optionsFor({ packKey: sectorPackKey, domain: "equipment_type", parentId: f.id });
    types.forEach((t) => {
      rows.push({ Column: "equipmentTypeId", "Canonical ID": t.id, "Display label": `${f.name} › ${t.name}`, Notes: "" });
    });
  });

  // Value chains and services
  const vcs = optionsFor({ packKey: sectorPackKey, domain: "value_chain" });
  vcs.forEach((vc) => {
    rows.push({ Column: "serviceId", "Canonical ID": vc.id, "Display label": vc.name, Notes: "Value chain stage" });
    const svcs = optionsFor({ packKey: sectorPackKey, domain: "service", parentId: vc.id });
    svcs.forEach((svc) => {
      rows.push({ Column: "serviceId", "Canonical ID": svc.id, "Display label": svc.name, Notes: "" });
      const acts = optionsFor({ packKey: sectorPackKey, domain: "activity", parentId: svc.id });
      acts.forEach((a) => {
        rows.push({ Column: "activityId", "Canonical ID": a.id, "Display label": a.name, Notes: "" });
      });
    });
  });

  // Commodities, methods, environments — where the sheet references them
  ["commodity", "method"].forEach((domain) => {
    optionsFor({ packKey: sectorPackKey, domain }).forEach((o) => {
      rows.push({ Column: domain, "Canonical ID": o.id, "Display label": o.name, Notes: "" });
    });
  });

  // Enum options per column
  sheet.columns.filter((c) => c.type === "enum" && c.options).forEach((c) => {
    c.options.forEach((o) => {
      rows.push({ Column: c.id, "Canonical ID": o, "Display label": o.replace(/_/g, " "), Notes: "enum" });
    });
  });

  return rows.length > 0 ? rows : [{ Column: "—", "Canonical ID": "—", "Display label": "No lookup values for this sheet.", Notes: "" }];
};

// ── Example rows ─────────────────────────────────────────────────────────
const EXAMPLE_DATA = {
  IS01: [
    { contextId: "", organisationId: "COMPANY_ID", siteId: "SITE_ID", contractId: "CONTRACT_ID", facilityId: "", timezone: "Africa/Johannesburg", effectiveFrom: "2026-01-01", effectiveTo: "", status: "active", client: "Northern Pit Mine", commodity: "commodity.iron_ore", productionMethod: "method.surface_open_pit", environment: "surface", processArea: "", acceptedOutputBoundary: "crusher_feed" },
  ],
  IS02: [
    { externalSourceId: "TRK-014", resourceKind: "asset", equipmentTypeId: "eqtype.rigid_haul_truck", name: "KMS TRK 014", internalNumber: "TRK-014", ownershipType: "owned", status: "available", effectiveFrom: "2026-01-01", make: "Caterpillar", model: "777E", serialNumber: "CAT777E000014", registration: "KMS-TRK-014", year: 2022, nameplateCapacity: 100, canonicalUnit: "tonnes", currentDeratedCapacity: 95, condition: "good", criticality: "high" },
  ],
  IS05: [
    { recordDate: "2026-04-15", shiftId: "day", assetId: "ASSET_ID_HERE", scheduledHours: 12, availableHours: 11.5, operatingHours: 10.2, excludedHours: 0, plannedDowntime: 0.5, standbyHours: 1.3, delayHours: 0, meterStart: 32100, meterEnd: 32110.2, operatorOrCrew: "B Crew", notes: "Two short pauses due to blasting", source: "manual", confidence: "manual_actual", externalSourceId: "TRK014-20260415-DAY" },
  ],
  IS06: [
    { recordDate: "2026-04-15", shiftId: "day", assetId: "ASSET_ID_HERE", groupId: "", activityId: "act.hauling", scopeKey: "", outputQuantity: 1020, outputUnit: "tonnes", acceptedOrIntermediate: "accepted", source: "manual", rejectsOrRework: 0, distance: 4200, trips: 10, cycles: 10, holes: 0, destination: "Primary crusher", notes: "", confidence: "manual_actual", externalSourceId: "TRK014-20260415-PROD" },
  ],
  IS07: [
    { assetId: "ASSET_ID_HERE", groupId: "", eventStart: "2026-04-15T09:15:00", eventEnd: "2026-04-15T12:45:00", categoryLevel1: "unplanned_mechanical", categoryLevel2: "Hydraulics", failureMode: "Hose failure", causeCode: "", responsibility: "internal", lostOperatingHours: 3.5, estimatedLostOutput: 420, workOrderId: "WO-2026-0415-014", actionTaken: "Hose replaced, system bled", evidenceUrl: "", confidence: "manual_actual", externalSourceId: "WO-2026-0415-014" },
  ],
  IS08: [
    { recordDate: "2026-04-15", assetId: "ASSET_ID_HERE", processAreaId: "", period: "2026-04-15", quantity: 350, unit: "litres", energyOrFuelType: "diesel", source: "bowser", meterStart: 0, meterEnd: 0, supplierRecord: "", distance: 4200, outputLinkage: "accepted_output", cost: 8500, evidenceUrl: "", confidence: "manual_actual", externalSourceId: "FUEL-TRK014-20260415" },
  ],
  IS09: [
    { assetId: "ASSET_ID_HERE", workOrderId: "WO-2026-0415-014", maintenanceType: "corrective", openedTimestamp: "2026-04-15T09:20:00", completedTimestamp: "2026-04-15T12:40:00", state: "completed", failureFlag: true, activeRepairHours: 2.8, labourHours: 3.5, partsCost: 4200, labourCost: 1200, totalCost: 5400, pmDueOnTime: false, cause: "Age-related hose failure", externalSourceId: "WO-2026-0415-014" },
  ],
  IS10: [
    { period: "2026-04", scopeKey: "contract:NORTH_LH", costCategory: "maintenance", amount: 45200, currency: "ZAR", source: "gl_import", assetId: "", activityId: "", supplier: "Northern Auto Parts", directIndirect: "direct", allocationBasis: "", invoiceReference: "INV-2026-0412", ledgerReference: "5000-1200", externalSourceId: "GL-2026-04-5000-1200" },
  ],
  IS11: [
    { linkedObjectType: "kpi", linkedObjectId: "kpi.physical_availability", issueType: "exception", title: "Availability below target on TRK 014", description: "Hydraulic hose failure caused 3.5h unplanned downtime.", owner: "maintenance_manager", dueDate: "2026-04-22", state: "open", rootCause: "Preventive inspection interval too long on hydraulics", priority: "high", evidenceUrl: "", completionResult: "", verification: "pending", externalSourceId: "ACT-2026-04-001" },
  ],
  IS03: [
    { externalSourceId: "ASG-TRK014-NORTHLH", resourceId: "ASSET_ID_HERE", siteId: "SITE_ID", contractId: "CONTRACT_ID", facilityId: "", processAreaId: "", serviceId: "svc.haul_ore", activityId: "act.hauling", groupId: "GROUP_ID", effectiveFrom: "2026-01-01", effectiveTo: "", state: "active", isPrimary: true, allocationBasis: "", allocationValue: "", allocationUnit: "", workPackageId: "" },
  ],
  IS04: [
    { externalSourceId: "TARGET-2026-04-KPI-AVAIL", scopeKey: "contract:NORTH_LH", periodType: "month", startDate: "2026-04-01", endDate: "2026-04-30", timezone: "Africa/Johannesburg", workingCalendar: "24_7", periodStatus: "open", shiftPattern: "2x12", scheduledDays: 30, scheduledHours: 720, targetKpiId: "kpi.physical_availability", targetValue: 90, targetUnit: "percent", warningValue: 87, criticalValue: 84, approver: "operations_manager" },
  ],
};

const buildExampleRows = (sheetId, headers) => {
  const rows = EXAMPLE_DATA[sheetId] || [];
  return rows.map((r) => headers.map((h) => r[h] ?? ""));
};

// ── Style helpers ────────────────────────────────────────────────────────
const setColumnWidths = (sheet, widths) => {
  sheet["!cols"] = widths.map((w) => ({ wch: w }));
};
const freezeFirstRow = (sheet) => {
  sheet["!freeze"] = { xSplit: 0, ySplit: 1 };
};

const sanitise = (s) => String(s || "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);

// ── Template parsing (from an uploaded file) ────────────────────────────
/**
 * Parse an uploaded XLSX back to raw rows, extracting the embedded meta
 * block from the README sheet. Throws if template_version is unsupported.
 */
export const parseUploadedTemplate = async (file) => {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });

  // 1. Read the README
  const readme = wb.Sheets["README"];
  if (!readme) throw new Error("README sheet not found — this does not look like a BIG digital twin template.");
  const readmeRows = XLSX.utils.sheet_to_json(readme, { header: 1 });
  const meta = {};
  readmeRows.forEach((r) => {
    if (!Array.isArray(r) || r.length < 2) return;
    const key = String(r[0] || "").trim();
    const value = String(r[1] || "").trim();
    if (key === "Template version")  meta.templateVersion = value;
    if (key === "Contract version")  meta.contractVersion = value;
    if (key === "Taxonomy version")  meta.taxonomyVersion = value;
    if (key === "Tenant ID")         meta.tenantId = value;
    if (key === "Context ID")        meta.contextId = value === "(not context-bound)" ? null : value;
    if (key === "Sector pack")       meta.sectorPackKey = value;
    if (key === "Sheet ID")          meta.sheetId = value;
  });

  if (meta.templateVersion !== TEMPLATE_VERSION) {
    throw new Error(`Unsupported template version "${meta.templateVersion}". This build expects "${TEMPLATE_VERSION}". Re-download the template and try again.`);
  }

  // 2. Read the DATA sheet
  const dataSheet = wb.Sheets["DATA"];
  if (!dataSheet) throw new Error("DATA sheet not found.");
  const dataRows = XLSX.utils.sheet_to_json(dataSheet, { defval: "" });

  return { meta, rows: dataRows };
};

export default {
  TEMPLATE_VERSION,
  generateTemplate,
  downloadTemplate,
  parseUploadedTemplate,
};