import {
  filterMenuForCredibilityObjective,
  filterMenuForObjective,
  filterProfileSectionsForCredibilityObjective,
  filterProfileSectionsForObjective,
  getObjectiveDocumentCategories,
  getObjectiveDocumentLabels,
  getObjectiveViewConfig,
  isApplicationAllowedForObjective,
  isCredibilityObjective,
} from "./smeObjectiveView"

const menu = [
  { id: "home" },
  { id: "profile" },
  { id: "documents" },
  {
    id: "applications",
    route: "/applications",
    subItems: [
      { id: "products-services", route: "/applications/products-services" },
      { id: "funding-programs", route: "/applications/funding" },
      { id: "advisors", route: "/applications/advisors" },
      { id: "interns", route: "/applications/interns" },
    ],
  },
  {
    id: "matches",
    subItems: [
      { id: "customer-matches" },
      { id: "supplier-matches" },
      { id: "funder-matches" },
      { id: "support-matches" },
      { id: "advisor-matches" },
      { id: "intern-matches" },
    ],
  },
  { id: "growth-tools", subItems: [{ id: "raps", subItems: [{ id: "raps-actions" }] }] },
  { id: "dashboard" },
  { id: "insights" },
  { id: "messages" },
  { id: "settings" },
  { id: "calendar" },
]

describe("SME objective views", () => {
  test.each(["readiness", "credibility", "O1"])(
    "recognizes %s as the credibility objective",
    (objectiveId) => {
      expect(isCredibilityObjective(objectiveId)).toBe(true)
    }
  )

  test("does not apply an objective view when no recognized objective is set", () => {
    expect(getObjectiveViewConfig("")).toBeNull()
    expect(getObjectiveViewConfig("unrecognized")).toBeNull()
    expect(filterMenuForObjective(menu, "")).toBe(menu)
  })

  test("keeps credibility profile sections and omits unrelated brand assets", () => {
    const sections = [
      { id: "instructions" },
      { id: "entityOverview" },
      { id: "brandAssets" },
      { id: "productsServices" },
      { id: "financialOverview" },
    ]

    expect(
      filterProfileSectionsForCredibilityObjective(sections).map(({ id }) => id)
    ).toEqual([
      "instructions",
      "entityOverview",
      "productsServices",
      "financialOverview",
    ])
  })

  test.each([
    ["funding", "capital", "funding"],
    ["corporate-customers", "customer", "product"],
    ["sell-b2b", "seller", "product"],
    ["join-programme", "programme", null],
    ["find-advisor", "advisor", "advisory"],
    ["recruit-intern", "intern", "intern"],
    ["improve-execution", "digital", null],
    ["compliance-fix", "compliance", null],
    ["compliance-maintain", "compliance", null],
    ["not-sure", "guided", null],
    ["find-suppliers", "sourcing", null],
    ["offer-services", "services", "product"],
  ])("maps signup objective %s to the %s view", (objectiveId, key, scope) => {
    const config = getObjectiveViewConfig(objectiveId)
    expect(config.key).toBe(key)
    expect(config.applicationScopes.has(scope)).toBe(scope !== null)
  })

  test("narrows profile requirements and documents by objective", () => {
    const sections = [
      { id: "entityOverview" },
      { id: "productsServices" },
      { id: "financialOverview" },
      { id: "legalCompliance" },
      { id: "governance" },
    ]
    expect(
      filterProfileSectionsForObjective(sections, "funding").map(({ id }) => id)
    ).toContain("financialOverview")
    expect(
      filterProfileSectionsForObjective(sections, "compliance-fix").map(({ id }) => id)
    ).not.toContain("financialOverview")

    expect(getObjectiveDocumentLabels("funding")).toContain("5 Year Budget")
    expect(getObjectiveDocumentLabels("readiness")).not.toContain("Business Plan")
    expect(
      getObjectiveDocumentCategories("join-programme")["Capital Appeal"]
    ).toContain("Business Plan")
  })

  test.each([
    "readiness",
    "capital",
    "customer",
    "seller",
    "programme",
    "advisor",
    "intern",
    "digital",
    "compliance",
    "guided",
    "sourcing",
    "services",
  ])(
    "keeps Messages and Settings in the %s sidebar",
    (objectiveId) => {
      const visibleIds = filterMenuForObjective(menu, objectiveId).map(({ id }) => id)
      expect(visibleIds).toContain("messages")
      expect(visibleIds).toContain("settings")
    }
  )

  test("shows only the selected objective's nested service links", () => {
    const customerItems = filterMenuForObjective(menu, "corporate-customers")
    expect(customerItems.find(({ id }) => id === "matches").subItems.map(({ id }) => id)).toEqual([
      "customer-matches",
    ])
    expect(customerItems.find(({ id }) => id === "applications").subItems.map(({ id }) => id)).toEqual([
      "products-services",
    ])
    expect(customerItems.find(({ id }) => id === "applications").route).toBe(
      "/applications/products-services"
    )

    const fundingItems = filterMenuForObjective(menu, "funding")
    expect(fundingItems.find(({ id }) => id === "applications").route).toBe(
      "/applications/funding"
    )

    const supplierItems = filterMenuForObjective(menu, "find-suppliers")
    expect(supplierItems.find(({ id }) => id === "matches").subItems.map(({ id }) => id)).toEqual([
      "supplier-matches",
    ])

    expect(filterMenuForObjective(menu, "sell-b2b").map(({ id }) => id)).not.toContain(
      "dashboard"
    )
    expect(filterMenuForObjective(menu, "compliance-fix").map(({ id }) => id)).not.toContain(
      "dashboard"
    )
    expect(filterMenuForObjective(menu, "readiness").map(({ id }) => id)).toContain(
      "dashboard"
    )
  })

  test("allows only application scopes relevant to the selected objective", () => {
    expect(isApplicationAllowedForObjective("funding", "/applications/funding")).toBe(true)
    expect(isApplicationAllowedForObjective("funding", "/applications/product")).toBe(false)
    expect(isApplicationAllowedForObjective("find-advisor", "/applications/advisory")).toBe(true)
    expect(isApplicationAllowedForObjective("find-advisor", "/applications/intern")).toBe(false)
    expect(isApplicationAllowedForObjective("", "/applications/funding")).toBe(true)
  })

  test("keeps the existing credibility helper aligned with the general filter", () => {
    expect(
      filterMenuForCredibilityObjective(menu).map(({ id }) => id)
    ).toEqual(filterMenuForObjective(menu, "readiness").map(({ id }) => id))
    expect(
      filterProfileSectionsForCredibilityObjective([{ id: "contactDetails" }])
    ).toEqual(
      filterProfileSectionsForObjective([{ id: "contactDetails" }], "readiness")
    )
  })
})
