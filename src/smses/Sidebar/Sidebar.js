// File: src/smses/Sidebar/Sidebar.jsx
import { useState, useEffect } from "react"
import Sidebar from "../../components/profile/sidebar/Sidebar"
import { useUserProfile } from "../../hooks/useUserProfile"
import { smeMenuItems } from "../../config/menuConfig"

// ─── What an outside viewer can reach ───────────────────────────────────────
// "profile" and "documents" are now standalone top-level items.
// "growth-tools" carries both RAPs and Operations (digital twin) as nested
// submenus.
const VIEWER_MENU_IDS = ["dashboard", "growth-tools", "profile", "documents"]

const CMF_VIEWER_MENU_IDS = [
  "profile",
  "documents",
  "dashboard",
  "applications",
  "matches",
  "growth-tools",
  "insights",
  "messages",
  "calendar",
  "billing",
]

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

  useEffect(() => {
    const investorViewMode = sessionStorage.getItem("investorViewMode")
    const smeId = sessionStorage.getItem("viewingSMEId")
    const smeName = sessionStorage.getItem("viewingSMEName")
    const viewOrigin = sessionStorage.getItem("viewOrigin")

    if (investorViewMode === "true" && smeId) {
      setIsInvestorView(true)
      setViewingSMEName(smeName || "SME")

      const allowedIds = new Set(
        viewOrigin === "cmf" ? CMF_VIEWER_MENU_IDS : VIEWER_MENU_IDS
      )

      const visible = smeMenuItems.filter((item) => allowedIds.has(item.id))
      setFilteredMenuItems(visible.length > 0 ? visible : smeMenuItems)

      // Expand growth suite + RAPs + Operations so nested items are visible.
      setAutoExpandMenus({
        "growth-tools": true,
        raps: true,
        operations: true,
      })
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