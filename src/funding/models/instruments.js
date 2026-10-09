/**
 * funding/models/instruments.js
 *
 * Canonical instrument families from Brief §3.1. Each instrument declares:
 *   - id (immutable, used as foreign key)
 *   - family (the top-level grouping)
 *   - label (human-readable)
 *   - incrementalCapture (fields beyond the generic application)
 *   - additionalEvidence (files to request when absent)
 *   - validation (checks applied before submission)
 *
 * The catalogue is the default. Funders can only add programme/opportunity
 * rules on top — they cannot redefine an instrument.
 */

export const INSTRUMENT_FAMILIES = Object.freeze({
  WORKING_CAPITAL:    "working_capital",
  ASSET:              "asset",
  TERM_DEBT:          "term_debt",
  BRIDGE:             "bridge",
  TRADE:              "trade",
  EQUITY:             "equity",
  STRATEGIC:          "strategic",
  GRANT:              "grant",
  CONVERTIBLE:        "convertible",
  REVENUE_BASED:      "revenue_based",
  BLENDED:            "blended",
  TRANSACTION:        "transaction",
});

export const INSTRUMENTS = Object.freeze({
  PO_FINANCE: {
    id: "po_finance",
    family: INSTRUMENT_FAMILIES.WORKING_CAPITAL,
    label: "Purchase order finance",
    description: "Short-term funding against a confirmed order you need to fulfil.",
    incrementalCapture: [
      { field: "buyerName", label: "Buyer name", type: "text", required: true },
      { field: "orderValue", label: "Order value", type: "currency", required: true },
      { field: "orderReference", label: "PO / order reference", type: "text", required: true },
      { field: "costToFulfil", label: "Cost to fulfil the order", type: "currency", required: true },
      { field: "expectedMargin", label: "Expected margin", type: "percent", required: true },
      { field: "deliveryDate", label: "Delivery date", type: "date", required: true },
      { field: "assignmentStatus", label: "Assignment status", type: "enum", options: ["unassigned", "partially assigned", "fully assigned"], required: true },
    ],
    additionalEvidence: [
      { type: "signed_purchase_order", label: "Signed PO / call-off", required: true, accepts: [".pdf"] },
      { type: "supplier_quote", label: "Supplier quote or cost sheet", required: true },
      { type: "delivery_schedule", label: "Delivery / fulfilment schedule", required: false },
    ],
    validation: [
      "Buyer and order must match the provided PO reference.",
      "Check cancellation clauses and prior cession against order.",
      "Cost plus margin must reconcile to order value.",
      "Capacity check against current assignments.",
    ],
  },

  CONTRACT_PROJECT_FINANCE: {
    id: "contract_project_finance",
    family: INSTRUMENT_FAMILIES.WORKING_CAPITAL,
    label: "Contract or project finance",
    description: "Funding tied to a signed contract or project, covering mobilisation and delivery.",
    incrementalCapture: [
      { field: "payerName", label: "Payer / client", type: "text", required: true },
      { field: "contractValue", label: "Contract value", type: "currency", required: true },
      { field: "mobilisationNeed", label: "Mobilisation capital needed", type: "currency", required: true },
      { field: "milestones", label: "Payment milestones", type: "milestone_list", required: true },
      { field: "performanceObligations", label: "Performance obligations", type: "text", required: false },
    ],
    additionalEvidence: [
      { type: "executed_contract", label: "Executed contract", required: true },
      { type: "project_budget", label: "Project budget", required: true },
      { type: "security_guarantee", label: "Security or guarantee", required: false },
    ],
    validation: [
      "Counterparty must be verified.",
      "Check contract for assignment restrictions.",
      "Obligations must be documented.",
      "Proceeds timing must be realistic against milestones.",
    ],
  },

  INVOICE_FINANCE: {
    id: "invoice_finance",
    family: INSTRUMENT_FAMILIES.WORKING_CAPITAL,
    label: "Invoice finance / factoring",
    description: "Advance against unpaid invoices, typically at a discount.",
    incrementalCapture: [
      { field: "debtorName", label: "Debtor name", type: "text", required: true },
      { field: "invoiceNumber", label: "Invoice number", type: "text", required: true },
      { field: "invoiceValue", label: "Invoice value", type: "currency", required: true },
      { field: "invoiceDate", label: "Invoice date", type: "date", required: true },
      { field: "dueDate", label: "Invoice due date", type: "date", required: true },
      { field: "acceptanceStatus", label: "Acceptance status", type: "enum", options: ["accepted", "partially accepted", "disputed", "pending"], required: true },
      { field: "priorCession", label: "Is the invoice already ceded?", type: "boolean", required: true },
    ],
    additionalEvidence: [
      { type: "invoice_copy", label: "Invoice copy", required: true },
      { type: "proof_of_delivery", label: "Proof of delivery or acceptance", required: true },
      { type: "debtor_terms", label: "Payment terms", required: true },
    ],
    validation: [
      "Invoice authenticity check.",
      "Ageing and dilution analysis.",
      "Debtor credit check.",
      "Duplicate financing check.",
    ],
  },

  ASSET_LEASE_VENDOR: {
    id: "asset_lease_vendor",
    family: INSTRUMENT_FAMILIES.ASSET,
    label: "Asset, lease, or vendor finance",
    description: "Funding to acquire a specific physical asset, often via lease or vendor arrangement.",
    incrementalCapture: [
      { field: "assetCategory", label: "Asset category", type: "text", required: true },
      { field: "assetMakeModel", label: "Make and model", type: "text", required: true },
      { field: "assetPrice", label: "Purchase price", type: "currency", required: true },
      { field: "supplierName", label: "Supplier / vendor", type: "text", required: true },
      { field: "deposit", label: "Deposit offered", type: "currency", required: false },
      { field: "intendedUse", label: "Intended use", type: "text", required: true },
      { field: "expectedBenefit", label: "Expected benefit", type: "text", required: true },
    ],
    additionalEvidence: [
      { type: "asset_quote", label: "Asset quote / specification sheet", required: true },
      { type: "asset_condition", label: "Condition report (if used)", required: false },
      { type: "deposit_proof", label: "Deposit proof (if claimed)", required: false },
    ],
    validation: [
      "Supplier and asset must be verifiable.",
      "Lien and ownership check on used assets.",
      "Residual value assessment.",
      "Affordability against expected benefit.",
    ],
  },

  TERM_LOAN_OVERDRAFT: {
    id: "term_loan_overdraft",
    family: INSTRUMENT_FAMILIES.TERM_DEBT,
    label: "Term loan, overdraft, or revolver",
    description: "Standard debt facility — fixed tenor with agreed repayment schedule.",
    incrementalCapture: [
      { field: "tenorMonths", label: "Tenor (months)", type: "number", required: true },
      { field: "facilityLimit", label: "Facility limit", type: "currency", required: true },
      { field: "drawPattern", label: "Expected draw pattern", type: "text", required: false },
      { field: "repaymentSource", label: "Repayment source", type: "text", required: true },
      { field: "facilityObligations", label: "Facility obligations", type: "text", required: false },
    ],
    additionalEvidence: [
      { type: "bank_statements", label: "Current bank statements", required: true },
      { type: "debt_schedule", label: "Debt schedule", required: true },
      { type: "cashflow_forecast", label: "Cash-flow forecast", required: true },
    ],
    validation: [
      "Debt service coverage and liquidity check.",
      "Maturity wall against existing facilities.",
      "Covenant compatibility.",
      "Security requirement if specified.",
    ],
  },

  BRIDGE: {
    id: "bridge",
    family: INSTRUMENT_FAMILIES.BRIDGE,
    label: "Bridge finance",
    description: "Short-term funding against an expected future receipt.",
    incrementalCapture: [
      { field: "repaymentEvent", label: "Dated repayment event", type: "text", required: true },
      { field: "expectedReceipt", label: "Expected receipt amount", type: "currency", required: true },
      { field: "expectedReceiptDate", label: "Expected receipt date", type: "date", required: true },
      { field: "delayPlan", label: "Contingency if delayed", type: "text", required: true },
    ],
    additionalEvidence: [
      { type: "award_evidence", label: "Award, sale, or receivable evidence", required: true },
      { type: "payment_milestone", label: "Payment milestone documentation", required: true },
    ],
    validation: [
      "Payer creditworthiness check.",
      "Expected date realism.",
      "Delay scenario stress test.",
      "Refinancing exposure assessment.",
    ],
  },

  TRADE_IMPORT_EXPORT: {
    id: "trade_import_export",
    family: INSTRUMENT_FAMILIES.TRADE,
    label: "Trade / import / export finance",
    description: "Funding across borders — letters of credit, guarantees, shipment finance.",
    incrementalCapture: [
      { field: "counterparties", label: "Counterparties", type: "text", required: true },
      { field: "jurisdiction", label: "Jurisdiction(s)", type: "text", required: true },
      { field: "currency", label: "Currency of trade", type: "text", required: true },
      { field: "shipmentTerms", label: "Shipment terms", type: "text", required: true },
      { field: "paymentTerms", label: "Payment terms", type: "text", required: true },
    ],
    additionalEvidence: [
      { type: "trade_contract", label: "Trade contract", required: true },
      { type: "lc_guarantee", label: "Letter of credit or guarantee", required: false },
      { type: "shipping_customs", label: "Shipping and customs evidence", required: false },
    ],
    validation: [
      "Counterparty verification.",
      "FX exposure assessment.",
      "Shipment and delivery tracking.",
      "Sanctions / AML check via authorised process.",
    ],
  },

  EQUITY_ROUND: {
    id: "equity_round",
    family: INSTRUMENT_FAMILIES.EQUITY,
    label: "Angel, venture, or growth equity",
    description: "Equity investment — ownership exchanged for capital.",
    incrementalCapture: [
      { field: "roundType", label: "Round type", type: "enum", options: ["pre_seed", "seed", "series_a", "series_b", "series_c_plus", "growth"], required: true },
      { field: "useOfFunds", label: "Use of funds", type: "text", required: true },
      { field: "runwayMonths", label: "Target runway (months)", type: "number", required: true },
      { field: "traction", label: "Current traction", type: "text", required: true },
      { field: "valuation", label: "Valuation (or unsure)", type: "text", required: false },
      { field: "dilution", label: "Expected dilution %", type: "number", required: false },
      { field: "milestones", label: "Milestones to reach", type: "text", required: true },
    ],
    additionalEvidence: [
      { type: "pitch_deck", label: "Pitch deck", required: true },
      { type: "cap_table", label: "Cap table", required: true },
      { type: "financial_model", label: "Financial model", required: true },
      { type: "shareholder_records", label: "Shareholder records", required: false },
    ],
    validation: [
      "Ownership and dilution maths.",
      "Shareholder rights review.",
      "Valuation remains a judgment for the investor.",
    ],
  },

  STRATEGIC_EQUITY: {
    id: "strategic_equity",
    family: INSTRUMENT_FAMILIES.STRATEGIC,
    label: "Strategic equity / PE / buyout",
    description: "Control-transaction equity — often with a strategic partner or PE fund.",
    incrementalCapture: [
      { field: "controlStructure", label: "Control structure", type: "text", required: true },
      { field: "targetSeller", label: "Target / seller", type: "text", required: true },
      { field: "strategicRationale", label: "Strategic rationale", type: "text", required: true },
      { field: "proceedsRecipient", label: "Proceeds recipient", type: "text", required: true },
    ],
    additionalEvidence: [
      { type: "target_accounts", label: "Target accounts", required: true },
      { type: "transaction_records", label: "Transaction records", required: true },
      { type: "authority_documentation", label: "Authority to transact", required: true },
    ],
    validation: [
      "Structure and ownership check.",
      "Transaction authority review.",
      "Diligence deferred to funder.",
    ],
  },

  GRANT_INCENTIVE: {
    id: "grant_incentive",
    family: INSTRUMENT_FAMILIES.GRANT,
    label: "Grant or incentive",
    description: "Non-repayable funding — usually with eligibility conditions and reporting obligations.",
    incrementalCapture: [
      { field: "eligibleCosts", label: "Eligible costs", type: "cost_list", required: true },
      { field: "coFunding", label: "Co-funding committed", type: "currency", required: false },
      { field: "milestones", label: "Programme milestones", type: "milestone_list", required: true },
      { field: "reportingObligations", label: "Reporting obligations", type: "text", required: true },
      { field: "outcomes", label: "Expected outcomes", type: "text", required: true },
    ],
    additionalEvidence: [
      { type: "programme_proof", label: "Programme eligibility proof", required: true },
      { type: "proposal", label: "Project proposal", required: true },
      { type: "project_budget", label: "Project budget", required: true },
      { type: "co_funding_confirmation", label: "Co-funding confirmation", required: false },
    ],
    validation: [
      "Eligibility screening.",
      "Issuer verification.",
      "Excluded costs check.",
      "Double-funding check across programmes.",
    ],
  },

  CONVERTIBLE_SAFE: {
    id: "convertible_safe",
    family: INSTRUMENT_FAMILIES.CONVERTIBLE,
    label: "Convertible note, SAFE, or preference shares",
    description: "Instrument that converts to equity under defined triggers.",
    incrementalCapture: [
      { field: "trigger", label: "Conversion trigger", type: "text", required: true },
      { field: "cap", label: "Valuation cap", type: "currency", required: false },
      { field: "discount", label: "Discount %", type: "number", required: false },
      { field: "maturity", label: "Maturity date", type: "date", required: false },
      { field: "interest", label: "Interest rate %", type: "number", required: false },
      { field: "priorRights", label: "Prior rights or privileges", type: "text", required: false },
    ],
    additionalEvidence: [
      { type: "term_sheet", label: "Term sheet", required: true },
      { type: "cap_table", label: "Cap table", required: true },
      { type: "existing_rights", label: "Existing rights documentation", required: false },
    ],
    validation: [
      "Conversion scenarios modelling.",
      "Dilution impacts.",
      "Legal review deferred to funder.",
    ],
  },

  REVENUE_BASED: {
    id: "revenue_based",
    family: INSTRUMENT_FAMILIES.REVENUE_BASED,
    label: "Revenue-based / royalty / mezzanine",
    description: "Funding repaid as a share of future revenue or with a subordinate debt structure.",
    incrementalCapture: [
      { field: "revenueBase", label: "Revenue base", type: "currency", required: true },
      { field: "revenueShare", label: "Revenue share %", type: "number", required: true },
      { field: "cap", label: "Cap or ceiling", type: "currency", required: false },
      { field: "waterfall", label: "Waterfall structure", type: "text", required: false },
      { field: "seniorObligations", label: "Senior obligations", type: "text", required: false },
    ],
    additionalEvidence: [
      { type: "revenue_history", label: "Revenue history", required: true },
      { type: "forecast", label: "Forecast", required: true },
      { type: "existing_facilities", label: "Existing facilities list", required: true },
    ],
    validation: [
      "Downside cash-flow test.",
      "Ranking against senior debt.",
      "Covenant compatibility.",
    ],
  },

  BLENDED: {
    id: "blended",
    family: INSTRUMENT_FAMILIES.BLENDED,
    label: "Blended finance",
    description: "Multiple instruments combined (e.g. grant + debt + equity).",
    incrementalCapture: [
      { field: "components", label: "Components", type: "component_list", required: true },
      { field: "providers", label: "Providers per component", type: "text", required: true },
      { field: "sequencing", label: "Draw sequencing", type: "text", required: true },
    ],
    additionalEvidence: [
      { type: "component_evidence", label: "Each component's evidence", required: true },
    ],
    validation: [
      "No double-count across components.",
      "Aggregate affordability.",
      "Separate component scores.",
    ],
  },

  ACQUISITION_SECONDARY: {
    id: "acquisition_secondary",
    family: INSTRUMENT_FAMILIES.TRANSACTION,
    label: "Acquisition / infrastructure / secondary sale",
    description: "Transaction capital for a target purchase, project, or secondary stake.",
    incrementalCapture: [
      { field: "sponsors", label: "Sponsors", type: "text", required: true },
      { field: "targetEconomics", label: "Target / project economics", type: "text", required: true },
      { field: "seller", label: "Seller", type: "text", required: true },
      { field: "recipient", label: "Proceeds recipient", type: "text", required: true },
      { field: "instrumentMix", label: "Instrument mix", type: "text", required: true },
    ],
    additionalEvidence: [
      { type: "transaction_documents", label: "Transaction documents", required: true },
      { type: "project_documents", label: "Project documents", required: false },
    ],
    validation: [
      "Apply underlying debt/equity/grant rules per component.",
      "Share sale is not automatically SME operating capital.",
    ],
  },
});

// ── Convenience helpers ───────────────────────────────────────────────────

export const getInstrument = (id) => INSTRUMENTS[id] || null;

export const listInstrumentsByFamily = (family) =>
  Object.values(INSTRUMENTS).filter((i) => i.family === family);

export const listAllInstruments = () => Object.values(INSTRUMENTS);

export const getInstrumentLabel = (id) => INSTRUMENTS[id]?.label || id;

/**
 * Instrument applicability — used by the score service. If a route is
 * selected and its input requirements aren't met, the score is "Not
 * assessed" rather than zero (Brief §6).
 */
export const hasMinimumInputs = (instrumentId, request) => {
  const instrument = INSTRUMENTS[instrumentId];
  if (!instrument) return { ok: false, missing: ["Unknown instrument"] };
  const missing = instrument.incrementalCapture
    .filter((f) => f.required)
    .filter((f) => {
      const v = request?.[f.field];
      return v === undefined || v === null || v === "";
    })
    .map((f) => f.label);
  return { ok: missing.length === 0, missing };
};

export default INSTRUMENTS;