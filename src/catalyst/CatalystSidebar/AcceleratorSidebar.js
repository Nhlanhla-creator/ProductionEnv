import Sidebar from "../../components/profile/sidebar/Sidebar"
import { useUserProfile } from "../../hooks/useUserProfile"
import { catalystMenuItems } from "../../config/menuConfig"

function CatalystSidebar() {
  const { userName } = useUserProfile(
    "catalystProfiles",
    "formData.entityOverview.registeredName",
    "Accelerator Program"
  )

  return (
    <Sidebar
      menuItems={catalystMenuItems}
      userName={userName}
      portalTitle="Catalyst Dashboard"
      storageKey="catalystSidebarCollapsed"
    />
  )
}

export default CatalystSidebar