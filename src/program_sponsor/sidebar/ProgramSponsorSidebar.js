import Sidebar from "../../components/profile/sidebar/Sidebar"
import { programSponsorMenuItems } from "../../config/menuConfig"

function ProgramSponsorSidebar() {
  return (
    <Sidebar
      menuItems={programSponsorMenuItems}
      portalTitle="Program Sponsor Portal"
      userCollection="programSponsorProfiles"
      userNameField="formData.entityOverview.organizationName"
      storageKey="programSponsorSidebarCollapsed"
    />
  )
}

export default ProgramSponsorSidebar