import Header from "../../components/profile/header/Header"
import Notifications from '../../Notifications'
import { useHeaderProfile } from "../../hooks/useHeaderProfile"
import { useMessages } from "../../hooks/useMessages"
import { useRoles } from "../../hooks/useRoles"
import { headerProfiles, profileRoleOptions } from "../../config/headerConfig"

function SMSEHeader({ sidebarCollapsed }) {
  const config = headerProfiles.sme

  const { user, userName, profileLogo, profileData } = useHeaderProfile(
    config.collection,
    config.nameField,
    config.logoField,
    config.fallbackName
  )

  const { unreadCount } = useMessages(user)
  const { availableRoles, selectedRole, addRole } = useRoles()

  // Custom CSS class for SMSE layout
  const smseClassName = sidebarCollapsed ? 'sidebar-collapsed' : ''

  return (
    <div className={smseClassName}>
      <Header
        user={user}
        userName={userName}
        profileLogo={profileLogo}
        profileData={profileData}
        unreadMessages={unreadCount}
        portalName={config.portalName}
        availableRoles={availableRoles}
        selectedRole={selectedRole}
        roleOptions={["Investor", "Advisor", "Catalyst", "Program Sponsor", "Intern"]} // Original SMSE options
        onAddRole={addRole}
        NotificationComponent={Notifications}
        userCollection={config.collection}
        logoField={config.logoField}
        enableAdvancedMessages={true}
        messagesRoute="/messages"
        messageSenderCollection="MyuniversalProfiles"
      />
    </div>
  )
}

export default SMSEHeader