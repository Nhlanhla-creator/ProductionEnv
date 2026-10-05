/**
 * buyerProfileState.js
 *
 * Implements the 6-state lifecycle engine and dynamic completion plan
 * specified in the BIG Prism Procurement Dashboard Core Developer Brief.
 *
 * States:
 *   1. Profile Started: Organisation exists but objectives or context are incomplete.
 *   2. Configuration Required: Categories, requirements, users or portal workflow still block use.
 *   3. Match Ready: Demand, category, location and supplier criteria are sufficient.
 *   4. Assessment Ready: Requirements and permissions support Score and Passport review.
 *   5. Onboarding Ready: Decision roles, portal hand-off and buyer-specific requirements are configured.
 *   6. Live: The buyer can match, interact with and progress suppliers through the configured journey.
 */

export const PROFILE_STATES = {
  PROFILE_STARTED: {
    key: "profile_started",
    label: "Profile Started",
    description: "Organisation basic entity details recorded; objectives and operational context incomplete.",
    variant: "neutral",
    badgeColor: "#8D6E63",
    badgeBg: "#EFEBE9",
    step: 1,
  },
  CONFIGURATION_REQUIRED: {
    key: "configuration_required",
    label: "Configuration Required",
    description: "Categories, requirements, users or portal workflow still block matching and progression.",
    variant: "warning",
    badgeColor: "#E65100",
    badgeBg: "#FFF3E0",
    step: 2,
  },
  MATCH_READY: {
    key: "match_ready",
    label: "Match Ready",
    description: "Demand, category, location and supplier criteria are sufficient to generate accurate matches.",
    variant: "info",
    badgeColor: "#0D47A1",
    badgeBg: "#E3F2FD",
    step: 3,
  },
  ASSESSMENT_READY: {
    key: "assessment_ready",
    label: "Assessment Ready",
    description: "Requirement gates and reviewer permissions support BIG Score and Passport deep-dive inspection.",
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
    description: "Full end-to-end journey active: match, interact, assess, and progress suppliers.",
    variant: "success",
    badgeColor: "#2E7D32",
    badgeBg: "#C8E6C9",
    step: 6,
  },
}

/**
 * Evaluates profile data and returns the active state, progress percentage,
 * and actionable completion plan items.
 */
export function evaluateBuyerProfileState(profile = {}) {
  const org = profile.organisation || {}
  const obj = profile.objectives || {}
  const env = profile.currentEnvironment || {}
  const demand = profile.demandContext || {}
  const req = profile.requirements || {}
  const decisions = profile.decisionProcess || {}
  const consent = profile.dataConsent || {}

  const tasks = []

  // Check 1: Organisation
  const hasOrg = !!(org.legalName || org.tradingName) && !!org.industry && !!org.primaryContact?.email
  if (!hasOrg) {
    tasks.push({
      id: "org_info",
      section: "organisation",
      title: "Complete Organization & Primary Contact",
      description: "Record legal entity name, industry, and primary procurement lead contact.",
      blocking: true,
      owner: org.primaryContact?.name || "Procurement Admin",
      dueDate: "Immediate",
    })
  }

  // Check 2: Objectives
  const hasObjectives = Array.isArray(obj.selectedObjectives) && obj.selectedObjectives.length > 0
  if (!hasObjectives) {
    tasks.push({
      id: "objectives_select",
      section: "objectives",
      title: "Select Strategic Procurement Objectives",
      description: "Define what your organisation wants from Prism (pre-vetting, pipeline, ESD, localization).",
      blocking: true,
      owner: "Procurement Lead",
      dueDate: "Within 2 days",
    })
  }

  // Check 3: Demand Context (Unlocks Match Ready)
  const hasDemand = Array.isArray(demand.categories) && demand.categories.length > 0
  if (!hasDemand) {
    tasks.push({
      id: "demand_categories",
      section: "demand",
      title: "Configure Demand Categories & Taxonomy",
      description: "Select at least one product or service category to unlock supplier matching.",
      blocking: true,
      owner: "Category Manager",
      dueDate: "Within 3 days",
    })
  }

  // Check 4: Requirements & Baseline Gates (Unlocks Assessment Ready)
  const hasRequirements = !!req.minBBBEELevel && req.mandatoryCIPC !== undefined
  if (!hasRequirements) {
    tasks.push({
      id: "requirement_gates",
      section: "requirements",
      title: "Set Statutory Requirement Gates",
      description: "Define baseline B-BBEE, Tax Pin, CIPC and COIDA compliance thresholds.",
      blocking: false,
      owner: "Compliance / SHEQ",
      dueDate: "Within 5 days",
    })
  }

  // Check 5: Environment & Portal Coexistence (Unlocks Onboarding Ready)
  const hasEnvironment = !!env.primaryERP && !!env.portalUrl
  if (!hasEnvironment) {
    tasks.push({
      id: "env_portal",
      section: "environment",
      title: "Configure Buyer Portal URL & ERP Coexistence",
      description: "Specify your external supplier onboarding portal URL and ERP system (SAP, Ariba, Coupa).",
      blocking: false,
      owner: "Procurement Ops",
      dueDate: "Within 1 week",
    })
  }

  // Check 6: Decision Roles & Approval Stages (Unlocks Live)
  const hasRoles = !!decisions.approverRole || !!decisions.technicalReviewer
  if (!hasRoles) {
    tasks.push({
      id: "decision_roles",
      section: "decisions",
      title: "Assign Decision Roles & Approval Authority",
      description: "Designate Technical Reviewer, Category Manager, and Stage Approver roles.",
      blocking: false,
      owner: "Procurement Director",
      dueDate: "Within 1 week",
    })
  }

  // Check 7: Consent Policy
  const hasConsent = consent.agreedToBenchmark !== undefined && !!consent.policySignedBy
  if (!hasConsent) {
    tasks.push({
      id: "data_consent",
      section: "consent",
      title: "Sign Data Minimization & Consent Policy",
      description: "Acknowledge evidence visibility limitations and benchmark access terms.",
      blocking: false,
      owner: "Legal / Compliance",
      dueDate: "Prior to go-live",
    })
  }

  // Determine State
  let currentState = PROFILE_STATES.PROFILE_STARTED

  if (hasOrg && hasObjectives && hasDemand) {
    currentState = PROFILE_STATES.MATCH_READY
  } else if (hasOrg || hasObjectives) {
    currentState = PROFILE_STATES.CONFIGURATION_REQUIRED
  }

  if (currentState.step >= 3 && hasRequirements) {
    currentState = PROFILE_STATES.ASSESSMENT_READY
  }

  if (currentState.step >= 4 && hasEnvironment) {
    currentState = PROFILE_STATES.ONBOARDING_READY
  }

  if (currentState.step >= 5 && hasRoles && hasConsent) {
    currentState = PROFILE_STATES.LIVE
  }

  const totalChecks = 7
  const passedChecks = [
    hasOrg,
    hasObjectives,
    hasDemand,
    hasRequirements,
    hasEnvironment,
    hasRoles,
    hasConsent,
  ].filter(Boolean).length

  const completionPercentage = Math.round((passedChecks / totalChecks) * 100)

  return {
    state: currentState,
    completionPercentage,
    passedChecks,
    totalChecks,
    tasks,
    isMatchReady: currentState.step >= 3,
    isLive: currentState.step === 6,
  }
}
