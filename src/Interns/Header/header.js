import Header from "../../components/profile/header/Header"
import Notifications from '../Notification'
import { useHeaderProfile } from "../../hooks/useHeaderProfile"
import { useMessages } from "../../hooks/useMessages"
import { useRoles } from "../../hooks/useRoles"
import { headerProfiles, profileRoleOptions } from "../../config/headerConfig"

function InternHeader() {
  const config = headerProfiles.intern

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
      roleOptions={profileRoleOptions.intern}
      onAddRole={addRole}
      NotificationComponent={Notifications}
      userCollection={config.collection}
      logoField={config.logoField}
      enableAdvancedMessages={true}
      messagesRoute="/messages"
      messageSenderCollection="MyuniversalProfiles"
    />
  )
}

export default InternHeader