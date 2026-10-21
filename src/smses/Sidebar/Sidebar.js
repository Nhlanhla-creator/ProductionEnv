// File: src/smses/Sidebar/Sidebar.jsx
import { useState, useEffect } from "react"
import { Boxes, Rocket, BarChart3, Truck, Wrench, Upload } from "lucide-react"
import Sidebar from "../../components/profile/sidebar/Sidebar"
import { useUserProfile } from "../../hooks/useUserProfile"
import { smeMenuItems } from "../../config/menuConfig"

// ─── What an outside viewer can reach ───────────────────────────────────────
// NOTE: "documents" now lives inside profile.subItems, so we allow "profile"
// instead (and the shared Sidebar will show its submenu).
const VIEWER_MENU_IDS = ["dashboard", "growth-tools", "profile"]

const CMF_VIEWER_MENU_IDS = [
  "profile",
  "dashboard",
  "applications",
  "matches",
  "growth-tools",
  "insights",
  "messages",
  "calendar",
  "billing",
]

// ─── Operations — the digital twin entry point ──────────────────────────────
const OPERATIONS_MENU = {
  id: "operations",
  label: "Operations",
  icon: <Boxes size={18} />,
  hasSubmenu: true,
  route: "/digital-twin/dashboard",
  subItems: [
    { id: "operations-setup", label: "Setup Guide", route: "/digital-twin/setup", icon: <Rocket size={16} /> },
    { id: "operations-overview", label: "Command Centre", route: "/digital-twin/dashboard", icon: <BarChart3 size={16} /> },
    { id: "operations-assets", label: "My Assets", route: "/digital-twin/assets", icon: <Truck size={16} /> },
    { id: "operations-downtime", label: "Downtime", route: "/digital-twin/downtime", icon: <Wrench size={16} /> },
    { id: "operations-imports", label: "Data Imports", route: "/digital-twin/imports", icon: <Upload size={16} /> },
  ],
}

function injectOperations(items) {
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

      // Expand growth suite + RAPs so the nested Operational Performance shows.
      setAutoExpandMenus({ "growth-tools": true, raps: true })
    } else {
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