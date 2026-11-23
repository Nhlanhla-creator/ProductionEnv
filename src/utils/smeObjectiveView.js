export const SME_OBJECTIVE_VIEW_EVENT = "sme-objective-view-change"
export const SME_OBJECTIVE_VIEW_STORAGE_KEY = "sme-objective-show-everything"

const BASE_PROFILE_SECTIONS = [
  "instructions",
  "entityOverview",
  "contactDetails",
  "documents",
  "declarationConsent",
]

const CREDIBILITY_PROFILE_SECTIONS = [
  ...BASE_PROFILE_SECTIONS,
  "productsServices",
  "ownershipManagement",
  "legalCompliance",
  "operationsOverview",
  "financialOverview",
  "governance",
]

const CREDIBILITY_DOCUMENTS = [
  "B-BBEE Certificate",
  "CV",
  "Client References & Support Letters",
  "COIDA Letter of Good Standing",
  "Company Letterhead",
  "Company Profile / Brochure",
  "Company Registration Certificate",
  "Conflict of Interest Policy",
  "Disciplinary & Grievance Policy",
  "Employee Code of Conduct",
  "Ethics Policy",
  "Financial Statements",
  "Health & Safety Policy",
  "IDs of Directors & Shareholders",
  "Industry Accreditations",
  "Leave Policy",
  "Loan Agreements",
  "Performance Review Policy",
  "Proof of Address",
  "Share Register",
  "Tax Clearance Certificate",
  "Termination Policy",
  "Whistleblowing Policy",
]

const DOCUMENT_CATEGORIES = {
  Funding: [
    "5 Year Budget",
    "Bank Details Confirmation Letter",
    "Financial Statements",
    "Loan Agreements",
  ],
  Compliance: [
    "Company Registration Certificate",
    "Tax Clearance Certificate",
    "B-BBEE Certificate",
    "Bank Details Confirmation Letter",
    "COIDA Letter of Good Standing",
    "Proof of Address",
    "Company Profile / Brochure",
  ],
  Legitimacy: [
    "Client References & Support Letters",
    "Company Profile / Brochure",
  ],
  Leadership: ["CV"],
  Governance: [
    "IDs of Directors & Shareholders",
    "Share Register",
    "Employment Contract",
    "Non-Disclosure Agreement (NDA)",
    "Employee Code of Conduct",
    "Memorandum of Understanding (MOU)",
    "Supplier Contracts",
    "Ethics Policy",
    "Whistleblowing Policy",
    "Leave Policy",
    "Disciplinary & Grievance Policy",
    "Health & Safety Policy",
    "Privacy & Data Protection Policy",
    "Remote Work Policy",
    "Conflict of Interest Policy",
    "Intellectual Property Protection",
    "Social Media Use Policy",
    "Expense Reimbursement Policy",
    "Overtime & Compensation Policy",
    "Termination Policy",
    "Performance Review Policy",
  ],
  Operations: ["Industry Accreditations"],
  "Capital Appeal": [
    "Financial Statements",
    "5 Year Budget",
    "Business Plan",
    "Pitch Deck",
    "Loan Agreements",
    "Guarantee/Collateral",
  ],
}

const createConfig = ({
  key,
  title,
  menuIds,
  menuSubItemIds = [],
  includeAllChildren = [],
  profileSections,
  applicationScopes = [],
  documentLabels,
  documentCategories = {},
}) => ({
  key,
  title,
  menuIds: new Set(menuIds),
  menuSubItemIds: new Set(menuSubItemIds),
  includeAllChildren: new Set(includeAllChildren),
  profileSections: new Set(profileSections),
  applicationScopes: new Set(applicationScopes),
  documentLabels: new Set(documentLabels),
  documentCategories: Object.fromEntries(
    Object.entries(documentCategories).map(([category, labels]) => [
      category,
      new Set(labels),
    ])
  ),
})

