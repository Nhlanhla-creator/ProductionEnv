// CMF Profile Configuration & Centralized Specification
// Based on CMF Profile Spec Sheet

export const CMF_SECTIONS = [
  {
    id: "instructions",
    label: "Instructions",
    step: 1,
    purpose: "Explain what to complete and what SMEs will see",
    shortLabel: "Instructions"
  },
  {
    id: "entityOverview",
    label: "Entity\nOverview",
    step: 2,
    purpose: "Introduce the facilitator",
    shortLabel: "Entity Overview"
  },
  {
    id: "servicesSupport",
    label: "Services &\nSupport",
    step: 3,
    purpose: "Explain the assistance offered",
    shortLabel: "Services & Support"
  },
  {
    id: "smeFocusMatching",
    label: "SME Focus &\nMatching",
    step: 4,
    purpose: "Define which SMEs the CMF supports",
    shortLabel: "SME Focus & Matching"
  },
  {
    id: "experienceNetworks",
    label: "Experience &\nNetworks",
    step: 5,
    purpose: "Demonstrate relevant expertise and access",
    shortLabel: "Experience & Networks"
  },
  {
    id: "feesEngagement",
    label: "Fees &\nEngagement",
    step: 6,
    purpose: "Explain commercial terms and how support works",
    shortLabel: "Fees & Engagement"
  },
  {
    id: "legalVerification",
    label: "Legal &\nVerification",
    step: 7,
    purpose: "Capture private verification information",
    shortLabel: "Legal & Verification"
  },
  {
    id: "contactDetails",
    label: "Contact\nDetails",
    step: 8,
    purpose: "Identify who SMEs should contact",
    shortLabel: "Contact Details"
  },
  {
    id: "declarationConsent",
    label: "Declaration &\nConsent",
    step: 9,
    purpose: "Confirm accuracy and sharing permissions",
    shortLabel: "Declaration & Consent"
  }
]

// Service offerings predefined catalogues
export const CAPITAL_SERVICES = [
  "Funding readiness",
  "Funding route advice",
  "Application preparation",
  "Financial modelling",
  "Funder introductions",
  "Transaction coordination",
  "Post-funding support"
]

export const MARKET_SERVICES = [
  "Supplier readiness",
  "Opportunity sourcing",
  "Buyer introductions",
  "Tender support",
  "Supplier onboarding",
  "Commercial partnerships"
]

export const SECTOR_OPTIONS = [
  "Agriculture & Agribusiness",
  "Manufacturing & Industrial",
  "Information & Communication Technology (ICT)",
  "Energy, CleanTech & Renewables",
  "Logistics & Supply Chain",
  "Healthcare & Pharmaceuticals",
  "Financial Services & FinTech",
  "Retail & Wholesale Trade",
  "Construction & Real Estate",
  "Mining & Resources",
  "Tourism & Hospitality",
  "Education & EdTech",
  "Professional & Specialist Services",
  "Water & Waste Management",
  "Creative & Media Industries"
]

export const BUSINESS_STAGES = [
  "Idea",
  "Startup",
  "Established",
  "Growth",
  "Turnaround"
]

export const FUNDING_INSTRUMENTS = [
  "Senior Debt / Term Loans",
  "Subordinated / Mezzanine Debt",
  "Venture Capital (Seed / Series A+)",
  "Growth Private Equity",
  "Government Grants & Subsidies",
  "Asset & Equipment Finance",
  "Trade & Invoice Finance",
  "Working Capital Facilities",
  "Revenue-based Financing",
  "Convertible Notes"
]

export const OPPORTUNITY_TYPES = [
  "Tenders & RFPs",
  "Supply contracts",
  "Offtake & Distribution",
  "Export markets",
  "Commercial partnerships"
]

export const LANGUAGES_LIST = [
  "English",
  "isiZulu",
  "isiXhosa",
  "Afrikaans",
  "Sesotho",
  "Setswana",
  "Sepedi",
  "French",
  "Portuguese",
  "Swahili"
]

