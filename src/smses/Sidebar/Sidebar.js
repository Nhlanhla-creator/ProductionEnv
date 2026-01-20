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

    if (investorViewMode === "true" && smeId) {
      setIsInvestorView(true)
      setViewingSMEName(smeName || "SME")
      console.log("Investor view mode activated for SME:", smeId)

      // Filter to only show Growth Suite for investors
      setFilteredMenuItems(smeMenuItems.filter((item) => item.id === "growth-tools"))
      
      // Auto-expand My Growth Suite for investors
      setAutoExpandMenus({ "growth-tools": true })
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
    />
  )
}

export default SMESidebar