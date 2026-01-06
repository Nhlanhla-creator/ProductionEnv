import Header from "../../components/profile/header/Header"
import InvestorNotifications from "../NotificationInvestor"
import { useHeaderProfile } from "../../hooks/useHeaderProfile"
import { useMessages } from "../../hooks/useMessages"
import { useRoles } from "../../hooks/useRoles"
import { headerProfiles, profileRoleOptions } from "../../config/headerConfig"

function InvestorHeader() {
  const config = headerProfiles.investor

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
      roleOptions={profileRoleOptions.investor}
      onAddRole={addRole}
      NotificationComponent={InvestorNotifications}
      userCollection={config.collection}
      logoField={config.logoField}
      enableAdvancedMessages={true}
      messagesRoute="/investor-messages"
      messageSenderCollection="MyuniversalProfiles"
    />
  )
}

export default InvestorHeader