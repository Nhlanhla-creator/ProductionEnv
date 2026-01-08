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
  "Program Sponsor": "/sponsor-profile",
  ProgramSponsor: "/sponsor-profile",
  Intern: "/intern-profile",
  Interns: "/intern-profile",
}

// Available role options for each profile type
export const profileRoleOptions = {
  investor: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern"],
  intern: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern"],
  advisor: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern"],
  catalyst: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern"],
  sme: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern"],
  programSponsor: ["Investor", "SMSEs", "Advisors", "Catalysts", "Intern", "ProgramSponsor"]
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
    portalName: "Program Sponsor", // Shows in profile dropdown
    fallbackName: "Program Sponsor",
  }
}