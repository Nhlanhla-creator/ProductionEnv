/**
 * funding/models/canonicalFields.js
 *
 * The registry of profile field paths the funding application can reference.
 * Every field is defined here once; the wizard uses this registry to build
 * the prefill (Brief §2).
 *
 * Corrections write BACK to the profile — never to an application-only copy.
 * That's why every entry points at a canonical profile path.
 */

export const FIELD_GROUPS = Object.freeze({
  ENTITY: "entityOverview",
  OWNERSHIP: "ownershipManagement",
  CONTACT: "contactDetails",
  LEGAL: "legalCompliance",
  OPERATIONS: "operationsOverview",
  FINANCIAL: "financialOverview",
  PRODUCTS: "productsServices",
  GOVERNANCE: "governance",
});

const F = (path, label, group, opts = {}) => ({
  path,
  label,
  group,
  type: opts.type || "text",
  unit: opts.unit || null,
  period: opts.period || null,
});

export const CANONICAL_FIELDS = [
  // ── Entity ───────────────────────────────────────────────────────
  F("entityOverview.registeredName", "Registered name", FIELD_GROUPS.ENTITY, { type: "text" }),
  F("entityOverview.tradingName", "Trading name", FIELD_GROUPS.ENTITY),
  F("entityOverview.registrationNumber", "Registration number", FIELD_GROUPS.ENTITY),
  F("entityOverview.entityType", "Entity type", FIELD_GROUPS.ENTITY),
  F("entityOverview.legalStructure", "Legal structure", FIELD_GROUPS.ENTITY),
  F("entityOverview.entitySize", "Entity size", FIELD_GROUPS.ENTITY),
  F("entityOverview.yearsInOperation", "Years in operation", FIELD_GROUPS.ENTITY, { type: "number" }),
  F("entityOverview.operationStage", "Operation stage", FIELD_GROUPS.ENTITY),
  F("entityOverview.economicSectors", "Economic sectors", FIELD_GROUPS.ENTITY, { type: "list" }),
  F("entityOverview.operatingCountries", "Countries of operation", FIELD_GROUPS.ENTITY, { type: "list" }),
  F("entityOverview.operatingProvinces", "Provinces (SA)", FIELD_GROUPS.ENTITY, { type: "list" }),
  F("entityOverview.businessDescription", "Business description", FIELD_GROUPS.ENTITY, { type: "long_text" }),

  // ── Ownership ────────────────────────────────────────────────────
  F("ownershipManagement.shareholders", "Shareholders", FIELD_GROUPS.OWNERSHIP, { type: "table" }),
  F("ownershipManagement.directors", "Directors", FIELD_GROUPS.OWNERSHIP, { type: "table" }),
  F("ownershipManagement.totalAuthorisedShares", "Total authorised shares", FIELD_GROUPS.OWNERSHIP, { type: "number" }),
  F("ownershipManagement.totalIssuedShares", "Total issued shares", FIELD_GROUPS.OWNERSHIP, { type: "number" }),
  F("ownershipManagement.businessLeadership", "Business leadership", FIELD_GROUPS.OWNERSHIP),

  // ── Contact ──────────────────────────────────────────────────────
  F("contactDetails.contactName", "Primary contact", FIELD_GROUPS.CONTACT),
  F("contactDetails.position", "Position", FIELD_GROUPS.CONTACT),
  F("contactDetails.email", "Email", FIELD_GROUPS.CONTACT, { type: "email" }),
  F("contactDetails.mobile", "Mobile", FIELD_GROUPS.CONTACT, { type: "phone" }),
  F("contactDetails.businessPhone", "Business phone", FIELD_GROUPS.CONTACT, { type: "phone" }),
  F("contactDetails.physicalAddress", "Physical address", FIELD_GROUPS.CONTACT, { type: "long_text" }),

  // ── Legal ────────────────────────────────────────────────────────
  F("legalCompliance.taxNumber", "Tax number", FIELD_GROUPS.LEGAL),
  F("legalCompliance.vatNumber", "VAT number", FIELD_GROUPS.LEGAL),
  F("legalCompliance.payeNumber", "PAYE number", FIELD_GROUPS.LEGAL),
  F("legalCompliance.uifNumber", "UIF number", FIELD_GROUPS.LEGAL),
  F("legalCompliance.coidaNumber", "COIDA number", FIELD_GROUPS.LEGAL),
  F("legalCompliance.bbbeeLevel", "B-BBEE level", FIELD_GROUPS.LEGAL),
  F("legalCompliance.pendingLegalJudgments", "Pending legal judgments", FIELD_GROUPS.LEGAL, { type: "boolean" }),

  // ── Operations ───────────────────────────────────────────────────
  F("operationsOverview.multipleSuppliers", "Multiple key suppliers", FIELD_GROUPS.OPERATIONS, { type: "boolean" }),
  F("operationsOverview.contingencyPlan", "Documented contingency plan", FIELD_GROUPS.OPERATIONS, { type: "boolean" }),
  F("operationsOverview.trackPerformanceMetrics", "Tracks performance metrics", FIELD_GROUPS.OPERATIONS, { type: "boolean" }),
  F("operationsOverview.threeSuccessfulDeliveries", "3+ successful deliveries", FIELD_GROUPS.OPERATIONS, { type: "boolean" }),
  F("operationsOverview.hasCapacityToIncrease", "Capacity to increase output", FIELD_GROUPS.OPERATIONS, { type: "boolean" }),
  F("operationsOverview.hasFormalProcedures", "Formal safety / compliance procedures", FIELD_GROUPS.OPERATIONS, { type: "boolean" }),
  F("operationsOverview.hasMajorIncidents", "Major incidents in past 24 months", FIELD_GROUPS.OPERATIONS, { type: "boolean" }),
  F("operationsOverview.operationalChallenges", "Operational challenges", FIELD_GROUPS.OPERATIONS, { type: "long_text" }),

  // ── Financial ────────────────────────────────────────────────────
  F("financialOverview.incomeCurrency", "Reporting currency", FIELD_GROUPS.FINANCIAL),
  F("financialOverview.incomeTurnoverCurrent", "Revenue — current year", FIELD_GROUPS.FINANCIAL, { type: "currency", period: "current_year" }),
  F("financialOverview.incomeTurnoverPrevious", "Revenue — previous year", FIELD_GROUPS.FINANCIAL, { type: "currency", period: "previous_year" }),
  F("financialOverview.incomeCOGSCurrent", "COGS — current year", FIELD_GROUPS.FINANCIAL, { type: "currency", period: "current_year" }),
  F("financialOverview.incomeCOGSPrevious", "COGS — previous year", FIELD_GROUPS.FINANCIAL, { type: "currency", period: "previous_year" }),
  F("financialOverview.incomeGrossProfitCurrent", "Gross profit — current year", FIELD_GROUPS.FINANCIAL, { type: "currency", period: "current_year" }),
  F("financialOverview.incomeGrossProfitPrevious", "Gross profit — previous year", FIELD_GROUPS.FINANCIAL, { type: "currency", period: "previous_year" }),
  F("financialOverview.incomeOperatingProfitCurrent", "Operating profit — current year", FIELD_GROUPS.FINANCIAL, { type: "currency", period: "current_year" }),
  F("financialOverview.incomeOperatingProfitPrevious", "Operating profit — previous year", FIELD_GROUPS.FINANCIAL, { type: "currency", period: "previous_year" }),
  F("financialOverview.incomeNetProfitCurrent", "Net profit — current year", FIELD_GROUPS.FINANCIAL, { type: "currency", period: "current_year" }),
  F("financialOverview.incomeNetProfitPrevious", "Net profit — previous year", FIELD_GROUPS.FINANCIAL, { type: "currency", period: "previous_year" }),
  F("financialOverview.balanceTotalAssetsCurrent", "Total assets — current", FIELD_GROUPS.FINANCIAL, { type: "currency", period: "current_year" }),
  F("financialOverview.balanceTotalAssetsPrevious", "Total assets — previous", FIELD_GROUPS.FINANCIAL, { type: "currency", period: "previous_year" }),
  F("financialOverview.balanceCurrentLiabilitiesCurrent", "Current liabilities — current", FIELD_GROUPS.FINANCIAL, { type: "currency", period: "current_year" }),
  F("financialOverview.balanceLongTermLiabilitiesCurrent", "Long-term liabilities — current", FIELD_GROUPS.FINANCIAL, { type: "currency", period: "current_year" }),
  F("financialOverview.balanceEquityCurrent", "Equity — current", FIELD_GROUPS.FINANCIAL, { type: "currency", period: "current_year" }),
  F("financialOverview.booksUpToDate", "Books up to date", FIELD_GROUPS.FINANCIAL),
  F("financialOverview.hasManagementAccounts", "Management accounts status", FIELD_GROUPS.FINANCIAL),
  F("financialOverview.hasAccountingSoftware", "Accounting software", FIELD_GROUPS.FINANCIAL),
  F("financialOverview.isInsured", "Insured", FIELD_GROUPS.FINANCIAL, { type: "boolean" }),
  F("financialOverview.hasFinancialStatements", "Financial statements available", FIELD_GROUPS.FINANCIAL),
  F("financialOverview.financialsAudited", "Financials audited", FIELD_GROUPS.FINANCIAL),
  F("financialOverview.hasOverdraft", "Has overdraft", FIELD_GROUPS.FINANCIAL, { type: "boolean" }),
  F("financialOverview.directorsSurety", "Directors surety", FIELD_GROUPS.FINANCIAL, { type: "boolean" }),
  F("financialOverview.debtorsCeded", "Debtors ceded", FIELD_GROUPS.FINANCIAL, { type: "boolean" }),
  F("financialOverview.salesTerms", "Payment terms to clients", FIELD_GROUPS.FINANCIAL),
  F("financialOverview.financialYearEnd", "Financial year end", FIELD_GROUPS.FINANCIAL),

  // ── Products & services ──────────────────────────────────────────
  F("productsServices.offeringType", "Offering type", FIELD_GROUPS.PRODUCTS),
  F("productsServices.offerings", "Offerings", FIELD_GROUPS.PRODUCTS, { type: "list" }),
  F("productsServices.keyClients", "Key clients", FIELD_GROUPS.PRODUCTS, { type: "table" }),
  F("productsServices.targetMarket", "Target market", FIELD_GROUPS.PRODUCTS, { type: "long_text" }),

  // ── Governance ───────────────────────────────────────────────────
  F("governance.governanceChecklist", "Governance checklist", FIELD_GROUPS.GOVERNANCE, { type: "map" }),
  F("governance.riskManagement", "Risk management", FIELD_GROUPS.GOVERNANCE),
  F("governance.transparencyReporting", "Transparency & reporting", FIELD_GROUPS.GOVERNANCE),
];

