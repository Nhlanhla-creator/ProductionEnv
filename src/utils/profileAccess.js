// src/utils/profileAccess.js
export const checkProfileAccess = async (userId, targetUserId) => {
  // If accessing own profile, always allow
  if (userId === targetUserId) {
    return { canView: true, canEdit: true };
  }

  try {
    // Get current user's company info
    const userCompanyRef = doc(db, "users", userId, "userCompanies", "current");
    const userCompanySnap = await getDoc(userCompanyRef);
    
    if (!userCompanySnap.exists()) {
      return { canView: false, canEdit: false };
    }

    const userCompanyData = userCompanySnap.data();
    const userRole = userCompanyData.userRole;
    const companyId = userCompanyData.companyId;

    // Check if target user is in same company
    const targetUserRef = doc(db, "users", targetUserId);
    const targetUserSnap = await getDoc(targetUserRef);
    
    if (!targetUserSnap.exists()) {
      return { canView: false, canEdit: false };
    }

    const targetUserData = targetUserSnap.data();
    
    if (targetUserData.companyId !== companyId) {
      return { canView: false, canEdit: false };
    }

    // Check permissions based on role
    const permissions = getRolePermissions(userRole);
    
    return {
      canView: permissions.canViewUniversalProfile,
      canEdit: permissions.canEditUniversalProfile
    };

  } catch (error) {
    console.error("Error checking profile access:", error);
    return { canView: false, canEdit: false };
  }
};