const OBJECTIVE_CONFIGS = {
  credibility: createConfig({
    key: "credibility",
    title: "credibility",
    menuIds: ["home", "profile", "documents", "dashboard", "insights"],
    profileSections: CREDIBILITY_PROFILE_SECTIONS,
    documentLabels: CREDIBILITY_DOCUMENTS,
    documentCategories: {
      Compliance: DOCUMENT_CATEGORIES.Compliance,
      Financial: ["Financial Statements", "Loan Agreements"],
      Governance: DOCUMENT_CATEGORIES.Governance,
      Legitimacy: DOCUMENT_CATEGORIES.Legitimacy,
      Leadership: [
        "CV",
        "IDs of Directors & Shareholders",
        "Share Register",
      ],
      Operations: [
        "Client References & Support Letters",
        "Industry Accreditations",
        "Supplier Contracts",
      ],
    },
  }),
  capital: createConfig({
    key: "capital",
    title: "capital and funding",
    menuIds: ["home", "profile", "documents", "dashboard", "insights"],
    menuSubItemIds: [
      "funding-programs",
      "funder-matches",
      "growth-tools",
      "raps",
      "raps-actions",
    ],
    profileSections: CREDIBILITY_PROFILE_SECTIONS,
    applicationScopes: ["funding"],
    documentLabels: [
      ...CREDIBILITY_DOCUMENTS,
      "5 Year Budget",
      "Bank Details Confirmation Letter",
      "Business Plan",
      "Guarantee/Collateral",
      "Loan Agreements",
      "Pitch Deck",
      "Supplier Contracts",
    ],
    documentCategories: {
      ...DOCUMENT_CATEGORIES,
      Financial: DOCUMENT_CATEGORIES.Funding,
    },
  }),
  customer: createConfig({
    key: "customer",
    title: "customer readiness",
    menuIds: ["home", "profile", "documents", "dashboard", "insights"],
    menuSubItemIds: [
      "products-services",
      "customer-matches",
      "growth-tools",
      "raps",
      "raps-actions",
    ],
    profileSections: [
      ...BASE_PROFILE_SECTIONS,
      "productsServices",
      "ownershipManagement",
      "legalCompliance",
      "operationsOverview",
      "financialOverview",
      "governance",
    ],
    applicationScopes: ["product"],
    documentLabels: [
      "B-BBEE Certificate",
      "Client References & Support Letters",
      "COIDA Letter of Good Standing",
      "Company Profile / Brochure",
      "Company Registration Certificate",
      "Conflict of Interest Policy",
      "Employee Code of Conduct",
      "Financial Statements",
      "Health & Safety Policy",
      "Industry Accreditations",
      "Privacy & Data Protection Policy",
      "Proof of Address",
      "Supplier Contracts",
      "Tax Clearance Certificate",
    ],
    documentCategories: {
      Compliance: DOCUMENT_CATEGORIES.Compliance,
      Governance: DOCUMENT_CATEGORIES.Governance,
      Legitimacy: DOCUMENT_CATEGORIES.Legitimacy,
      Leadership: ["CV"],
      Operations: [
        "Client References & Support Letters",
        "Health & Safety Policy",
        "Industry Accreditations",
        "Supplier Contracts",
      ],
    },
  }),
  seller: createConfig({
    key: "seller",
    title: "marketplace seller",
    menuIds: ["home", "profile", "documents", "insights"],
    menuSubItemIds: ["products-services", "customer-matches"],
    profileSections: [
      ...BASE_PROFILE_SECTIONS,
      "brandAssets",
      "productsServices",
      "legalCompliance",
    ],
    applicationScopes: ["product"],
    documentLabels: [
      "B-BBEE Certificate",
      "Company Profile / Brochure",
      "Company Registration Certificate",
      "Industry Accreditations",
      "Proof of Address",
      "Tax Clearance Certificate",
    ],
    documentCategories: {
      Compliance: DOCUMENT_CATEGORIES.Compliance,
      Legitimacy: DOCUMENT_CATEGORIES.Legitimacy,
      Operations: DOCUMENT_CATEGORIES.Operations,
    },
  }),
  programme: createConfig({
    key: "programme",
    title: "programmes and support",
    menuSubItemIds: ["support-matches", "raps", "raps-actions"],
    menuIds: ["home", "profile", "documents", "dashboard", "insights", "growth-tools"],
    profileSections: [
      ...BASE_PROFILE_SECTIONS,
      "brandAssets",
      "productsServices",
      "ownershipManagement",
      "legalCompliance",
      "operationsOverview",
      "financialOverview",
      "governance",
    ],
    documentLabels: [
      ...CREDIBILITY_DOCUMENTS,
      "5 Year Budget",
      "Business Plan",
      "Pitch Deck",
      "Supplier Contracts",
    ],
    documentCategories: DOCUMENT_CATEGORIES,
  }),
  advisor: createConfig({
    key: "advisor",
    title: "advisor and board support",
    menuIds: ["home", "profile", "documents", "dashboard", "insights"],
    menuSubItemIds: [
      "advisors",
      "advisor-matches",
      "growth-tools",
      "raps",
      "raps-actions",
    ],
    profileSections: [
      ...BASE_PROFILE_SECTIONS,
      "productsServices",
      "ownershipManagement",
      "legalCompliance",
      "governance",
    ],
    applicationScopes: ["advisory"],
    documentLabels: [
      "Company Profile / Brochure",
      "Company Registration Certificate",
      "Conflict of Interest Policy",
      "IDs of Directors & Shareholders",
      "Share Register",
    ],
    documentCategories: {
      Compliance: ["Company Registration Certificate"],
      Governance: DOCUMENT_CATEGORIES.Governance,
      Legitimacy: DOCUMENT_CATEGORIES.Legitimacy,
      Leadership: ["CV", "IDs of Directors & Shareholders", "Share Register"],
    },
  }),
  intern: createConfig({
    key: "intern",
    title: "intern and project talent",
    menuIds: ["home", "profile", "documents", "dashboard", "insights"],
    menuSubItemIds: [
      "interns",
      "intern-matches",
      "growth-tools",
      "raps",
      "raps-actions",
    ],
    profileSections: [
      ...BASE_PROFILE_SECTIONS,
      "productsServices",
      "ownershipManagement",
      "legalCompliance",
      "operationsOverview",
      "governance",
    ],
    applicationScopes: ["intern"],
    documentLabels: [
      "Company Profile / Brochure",
      "Company Registration Certificate",
      "Employee Code of Conduct",
      "Employment Contract",
      "Health & Safety Policy",
      "Privacy & Data Protection Policy",
      "Proof of Address",
      "Supplier Contracts",
    ],
    documentCategories: {
      Compliance: DOCUMENT_CATEGORIES.Compliance,
      Governance: DOCUMENT_CATEGORIES.Governance,
      Operations: [
        "Health & Safety Policy",
        "Supplier Contracts",
      ],
    },
  }),
  digital: createConfig({
    key: "digital",
    title: "digital management",
    menuIds: [
      "home",
      "profile",
      "documents",
      "dashboard",
      "insights",
      "growth-tools",
    ],
    includeAllChildren: ["growth-tools"],
    profileSections: CREDIBILITY_PROFILE_SECTIONS,
    documentLabels: [
      ...CREDIBILITY_DOCUMENTS,
      "5 Year Budget",
      "Business Plan",
      "Employment Contract",
      "Health & Safety Policy",
      "Privacy & Data Protection Policy",
      "Supplier Contracts",
    ],
    documentCategories: DOCUMENT_CATEGORIES,
  }),
  compliance: createConfig({
    key: "compliance",
    title: "legitimacy and compliance",
    menuIds: ["home", "profile", "documents", "insights"],
    menuSubItemIds: ["growth-tools", "raps", "raps-actions"],
    profileSections: [
      ...BASE_PROFILE_SECTIONS,
      "productsServices",
      "legalCompliance",
    ],
    documentLabels: [
      "B-BBEE Certificate",
      "COIDA Letter of Good Standing",
      "Company Profile / Brochure",
      "Company Registration Certificate",
      "Conflict of Interest Policy",
      "Disciplinary & Grievance Policy",
      "Employee Code of Conduct",
      "Ethics Policy",
      "Health & Safety Policy",
      "Industry Accreditations",
      "Leave Policy",
      "Performance Review Policy",
      "Proof of Address",
      "Tax Clearance Certificate",
      "Termination Policy",
      "Whistleblowing Policy",
    ],
    documentCategories: {
      Compliance: DOCUMENT_CATEGORIES.Compliance,
      Governance: DOCUMENT_CATEGORIES.Governance,
      Legitimacy: DOCUMENT_CATEGORIES.Legitimacy,
      Operations: DOCUMENT_CATEGORIES.Operations,
    },
  }),
  guided: createConfig({
    key: "guided",
    title: "guided recommendations",
    menuIds: ["home", "profile"],
    profileSections: [
      "instructions",
      "entityOverview",
      "contactDetails",
      "declarationConsent",
    ],
    documentLabels: [
      "Company Profile / Brochure",
      "Company Registration Certificate",
      "Proof of Address",
    ],
    documentCategories: {},
  }),
  sourcing: createConfig({
    key: "sourcing",
    title: "supplier sourcing",
    menuIds: ["home", "profile", "documents"],
    menuSubItemIds: ["supplier-matches"],
    profileSections: [
      ...BASE_PROFILE_SECTIONS,
      "productsServices",
      "legalCompliance",
      "operationsOverview",
    ],
    documentLabels: [
      "Company Profile / Brochure",
      "Company Registration Certificate",
      "Client References & Support Letters",
      "Proof of Address",
      "Supplier Contracts",
    ],
    documentCategories: {
      Compliance: ["Company Registration Certificate", "Proof of Address"],
      Legitimacy: DOCUMENT_CATEGORIES.Legitimacy,
      Operations: ["Client References & Support Letters", "Supplier Contracts"],
    },
  }),
  services: createConfig({
    key: "services",
    title: "professional services",
    menuIds: ["home", "profile", "documents", "insights"],
    menuSubItemIds: ["products-services", "customer-matches", "advisor-matches"],
    profileSections: [
      ...BASE_PROFILE_SECTIONS,
      "brandAssets",
      "productsServices",
      "ownershipManagement",
      "legalCompliance",
    ],
    applicationScopes: ["product"],
    documentLabels: [
      "Company Profile / Brochure",
      "Company Registration Certificate",
      "CV",
      "Industry Accreditations",
      "Proof of Address",
      "Tax Clearance Certificate",
    ],
    documentCategories: {
      Compliance: DOCUMENT_CATEGORIES.Compliance,
      Leadership: DOCUMENT_CATEGORIES.Leadership,
      Legitimacy: DOCUMENT_CATEGORIES.Legitimacy,
      Operations: DOCUMENT_CATEGORIES.Operations,
    },
  }),
}