// ── Lookup index ──────────────────────────────────────────────────────────
export const FIELD_BY_PATH = Object.fromEntries(CANONICAL_FIELDS.map((f) => [f.path, f]));

export const fieldsByGroup = (group) => CANONICAL_FIELDS.filter((f) => f.group === group);

export const getFieldDefinition = (path) => FIELD_BY_PATH[path] || null;

/**
 * Prefill resolver — reads a canonical field from the profile and returns
 * the shape the wizard expects (Brief §2):
 *
 *   { path, label, value, group, sourceRecord, lastUpdated, verificationState }
 */
export const prefillField = (profile, path) => {
  const def = FIELD_BY_PATH[path];
  if (!def) return null;
  const value = getNested(profile, path);
  return {
    path,
    label: def.label,
    group: def.group,
    type: def.type,
    unit: def.unit,
    period: def.period,
    value: value !== undefined ? value : null,
    sourceRecord: "universalProfiles/" + (profile?.id || profile?.uid || ""),
    lastUpdated: profile?.lastEditedAt || profile?.updatedAt || null,
    verificationState: getVerificationState(profile, path),
  };
};

const getNested = (obj, path) => {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
};

const getVerificationState = (profile, path) => {
  // Simple lookup against the profile's verification map if it exists.
  // Falls back to "self_declared" (Brief §3 hierarchy of truth).
  const verification = profile?.verification || {};
  const key = path.split(".").pop();
  const entry = verification[key];
  if (!entry) return "self_declared";
  return entry.status || "self_declared"; // "verified" | "checked" | "uploaded" | "self_declared" | "unknown"
};

export default {
  FIELD_GROUPS,
  CANONICAL_FIELDS,
  FIELD_BY_PATH,
  fieldsByGroup,
  getFieldDefinition,
  prefillField,
};