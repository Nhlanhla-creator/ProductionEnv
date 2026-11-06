import React, { useEffect } from "react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import Header from "../../components/profile/header/Header"
import { useHeaderProfile } from "../../hooks/useHeaderProfile"
import { useMessages } from "../../hooks/useMessages"
import { useRoles } from "../../hooks/useRoles"
import { headerProfiles, profileRoleOptions } from "../../config/headerConfig"

function ProcurementHeader() {
  const config = headerProfiles.procurement || {
    collection: "universalProfiles",
    nameField: "contactDetails.contactName",
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
  const { availableRoles, selectedRole, addRole, removeRole } = useRoles()

  // Auto-prune accidental legacy roles for dedicated Procurement users
  useEffect(() => {
    if (user && availableRoles.includes("Procurement") && (availableRoles.includes("SMSEs") || availableRoles.includes("Corporate"))) {
      const cleaned = availableRoles.filter((r) => r !== "SMSEs" && r !== "Corporate")
      if (cleaned.length > 0) {
        updateDoc(doc(db, "users", user.uid), {
          role: cleaned.join(","),
          roleArray: cleaned,
          currentRole: "Procurement",
        }).catch((e) => console.warn("Role cleanup error:", e))
      }
    }
  }, [user, availableRoles])

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