// 13 Document Vault configurations as specified in the Spec Sheet
export const CMF_DOCUMENT_VAULT_CONFIG = [
  {
    id: "entityRegistration",
    label: "Entity Registration Document",
    recommendedStatus: "Compulsory for registered organisations",
    whenRequired: "Registration certificate or equivalent in the entity's country",
    visibleToSMEs: "Verification status only",
    category: "Legal & Entity",
    requiredFor: "organisation",
    multiple: false
  },
  {
    id: "idVerification",
    label: "Identity Verification of Account Holder",
    recommendedStatus: "Compulsory",
    whenRequired: "Person administering the account; individual practitioners verify their own identity",
    visibleToSMEs: "No",
    category: "Identity",
    requiredFor: "all",
    multiple: false
  },
  {
    id: "authorityToRepresent",
    label: "Authority to Represent the Organisation",
    recommendedStatus: "Conditional compulsory",
    whenRequired: "Where the account holder's authority cannot otherwise be established; accept an authorisation letter or equivalent confirmation",
    visibleToSMEs: "No",
    category: "Legal & Entity",
    requiredFor: "organisation",
    multiple: false
  },
  {
    id: "regulatoryAuthorisation",
    label: "Relevant Licence or Regulatory Authorisation Evidence",
    recommendedStatus: "Conditional compulsory",
    whenRequired: "Where required for the specific services offered; capture licence number, scope and expiry where applicable",
    visibleToSMEs: "Verified details/status",
    category: "Credentials & Authorisation",
    requiredFor: "conditional",
    multiple: true
  },
  {
    id: "formalMandate",
    label: "Formal Funder, Buyer or Programme Mandate",
    recommendedStatus: "Conditional compulsory",
    whenRequired: "If the CMF claims to be an appointed representative or mandated partner",
    visibleToSMEs: "Relationship status; document private",
    category: "Mandates & Partnerships",
    requiredFor: "conditional",
    multiple: true
  },
  {
    id: "professionalAccreditation",
    label: "Qualification, Accreditation or Professional Membership Evidence",
    recommendedStatus: "Conditional compulsory",
    whenRequired: "If the CMF wants BIG to mark the claimed credential as verified",
    visibleToSMEs: "Credential and verification status",
    category: "Credentials & Authorisation",
    requiredFor: "conditional",
    multiple: true
  },
  {
    id: "taxCompliance",
    label: "Tax Compliance Evidence",
    recommendedStatus: "Optional by default",
    whenRequired: "Can become compulsory for a specific paid appointment, corporate programme or procurement requirement",
    visibleToSMEs: "Status only, if relevant",
    category: "Tax & Compliance",
    requiredFor: "optional",
    multiple: false
  },
  {
    id: "bbbeeCertificate",
    label: "B-BBEE Certificate or Affidavit",
    recommendedStatus: "Optional by default",
    whenRequired: "Can become compulsory where a South African programme or appointment requires it",
    visibleToSMEs: "Level/status, with permission",
    category: "Tax & Compliance",
    requiredFor: "optional",
    multiple: false
  },
  {
    id: "professionalIndemnity",
    label: "Professional Indemnity Insurance",
    recommendedStatus: "Optional by default",
    whenRequired: "Can become compulsory for a particular engagement or programme",
    visibleToSMEs: "Cover status, where relevant",
    category: "Insurance & Risk",
    requiredFor: "optional",
    multiple: false
  },
  {
    id: "proofOfAddress",
    label: "Proof of Business Address",
    recommendedStatus: "Optional / verification exception",
    whenRequired: "Request where needed to resolve an identity or address discrepancy",
    visibleToSMEs: "No",
    category: "Identity",
    requiredFor: "optional",
    multiple: false
  },
  {
    id: "bankAccountConfirmation",
    label: "Bank Account Confirmation",
    recommendedStatus: "Outside initial profile onboarding",
    whenRequired: "Required before payments are made through BIG, if applicable",
    visibleToSMEs: "No",
    category: "Financial",
    requiredFor: "optional",
    multiple: false
  },
  {
    id: "serviceAgreementTerms",
    label: "Service Agreement or Standard Engagement Terms",
    recommendedStatus: "Optional at profile stage",
    whenRequired: "Agreed terms should be captured before a paid engagement begins",
    visibleToSMEs: "Shareable with the engaging SME",
    category: "Commercial & Engagement",
    requiredFor: "optional",
    multiple: true
  },
  {
    id: "companyBrochureAndCaseStudies",
    label: "Company Brochure, Case Studies and References",
    recommendedStatus: "Optional",
    whenRequired: "Supports the public profile and track record",
    visibleToSMEs: "Yes, with permission",
    category: "Commercial & Engagement",
    requiredFor: "optional",
    multiple: true
  }
]

