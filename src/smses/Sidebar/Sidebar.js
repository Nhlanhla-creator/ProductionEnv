// File: src/smses/Sidebar/Sidebar.jsx
import { useState, useEffect } from "react"
import Sidebar from "../../components/profile/sidebar/Sidebar"
import { useUserProfile } from "../../hooks/useUserProfile"
import { smeMenuItems } from "../../config/menuConfig"
import { filterSmeMenuItems } from "../../utils/sme-access"
import { useSmeAccess } from "../SMEAccess"
import { useSmeObjectiveView } from "../../hooks/useSmeObjectiveView"
import {
  filterMenuForObjective,
  getObjectiveViewConfig,
} from "../../utils/smeObjectiveView"

// ─── What an outside viewer can reach ───────────────────────────────────────
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
  const [filteredMenuItems, setFilteredMenuItems] = useState([])
  const [autoExpandMenus, setAutoExpandMenus] = useState({})
  const { loading: accessLoading, error: accessError, isCompanyMember, permissions } = useSmeAccess()
  const {
    primaryObjective,
    showEverything,
    setShowEverything,
    loading: objectiveLoading,
  } = useSmeObjectiveView()
  const objectiveViewActive =
    !objectiveLoading &&
    !accessLoading &&
    !accessError &&
    !isInvestorView &&
    !isCompanyMember &&
    !showEverything &&
    Boolean(getObjectiveViewConfig(primaryObjective))
  const objectiveViewAvailable =
    !objectiveLoading &&
    !accessLoading &&
    !accessError &&
    !isInvestorView &&
    !isCompanyMember &&
    Boolean(getObjectiveViewConfig(primaryObjective))

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
      setFilteredMenuItems(visible)

      // Expand growth suite + RAPs + Operations so nested items are visible.
      setAutoExpandMenus({
        "growth-tools": true,
        raps: true,
        operations: true,
      })
    } else if (accessError) {
      setIsInvestorView(false)
      setFilteredMenuItems([])
      setAutoExpandMenus({})
    } else if (accessLoading) {
      setIsInvestorView(false)
      setFilteredMenuItems([])
      setAutoExpandMenus({})
    } else if (isCompanyMember) {
      setIsInvestorView(false)
      setFilteredMenuItems(filterSmeMenuItems(smeMenuItems, permissions?.sidebarSections || []))
      setAutoExpandMenus({})
    } else {
      setIsInvestorView(false)
      setFilteredMenuItems(
        objectiveViewActive
          ? filterMenuForObjective(smeMenuItems, primaryObjective)
          : smeMenuItems
      )
      setAutoExpandMenus({})
    }
  }, [
    accessError,
    accessLoading,
    isCompanyMember,
    permissions,
    primaryObjective,
    objectiveViewActive,
  ])

  return (
    <Sidebar
      menuItems={filteredMenuItems}
      userName={isInvestorView ? viewingSMEName : userName}
      portalTitle="SMSE Dashboard"
      storageKey="smeSidebarCollapsed"
      autoExpandMenus={autoExpandMenus}
      enableNested={true}
      objectiveViewControl={
        objectiveViewAvailable
          ? {
              label: showEverything
                ? `Focus on ${getObjectiveViewConfig(primaryObjective)?.title}`
                : "Show everything",
              onClick: () => setShowEverything(!showEverything),
            }
          : null
      }
    />
  )
}

export default SMESidebar