/**
 * funding/services/invalidationService.js
 *
 * Cache and invalidation rules from Brief §8 (p.66):
 *
 *   - Profile / evidence change  → refresh original and unsent contexts
 *   - Request route/amount change → rerun applicability, requirements,
 *                                    matches and adjusted scores
 *   - Opportunity publication / version change → recheck unsent dialogs
 *   - Submitted records are immutable
 *
 * This service centralises the logic so callers don't each re-implement
 * their own staleness checks. It returns a plan; the caller decides when
 * to act on it.
 */

export const INVALIDATION_REASONS = Object.freeze({
  PROFILE_CHANGED:    "profile.changed",
  EVIDENCE_CHANGED:   "evidence.changed",
  ROUTE_CHANGED:      "request.route_changed",
  AMOUNT_CHANGED:     "request.amount_changed",
  RULES_REPUBLISHED:  "opportunity.rules_republished",
  SCORING_CHANGED:    "scoringProfile.changed",
})

/**
 * Given a trigger and current state, return what must be refreshed.
 * Pure function.
 */
export const planInvalidation = ({ trigger, request, drafts = {}, submissions = [] }) => {
  const plan = { invalidateScores: false, invalidateMatches: false, invalidateDrafts: [], invalidateBridges: false, notes: [] }

  switch (trigger) {
    case INVALIDATION_REASONS.PROFILE_CHANGED:
    case INVALIDATION_REASONS.EVIDENCE_CHANGED:
      plan.invalidateScores = true
      plan.invalidateMatches = true
      plan.invalidateBridges = true
      plan.invalidateDrafts = Object.keys(drafts)
      plan.notes.push("Original BIG Score will refresh on next calculation.")
      plan.notes.push("Unsent opportunity drafts must be revalidated before submission.")
      // Submitted records are immutable — no action.
      if (submissions.length > 0) {
        plan.notes.push(`${submissions.length} submitted package(s) remain frozen.`)
      }
      break

    case INVALIDATION_REASONS.ROUTE_CHANGED:
      plan.invalidateScores = true
      plan.invalidateMatches = true
      plan.invalidateBridges = true
      plan.invalidateDrafts = Object.keys(drafts)
      plan.notes.push("Instrument applicability rerun for the new route.")
      plan.notes.push("Requirements and matches regenerated.")
      break

    case INVALIDATION_REASONS.AMOUNT_CHANGED:
      plan.invalidateMatches = true
      plan.invalidateDrafts = Object.keys(drafts)
      plan.notes.push("Ticket bounds rechecked against the new amount.")
      break

    case INVALIDATION_REASONS.RULES_REPUBLISHED:
      plan.invalidateDrafts = Object.keys(drafts).filter((k) => drafts[k]?.opportunityId)
      plan.notes.push("Open drafts against the affected opportunity must review the rule diff.")
      break

    case INVALIDATION_REASONS.SCORING_CHANGED:
      plan.invalidateScores = true
      plan.invalidateBridges = true
      plan.notes.push("Adjusted BIG Score recalculated under the new weights.")
      break

    default:
      plan.notes.push("Unknown trigger — no plan.")
  }

  return plan
}

/**
 * Optimistic-concurrency guard. Every write to a request or submission
 * should pass the version it last read; if the stored version doesn't
 * match, the write is rejected and the UI shows a refresh prompt.
 */
export const checkVersionGuard = ({ currentVersion, expectedVersion }) => {
  if (expectedVersion == null) return { ok: true }
  if (currentVersion !== expectedVersion) {
    return {
      ok: false,
      code: "VERSION_MISMATCH",
      message: "This record was changed elsewhere. Reload to see the latest.",
    }
  }
  return { ok: true }
}

export default { INVALIDATION_REASONS, planInvalidation, checkVersionGuard }