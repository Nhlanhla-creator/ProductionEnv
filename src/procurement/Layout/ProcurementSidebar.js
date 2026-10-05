import Sidebar from "../../components/profile/sidebar/Sidebar"
import { procurementMenuItems } from "../../config/menuConfig"

function ProcurementSidebar() {
  return (
    <Sidebar
      menuItems={procurementMenuItems}
      portalTitle="Procurement Portal"
      userCollection="universalProfiles"
      userNameField="entityOverview.registeredName"
      storageKey="procurementSidebarCollapsed"
    />
  )
}

export default ProcurementSidebar
