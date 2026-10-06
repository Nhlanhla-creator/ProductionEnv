/**
 * buyerProfileState.js
 *
 * Implements the 6-state lifecycle engine and completion status
 * for the Procurement Universal Profile.
 *
 * Section Order:
 *   1. Objectives (Entity Details & Strategic Objectives)
 *   2. Demand Context (Categories, Spend Ranges, Geography, Onboarding Instructions)
 *   3. Compliance Gates (Statutory Gates, Accreditations, Operational Overlays)
 *   4. Decision Roles (Governance Roles & Approval Thresholds)
 *   5. Environment & ERP (ERP Coexistence & Vendor Master Portal)
 *   6. Policy & Consent (Data Minimisation & Benchmark Consent)
 */

export const PROFILE_STATES = {
  PROFILE_STARTED: {
    key: "profile_started",
    label: "Profile Started",
    description: "Corporate entity details and objectives recorded; demand context incomplete.",
    variant: "neutral",
    badgeColor: "#8D6E63",
    badgeBg: "#EFEBE9",
    step: 1,
  },
  CONFIGURATION_REQUIRED: {
    key: "configuration_required",
    label: "Configuration Required",
    description: "Categories, compliance gates, decision roles or portal workflow still pending.",
    variant: "warning",
    badgeColor: "#E65100",
    badgeBg: "#FFF3E0",
    step: 2,
  },
  MATCH_READY: {
    key: "match_ready",
    label: "Match Ready",
    description: "Demand taxonomy and supplier criteria are configured to qualify Preferred Suppliers.",
    variant: "info",
    badgeColor: "#0D47A1",
    badgeBg: "#E3F2FD",
    step: 3,
  },
  ASSESSMENT_READY: {
    key: "assessment_ready",
    label: "Assessment Ready",
    description: "Compliance gates and review roles support BIG Score and Passport deep-dive inspection.",
    variant: "accent",
    badgeColor: "#4A148C",
    badgeBg: "#F3E5F5",
    step: 4,
  },
  ONBOARDING_READY: {
    key: "onboarding_ready",
    label: "Onboarding Ready",
    description: "Decision roles, external portal hand-off URL and statutory rules are configured.",
    variant: "primary",
    badgeColor: "#1B5E20",
    badgeBg: "#E8F5E9",
    step: 5,
  },
  LIVE: {
    key: "live",
    label: "Live",
    description: "Full end-to-end journey active: discover preferred suppliers, issue RFPs, and progress bids.",
    variant: "success",
    badgeColor: "#2E7D32",
    badgeBg: "#C8E6C9",
    step: 6,
  },
}

/**
 * Checks if a specific section has completed required information.
 */
export function isSectionCompleted(sectionId, profile = {}) {
  const org = profile.organisation || {}
  const obj = profile.objectives || {}
  const demand = profile.demandContext || {}
  const req = profile.requirements || {}
  const decisions = profile.decisionProcess || {}
  const env = profile.currentEnvironment || {}
  const consent = profile.dataConsent || {}

  switch (sectionId) {
    case "objectives":
      return !!(org.legalName || org.tradingName) && Array.isArray(obj.selectedObjectives) && obj.selectedObjectives.length > 0
    case "demand":
      return Array.isArray(demand.categories) && demand.categories.length > 0
    case "compliance":
      return !!req.minBBBEELevel && req.mandatoryCIPC !== undefined
    case "decisions":
      return !!decisions.approverRole || !!decisions.technicalReviewer
    case "environment":
      return !!env.primaryERP && !!env.portalUrl
    case "consent":
      return consent.agreedToBenchmark !== undefined && !!consent.policySignedBy
    default:
      return false
  }
}

/**
 * Evaluates profile data and returns active state and progress percentage.
 */
export function evaluateBuyerProfileState(profile = {}) {
  const org = profile.organisation || {}
  const obj = profile.objectives || {}
  const env = profile.currentEnvironment || {}
  const demand = profile.demandContext || {}
  const req = profile.requirements || {}
  const decisions = profile.decisionProcess || {}
  const consent = profile.dataConsent || {}

  // Section 1: Objectives & Entity Details
  const hasOrg = !!(org.legalName || org.tradingName) && !!org.industry && !!org.primaryContact?.email
  const hasObjectives = Array.isArray(obj.selectedObjectives) && obj.selectedObjectives.length > 0
  const objectivesComplete = hasOrg || hasObjectives

  // Section 2: Demand Context
  const demandComplete = Array.isArray(demand.categories) && demand.categories.length > 0

  // Section 3: Compliance Gates
  const complianceComplete = !!req.minBBBEELevel && req.mandatoryCIPC !== undefined

  // Section 4: Decision Roles
  const decisionsComplete = !!decisions.approverRole || !!decisions.technicalReviewer

  // Section 5: Environment & ERP (#5 per user request)
  const environmentComplete = !!env.primaryERP && !!env.portalUrl

  // Section 6: Policy & Consent (#6 LAST per user request)
  const consentComplete = consent.agreedToBenchmark !== undefined && !!consent.policySignedBy

  // Determine State
  let currentState = PROFILE_STATES.PROFILE_STARTED

  if (objectivesComplete && demandComplete) {
    currentState = PROFILE_STATES.MATCH_READY
  } else if (objectivesComplete) {
    currentState = PROFILE_STATES.CONFIGURATION_REQUIRED
  }

  if (currentState.step >= 3 && complianceComplete) {
    currentState = PROFILE_STATES.ASSESSMENT_READY
  }

  if (currentState.step >= 4 && decisionsComplete && environmentComplete) {
    currentState = PROFILE_STATES.ONBOARDING_READY
  }

  if (currentState.step >= 5 && consentComplete) {
    currentState = PROFILE_STATES.LIVE
  }

  const completedMap = {
    objectives: objectivesComplete,
    demand: demandComplete,
    compliance: complianceComplete,
    decisions: decisionsComplete,
    environment: environmentComplete,
    consent: consentComplete,
  }

  const totalChecks = 6
  const passedChecks = Object.values(completedMap).filter(Boolean).length
  const completionPercentage = Math.round((passedChecks / totalChecks) * 100)

  return {
    state: currentState,
    completionPercentage,
    passedChecks,
    totalChecks,
    completedMap,
    isMatchReady: currentState.step >= 3,
    isLive: currentState.step === 6,
  }
}
