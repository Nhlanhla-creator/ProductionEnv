import Header from "../../components/profile/header/Header"
import CatalystNotifications from "../Notifications"
import { useHeaderProfile } from "../../hooks/useHeaderProfile"
import { useMessages } from "../../hooks/useMessages"
import { useRoles } from "../../hooks/useRoles"
import { headerProfiles, profileRoleOptions } from "../../config/headerConfig"

function CatalystHeader() {
  const config = headerProfiles.catalyst

  const { user, userName, profileLogo, profileData } = useHeaderProfile(
    config.collection,
    config.nameField,
    config.logoField,
    config.fallbackName
  )

  const { unreadCount } = useMessages(user)
  const { availableRoles, selectedRole, addRole } = useRoles()

  return (
    <Header
      user={user}
      userName={userName}
      profileLogo={profileLogo}
      profileData={profileData}
      unreadMessages={unreadCount}
      portalName={config.portalName}
      availableRoles={availableRoles}
      selectedRole={selectedRole}
      roleOptions={profileRoleOptions.catalyst}
      onAddRole={addRole}
      NotificationComponent={CatalystNotifications}
      userCollection={config.collection}
      logoField={config.logoField}
    />
  )
}

export default CatalystHeader