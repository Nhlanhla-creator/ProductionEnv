// File: src/smses/Sidebar/Sidebar.jsx
import { useState, useEffect } from "react"
import { Boxes, Rocket, BarChart3, Truck, Wrench, Upload } from "lucide-react"
import Sidebar from "../../components/profile/sidebar/Sidebar"
import { useUserProfile } from "../../hooks/useUserProfile"
import { smeMenuItems } from "../../config/menuConfig"

// ─── What an outside viewer can reach ───────────────────────────────────────
const VIEWER_MENU_IDS = ["dashboard", "growth-tools", "documents"]

const CMF_VIEWER_MENU_IDS = [
  "profile",
  "dashboard",
  "applications",
  "matches",
  "growth-tools",
  "insights",
  "documents",
  "messages",
  "calendar",
  "billing",
]

// ─── Operations — the digital twin entry point ──────────────────────────────
// The shared Sidebar component reads:
//   - item.hasSubmenu  (boolean)  → renders as expandable parent
//   - item.subItems    (array)    → the child menu items
//   - item.route       (string)   → where clicking navigates
//   - item.label       (string)   → display text
//   - item.icon        (JSX)      → the leading icon
//
// NOTE: This menu is intentionally NOT in VIEWER_MENU_IDS or
// CMF_VIEWER_MENU_IDS — facilitators/catalysts/investors reviewing an
// SME's account do not operate the twin.
const OPERATIONS_MENU = {
  id: "operations",
  label: "Operations",
  icon: <Boxes size={18} />,
  hasSubmenu: true,
  route: "/digital-twin/dashboard",
  subItems: [
    { id: "operations-setup",    label: "Setup Guide",    route: "/digital-twin/setup",     icon: <Rocket size={16} /> },
    { id: "operations-overview", label: "Command Centre", route: "/digital-twin/dashboard", icon: <BarChart3 size={16} /> },
    { id: "operations-assets",   label: "My Assets",      route: "/digital-twin/assets",    icon: <Truck size={16} /> },
    { id: "operations-downtime", label: "Downtime",       route: "/digital-twin/downtime",  icon: <Wrench size={16} /> },
    { id: "operations-imports",  label: "Data Imports",   route: "/digital-twin/imports",   icon: <Upload size={16} /> },
  ],
}
function injectOperations(items) {
  // Place Operations right after "dashboard" so it sits naturally in the
  // SME's working menus. Falls back to the top if "dashboard" isn't found.
  const idx = items.findIndex((i) => i.id === "dashboard")
  const next = [...items]
  next.splice(idx >= 0 ? idx + 1 : 0, 0, OPERATIONS_MENU)
  return next
}

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

      setAutoExpandMenus({ "growth-tools": true, raps: true })
    } else {
      // Normal SME view — inject the Operations menu.
      setFilteredMenuItems(injectOperations(smeMenuItems))
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