const OBJECTIVE_ALIASES = {
  readiness: "credibility",
  credibility: "credibility",
  o1: "credibility",
  funding: "capital",
  capital: "capital",
  o2: "capital",
  "corporate-customers": "customer",
  customer: "customer",
  o3: "customer",
  "sell-b2b": "seller",
  seller: "seller",
  o4: "seller",
  "join-programme": "programme",
  programme: "programme",
  programmes: "programme",
  o5: "programme",
  "find-advisor": "advisor",
  advisor: "advisor",
  o6: "advisor",
  "recruit-intern": "intern",
  intern: "intern",
  o7: "intern",
  "improve-execution": "digital",
  "digital-management": "digital",
  digital: "digital",
  o8: "digital",
  "compliance-fix": "compliance",
  "compliance-maintain": "compliance",
  compliance: "compliance",
  legitimacy: "compliance",
  o9: "compliance",
  "not-sure": "guided",
  guided: "guided",
  o10: "guided",
  "find-suppliers": "sourcing",
  sourcing: "sourcing",
  "offer-services": "services",
  services: "services",
}

export const CREDIBILITY_PROFILE_SECTION_IDS = new Set(
  CREDIBILITY_PROFILE_SECTIONS
)

export const getObjectiveViewConfig = (objectiveId) => {
  if (typeof objectiveId !== "string") return null
  const key = OBJECTIVE_ALIASES[objectiveId.trim().toLowerCase()]
  return key ? OBJECTIVE_CONFIGS[key] : null
}

