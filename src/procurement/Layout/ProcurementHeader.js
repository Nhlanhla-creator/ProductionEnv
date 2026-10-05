import Header from "../../components/profile/header/Header"
import { useHeaderProfile } from "../../hooks/useHeaderProfile"
import { useMessages } from "../../hooks/useMessages"
import { useRoles } from "../../hooks/useRoles"
import { headerProfiles, profileRoleOptions } from "../../config/headerConfig"

function ProcurementHeader() {
  const config = headerProfiles.procurement || {
    collection: "universalProfiles",
    nameField: "entityOverview.registeredName",
    logoField: "entityOverview.companyLogo",
    portalName: "Procurement Portal",
    fallbackName: "Procurement Lead",
  }

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
      roleOptions={profileRoleOptions.procurement}
      onAddRole={addRole}
      userCollection={config.collection}
      logoField={config.logoField}
      enableAdvancedMessages={false}
      messagesRoute="/procurement/interactions"
      messageSenderCollection="universalProfiles"
    />
  )
}

export default ProcurementHeader
