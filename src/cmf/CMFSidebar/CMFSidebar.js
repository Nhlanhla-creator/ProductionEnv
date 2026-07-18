import Sidebar from "../../components/profile/sidebar/Sidebar"
import { useUserProfile } from "../../hooks/useUserProfile"
import { capitalMarketFacilitatorMenuItems } from "../../config/menuConfig"
import { auth } from "../../firebaseConfig"

function CMFSidebar() {
  const userId = auth.currentUser?.uid
  const customDocId = userId ? `${userId}_cmf` : null

  const { userName } = useUserProfile(
    "MyuniversalProfiles",
    "formData.entityOverview.registeredName",
    "Facilitator",
    customDocId
  )

  return (
    <Sidebar
      menuItems={capitalMarketFacilitatorMenuItems}
      userName={userName}
      portalTitle="CMF Dashboard"
      userCollection="MyuniversalProfiles"
      userNameField="formData.entityOverview.registeredName"
      storageKey="cmfSidebarCollapsed"
      customDocId={customDocId}
    />
  )
}

export default CMFSidebar
