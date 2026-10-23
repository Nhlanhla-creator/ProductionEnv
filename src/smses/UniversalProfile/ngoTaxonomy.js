// src/smses/UniversalProfile/ngoTaxonomy.js
// Centralized taxonomy and detection helpers for NGO / Non-Profit Universal Profile adaptation

export const NGO_ENTITY_TYPES = [
  { value: "NGO", label: "NGO / Non-profit organisation" },
  { value: "Social Enterprise", label: "Social Enterprise" },
  { value: "SME", label: "Commercial SME" },
]

export const NGO_LEGAL_STRUCTURES = [
  { value: "NPC", label: "Non-profit company (NPC)" },
  { value: "Trust", label: "Trust" },
  { value: "Voluntary association", label: "Voluntary association" },
  { value: "Foreign non-profit entity", label: "Foreign non-profit entity" },
  { value: "Other", label: "Other (specify)" },
]

export const NGO_OPERATION_STAGES = [
  { value: "Establishing", label: "Establishing" },
  { value: "Pilot delivery", label: "Pilot delivery" },
  { value: "Established", label: "Established" },
  { value: "Expanding", label: "Expanding" },
  { value: "Restructuring", label: "Restructuring" },
  { value: "Dormant", label: "Dormant" },
]

export const NGO_FOCUS_AREAS = [
  { value: "education", label: "Education" },
  { value: "health", label: "Health & Healthcare" },
  { value: "youth_development", label: "Youth Development" },
  { value: "livelihoods_entrepreneurship", label: "Livelihoods & Entrepreneurship" },
  { value: "social_welfare", label: "Social Welfare" },
  { value: "food_security", label: "Food Security & Nutrition" },
  { value: "environment_climate", label: "Environment & Climate Action" },
  { value: "arts_culture", label: "Arts & Culture" },
  { value: "sport_recreation", label: "Sport & Recreation" },
  { value: "human_rights_advocacy", label: "Human Rights & Advocacy" },
  { value: "community_development", label: "Community Development" },
  { value: "other", label: "Other" },
]

export const NGO_TARGET_BENEFICIARIES = [
  { value: "children", label: "Children (0-14 yrs)" },
  { value: "youth", label: "Youth (15-35 yrs)" },
  { value: "women", label: "Women & Girls" },
  { value: "disabilities", label: "Persons with Disabilities" },
  { value: "elderly", label: "Elderly Persons" },
  { value: "rural_communities", label: "Rural Communities" },
  { value: "informal_settlements", label: "Informal Settlement Residents" },
  { value: "unemployed", label: "Unemployed Jobseekers" },
  { value: "emerging_entrepreneurs", label: "Emerging Entrepreneurs & SMMEs" },
  { value: "schools_learners", label: "Schools & Learners" },
  { value: "patients_health", label: "Patients & Care Seekers" },
  { value: "general_public", label: "General Public" },
  { value: "other", label: "Other" },
]

export const NGO_OPERATING_MODELS = [
  { value: "direct_delivery", label: "Direct delivery (delivering frontline programmes/services)" },
  { value: "grantmaking", label: "Grantmaking (funding other non-profits/initiatives)" },
  { value: "advocacy_research", label: "Advocacy / Research (policy, campaigns, evidence generation)" },
  { value: "capacity_building", label: "Capacity building (training, mentoring other organisations)" },
  { value: "membership_network", label: "Membership / Network (convening and supporting members)" },
  { value: "mixed", label: "Mixed model (combination of delivery and support)" },
]

export const NGO_ENTITY_SIZES = [
  { value: "Micro", label: "Micro (< R1M annual income)" },
  { value: "Small", label: "Small (R1M - R5M annual income)" },
  { value: "Medium", label: "Medium (R5M - R20M annual income)" },
  { value: "Large", label: "Large (> R20M annual income)" },
]

export const NGO_CHARGING_MODELS = [
  { value: "free", label: "Free (100% grant/donor-funded)" },
  { value: "subsidised", label: "Subsidised (nominal contribution required)" },
  { value: "fee_paying", label: "Fee-paying / Cost-recovery" },
  { value: "mixed", label: "Mixed model" },
]

export const NGO_PROGRAMME_STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "pilot", label: "Pilot delivery" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
]

export const NGO_DELIVERY_METHODS = [
  { value: "in_person", label: "In person" },
  { value: "online", label: "Online / Digital" },
  { value: "hybrid", label: "Hybrid" },
  { value: "outreach_mobile", label: "Outreach / Mobile delivery" },
  { value: "through_partners", label: "Through delivery partners" },
]

