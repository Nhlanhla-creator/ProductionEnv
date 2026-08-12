// File: src/smses/Sidebar/Sidebar.jsx (or wherever your SMESidebar is located)
import { useState, useEffect } from "react"
import Sidebar from "../../components/profile/sidebar/Sidebar"
import { useUserProfile } from "../../hooks/useUserProfile"
import { smeMenuItems } from "../../config/menuConfig"

// ─── What an outside viewer can reach ───────────────────────────────────────
// While a catalyst / investor / facilitator is viewing an SME's account, the
// sidebar is narrowed to the screens their cohorts table can actually send
// them to. That set is now driven by one list instead of a per-case filter,
// because the per-case version was the bug: it kept only "growth-tools", so
// "View Documents" navigated correctly to /my-documents but arrived with no
// Documents entry in the menu — the page rendered under a sidebar that had
// filtered its own destination out.
//
// The three ids below map 1:1 onto the three row actions:
//   Open BIG Score Page → dashboard     (/dashboard)
//   Open Growth Suite   → growth-tools  (/overall-company-health et al)
//   View Documents      → documents     (/my-documents)
//
// Keep this in sync with the quick-actions menus in MyCohorts — if an action
// is added there, its menu id belongs here, or the destination will load
// under a sidebar that can't represent it.
const VIEWER_MENU_IDS = ["dashboard", "growth-tools", "documents"]

// A facilitator additionally reviews the business's own profile, so they get
// one extra entry on top of the shared set.
const CMF_EXTRA_MENU_IDS = ["profile"]

function SMESidebar() {
  const [isInvestorView, setIsInvestorView] = useState(false)
  const [viewingSMEName, setViewingSMEName] = useState("")
  const [filteredMenuItems, setFilteredMenuItems] = useState(smeMenuItems)
  const [autoExpandMenus, setAutoExpandMenus] = useState({})

  const { userName } = useUserProfile(
    "universalProfiles",
    "entityOverview.registeredName",
    "Company"
  )

  // Check for investor view mode
  useEffect(() => {
    const investorViewMode = sessionStorage.getItem("investorViewMode")
    const smeId = sessionStorage.getItem("viewingSMEId")
    const smeName = sessionStorage.getItem("viewingSMEName")
    const viewOrigin = sessionStorage.getItem("viewOrigin")

    if (investorViewMode === "true" && smeId) {
      setIsInvestorView(true)
      setViewingSMEName(smeName || "SME")

      const allowedIds = new Set(
        viewOrigin === "cmf" ? [...VIEWER_MENU_IDS, ...CMF_EXTRA_MENU_IDS] : VIEWER_MENU_IDS
      )

      // filter() preserves smeMenuItems' own order, so the viewer sees the
      // same sequence the SME does — just fewer entries.
      const visible = smeMenuItems.filter((item) => allowedIds.has(item.id))
      setFilteredMenuItems(visible.length > 0 ? visible : smeMenuItems)

      // Growth Suite holds its children behind a collapsed parent, so it's
      // expanded on arrival — otherwise landing on /overall-company-health
      // shows a collapsed menu with nothing marked active.
      setAutoExpandMenus({ "growth-tools": true, raps: true })
    } else {
      setFilteredMenuItems(smeMenuItems)
      setAutoExpandMenus({})
    }
  }, [])

  return (
    <Sidebar
      menuItems={filteredMenuItems}
      userName={isInvestorView ? viewingSMEName : userName}
      portalTitle="SMSE Dashboard"
      storageKey="smeSidebarCollapsed"
      autoExpandMenus={autoExpandMenus}
      enableNested={true}
    />
  )
}

export default SMESidebar