// Centralized Validation Rules for CMF Sections
export const sectionValidations = {
  instructions: () => true,

  entityOverview: (data) => {
    if (!data) return false
    const hasProfileType = Boolean(data.profileType && String(data.profileType).trim())
    const hasName = Boolean(data.organisationName && String(data.organisationName).trim())
    const hasHeadline = Boolean(data.headline && String(data.headline).trim())
    const hasAbout = Boolean(data.about && String(data.about).trim())
    const hasFocus = Boolean(data.facilitationFocus && String(data.facilitationFocus).trim())
    const hasCountry = Boolean(data.baseCountry && String(data.baseCountry).trim())
    const hasCity = Boolean(data.baseCity && String(data.baseCity).trim())
    return Boolean(hasProfileType && hasName && hasHeadline && hasAbout && hasFocus && hasCountry && hasCity)
  },

  servicesSupport: (data) => {
    if (!data) return false
    const hasServices = Array.isArray(data.servicesOffered) && data.servicesOffered.length > 0
    const hasDeliverables = Boolean(data.whatSmesReceive && String(data.whatSmesReceive).trim())
    const hasDeliveryMethod = Boolean(data.deliveryMethod && String(data.deliveryMethod).trim())
    const hasSupportFormat = Boolean(data.supportFormat && String(data.supportFormat).trim())
    const hasEngagementType = Boolean(data.engagementType && String(data.engagementType).trim())
    return Boolean(hasServices && hasDeliverables && hasDeliveryMethod && hasSupportFormat && hasEngagementType)
  },

  smeFocusMatching: (data) => {
    if (!data) return false
    const hasSectors = Array.isArray(data.sectorsSupported) && data.sectorsSupported.length > 0
    const hasGeos = Array.isArray(data.geographicAreas) && data.geographicAreas.length > 0
    const hasStages = Array.isArray(data.businessStages) && data.businessStages.length > 0
    const hasEligibility = Boolean(
      (Array.isArray(data.eligibilityCriteria) && data.eligibilityCriteria.length > 0) ||
      (data.eligibilityExplanation && String(data.eligibilityExplanation).trim())
    )
    const hasAccepting = Boolean(data.acceptingNewSmes && String(data.acceptingNewSmes).trim())
    return Boolean(hasSectors && hasGeos && hasStages && hasEligibility && hasAccepting)
  },

  experienceNetworks: (data) => {
    if (!data) return false
    const hasLeadName = Boolean(data.leadFacilitatorName && String(data.leadFacilitatorName).trim())
    const hasLeadRole = Boolean(data.leadFacilitatorRole && String(data.leadFacilitatorRole).trim())
    const hasBio = Boolean(data.leadExperienceBio && String(data.leadExperienceBio).trim())
    return Boolean(hasLeadName && hasLeadRole && hasBio)
  },

  feesEngagement: (data) => {
    if (!data) return false
    const hasPayer = Boolean(data.payer && String(data.payer).trim())
    const hasFeeModel = Boolean(data.feeModel && String(data.feeModel).trim())
    const isPaid = data.feeModel && data.feeModel !== "Free"
    const hasFeesIfPaid = !isPaid || Boolean(data.indicativeFees && String(data.indicativeFees).trim())
    const hasTimingIfPaid = !isPaid || Boolean(data.paymentTiming && String(data.paymentTiming).trim())
    const hasReferral = Boolean(data.referralCommissions && String(data.referralCommissions).trim())
    const hasExclusivity = Boolean(data.exclusivityRequired && String(data.exclusivityRequired).trim())
    const hasStart = Boolean(data.howEngagementStarts && String(data.howEngagementStarts).trim())
    const hasInitialInfo = Array.isArray(data.initialAssessmentInfo) && data.initialAssessmentInfo.length > 0
    const hasResponseTime = Boolean(data.typicalResponseTime && String(data.typicalResponseTime).trim())
    return Boolean(
      hasPayer && hasFeeModel && hasFeesIfPaid && hasTimingIfPaid &&
      hasReferral && hasExclusivity && hasStart && hasInitialInfo && hasResponseTime
    )
  },

  legalVerification: (data, allData) => {
    if (!data) return false
    const isOrg = (allData?.entityOverview?.profileType || data?.profileType) === "Organisation"
    if (isOrg) {
      const hasLegalName = Boolean(data.legalEntityName && String(data.legalEntityName).trim())
      const hasRegCountry = Boolean(data.registrationCountry && String(data.registrationCountry).trim())
      const hasRegNumber = Boolean(data.registrationNumber && String(data.registrationNumber).trim())
      const hasCapacity = Boolean(data.capacityInWhichActs && String(data.capacityInWhichActs).trim())
      return Boolean(hasLegalName && hasRegCountry && hasRegNumber && hasCapacity)
    }
    const hasCapacity = Boolean(data.capacityInWhichActs && String(data.capacityInWhichActs).trim())
    return Boolean(hasCapacity)
  },

  contactDetails: (data) => {
    if (!data) return false
    const hasContactName = Boolean(data.smeContactName && String(data.smeContactName).trim())
    const hasContactRole = Boolean(data.smeContactRole && String(data.smeContactRole).trim())
    const hasRoute = Boolean(data.preferredContactRoute && String(data.preferredContactRoute).trim())
    const requiresEmail = data.preferredContactRoute === "Email"
    const hasEmailIfRequired = !requiresEmail || Boolean(data.publicEmail && String(data.publicEmail).trim())
    const hasAdminName = Boolean(data.accountAdminName && String(data.accountAdminName).trim())
    const hasAdminEmail = Boolean(data.accountAdminEmail && String(data.accountAdminEmail).trim())
    const hasAdminPhone = Boolean(data.accountAdminPhone && String(data.accountAdminPhone).trim())
    return Boolean(
      hasContactName && hasContactRole && hasRoute && hasEmailIfRequired &&
      hasAdminName && hasAdminEmail && hasAdminPhone
    )
  },

  declarationConsent: (data) => {
    if (!data) return false
    return Boolean(
      data.accuracy &&
      data.permissionRelationships &&
      data.approvePublicProfile &&
      data.acceptTermsPrivacy
    )
  }
}

