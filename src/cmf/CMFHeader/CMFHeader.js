import Header from "../../components/profile/header/Header"
import { profileRoleOptions } from "../../config/headerConfig"
import { auth } from "../../firebaseConfig"

function CMFHeader() {
  const userId = auth.currentUser?.uid
  const customDocId = userId ? `${userId}_cmf` : null

  return (
    <Header
      userCollection="cmfProfiles"
      userNameField="formData.entityOverview.registeredName"
      logoField="formData.entityOverview.companyLogo"
      portalName="CMF Dashboard"
      roleOptions={profileRoleOptions.capitalMarketFacilitator}
      enableAdvancedMessages={true}
      messagesRoute="/cmf-messages"
      messageSenderCollection="cmfProfiles"
      customDocId={customDocId}
    />
  )
}

export default CMFHeader
