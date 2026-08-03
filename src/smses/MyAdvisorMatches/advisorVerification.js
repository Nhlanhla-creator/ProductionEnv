/* ════════════════════════════════════════════════════════════════════════════
   Advisor verification scoring.

   Same skeleton as VerificationScoreCard in AdvisorProfileSummary.jsx — five
   weighted categories, each scored 0–5, summed to a 0–25 internal total and
   shown as 0–100, then bucketed into the same four tiers with the same badges.

   The difference is what it reads. VerificationScoreCard scores *funder*
   fields (legalCompliance.cipcStatus, fundDetails.funds, fundManageOverview,
   productsServices.fundMandate). None of those exist on an advisorProfiles
   document, so running it unchanged returns Tier 4 for every advisor. The
   categories below read the fields advisorProfiles actually stores, which are
   the same ones AdvisorProfileSummary renders further down the page.

   Input is the whole advisorProfiles document (the one with `formData`), so
   this can be called straight from the row mapper.
   ════════════════════════════════════════════════════════════════════════ */

const filled = (value) => {
  if (value === null || value === undefined) return false
  if (Array.isArray(value)) return value.length > 0
  const s = value.toString().trim()
  return s !== "" && s !== "-" && s !== "N/A" && !/^not specified$/i.test(s)
}

// How many of the listed values are populated.
const countFilled = (values) => values.filter(filled).length

// Scale a "n of total populated" count onto the 0–5 category scale.
const scaleTo5 = (count, total) => (total === 0 ? 0 : Math.round((count / total) * 5))

export const VERIFICATION_CATEGORY_LABELS = {
  identityContact: "Identity & Contact",
  profileCompleteness: "Profile Completeness",
  advisoryMandate: "Advisory Mandate",
  trackRecord: "Track Record",
  declarations: "Declarations",
}

export const VERIFICATION_TIERS = [
  {
    min: 21,
    name: "Tier 1",
    label: "Verified Partner",
    badge: "🟢",
    summary: "Fully verified, transparent, responsive, and trusted. Shown first in match results.",
  },
  {
    min: 16,
    name: "Tier 2",
    label: "Trusted Entity",
    badge: "🔵",
    summary: "Actively engaged, most disclosures complete. Eligible for matches and higher visibility.",
  },
  {
    min: 11,
    name: "Tier 3",
    label: "Registered",
    badge: "⚪",
    summary: "Profile created and partially verified. Listed, but with lower match priority.",
  },
  {
    min: 0,
    name: "Tier 4",
    label: "Not Verified",
    badge: "❌",
    summary: "Key profile details are missing. Limited visibility in match results.",
  },
]

export const getVerificationTier = (internalScore) =>
  VERIFICATION_TIERS.find((t) => internalScore >= t.min) || VERIFICATION_TIERS[VERIFICATION_TIERS.length - 1]

/* Tier colours reuse the same intent as VerificationScoreCard's getScoreColor,
   flattened to a single foreground/background pair so they can sit in a table
   cell as a pill rather than a gradient ring. */
export const VERIFICATION_STYLES = {
  "Tier 1": { color: "#2E7D32", bg: "rgba(46,125,50,0.12)" },
  "Tier 2": { color: "#1565C0", bg: "rgba(21,101,192,0.12)" },
  "Tier 3": { color: "#616161", bg: "rgba(97,97,97,0.12)" },
  "Tier 4": { color: "#C62828", bg: "rgba(198,40,40,0.12)" },
}

export const getVerificationStyle = (tierName) =>
  VERIFICATION_STYLES[tierName] || VERIFICATION_STYLES["Tier 4"]

/**
 * deriveAdvisorVerification(advisorProfile)
 *
 * @param  {object} advisorProfile  a raw advisorProfiles document
 * @return {{
 *   score: number,          // 0–100, for display
 *   internalScore: number,  // 0–25, what the tier thresholds compare against
 *   tier: string,           // "Tier 1".."Tier 4"
 *   label: string,          // "Verified Partner" etc
 *   badge: string,          // emoji
 *   status: string,         // "🟢 Tier 1 — Verified Partner" — the column value
 *   summary: string,        // the Status Summary column value
 *   breakdown: object       // per-category { score, max, weight }
 * }}
 */
export const deriveAdvisorVerification = (advisorProfile) => {
  const form = advisorProfile?.formData || {}
  const contact = form.contactDetails || {}
  const overview = form.personalProfessionalOverview || {}
  const selection = form.selectionCriteria || {}
  const credentials = form.professionalCredentials || {}
  const declaration = form.declarationConsent || {}

  const breakdown = {
    identityContact: { score: 0, max: 5, weight: 0.2 },
    profileCompleteness: { score: 0, max: 5, weight: 0.25 },
    advisoryMandate: { score: 0, max: 5, weight: 0.2 },
    trackRecord: { score: 0, max: 5, weight: 0.2 },
    declarations: { score: 0, max: 5, weight: 0.15 },
  }

  // 1. Identity & Contact (20%)
  const identityFields = [contact.name, contact.surname, contact.email, contact.mobile, contact.country]
  breakdown.identityContact.score = scaleTo5(countFilled(identityFields), identityFields.length)

  // 2. Profile Completeness (25%)
  const profileFields = [
    overview.briefBio,
    overview.professionalHeadline,
    overview.yearsOfExperience,
    overview.functionalExpertise,
    overview.industryExperience,
  ]
  breakdown.profileCompleteness.score = scaleTo5(countFilled(profileFields), profileFields.length)

  // 3. Advisory Mandate (20%) — can this advisor actually be matched on?
  const mandateFields = [selection.advisorySupportType, selection.smeStageFit, selection.compensationModel]
  breakdown.advisoryMandate.score = scaleTo5(countFilled(mandateFields), mandateFields.length)

  // 4. Track Record (20%)
  const trackFields = [
    credentials.qualifications,
    credentials.currentBoardSeats,
    credentials.pastBoardRoles,
    credentials.keyAchievements,
  ]
  breakdown.trackRecord.score = scaleTo5(countFilled(trackFields), trackFields.length)

  // 5. Declarations (15%) — these are booleans, so treat them as all-or-nothing
  // per item rather than running them through `filled` (false is a real answer,
  // not a missing one).
  const declarationFields = [
    declaration.codeOfConduct === true,
    declaration.dataSharingConsent === true,
    declaration.availabilityConfirmation === true,
  ]
  breakdown.declarations.score = scaleTo5(
    declarationFields.filter(Boolean).length,
    declarationFields.length,
  )

  // Weighted 0–25 total, identical formula to VerificationScoreCard.
  const internalScore = Object.values(breakdown).reduce(
    (sum, category) => sum + category.score * category.weight * 5,
    0,
  )
  const score = Math.round((internalScore / 25) * 100)
  const tier = getVerificationTier(internalScore)

  return {
    score,
    internalScore: Math.round(internalScore),
    tier: tier.name,
    label: tier.label,
    badge: tier.badge,
    status: `${tier.badge} ${tier.name} — ${tier.label}`,
    summary: tier.summary,
    breakdown,
  }
}

export default deriveAdvisorVerification