// Calculate Section Progress & Status
export const getSectionStatus = (sectionId, formData, completedSections) => {
  if (sectionId === "instructions") return "Complete"
  const isMarkedCompleted = Boolean(completedSections?.[sectionId])
  const isValid = Boolean(sectionValidations[sectionId]?.(formData?.[sectionId] || {}, formData))
  if (isMarkedCompleted && isValid) return "Complete"
  const data = formData?.[sectionId]
  if (!data || Object.keys(data).length === 0) return "Not started"
  const hasSomeData = Object.values(data).some(val => {
    if (Array.isArray(val)) return val.length > 0
    if (typeof val === "string") return val.trim().length > 0
    if (typeof val === "boolean") return val
    if (typeof val === "object" && val !== null) return Object.keys(val).length > 0
    return false
  })
  return hasSomeData ? "In progress" : "Not started"
}

export const calculateProfileCompletion = (formData, completedSections = {}) => {
  const countableSections = CMF_SECTIONS.filter(s => s.id !== "instructions")
  let completedCount = 0
  countableSections.forEach(s => {
    const isValid = Boolean(sectionValidations[s.id]?.(formData?.[s.id] || {}, formData))
    if (isValid && completedSections[s.id]) {
      completedCount++
    }
  })
  return Math.round((completedCount / countableSections.length) * 100)
}

