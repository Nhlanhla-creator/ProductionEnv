import Sidebar from "../../components/profile/sidebar/Sidebar"
import { useUserProfile } from "../../hooks/useUserProfile"
import { investorMenuItems } from "../../config/menuConfig"

function InvestorSidebar() {
  const { userName } = useUserProfile(
    "MyuniversalProfiles",
    "formData.fundManageOverview.registeredName",
    "Company"
  )

  return (
    <Sidebar
      menuItems={investorMenuItems}
      userName={userName}
      portalTitle="Investor Portal"
      storageKey="investorSidebarCollapsed"
    />
  )
}

export default InvestorSidebar