import Sidebar from "../../components/profile/sidebar/Sidebar"
import { useUserProfile } from "../../hooks/useUserProfile"
import { investorMenuItems } from "../../config/menuConfig"

function InvestorSidebar() {
  const isViewerMode =
    (sessionStorage.getItem("investorViewMode") === "true" || sessionStorage.getItem("viewOrigin") === "cmf") &&
    sessionStorage.getItem("viewingSMEId")
  const customDocId = isViewerMode ? sessionStorage.getItem("viewingSMEId") : null
  const viewingName = isViewerMode ? sessionStorage.getItem("viewingSMEName") : null

  const { userName } = useUserProfile(
    "MyuniversalProfiles",
    "formData.fundManageOverview.registeredName",
    viewingName || "Company",
    customDocId
  )

  const displayedMenuItems = isViewerMode
    ? investorMenuItems.filter((item) => item.id !== "home")
    : investorMenuItems

  return (
    <Sidebar
      menuItems={displayedMenuItems}
      userName={userName}
      portalTitle="Investor Portal"
      storageKey="investorSidebarCollapsed"
    />
  )
}

export default InvestorSidebar