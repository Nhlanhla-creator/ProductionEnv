// components/associator/AssociatorSidebar.jsx (or wherever you want to place it)
import Sidebar from "../../components/profile/sidebar/Sidebar";
import { useUserProfile } from "../../hooks/useUserProfile";
import { associatorMenuItems } from "../../config/menuConfig";

function AssociatorSidebar() {
  const { userName } = useUserProfile(
    "associatorProfiles",
    "formData.contactDetails.primaryContactName",
    "Associator Portal"
  );

  return (
    <Sidebar
      menuItems={associatorMenuItems}
      userName={userName}
      portalTitle="Associator Portal"
      storageKey="associatorSidebarCollapsed"
    />
  );
}

export default AssociatorSidebar;