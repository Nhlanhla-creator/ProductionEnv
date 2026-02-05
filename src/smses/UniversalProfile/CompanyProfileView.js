// src/smses/CompanyProfileView/CompanyProfileView.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import UniversalProfile from "../UniversalProfile/UniversalProfile";

const CompanyProfileView = () => {
  const { userId } = useParams();
  const { companyMembers, permissions } = useCompany();
  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        // If no userId specified, use current user
        setLoading(false);
        return;
      }

      try {
        // Check if user is in the same company
        const isTeamMember = companyMembers.some(member => member.id === userId);
        
        if (!isTeamMember) {
          console.error("User is not in your company");
          return;
        }

        // Fetch user data
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setTargetUser({
            id: userId,
            ...userSnap.data()
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId, companyMembers]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!permissions.canViewUniversalProfile) {
    return (
      <div className="unauthorized">
        <h2>Access Denied</h2>
        <p>You don't have permission to view this profile.</p>
      </div>
    );
  }

  // Render UniversalProfile in company view mode
  return (
    <div className="company-profile-view">
      {targetUser && (
        <div className="profile-header">
          <h1>Viewing: {targetUser.username || targetUser.email}'s Profile</h1>
          <p className="view-mode-notice">You are viewing this profile in company mode</p>
        </div>
      )}
      <UniversalProfile 
        companyAccess={true} 
        viewingUserId={userId || undefined}
      />
    </div>
  );
};

export default CompanyProfileView;