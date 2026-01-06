import Sidebar from "../../components/profile/sidebar/Sidebar"
import { useUserProfile } from "../../hooks/useUserProfile"
import { internMenuItems } from "../../config/menuConfig"

function InternSidebar() {
  const { userName } = useUserProfile(
    "internProfiles",
    "formData.personalOverview.fullName",
    "Intern"
  )

  return (
    <Sidebar
      menuItems={internMenuItems}
      userName={userName}
      portalTitle="Intern Dashboard"
      storageKey="internSidebarCollapsed"
    />
  )
}

export default InternSidebar