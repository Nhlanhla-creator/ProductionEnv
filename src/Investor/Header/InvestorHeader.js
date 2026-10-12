import Header from "../../components/profile/header/Header"
import InvestorNotifications from "../NotificationInvestor"
import { useHeaderProfile } from "../../hooks/useHeaderProfile"
import { useMessages } from "../../hooks/useMessages"
import { useRoles } from "../../hooks/useRoles"
import { headerProfiles, profileRoleOptions } from "../../config/headerConfig"

function InvestorHeader() {
  const config = headerProfiles.investor

  const isViewerMode =
    (sessionStorage.getItem("investorViewMode") === "true" || sessionStorage.getItem("viewOrigin") === "cmf") &&
    sessionStorage.getItem("viewingSMEId")
  const customDocId = isViewerMode ? sessionStorage.getItem("viewingSMEId") : null
  const viewingName = isViewerMode ? sessionStorage.getItem("viewingSMEName") : null

  const { user, userName, profileLogo, profileData } = useHeaderProfile(
    config.collection,
    config.nameField,
    config.logoField,
    viewingName || config.fallbackName,
    customDocId
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