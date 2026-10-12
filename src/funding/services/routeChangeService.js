/**
 * funding/services/routeChangeService.js
 *
 * Handles route (instrument) changes on an SME's funding request.
 *
 * Brief §3, acceptance #6:
 *   "Generic request route changes from term debt to equity: old answers
 *    persist as inactive history, collateral/credit rows leave the score,
 *    the equity tasks and score recompute, and the bridge explains the
 *    change."
 *
 * Strategy:
 *   - Old answers move into request.inactiveAnswers, keyed by their old
 *     route context so a revert can restore them.
 *   - The active answers object is reset — only fields valid under the new
 *     route remain.
 *   - The service returns a list of affected rule contexts so the caller
 *     can show a diff and ask for re-confirmation.
 */

import { getInstrument } from "../models/instruments"
import { logEvent, AUDIT_ACTIONS } from "./auditService"

const ROUTE_SENSITIVE_FIELDS = {
  // fields that only make sense under certain instruments
  invoice_finance:         ["debtorName", "invoiceNumber", "invoiceValue", "invoiceDate", "dueDate", "acceptanceStatus", "priorCession"],
  po_finance:              ["buyerName", "orderValue", "orderReference", "costToFulfil", "expectedMargin", "deliveryDate", "assignmentStatus"],
  term_loan_overdraft:     ["tenorMonths", "facilityLimit", "drawPattern", "repaymentSource", "facilityObligations"],
  equity_round:            ["roundType", "useOfFunds", "runwayMonths", "traction", "valuation", "dilution", "milestones"],
  grant_incentive:         ["eligibleCosts", "coFunding", "milestones", "reportingObligations", "outcomes"],
  convertible_safe:        ["trigger", "cap", "discount", "maturity", "interest", "priorRights"],
  revenue_based:           ["revenueBase", "revenueShare", "cap", "waterfall", "seniorObligations"],
  bridge:                  ["repaymentEvent", "expectedReceipt", "expectedReceiptDate", "delayPlan"],
  contract_project_finance:["payerName", "contractValue", "mobilisationNeed", "milestones", "performanceObligations"],
  trade_import_export:     ["counterparties", "jurisdiction", "currency", "shipmentTerms", "paymentTerms"],
}

const fieldsFor = (instrumentId) => ROUTE_SENSITIVE_FIELDS[instrumentId] || []

/**
 * Compute what will change and produce a migration patch. Pure function.
 * Returns { patch, diff, affectedRuleContexts } — the caller decides
 * whether to apply.
 */
export const previewRouteChange = ({ request, newInstrumentId, newCategory }) => {
  const oldInstrumentId = request?.instrumentId || null
  const oldCategory = request?.instrumentCategory || null
  const oldFields = fieldsFor(oldInstrumentId)
  const newFields = fieldsFor(newInstrumentId)
  const overlap = oldFields.filter((f) => newFields.includes(f))
  const drop = oldFields.filter((f) => !newFields.includes(f))
  const add = newFields.filter((f) => !oldFields.includes(f))

  const oldAnswers = {
    readinessAnswers: request?.readinessAnswers || {},
    termsAnswers: request?.termsAnswers || {},
    readinessEvidence: request?.readinessEvidence || {},
    termsEvidence: request?.termsEvidence || {},
  }

  // Fields to deactivate: any key that belongs to a field only in the OLD route
  const inactiveReadiness = {}
  const inactiveTerms = {}
  for (const [k, v] of Object.entries(oldAnswers.readinessAnswers)) {
    if (drop.includes(k)) inactiveReadiness[k] = v
  }
  for (const [k, v] of Object.entries(oldAnswers.termsAnswers)) {
    if (drop.includes(k)) inactiveTerms[k] = v
  }

  // Build the inactive bucket keyed by the old context so a revert can
  // restore the answers intact.
  const inactiveBucket = {
    fromInstrumentId: oldInstrumentId,
    fromCategory: oldCategory,
    capturedAt: new Date().toISOString(),
    readinessAnswers: inactiveReadiness,
    termsAnswers: inactiveTerms,
    readinessEvidence: Object.fromEntries(
      Object.entries(oldAnswers.readinessEvidence).filter(([k]) => drop.includes(k))
    ),
    termsEvidence: Object.fromEntries(
      Object.entries(oldAnswers.termsEvidence).filter(([k]) => drop.includes(k))
    ),
  }

  // Active answers — strip the deactivated fields
  const nextReadiness = Object.fromEntries(
    Object.entries(oldAnswers.readinessAnswers).filter(([k]) => !drop.includes(k))
  )
  const nextTerms = Object.fromEntries(
    Object.entries(oldAnswers.termsAnswers).filter(([k]) => !drop.includes(k))
  )

  // Merge in any previously inactive answers that match the new route
  const priorInactive = request?.inactiveAnswers || {}
  for (const bucket of Object.values(priorInactive)) {
    if (bucket?.fromInstrumentId === newInstrumentId) {
      Object.assign(nextReadiness, bucket.readinessAnswers || {})
      Object.assign(nextTerms, bucket.termsAnswers || {})
    }
  }

  const patch = {
    instrumentId: newInstrumentId || "",
    instrumentCategory: newCategory || "",
    readinessAnswers: nextReadiness,
    termsAnswers: nextTerms,
    inactiveAnswers: {
      ...priorInactive,
      [`${oldInstrumentId || "unknown"}__${Date.now()}`]: inactiveBucket,
    },
  }

  const diff = {
    oldInstrumentId,
    newInstrumentId,
    oldCategory,
    newCategory,
    keep: overlap,
    deactivated: drop,
    newFields: add,
    inactiveBucketKeys: Object.keys(inactiveBucket.readinessAnswers).concat(
      Object.keys(inactiveBucket.termsAnswers)
    ),
  }

  // Rule contexts that must be re-evaluated after this change.
  // The requirement engine will re-resolve once the patch is saved.
  const affectedRuleContexts = [
    { scope: "readiness", reason: `${drop.length} instrument-specific answers deactivated` },
    { scope: "terms",     reason: `${drop.length} instrument-specific terms deactivated` },
    { scope: "fundability", reason: `Instrument changed from ${oldInstrumentId || "none"} to ${newInstrumentId}` },
    { scope: "matches",   reason: "Opportunity matching will re-run against the new instrument" },
    { scope: "score",     reason: "Adjusted BIG Score will be recalculated per opportunity" },
  ]

  return { patch, diff, affectedRuleContexts }
}

/**
 * Apply the change and record it. Returns the applied patch.
 */
export const applyRouteChange = async ({ requestId, request, newInstrumentId, newCategory }) => {
  const preview = previewRouteChange({ request, newInstrumentId, newCategory })

  // Fire-and-forget audit. The caller persists the patch to Firestore.
  logEvent({
    action: AUDIT_ACTIONS.REQUEST_ROUTE_CHANGED,
    resourceType: "fundingRequest",
    resourceId: requestId,
    smeId: request?.userId,
    before: {
      instrumentId: preview.diff.oldInstrumentId,
      category: preview.diff.oldCategory,
    },
    after: {
      instrumentId: preview.diff.newInstrumentId,
      category: preview.diff.newCategory,
    },
    reason: "Route changed by SME in wizard",
    meta: {
      deactivatedFields: preview.diff.deactivated,
      keptFields: preview.diff.keep,
      newFields: preview.diff.newFields,
    },
  })

  return preview
}

export const getInstrumentLabel = (id) => getInstrument(id)?.label || id || "—"

export default { previewRouteChange, applyRouteChange }