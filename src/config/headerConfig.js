export const roleRoutes = {
  Investor: "/investor-profile",
  SMEs: "/profile",
  SMSEs: "/profile",
  "Small and Medium Social Enterprises": "/profile",
  "SME/BUSINESS": "/profile",
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
  associator: "/associator-profile",
}

// Available role options for each profile type
export const profileRoleOptions = {
  investor: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern", "Associator"],
  intern: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern", "Associator"],
  advisor: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern", "Associator"],
  catalyst: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern", "Associator"],
  sme: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern", "Associator"],
  programSponsor: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern", "ProgramSponsor", "Associator"],
  associator: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern", "ProgramSponsor", "Associator"],
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
}