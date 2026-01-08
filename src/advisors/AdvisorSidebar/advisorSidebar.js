import Sidebar from "../../components/profile/sidebar/Sidebar"
import { useUserProfile } from "../../hooks/useUserProfile"
import { advisorMenuItems } from "../../config/menuConfig"

function AdvisorSidebar() {
  const { userName } = useUserProfile(
    "advisorProfiles",
    "formData.entityOverview.registeredName",
    "Advisor"
  )

  return (
    <Sidebar
      menuItems={advisorMenuItems}
      userName={userName}
      portalTitle="Advisor Portal"
      storageKey="advisorSidebarCollapsed"
    />
  )
}

export default AdvisorSidebar