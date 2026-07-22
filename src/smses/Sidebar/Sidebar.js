// File: src/smses/Sidebar/Sidebar.jsx (or wherever your SMESidebar is located)
import { useState, useEffect } from "react"
import Sidebar from "../../components/profile/sidebar/Sidebar"
import { useUserProfile } from "../../hooks/useUserProfile"
import { smeMenuItems } from "../../config/menuConfig"

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
    // FIX: this flag (set by SupportSMETable.jsx's "Open BIG Score Page"
    // action) means the catalyst was sent specifically to /dashboard to
    // view BIG Score — not to Growth Suite. The filter below used to
    // unconditionally show only the "growth-tools" item for *any*
    // investor-view session, which is exactly why the Dashboard/BIG Score
    // nav item disappeared even though that's the page actually being
    // viewed: the sidebar was filtering it out.
    const viewOnlyBigScore = sessionStorage.getItem("viewOnlyBigScore") === "true"

    if (investorViewMode === "true" && smeId) {
      setIsInvestorView(true)
      setViewingSMEName(smeName || "SME")
      console.log("Investor view mode activated for SME:", smeId)

      if (viewOnlyBigScore) {
        // The SME menu's Dashboard/BIG Score entry is { id: "dashboard",
        // label: "My BIG Score", route: "/dashboard" } — match it exactly.
        const dashboardItem = smeMenuItems.find((item) => item.id === "dashboard")
        setFilteredMenuItems(dashboardItem ? [dashboardItem] : smeMenuItems)
        setAutoExpandMenus({})
      } else {
        // Filter to only show Growth Suite for investors
        setFilteredMenuItems(smeMenuItems.filter((item) => item.id === "growth-tools"))

        // Auto-expand My Growth Suite for investors
        setAutoExpandMenus({ "growth-tools": true,
           "raps": true,
        })
      }
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
  );
}

export default SMESidebar