import { smeMenuItems } from "../config/menuConfig"

export const SME_PROFILE_SECTIONS = [
  { id: "instructions", label: "Instructions" },
  { id: "entityOverview", label: "Entity Overview" },
  { id: "brandAssets", label: "Brand Assets" },
  { id: "productsServices", label: "Products & Services" },
  { id: "ownershipManagement", label: "Ownership & Management" },
  { id: "legalCompliance", label: "Legal & Compliance" },
  { id: "operationsOverview", label: "Operations Overview" },
  { id: "financialOverview", label: "Financial Overview" },
  { id: "governance", label: "ESG Overview" },
  { id: "contactDetails", label: "Contact Details" },
  { id: "documents", label: "Document Upload" },
  { id: "declarationConsent", label: "Declaration & Consent" },
]

const flattenMenu = (items, depth = 0) => items.flatMap((item) => [
  { id: item.id, label: item.label, depth },
  ...(item.subItems ? flattenMenu(item.subItems, depth + 1) : []),
])

export const SME_ACCESS_OPTIONS = flattenMenu(smeMenuItems)
const allSidebarSections = SME_ACCESS_OPTIONS.map(({ id }) => id)
const allProfileSections = SME_PROFILE_SECTIONS.map(({ id }) => id)
const sectionIds = new Set(allSidebarSections)

const roleSidebarSections = {
  owner: allSidebarSections,
  companyadmin: ["profile", "documents", "dashboard", "applications", "matches", "growth-tools", "insights", "messages", "calendar", "billing", "settings"],
  manager: ["profile", "documents", "dashboard", "applications", "matches", "growth-tools", "insights", "messages", "calendar", "settings"],
  employee: ["profile", "documents", "dashboard", "applications", "matches", "messages", "calendar", "settings"],
  viewer: ["profile", "documents", "dashboard", "settings"],
}

const descendantsById = new Map()
const indexDescendants = (items) => {
  for (const item of items) {
    const descendants = (item.subItems || []).flatMap((child) => [
      child.id,
      ...(child.subItems || []).flatMap((grandchild) => [grandchild.id, ...(grandchild.subItems || []).map((nested) => nested.id)]),
    ])
    descendantsById.set(item.id, descendants)
    if (item.subItems) indexDescendants(item.subItems)
  }
}
indexDescendants(smeMenuItems)

export const expandSmeSidebarSections = (sections = []) => {
  const selected = new Set(sections.filter((id) => sectionIds.has(id)))
  sections.forEach((id) => (descendantsById.get(id) || []).forEach((childId) => selected.add(childId)))
  return allSidebarSections.filter((id) => selected.has(id))
}

export const createDefaultSmeAccessPermissions = (role = "employee") => ({
  sidebarSections: expandSmeSidebarSections(roleSidebarSections[role] || roleSidebarSections.viewer),
  profileSections: [...allProfileSections],
})

export const resolveSmeAccessPermissions = (role, savedPermissions) => {
  if (
    savedPermissions &&
    (Array.isArray(savedPermissions.sidebarSections) || Array.isArray(savedPermissions.profileSections))
  ) {
    const defaults = createDefaultSmeAccessPermissions(role)
    return {
      sidebarSections: Array.isArray(savedPermissions.sidebarSections)
        ? expandSmeSidebarSections(savedPermissions.sidebarSections)
        : defaults.sidebarSections,
      profileSections: Array.isArray(savedPermissions.profileSections)
        ? savedPermissions.profileSections.filter((id) => allProfileSections.includes(id))
        : defaults.profileSections,
    }
  }
  return createDefaultSmeAccessPermissions(role)
}

export const canAccessSmeSection = (permissions, sectionId) =>
  Boolean(
    permissions?.sidebarSections?.includes(sectionId) ||
    (descendantsById.get(sectionId) || []).some((id) => permissions?.sidebarSections?.includes(id))
  )

export const filterSmeMenuItems = (items, sidebarSections) => items.reduce((visible, item) => {
  const subItems = item.subItems
    ? filterSmeMenuItems(item.subItems, sidebarSections)
    : undefined
  if (sidebarSections.includes(item.id) || subItems?.length) {
    visible.push({ ...item, ...(item.subItems ? { subItems } : {}) })
  }
  return visible
}, [])

export const getSmeRouteForSection = (sectionId) => {
  const findRoute = (items) => {
    for (const item of items) {
      if (item.id === sectionId && item.route && item.route !== "#") return item.route
      if (item.subItems) {
        const route = findRoute(item.subItems)
        if (route) return route
      }
    }
    return null
  }
  return findRoute(smeMenuItems)
}

const routeAliases = [
  ["/documents", "profile"],
  ["/find-matches", "matches"],
  ["/opportunity-matches", "matches"],
  ["/funding-new", "funding-programs"],
  ["/digital-twin", "operations"],
  ["/growth-suite-landing", "growth-tools"],
  ["/growth/my-tools", "growth-tools"],
  ["/growth/shop", "growth-tools"],
  ["/raps-overview", "overall-health"],
  ["/intern-matches-page", "intern-matches"],
  ["/intern-dealflow-page", "intern-matches"],
  ["/intern-insights-page", "intern-matches"],
  ["/intern-table-page", "intern-matches"],
  ["/applications/product", "products-services"],
  ["/applications/advisory", "advisors"],
  ["/applications/intern", "interns"],
]

export const getSmeSectionForPath = (pathname) => {
  const path = pathname.toLowerCase()
  const matchingOptions = SME_ACCESS_OPTIONS
    .filter(({ id }) => {
      const findItem = (items) => items.some((item) =>
        item.id === id && item.route && item.route !== "#" &&
        (path === item.route.toLowerCase() || path.startsWith(`${item.route.toLowerCase()}/`))
        || item.subItems && findItem(item.subItems)
      )
      return findItem(smeMenuItems)
    })
    .map(({ id }) => id)
  if (matchingOptions.length) return matchingOptions[matchingOptions.length - 1]

  const alias = routeAliases.find(([route]) => path === route || path.startsWith(`${route}/`))
  if (alias) return alias[1]
  if (path === "/") return "home"
  return null
}