export const isCredibilityObjective = (objectiveId) =>
  getObjectiveViewConfig(objectiveId)?.key === "credibility"

export const filterMenuForCredibilityObjective = (menuItems) =>
  filterMenuForObjective(menuItems, "credibility")

export const filterMenuForObjective = (menuItems, objectiveId) => {
  const config = getObjectiveViewConfig(objectiveId)
  if (!config) return menuItems

  const alwaysVisible = new Set(["messages", "settings"])
  const allowedIds = new Set([
    ...config.menuIds,
    ...config.menuSubItemIds,
    ...alwaysVisible,
  ])
  const filterItems = (items) =>
    items.reduce((visible, item) => {
      const subItems = item.subItems
        ? config.includeAllChildren.has(item.id)
          ? item.subItems
          : filterItems(item.subItems)
        : undefined
      if (allowedIds.has(item.id) || subItems?.length) {
        const objectiveRoute =
          item.id === "applications" && !allowedIds.has(item.id)
            ? subItems?.[0]?.route
            : undefined
        visible.push({
          ...item,
          ...(objectiveRoute ? { route: objectiveRoute } : {}),
          ...(item.subItems ? { subItems } : {}),
        })
      }
      return visible
    }, [])

  return filterItems(menuItems)
}

export const filterProfileSectionsForCredibilityObjective = (sections) =>
  filterProfileSectionsForObjective(sections, "credibility")

export const filterProfileSectionsForObjective = (sections, objectiveId) => {
  const profileSectionIds = getObjectiveViewConfig(objectiveId)?.profileSections
  if (!profileSectionIds) return sections
  return sections.filter((section) => profileSectionIds.has(section.id))
}

export const getObjectiveDocumentLabels = (objectiveId) =>
  getObjectiveViewConfig(objectiveId)?.documentLabels || null

export const getObjectiveDocumentCategories = (objectiveId) =>
  getObjectiveViewConfig(objectiveId)?.documentCategories || null

export const isApplicationAllowedForObjective = (objectiveId, pathname) => {
  const config = getObjectiveViewConfig(objectiveId)
  if (!config) return true

  const path = pathname.toLowerCase()
  let scope = null
  if (path.startsWith("/applications/funding") || path.startsWith("/funding-new")) {
    scope = "funding"
  } else if (
    path.startsWith("/applications/product") ||
    path.startsWith("/applications/products-services")
  ) {
    scope = "product"
  } else if (
    path.startsWith("/applications/advisory") ||
    path.startsWith("/applications/advisors")
  ) {
    scope = "advisory"
  } else if (
    path.startsWith("/applications/intern") ||
    path.startsWith("/applications/interns")
  ) {
    scope = "intern"
  }

  return !scope || config.applicationScopes.has(scope)
}

export const getObjectiveViewStorageKey = (userId) =>
  userId ? `${SME_OBJECTIVE_VIEW_STORAGE_KEY}:${userId}` : null
