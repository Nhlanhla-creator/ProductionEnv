// utils/migrateUsersToCompanies.js
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export const migrateExistingSMSEsToCompanies = async () => {
  try {
    // Get all SMSE users
    const usersQuery = query(
      collection(db, "users"),
      where("roleArray", "array-contains", "SMSEs")
    );
    
    const usersSnap = await getDocs(usersQuery);
    
    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      
      // Skip if already has company
      if (userData.companyId) continue;
      
      // Create company for this user
      const companyId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
      
      // Create company document
      await setDoc(doc(db, "companies", companyId), {
        name: userData.companyName || `${userData.username}'s Company`,
        createdBy: userDoc.id,
        createdAt: new Date().toISOString(),
        members: [{
          userId: userDoc.id,
          email: userData.email,
          role: 'owner',
          joinedAt: new Date().toISOString()
        }],
        settings: {
          canViewUniversalProfile: true,
          canEditUniversalProfile: true,
          canShareUniversalProfile: true,
          canInviteMembers: true,
          canRemoveMembers: true,
          canChangeMemberRoles: true,
          canViewFinancials: true,
          canEditFinancials: true
        }
      });
      
      // Update user with company reference
      await updateDoc(doc(db, "users", userDoc.id), {
        companyId: companyId,
        userRole: 'owner'
      });
      
      console.log(`Created company ${companyId} for user ${userDoc.id}`);
    }
  } catch (error) {
    console.error("Migration error:", error);
  }
};