export const roleRoutes = {
  Investor: "/investor-profile",
  SME: "/profile",
  SMSE: "/profile",
  SMEs: "/profile",
  SMSEs: "/profile",
  Business:"/profile",
  "Small and Medium Social Enterprises": "/profile",
  "SME/BUSINESS": "/profile",
  NonProfit:"/profile",
  Advisor: "/advisor-profile",
  Advisors: "/advisor-profile",
  Catalyst: "/support-profile",
  Catalysts: "/support-profile",
  Accelerators: "/support-profile",
  "Program Sponsor": "/program-sponsor-profile",
  ProgramSponsor: "/program-sponsor-profile",
  Intern: "/intern-profile",
  Interns: "/intern-profile",
  Associator: "/associator-profile",
  ASSOCIATOR: "/associator-profile",
  associators:"/associator-profile",
  associator: "/associator-profile",
  "Capital and Market Facilitator": "/cmf-profile",
  "Capital and Market Facilitators": "/cmf-profile",
  "Capital Market Facilitator": "/cmf-profile",
  "Capital Market Facilitators": "/cmf-profile",
  "CapitalMarketFacilitator": "/cmf-profile",
  "CapitalMarketFacilitators": "/cmf-profile",
  CMF: "/cmf-profile",
  cmf: "/cmf-profile",
  "CMF Dashboard": "/cmf-profile",
  Facilitator: "/cmf-profile",
  Facilitators: "/cmf-profile",
  "Investor Portal": "/investor-profile",
  "Intern Dashboard": "/intern-profile",
  "Advisor Portal": "/advisor-profile",
  "Catalyst Dashboard": "/support-profile",
  "SMSE Dashboard": "/profile",
  "Associator Portal": "/associator-profile",
  "Procurement Portal": "/procurement/profile",
  Procurement: "/procurement/profile",
  "Procurement Manager": "/procurement/profile",
  Buyer: "/procurement/profile",
}

// Available role options for each profile type
export const profileRoleOptions = {
  investor: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern", "Associator", "Capital and Market Facilitator"],
  intern: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern", "Associator", "Capital and Market Facilitator"],
  advisor: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern", "Associator", "Capital and Market Facilitator"],
  catalyst: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern", "Associator", "Capital and Market Facilitator"],
  sme: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern", "Associator", "Capital and Market Facilitator"],
  programSponsor: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern", "ProgramSponsor", "Associator", "Capital and Market Facilitator"],
  associator: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern", "ProgramSponsor", "Associator", "Capital and Market Facilitator"],
  capitalMarketFacilitator: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern", "Associator", "Capital and Market Facilitator"],
  procurement: ["Procurement", "SMSEs", "Advisors", "Catalysts", "Investor", "ProgramSponsor"],
}

// Profile-specific configurations
export const headerProfiles = {
  investor: {
    collection: "MyuniversalProfiles",
    nameField: "formData.contactDetails.primaryContactName",
    logoField: "formData.entityOverview.companyLogo",
    portalName: "Investor Portal",
    fallbackName: "Company",
  },
  intern: {
    collection: "internProfiles",
    nameField: "formData.personalOverview.fullName",
    logoField: "formData.entityOverview.companyLogo",
    portalName: "Intern Dashboard",
    fallbackName: "Intern",
  },
  advisor: {
    collection: "advisorProfiles",
    nameField: "formData.entityOverview.registeredName",
    logoField: "formData.entityOverview.companyLogo",
    portalName: "Advisor Portal",
    fallbackName: "Advisor",
  },
  catalyst: {
    collection: "catalystProfiles",
    nameField: "formData.entityOverview.registeredName",
    logoField: "formData.entityOverview.companyLogo",
    portalName: "Catalyst Dashboard",
    fallbackName: "Catalyst",
  },
  sme: {
    collection: "universalProfiles",
    nameField: "contactDetails.contactName",
    logoField: "entityOverview.companyLogo",
    portalName: "SMSE Dashboard",
    fallbackName: "Company",
  },
  programSponsor: {
    collection: "programSponsorProfiles",
    nameField: "formData.contactDetails.primaryContactName",
    logoField: "formData.entityOverview.companyLogo",
    portalName: "Program Sponsor",
    fallbackName: "Program Sponsor",
  },
  associator: {
    collection: "associatorProfiles",
    nameField: "formData.contactDetails.primaryContactName",
    logoField: "formData.entityOverview.companyLogo",
    portalName: "Associator Portal",
    fallbackName: "Associator",
  },
  capitalMarketFacilitator: {
    collection: "MyuniversalProfiles",
    nameField: "formData.entityOverview.registeredName",
    logoField: "formData.entityOverview.companyLogo",
    portalName: "CMF Dashboard",
    fallbackName: "Facilitator",
  },
  procurement: {
    collection: "universalProfiles",
    nameField: "entityOverview.registeredName",
    logoField: "entityOverview.companyLogo",
    portalName: "Procurement Portal",
    fallbackName: "Procurement Lead",
  },
}

const normKey = (s) => String(s || "").toLowerCase().replace(/[^a-z]/g, "")
const routeByNormKey = Object.fromEntries(
  Object.entries(roleRoutes).map(([k, v]) => [normKey(k), v])
)

export const getRoleRoute = (role) =>
  roleRoutes[role] || routeByNormKey[normKey(role)] || null

const CANONICAL_ALIASES = {
  admin: "admin", administrator: "admin", superadmin: "admin",
  sme: "sme", smes: "sme", smse: "sme", smses: "sme", business: "sme", businesses: "sme", npo: "sme", npos: "sme", corporate: "sme", corporates: "sme", smsedashboard: "sme",
  investor: "investor", investors: "investor", funder: "investor", funders: "investor", investorportal: "investor",
  catalyst: "catalyst", catalysts: "catalyst", support: "catalyst", supportprogram: "catalyst", accelerator: "catalyst", accelerators: "catalyst", incubator: "catalyst", catalystdashboard: "catalyst",
  advisor: "advisor", advisors: "advisor", adviser: "advisor", advisers: "advisor", mentor: "advisor", mentors: "advisor", advisorportal: "advisor",
  intern: "intern", interns: "intern", graduate: "intern", interndashboard: "intern",
  programsponsor: "programsponsor", programsponsors: "programsponsor", sponsor: "programsponsor",
  associator: "associator", associators: "associator", association: "associator", associatorportal: "associator",
  cmf: "cmf", cmfs: "cmf", capitalmarketfacilitator: "cmf", capitalmarketfacilitators: "cmf", capitalandmarketfacilitator: "cmf", capitalandmarketfacilitators: "cmf", capitalmarketsfacilitator: "cmf", marketfacilitator: "cmf", facilitator: "cmf", facilitators: "cmf", cmfdashboard: "cmf",
  procurement: "procurement", buyer: "procurement", procurementportal: "procurement",
}

export const isSameRole = (a, b) => {
  if (!a || !b) return false
  if (a === b) return true
  const ra = getRoleRoute(a)
  const rb = getRoleRoute(b)
  if (ra && rb && ra === rb) return true
  const na = normKey(a)
  const nb = normKey(b)
  if (na === nb) return true
  const ca = CANONICAL_ALIASES[na]
  const cb = CANONICAL_ALIASES[nb]
  if (ca && cb && ca === cb) return true
  return false
}

export const hasRole = (list, role) => (list || []).some((r) => isSameRole(r, role))