// Default Data Schema for a CMF Profile
export const getDefaultCMFFormData = () => ({
  instructions: {},
  entityOverview: {
    profileType: "Organisation",
    organisationName: "",
    logo: "",
    headline: "",
    about: "",
    facilitationFocus: "Both", // Capital | Market access | Both
    baseCountry: "South Africa",
    baseCity: "",
    website: "",
    linkedin: ""
  },
  servicesSupport: {
    servicesOffered: [],
    otherServiceText: "",
    whatSmesReceive: "",
    deliveryMethod: "Hybrid", // Online | In person | Hybrid
    supportFormat: "Both", // Individual support | Group programme | Both
    engagementType: "Ongoing", // Once-off | Ongoing | Programme-based
    typicalDuration: "3 - 6 months"
  },
  smeFocusMatching: {
    sectorsSupported: [],
    geographicAreas: ["South Africa"],
    businessStages: ["Startup", "Growth", "Established"],
    eligibilityCriteria: ["Registered entity", "Minimum operating track record"],
    eligibilityExplanation: "SMEs should have an operational track record and clear growth intent.",
    turnoverRange: "R 1,000,000 - R 50,000,000",
    allowNoTurnoverRestriction: false,
    programmeCriteria: [],
    excludedSectors: [],
    acceptingNewSmes: "Yes", // Yes | Limited capacity | Currently closed
    preferredNewEngagements: 10, // Private
    // Conditional Capital Fields
    fundingInstruments: [],
    typicalFundingRange: "R 500,000 - R 20,000,000",
    fundingReadinessRequirements: "",
    // Conditional Market Fields
    buyerSectors: [],
    opportunityTypes: [],
    supplierReadinessRequirements: ""
  },
  experienceNetworks: {
    leadFacilitatorName: "",
    leadFacilitatorRole: "Lead Facilitator & Managing Director",
    leadExperienceBio: "",
    yearsExperience: 8,
    teamMembers: [],
    qualifications: [],
    relationships: [],
    caseStudies: [],
    testimonials: []
  },
  feesEngagement: {
    payer: "SME", // SME | Funder | Buyer | Sponsor | Combination
    feeModel: "Fixed fee", // Free | Fixed fee | Retainer | Success fee | Combination
    indicativeFees: "",
    paymentTiming: "Milestones", // Upfront | Milestones | Completion | Success
    successFeeBasis: "",
    referralCommissions: "No",
    referralExplanation: "",
    exclusivityRequired: "No",
    exclusivityExplanation: "",
    howEngagementStarts: "Initial assessment", // Enquiry | Consultation | Initial assessment
    initialAssessmentInfo: [
      "Company registration & CIPC profile",
      "Executive summary / pitch deck",
      "Latest management accounts or financial overview"
    ],
    typicalResponseTime: "1 - 2 business days",
    engagementTermsUrl: ""
  },
  legalVerification: {
    legalEntityName: "",
    registrationCountry: "South Africa",
    registrationNumber: "",
    capacityInWhichActs: "Independent facilitator", // Independent facilitator | Appointed representative | Programme partner
    professionalAuthorisationDetails: "",
    professionalAuthorisationDoc: null,
    entityRegistrationDoc: null,
    identityVerificationDoc: null,
    mandateEvidenceDoc: null,
    supportingCredentialDocs: []
  },
  contactDetails: {
    smeContactName: "",
    smeContactRole: "Client Engagements Lead",
    preferredContactRoute: "BIG enquiry", // BIG enquiry | Email | Telephone | Booking link
    publicEmail: "",
    publicTelephone: "",
    bookingLink: "",
    languagesSupported: ["English"],
    accountAdminName: "",
    accountAdminEmail: "",
    accountAdminPhone: ""
  },
  declarationConsent: {
    accuracy: false,
    permissionRelationships: false,
    approvePublicProfile: false,
    acceptTermsPrivacy: false,
    marketingConsent: false
  },
  howDidYouHear: {
    source: ""
  },
  documents: {}
})