export const NGO_GOVERNING_BODY_ROLES = [
  { value: "chairperson", label: "Chairperson / Board President" },
  { value: "vice_chairperson", label: "Vice Chairperson" },
  { value: "treasurer", label: "Treasurer" },
  { value: "secretary", label: "Secretary" },
  { value: "trustee", label: "Trustee" },
  { value: "non_exec_director", label: "Non-Executive Director" },
  { value: "committee_member", label: "Management Committee Member" },
  { value: "patron", label: "Patron / Advisory Board Member" },
]

export const NGO_EXECUTIVE_ROLES = [
  { value: "ceo_ed", label: "Executive Director / CEO" },
  { value: "programme_manager", label: "Programme Manager / Director" },
  { value: "finance_manager", label: "Finance / Operations Manager" },
  { value: "fundraising_lead", label: "Fundraising & Partnerships Lead" },
  { value: "m_and_e_lead", label: "Monitoring & Evaluation (M&E) Lead" },
  { value: "community_coordinator", label: "Community / Field Coordinator" },
  { value: "other", label: "Other" },
]

export const NGO_INCOME_SOURCE_TYPES = [
  { value: "grants_local_foundation", label: "Local Philanthropic / Foundation Grants" },
  { value: "grants_international", label: "International Grants & Bilateral Aid" },
  { value: "individual_donations", label: "Individual Donations & Public Giving" },
  { value: "corporate_csi_esd", label: "Corporate CSI / ESD Sponsorships" },
  { value: "government_subsidies", label: "Government Subsidies & Grants" },
  { value: "government_contracts", label: "Government Service Delivery Contracts" },
  { value: "earned_income_services", label: "Earned Income / Service Fees" },
  { value: "earned_income_sales", label: "Earned Income / Goods & Products Sales" },
  { value: "membership_fees", label: "Membership Fees / Subscriptions" },
  { value: "investment_income", label: "Investment / Endowment Income" },
  { value: "in_kind_support", label: "In-kind Support & Pro-Bono Services" },
  { value: "other", label: "Other Income" },
]

export const NGO_COMPLIANCE_STATUSES = [
  { value: "approved", label: "Approved / Registered" },
  { value: "applied", label: "Application in progress" },
  { value: "not_approved", label: "Not registered / Not approved" },
  { value: "not_applicable", label: "Not applicable" },
  { value: "unsure", label: "Unsure / Under review" },
]

export const NGO_PARTNER_TYPES = [
  "Donor / Philanthropic Foundation",
  "Corporate CSI / ESD",
  "Government Department (e.g. DSD, DBE, DOH)",
  "International Development Agency",
  "Partner Non-Profit / NGO",
  "Higher Education / Research Institution",
  "Faith-Based Organisation",
  "Private Individual Benefactor",
  "Other",
]

/**
 * Robust detection helper for NGO mode
 * Returns true if the organisation should be rendered with the NGO profile experience.
 */
export const checkIsNGO = (formData, user) => {
  // 1. URL Dev Bypass or sessionStorage flag
  if (typeof window !== "undefined") {
    const search = window.location.search || ""
    if (search.includes("role=ngo") || search.includes("ngo=true")) {
      return true
    }
    if (search.includes("role=sme") || search.includes("sme=true")) {
      return false
    }
    if (sessionStorage.getItem("ngoDevMode") === "true") {
      return true
    }
    if (sessionStorage.getItem("ngoDevMode") === "false") {
      return false
    }
  }

  // 2. User account role
  const userRole = user?.role || ""
  const roleArray = Array.isArray(user?.roleArray) ? user.roleArray : []
  if (
    userRole === "NonProfit" ||
    userRole === "NGO" ||
    roleArray.includes("NonProfit") ||
    roleArray.includes("NGO")
  ) {
    return true
  }

  // 3. Form Data: Entity Type
  const entityType = formData?.entityOverview?.entityType || ""
  if (
    entityType === "NGO" ||
    entityType === "NGO / Non-profit organisation" ||
    entityType === "Non-profit organisation"
  ) {
    return true
  }

  // 4. Form Data: Legal Structure
  const legalStructure = formData?.entityOverview?.legalStructure || ""
  const ngoStructures = ["NPC", "Trust", "Voluntary association", "Foreign non-profit entity"]
  if (ngoStructures.includes(legalStructure)) {
    return true
  }

  return false
}
