// structure/usersMpStructure.js

export const USERS_STRUCTURE = [
  {
    id: "sme-profiles",
    name: "SME Profiles",
    type: "folder",
    icon: "🏢",
    children: [
      { id: "sme-onboarding", name: "SME Onboarding", type: "file", icon: "📋", path: ["Users Marketplace", "SME Profiles", "SME Onboarding"] },
      { id: "sme-personas", name: "SME Personas", type: "file", icon: "👤", path: ["Users Marketplace", "SME Profiles", "SME Personas"] },
      { id: "sme-success-stories", name: "Success Stories", type: "file", icon: "⭐", path: ["Users Marketplace", "SME Profiles", "Success Stories"] },
    ]
  },
  {
    id: "investor-profiles",
    name: "Investor Profiles",
    type: "folder",
    icon: "💰",
    children: [
      { id: "investor-onboarding", name: "Investor Onboarding", type: "file", icon: "📋", path: ["Users Marketplace", "Investor Profiles", "Investor Onboarding"] },
      { id: "investor-personas", name: "Investor Personas", type: "file", icon: "👤", path: ["Users Marketplace", "Investor Profiles", "Investor Personas"] },
      { id: "investment-criteria", name: "Investment Criteria", type: "file", icon: "🎯", path: ["Users Marketplace", "Investor Profiles", "Investment Criteria"] },
    ]
  },
  {
    id: "catalyst-profiles",
    name: "Catalyst Profiles",
    type: "folder",
    icon: "🚀",
    children: [
      { id: "catalyst-onboarding", name: "Catalyst Onboarding", type: "file", icon: "📋", path: ["Users Marketplace", "Catalyst Profiles", "Catalyst Onboarding"] },
      { id: "catalyst-programs", name: "Catalyst Programs", type: "file", icon: "🎯", path: ["Users Marketplace", "Catalyst Profiles", "Catalyst Programs"] },
    ]
  },
  {
    id: "advisor-profiles",
    name: "Advisor Profiles",
    type: "folder",
    icon: "👨‍🏫",
    children: [
      { id: "advisor-onboarding", name: "Advisor Onboarding", type: "file", icon: "📋", path: ["Users Marketplace", "Advisor Profiles", "Advisor Onboarding"] },
      { id: "advisor-expertise", name: "Advisor Expertise", type: "file", icon: "🎓", path: ["Users Marketplace", "Advisor Profiles", "Advisor Expertise"] },
    ]
  },
  {
    id: "user-guides",
    name: "User Guides & Documentation",
    type: "folder",
    icon: "📚",
    children: [
      { id: "user-manuals", name: "User Manuals", type: "file", icon: "📘", path: ["Users Marketplace", "User Guides & Documentation", "User Manuals"] },
      { id: "faq", name: "FAQ", type: "file", icon: "❓", path: ["Users Marketplace", "User Guides & Documentation", "FAQ"] },
      { id: "training-materials", name: "Training Materials", type: "file", icon: "🎓", path: ["Users Marketplace", "User Guides & Documentation", "Training Materials"] },
    ]
  }
];