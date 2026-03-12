"use client"

import { useState, useEffect } from "react"
import { auth, db } from '../../firebaseConfig';
import { 
  doc, getDoc, updateDoc, deleteDoc, 
  collection, addDoc, query, where, 
  getDocs, arrayUnion, arrayRemove 
} from "firebase/firestore"
import TwoFactorSetup from '../../TwoFactorSetup';

import { updatePassword, deleteUser } from "firebase/auth"
import { differenceInDays } from "date-fns"; 
export default function Settings() {
  const colors = {
    lightBrown: "#f5f0e1",
    mediumBrown: "#e6d7c3",
    accentBrown: "#c8b6a6",
    primaryBrown: "#a67c52",
    darkBrown: "#7d5a50",
    textBrown: "#4a352f",
    backgroundBrown: "#faf7f2",
    paleBrown: "#f0e6d9",
  }

  const [activeTab, setActiveTab] = useState("account")
  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    bio: "",
    notifications: false,
    sms: false,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    language: "en",
    timezone: "UTC",
    firstName: "",
    lastName: "",
  })
  const [invitations, setInvitations] = useState([]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteRoleConfirm, setShowDeleteRoleConfirm] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [userRoles, setUserRoles] = useState([]);
  const [roleListDeleted, setRoleListDeleted] = useState([]);
  const [deletedRoles, setDeletedRoles] = useState([])
  const [roleSelectionModal, setRoleSelectionModal] = useState({
    show: false,
    roles: [],
  });
  // Add these state variables with your other useState declarations
const [show2FASetup, setShow2FASetup] = useState(false);
const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
const [disabling2FA, setDisabling2FA] = useState(false);
// Add these with your existing state declarations
const [companyMembers, setCompanyMembers] = useState([]);
const [showAddMemberModal, setShowAddMemberModal] = useState(false);
const [inviteEmail, setInviteEmail] = useState("");
const [inviteRole, setInviteRole] = useState("employee");
const [companyId, setCompanyId] = useState(null);
const [isCompanyOwner, setIsCompanyOwner] = useState(false);
const [inviteLoading, setInviteLoading] = useState(false);
const [inviteSuccess, setInviteSuccess] = useState("");
const [inviteError, setInviteError] = useState("");

// Add this utility function
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const loadInvitations = async (companyId) => {
  try {
    const invitationsQuery = query(
      collection(db, "invitations"),
      where("companyId", "==", companyId),
      where("status", "==", "pending")
    );
    
    const invitationsSnapshot = await getDocs(invitationsQuery);
    const invitationsList = [];
    
    invitationsSnapshot.forEach((doc) => {
      invitationsList.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    setInvitations(invitationsList);
  } catch (error) {
    console.error("Error loading invitations:", error);
  }
};

// Add this useEffect to check 2FA status
useEffect(() => {
  const check2FAStatus = async () => {
    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTwoFactorEnabled(data?.twoFactorEnabled || false);
      }
    }
  };
  check2FAStatus();
}, []);

// Add handler for disabling 2FA
const handleDisable2FA = async () => {
  if (!window.confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
    return;
  }

  setDisabling2FA(true);
  try {
    const user = auth.currentUser;
    await updateDoc(doc(db, "users", user.uid), {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorSetupDate: null
    });
    setTwoFactorEnabled(false);
    alert('Two-factor authentication has been disabled.');
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    alert('Failed to disable 2FA. Please try again.');
  } finally {
    setDisabling2FA(false);
  }
};

// Handler for successful 2FA setup
const handle2FASetupSuccess = () => {
  setTwoFactorEnabled(true);
  alert('Two-factor authentication has been enabled successfully!');
};

// Call this in your useEffect when companyId changes
useEffect(() => {
  if (companyId) {
    loadInvitations(companyId);
    loadCompanyMembers(companyId);
  }
}, [companyId]);

  const getContainerStyles = () => ({
    minHeight: "100vh",
    padding: "0 2rem",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    transition: "margin-left 0.3s ease",
    boxSizing: "border-box",
  })

  useEffect(() => {
    const loadUser = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          // ✅ Set form data
          setFormData(prev => ({
            ...prev,
            email: data.email || "",
            phone: data.phone || "",
            notifications: data.notifications ?? true,
            marketingEmails: data.marketingEmails ?? false,
            darkMode: data.darkMode ?? false,
            language: data.language || "en",
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            twoFactorAuth: data.twoFactorAuth ?? false,
          }));

          // ✅ Set roles (handle both array and string formats)
          if (Array.isArray(data.roleArray)) {
            setUserRoles(data.roleArray);
          } else if (typeof data.role === "string") {
            setUserRoles(data.role.split(",").map(r => r.trim()));
          } else {
            setUserRoles([]); // fallback
          }
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };

    loadUser();
  }, []);

  const checkDeletedStatus = async (user) => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data.deletedAt) {
        const daysSinceDelete = differenceInDays(new Date(), new Date(data.deletedAt));

        if (daysSinceDelete < 30) {
          // Redirect to retrieve page
          window.location.href = "/retrieve-account";
        } else {
          // Hard delete after 30 days
          await deleteDoc(userRef);
          await deleteUser(user);
          alert("Your account has been permanently deleted.");
        }
      }
    }
  };

  const handleReset = () => {
    setFormData((prev) => ({
      ...prev,
      phone: "",
      notifications: true,
      marketingEmails: false,
      darkMode: false,
      language: "en",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      twoFactorAuth: false,
    }))
  }

  const handleDeleteRole = async () => {
    try {
      const user = auth.currentUser
      if (!user) return

      const userDocRef = doc(db, "users", user.uid)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        let roles = []

        if (userData.roleArray && Array.isArray(userData.roleArray)) {
          roles = userData.roleArray
        } else if (typeof userData.role === "string") {
          roles = userData.role.split(",").map((r) => r.trim())
        }

        setUserRoles(roles)
        setShowPopup(true)
      }
    } catch (error) {
      console.error("Error fetching user roles:", error)
      alert("Failed to fetch roles")
    }
  }

  const handleRoleClick = async (roleToDelete) => {
    try {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete the role "${roleToDelete}"?`
      );
      if (!confirmDelete) return;
  
      const user = auth.currentUser;
      if (!user) return;
  
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        alert("User profile not found.");
        return;
      }
  
      const userData = userDocSnap.data();
  
      // 1️⃣ Remove role from roleArray (active roles)
      let updatedRoleArray = [];
      if (userData.roleArray && Array.isArray(userData.roleArray)) {
        updatedRoleArray = userData.roleArray.filter(r => r !== roleToDelete);
      }
  
      // 2️⃣ Remove role from role string if it exists
      let updatedRoleString = "";
      if (userData.role && typeof userData.role === "string") {
        const rolesSplit = userData.role.split(",").map(r => r.trim());
        const filteredRoles = rolesSplit.filter(r => r !== roleToDelete);
        updatedRoleString = filteredRoles.join(",");
      }
  
      // 3️⃣ Add role to deletedRoles map with timestamp
      const updatedRolesMap = { ...(userData.roles || {}) };
      updatedRolesMap[roleToDelete] = {
        deletedStatus: true,
        deletedAt: Date.now(),
      };
  
      // 4️⃣ Update Firestore
      await updateDoc(userDocRef, {
        roleArray: updatedRoleArray,
        role: updatedRoleString,
        roles: updatedRolesMap,
      });
  
      alert(
        `Role "${roleToDelete}" has been soft-deleted. You can retrieve it within 30 days.`
      );
  
      // 5️⃣ Update local state
      setUserRoles(prev => prev.filter(r => r !== roleToDelete));
      setDeletedRoles(prev => [...prev, roleToDelete]);
  
    } catch (err) {
      console.error("Error deleting role:", err);
      alert("Failed to delete role. Please try again.");
    }
  };

  useEffect(() => {
  const loadUser = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // ✅ Set form data
        setFormData(prev => ({
          ...prev,
          email: data.email || "",
          phone: data.phone || "",
          notifications: data.notifications ?? true,
          marketingEmails: data.marketingEmails ?? false,
          darkMode: data.darkMode ?? false,
          language: data.language || "en",
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          twoFactorAuth: data.twoFactorAuth ?? false,
        }));

        // ✅ Set roles
        if (Array.isArray(data.roleArray)) {
          setUserRoles(data.roleArray);
        } else if (typeof data.role === "string") {
          setUserRoles(data.role.split(",").map(r => r.trim()));
        } else {
          setUserRoles([]);
        }

        // ✅ Load company data if user has company
        if (data.companyId) {
          setCompanyId(data.companyId);
          setIsCompanyOwner(data.userRole === 'owner');
          await loadCompanyMembers(data.companyId);
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  loadUser();
}, []);

// Function to load company members
const loadCompanyMembers = async (companyId) => {
  try {
    // Get company document
    const companyRef = doc(db, "companies", companyId);
    const companySnap = await getDoc(companyRef);
    
    if (companySnap.exists()) {
      const companyData = companySnap.data();
      
      // Get all users in this company
      const usersQuery = query(
        collection(db, "users"),
        where("companyId", "==", companyId)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const members = [];
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        members.push({
          id: doc.id,
          email: userData.email,
          username: userData.username,
          role: userData.userRole || 'employee',
          joinedAt: userData.createdAt || new Date().toISOString()
        });
      });
      
      setCompanyMembers(members);
    }
  } catch (error) {
    console.error("Error loading company members:", error);
  }
};
const handleInviteMember = async () => {
  if (!inviteEmail || !validateEmail(inviteEmail)) {
    setInviteError("Please enter a valid email address.");
    return;
  }

  setInviteLoading(true);
  setInviteError("");
  setInviteSuccess("");

  try {
    const user = auth.currentUser;
    if (!user || !companyId) {
      setInviteError("You need to be logged in and have a company.");
      return;
    }

    // Get company name
    const companyRef = doc(db, "companies", companyId);
    const companySnap = await getDoc(companyRef);
    if (!companySnap.exists()) {
      setInviteError("Company not found.");
      setInviteLoading(false);
      return;
    }
    const companyData = companySnap.data();

    // Check if user already exists with this email
    const usersQuery = query(
      collection(db, "users"),
      where("email", "==", inviteEmail)
    );
    const userSnapshot = await getDocs(usersQuery);

    if (!userSnapshot.empty) {
      // User exists, check if already in company
      const existingUser = userSnapshot.docs[0].data();
      if (existingUser.companyId === companyId) {
        setInviteError("This user is already a member of your company.");
        setInviteLoading(false);
        return;
      }
    }

    // Generate unique invitation code
    const invitationToken = Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15);

    // Create invitation - THIS WILL TRIGGER THE CLOUD FUNCTION
    const invitationData = {
      email: inviteEmail,
      companyId: companyId,
      companyName: companyData.name || "Your Company",
      role: inviteRole,
      invitedBy: user.uid,
      invitedByEmail: user.email,
      invitedByName: formData.firstName + " " + formData.lastName,
      status: 'pending',
      token: invitationToken,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      emailSent: false, // Will be updated by Cloud Function
      emailSentAt: null
    };

    // Add invitation document - this triggers the Firebase Function
    await addDoc(collection(db, "invitations"), invitationData);

    // Success message
    setInviteSuccess(`Invitation sent to ${inviteEmail}! The email should arrive shortly.`);
    setInviteEmail("");
    setInviteRole("employee");

    // Optional: Show invitation code for manual sharing
    console.log(`Invitation code: ${invitationToken}`);

  } catch (error) {
    console.error("Error inviting member:", error);
    setInviteError("Failed to create invitation. Please try again.");
  } finally {
    setInviteLoading(false);
  }
};

// Remove a team member
const handleRemoveMember = async (memberId) => {
  if (!window.confirm("Are you sure you want to remove this team member?")) {
    return;
  }

  try {
    if (!companyId) return;

    // Update user's companyId to null
    await updateDoc(doc(db, "users", memberId), {
      companyId: null,
      userRole: null
    });

    // Remove from company members array
    await updateDoc(doc(db, "companies", companyId), {
      members: arrayRemove(memberId)
    });

    // Refresh members list
    await loadCompanyMembers(companyId);

  } catch (error) {
    console.error("Error removing member:", error);
    alert("Failed to remove team member.");
  }
};

// Update member role
const handleUpdateRole = async (memberId, newRole) => {
  try {
    await updateDoc(doc(db, "users", memberId), {
      userRole: newRole
    });

    // Refresh members list
    await loadCompanyMembers(companyId);
    
  } catch (error) {
    console.error("Error updating role:", error);
    alert("Failed to update role.");
  }
};
  
 const handleDeleteAccount = async () => {
    const confirmAction = window.confirm(
      "⚠️ Account Deletion Request\n\n" +
      "Your account will be scheduled for deletion with a 30-day grace period.\n\n" +
      "During this time:\n" +
      "• Your data will be hidden from the platform\n" +
      "• You can recover your account anytime\n" +
      "• After 30 days, all data will be permanently deleted\n\n" +
      "Do you want to proceed?"
    );
    
    if (!confirmAction) return;

    setDeleteLoading(true);
    setDeleteMessage("");
    
    try {
      const user = auth.currentUser;
      if (!user) {
        setDeleteMessage("No user logged in.");
        return;
      }

      const userId = user.uid;
      const deletionTimestamp = Date.now();
      const hardDeleteDate = new Date(deletionTimestamp + 30 * 24 * 60 * 60 * 1000);

      // Collections that contain user data
      const collectionsToMark = [
        'advisorProfiles',
        'advisoryApplications',
        'aiAcademicEvaluation',
        'aiCaseStudyPrompts',
        'aiEvaluations',
        'aiFinancialEvaluations',
        'aiFundabilityEvaluations',
        'aiGovernanceEvaluation',
        'aiLeadershipEvaluation',
        'aiLegitimacyEvaluation',
        'aiPitchEvaluations',
        'aiPresentationEvaluation',
        'aiProfessionalSkillsEvaluation',
        'aiProfileEvaluations',
        'aiWorkExperienceEvaluation',
        'betaSignups',
        'bigEvaluations',
        'billingProfiles',
        'billingsAndPayments',
        'boardDirectors',
        'catalystApplications',
        'catalystNotifications',
        'catalystProfiles',
        'combinedEvaluations',
        'employeeComposition',
        'financialData',
        'fundabilityEvaluations',
        'governance',
        'growthToolsPurchases',
        'internApplications',
        'internCalendarEvents',
        'internEvaluations',
        'internProfiles',
        'internReviews',
        'internshipApplications',
        'internshipRatings',
        'investorApplications',
        'leadershipEvaluations',
        'messages',
        'milestones',
        'ndas',
        'notifications',
        'orders',
        'payments',
        'policies',
        'policyProcedures',
        'productApplications',
        'profileEvaluations',
        'programSponsorProfiles',
        'recoveryAreas',
        'riskData',
        'smeApplications',
        'smeCalendarEvents',
        'smeCatalystApplications',
        'smes',
        'subscriptions',
        'supplierApplications',
        'supplierCalendarEvents',
        'supplierReviews',
        'turnoverData',
        'universalProfiles',
        'userPreferences',
        'users'
      ];

      let markedCount = 0;
      let failedCount = 0;

      // Mark all user documents as deleted (soft delete)
      for (const collectionName of collectionsToMark) {
        try {
          const docRef = doc(db, collectionName, userId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            await updateDoc(docRef, {
              deletedAt: deletionTimestamp,
              deletedStatus: true,
              hardDeleteDate: hardDeleteDate.toISOString(),
              deletionReason: 'user_requested',
              // Optionally anonymize PII immediately
              _originalEmail: docSnap.data().email || null,
              email: `deleted_${userId}@deleted.local`,
            });
            markedCount++;
            console.log(`✓ Soft-deleted from ${collectionName}`);
          }
        } catch (err) {
          console.error(`Failed to mark deletion in ${collectionName}:`, err);
          failedCount++;
        }
      }

      console.log(`Soft deletion complete: ${markedCount} documents marked, ${failedCount} failed`);

      // Sign out the user
      await auth.signOut();
      
      setDeleteMessage(
        `Account scheduled for deletion. ${markedCount} records marked for removal. ` +
        `You can recover your account within 30 days by logging back in.`
      );
      
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);

    } catch (error) {
      console.error("Error scheduling account deletion:", error);
      
      if (error.code === 'auth/requires-recent-login') {
        setDeleteMessage("For security, please log out and log back in before deleting your account.");
      } else {
        setDeleteMessage(`Error scheduling deletion: ${error.message}`);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const confirmDelete = async () => {
   const user = auth.currentUser;
   if (user) {
     try {
       const userRef = doc(db, "users", user.uid);
 
       // Mark as deleted with timestamp
       await updateDoc(userRef, {
         deletedAt: Date.now()
       });
 
       await auth.signOut(); // Sign them out
       alert("Your account has been scheduled for deletion. You can retrieve it within 30 days.");
       window.location.href = "/"; // Go to homepage
     } catch (err) {
       console.error("Deletion error:", err);
       alert("Please re-login to delete your account.");
     }
   }
 };

  const handlePasswordChange = async () => {
    setPasswordError("")
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match.")
      return
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.")
      return
    }
    try {
      await updatePassword(auth.currentUser, newPassword)
      setPasswordSuccess(true)
      setNewPassword("")
      setConfirmNewPassword("")
      setShowPasswordFields(false)
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      console.error("Password change error:", err)
      setPasswordError(err.message)
    }
  }

  const handleSaveChanges = async () => {
    setLoading(true)
    setMessage("")
    try {
      const user = auth.currentUser
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
        })
        setMessage("Settings saved successfully!")
      }
    } catch (error) {
      console.error("Save error:", error)
      setMessage(`Error saving settings: ${error.message}`)
    }
    setLoading(false)
  }

  const openDeletePopup = async () => {
    setShowPopup(true);
  
    const user = auth.currentUser;
    if (!user) return;
  
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) return;
  
    const userData = userDocSnap.data();
    const activeRoles = [];
  
    // From roles object
    if (userData.roles && typeof userData.roles === "object") {
      Object.keys(userData.roles).forEach((r) => {
        if (!userData.roles[r].deletedStatus) activeRoles.push(r);
      });
    }
  
    // From roleArray
    if (Array.isArray(userData.roleArray)) {
      userData.roleArray.forEach((r) => {
        if (!activeRoles.includes(r)) activeRoles.push(r);
      });
    }
  
    // From role string
    if (typeof userData.role === "string") {
      userData.role.split(",").forEach((r) => {
        const trimmed = r.trim();
        if (!activeRoles.includes(trimmed)) activeRoles.push(trimmed);
      });
    }
  
    setUserRoles(activeRoles);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    try {
      const user = auth.currentUser
      if (user) {
        await updateDoc(doc(db, "users", user.uid), { ...formData })
        setMessage("Settings saved successfully!")
      }
    } catch (error) {
      console.error("Save error:", error)
      setMessage(`Error saving settings: ${error.message}`)
    }
    setLoading(false)
  }

  return (
    <div className="settingsContainer" style={getContainerStyles()}>
      <div style={{ marginBottom: "1rem" }}>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "700",
            margin: 0,
            color: colors.textBrown,
            letterSpacing: "-0.025em",
          }}
        >
          Settings
        </h1>
      </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          marginBottom: "2rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            padding: "0 2rem",
            borderBottom: `1px solid ${colors.lightBrown}`,
            overflowX: "auto",
          }}
        >
          {[
            { key: "account", label: "Account" },
            { key: "security", label: "Security" },
            { key: "appearance", label: "Appearance" },
            { key: "notifications", label: "Notifications" },
            // Update your tabs array to include "team"
{ key: "team", label: "Team Members" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "1.25rem 1.5rem",
                border: "none",
                backgroundColor: "transparent",
                color: activeTab === tab.key ? colors.textBrown : "#6b7280",
                fontWeight: activeTab === tab.key ? "600" : "500",
                fontSize: "0.95rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                borderBottom: activeTab === tab.key ? `2px solid ${colors.primaryBrown}` : "2px solid transparent",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "3rem" }}>
          {activeTab === "account" && (
            <div>
              <div style={{ marginBottom: "2rem" }}>
                <h2
                  style={{
                    color: colors.textBrown,
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                  }}
                >
                  Account Information
                </h2>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "0.95rem",
                    marginBottom: "2rem",
                  }}
                >
                  Update your account details and personal information.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        color: colors.textBrown,
                        fontWeight: "500",
                        marginBottom: "0.5rem",
                        fontSize: "0.95rem",
                      }}
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        padding: "0.875rem 1rem",
                        border: `1px solid ${colors.mediumBrown}`,
                        borderRadius: "8px",
                        fontSize: "1rem",
                        backgroundColor: "white",
                        color: colors.textBrown,
                        outline: "none",
                        transition: "all 0.2s ease",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.primaryBrown
                        e.target.style.boxShadow = `0 0 0 3px ${colors.primaryBrown}15`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = colors.mediumBrown
                        e.target.style.boxShadow = "none"
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        color: colors.textBrown,
                        fontWeight: "500",
                        marginBottom: "0.5rem",
                        fontSize: "0.95rem",
                      }}
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        padding: "0.875rem 1rem",
                        border: `1px solid ${colors.mediumBrown}`,
                        borderRadius: "8px",
                        fontSize: "1rem",
                        backgroundColor: "white",
                        color: colors.textBrown,
                        outline: "none",
                        transition: "all 0.2s ease",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.primaryBrown
                        e.target.style.boxShadow = `0 0 0 3px ${colors.primaryBrown}15`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = colors.mediumBrown
                        e.target.style.boxShadow = "none"
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "2rem" }}>
                  <label
                    style={{
                      display: "block",
                      color: colors.textBrown,
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                      fontSize: "0.95rem",
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.875rem 1rem",
                      border: `1px solid ${colors.mediumBrown}`,
                      borderRadius: "8px",
                      fontSize: "1rem",
                      backgroundColor: "white",
                      color: colors.textBrown,
                      outline: "none",
                      transition: "all 0.2s ease",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primaryBrown
                      e.target.style.boxShadow = `0 0 0 3px ${colors.primaryBrown}15`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.mediumBrown
                      e.target.style.boxShadow = "none"
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "2.5rem" }}>
                  <button
                    type="button"
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: colors.primaryBrown,
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "0.95rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = colors.darkBrown
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = colors.primaryBrown
                    }}
                    onClick={handleSaveChanges}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "transparent",
                      color: "#6b7280",
                      border: `1px solid ${colors.mediumBrown}`,
                      borderRadius: "8px",
                      fontSize: "0.95rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = colors.lightBrown
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent"
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div>
              <div style={{ marginBottom: "2rem" }}>
                <h2
                  style={{
                    color: colors.textBrown,
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                  }}
                >
                  Appearance
                </h2>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "0.95rem",
                    marginBottom: "2rem",
                  }}
                >
                  Change how your public dashboard looks and feels.
                </p>

                <h3
                  style={{
                    color: colors.textBrown,
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                  }}
                >
                  Language
                </h3>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "0.95rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  Default language for public dashboard.
                </p>
                <div
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    border: `1px solid ${colors.mediumBrown}`,
                    borderRadius: "8px",
                    fontSize: "1rem",
                    backgroundColor: colors.lightBrown,
                    color: colors.textBrown,
                    boxSizing: "border-box",
                  }}
                >
                  🇬🇧 English
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div>
              <div style={{ marginBottom: "2rem" }}>
                <h2
                  style={{
                    color: colors.textBrown,
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                    letterSpacing: "-0.025em",
                  }}
                >
                  Notifications
                </h2>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "1rem",
                    margin: 0,
                  }}
                >
                  Configure how you receive notifications.
                </p>
              </div>

              <div style={{ display: "grid", gap: "1.5rem", maxWidth: "600px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "1.5rem",
                    backgroundColor: colors.backgroundBrown,
                    borderRadius: "8px",
                    border: `1px solid ${colors.lightBrown}`,
                  }}
                >
                  <input
                    type="checkbox"
                    id="notifications"
                    name="notifications"
                    checked={formData.notifications}
                    onChange={handleInputChange}
                    style={{
                      width: "18px",
                      height: "18px",
                      marginRight: "1rem",
                      accentColor: colors.primaryBrown,
                    }}
                  />
                  <label
                    htmlFor="notifications"
                    style={{
                      color: colors.textBrown,
                      fontWeight: "500",
                      cursor: "pointer",
                      fontSize: "1rem",
                    }}
                  >
                    Enable Email Notifications
                  </label>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "1.5rem",
                    backgroundColor: colors.backgroundBrown,
                    borderRadius: "8px",
                    border: `1px solid ${colors.lightBrown}`,
                  }}
                >
                  <input
                    type="checkbox"
                    id="sms"
                    name="sms"
                    checked={formData.sms}
                    onChange={handleInputChange}
                    style={{
                      width: "18px",
                      height: "18px",
                      marginRight: "1rem",
                      accentColor: colors.primaryBrown,
                    }}
                  />
                  <label
                    htmlFor="sms"
                    style={{
                      color: colors.textBrown,
                      fontWeight: "500",
                      cursor: "pointer",
                      fontSize: "1rem",
                    }}
                  >
                    Enable SMS Notifications
                  </label>
                </div>
              </div>
            </div>
          )}

{activeTab === "team" && (
  <div>
    <div style={{ marginBottom: "2rem" }}>
      <h2 style={{
        color: colors.textBrown,
        fontSize: "1.5rem",
        fontWeight: "600",
        marginBottom: "0.5rem",
      }}>
        Team Management
      </h2>
      <p style={{
        color: "#6b7280",
        fontSize: "0.95rem",
        marginBottom: "2rem",
      }}>
        Manage your team members and their permissions.
      </p>
    </div>

    {!companyId ? (
      <div style={{
        padding: "3rem",
        backgroundColor: colors.lightBrown,
        borderRadius: "8px",
        textAlign: "center",
      }}>
        <p style={{ color: colors.textBrown, fontSize: "1rem", marginBottom: "1rem" }}>
          You don't have a company profile yet.
        </p>
        <button
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: colors.primaryBrown,
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.95rem",
            fontWeight: "500",
            cursor: "pointer",
          }}
          onClick={() => window.location.href = "/profile"}
        >
          Create Company Profile
        </button>
      </div>
    ) : (
      <>
        {/* Add Member Button */}
        {isCompanyOwner && (
          <div style={{ marginBottom: "2rem" }}>
            <button
              onClick={() => setShowAddMemberModal(true)}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: colors.primaryBrown,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.95rem",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>+</span> Add Team Member
            </button>
          </div>
        )}

        {/* Team Members List */}
        <div style={{
          backgroundColor: colors.backgroundBrown,
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}>
          <h3 style={{
            color: colors.textBrown,
            fontSize: "1.1rem",
            fontWeight: "600",
            marginBottom: "1rem",
          }}>
            Team Members ({companyMembers.length})
          </h3>

          {companyMembers.length === 0 ? (
            <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>
              No team members yet. Invite someone to join!
            </p>
          ) : (
            <div style={{
              display: "grid",
              gap: "1rem",
            }}>
              {companyMembers.map((member) => (
                <div
                  key={member.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    border: `1px solid ${colors.lightBrown}`,
                  }}
                >
                  <div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: colors.primaryBrown + "20",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: colors.primaryBrown,
                        fontWeight: "600",
                      }}>
                        {(member.username?.[0] || member.email?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <p style={{
                          color: colors.textBrown,
                          fontWeight: "500",
                          margin: 0,
                        }}>
                          {member.username || member.email}
                        </p>
                        <p style={{
                          color: "#6b7280",
                          fontSize: "0.875rem",
                          margin: "0.25rem 0 0 0",
                        }}>
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                  }}>
                    {/* Role Selector */}
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                      disabled={!isCompanyOwner || member.id === auth.currentUser?.uid}
                      style={{
                        padding: "0.5rem 1rem",
                        border: `1px solid ${colors.mediumBrown}`,
                        borderRadius: "6px",
                        backgroundColor: "white",
                        color: colors.textBrown,
                        fontSize: "0.875rem",
                        cursor: isCompanyOwner && member.id !== auth.currentUser?.uid ? "pointer" : "not-allowed",
                      }}
                    >
                      <option value="owner">Owner</option>
                      <option value="companyadmin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="employee">Employee</option>
                      <option value="viewer">Viewer</option>
                    </select>

                    {/* Remove Button (only for owner and not self) */}
                    {isCompanyOwner && member.id !== auth.currentUser?.uid && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: "#fee2e2",
                          color: "#dc2626",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Permissions Info */}
        <div style={{
          backgroundColor: "#f0f9ff",
          borderRadius: "12px",
          padding: "1.5rem",
          border: "1px solid #e0f2fe",
        }}>
          <h3 style={{
            color: "#0369a1",
            fontSize: "1.1rem",
            fontWeight: "600",
            marginBottom: "1rem",
          }}>
            Role Permissions
          </h3>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}>
            {[
              { role: "Owner", desc: "Full access, can manage everything" },
              { role: "Companyadmin", desc: "Can manage users and settings" },
              { role: "Manager", desc: "Can manage content and teams" },
              { role: "Employee", desc: "Can create and edit content" },
              { role: "Viewer", desc: "Read-only access" },
            ].map((perm) => (
              <div key={perm.role} style={{
                backgroundColor: "white",
                padding: "1rem",
                borderRadius: "8px",
                border: `1px solid ${colors.lightBrown}`,
              }}>
                <p style={{
                  color: colors.textBrown,
                  fontWeight: "600",
                  margin: "0 0 0.25rem 0",
                  fontSize: "0.95rem",
                }}>
                  {perm.role}
                </p>
                <p style={{
                  color: "#6b7280",
                  fontSize: "0.875rem",
                  margin: 0,
                }}>
                  {perm.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </>
    )}
  </div>
)}


         
{activeTab === "security" && (
  <div>
    <div style={{ marginBottom: "2rem" }}>
      <h2
        style={{
          color: colors.textBrown,
          fontSize: "1.5rem",
          fontWeight: "600",
          marginBottom: "0.5rem",
          letterSpacing: "-0.025em",
        }}
      >
        Security
      </h2>
      <p
        style={{
          color: "#6b7280",
          fontSize: "1rem",
          margin: 0,
        }}
      >
        Manage your password and security settings.
      </p>
    </div>

    {/* Two-Factor Authentication Section */}
    <div style={{
      backgroundColor: colors.backgroundBrown,
      borderRadius: "12px",
      padding: "1.5rem",
      marginBottom: "2rem",
      border: `1px solid ${colors.lightBrown}`,
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
      }}>
        <div>
          <h3 style={{
            color: colors.textBrown,
            fontSize: "1.1rem",
            fontWeight: "600",
            margin: "0 0 0.5rem 0",
          }}>
            Two-Factor Authentication
          </h3>
          <p style={{
            color: "#6b7280",
            fontSize: "0.95rem",
            margin: 0,
            lineHeight: 1.5,
          }}>
            Add an extra layer of security to your account by requiring a code from your authenticator app in addition to your password.
          </p>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}>
          <span style={{
            padding: "0.5rem 1rem",
            backgroundColor: twoFactorEnabled ? "#d1fae5" : "#fee2e2",
            color: twoFactorEnabled ? "#065f46" : "#991b1b",
            borderRadius: "8px",
            fontSize: "0.875rem",
            fontWeight: "600",
          }}>
            {twoFactorEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>
      </div>

      {twoFactorEnabled ? (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "1rem",
          backgroundColor: "#d1fae5",
          borderRadius: "8px",
          border: "1px solid #a7f3d0",
        }}>
          <div style={{ flex: 1 }}>
            <p style={{
              color: "#065f46",
              fontSize: "0.95rem",
              margin: 0,
              fontWeight: "500",
            }}>
              ✓ Two-factor authentication is active and protecting your account
            </p>
          </div>
          <button
            onClick={handleDisable2FA}
            disabled={disabling2FA}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: "500",
              cursor: disabling2FA ? "not-allowed" : "pointer",
              opacity: disabling2FA ? 0.7 : 1,
            }}
          >
            {disabling2FA ? "Disabling..." : "Disable 2FA"}
          </button>
        </div>
      ) : (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "1rem",
          backgroundColor: "#fef3c7",
          borderRadius: "8px",
          border: "1px solid #fde68a",
        }}>
          <div style={{ flex: 1 }}>
            <p style={{
              color: "#92400e",
              fontSize: "0.95rem",
              margin: 0,
              fontWeight: "500",
            }}>
              ⚠ Your account is not protected by two-factor authentication
            </p>
          </div>
          <button
            onClick={() => setShow2FASetup(true)}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: colors.primaryBrown,
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Enable 2FA
          </button>
        </div>
      )}
    </div>

    {/* Password Change Section */}
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gap: "2rem", maxWidth: "600px" }}>
        <div>
          <label
            style={{
              display: "block",
              color: colors.textBrown,
              fontWeight: "500",
              marginBottom: "0.75rem",
              fontSize: "0.95rem",
            }}
          >
            Current Password
          </label>
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleInputChange}
            style={{
              width: "100%",
              padding: "0.875rem 1rem",
              border: `1px solid ${colors.mediumBrown}`,
              borderRadius: "8px",
              fontSize: "1rem",
              backgroundColor: "white",
              color: colors.textBrown,
              outline: "none",
              transition: "all 0.2s ease",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = colors.primaryBrown
              e.target.style.boxShadow = `0 0 0 3px ${colors.primaryBrown}15`
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.mediumBrown
              e.target.style.boxShadow = "none"
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              color: colors.textBrown,
              fontWeight: "500",
              marginBottom: "0.75rem",
              fontSize: "0.95rem",
            }}
          >
            New Password
          </label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            style={{
              width: "100%",
              padding: "0.875rem 1rem",
              border: `1px solid ${colors.mediumBrown}`,
              borderRadius: "8px",
              fontSize: "1rem",
              backgroundColor: "white",
              color: colors.textBrown,
              outline: "none",
              transition: "all 0.2s ease",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = colors.primaryBrown
              e.target.style.boxShadow = `0 0 0 3px ${colors.primaryBrown}15`
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.mediumBrown
              e.target.style.boxShadow = "none"
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              color: colors.textBrown,
              fontWeight: "500",
              marginBottom: "0.75rem",
              fontSize: "0.95rem",
            }}
          >
            Confirm New Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            style={{
              width: "100%",
              padding: "0.875rem 1rem",
              border: `1px solid ${colors.mediumBrown}`,
              borderRadius: "8px",
              fontSize: "1rem",
              backgroundColor: "white",
              color: colors.textBrown,
              outline: "none",
              transition: "all 0.2s ease",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = colors.primaryBrown
              e.target.style.boxShadow = `0 0 0 3px ${colors.primaryBrown}15`
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.mediumBrown
              e.target.style.boxShadow = "none"
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginTop: "2.5rem" }}>
        <button
          type="button"
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "white",
            color: "#6b7280",
            border: `1px solid ${colors.mediumBrown}`,
            borderRadius: "8px",
            fontSize: "0.95rem",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: colors.primaryBrown,
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.95rem",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  </div>
)}

          {(activeTab === "profile" || activeTab === "billing" || activeTab === "integrations") && (
            <div>
              <div style={{ marginBottom: "2rem" }}>
                <h2
                  style={{
                    color: colors.textBrown,
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                    letterSpacing: "-0.025em",
                  }}
                >
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h2>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "1rem",
                    margin: 0,
                  }}
                >
                  {activeTab === "profile" && "Manage your public profile information."}
                  {activeTab === "billing" && "Manage your billing and subscription settings."}
                  {activeTab === "integrations" && "Connect and manage third-party integrations."}
                </p>
              </div>
              <div
                style={{
                  padding: "3rem",
                  backgroundColor: colors.lightBrown,
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <p style={{ color: colors.textBrown, fontSize: "1rem" }}>
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings coming soon...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
          marginTop: "2rem",
        }}
      >
        <div
          style={{
            backgroundColor: "#fafafa",
            padding: "1.5rem 3rem",
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          <h3
            style={{
              color: "#dc2626",
              fontSize: "1.25rem",
              fontWeight: "600",
              margin: 0,
              letterSpacing: "-0.025em",
            }}
          >
            Danger Zone
          </h3>
          <p
            style={{
              color: "#6b7280",
              fontSize: "0.95rem",
              margin: "0.5rem 0 0 0",
            }}
          >
            These actions cannot be undone. Please proceed with caution.
          </p>
        </div>

        <div style={{ padding: "3rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
              padding: "1.5rem",
              backgroundColor: "#fef2f2",
              borderRadius: "8px",
              border: "1px solid #fecaca",
            }}
          >
            <div>
              <h4
                style={{
                  color: "#dc2626",
                  fontSize: "1rem",
                  fontWeight: "600",
                  margin: "0 0 0.25rem 0",
                }}
              >
                Delete Role
              </h4>
              <p
                style={{
                  color: "#6b7280",
                  fontSize: "0.9rem",
                  margin: 0,
                }}
              >
                Remove a specific role from your account
              </p>
            </div>
            <button
              onClick={openDeletePopup}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.9rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
              }}
            >
              Delete Role
            </button>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1.5rem",
              backgroundColor: "#fef2f2",
              borderRadius: "8px",
              border: "1px solid #fecaca",
            }}
          >
            <div>
              <h4
                style={{
                  color: "#dc2626",
                  fontSize: "1rem",
                  fontWeight: "600",
                  margin: "0 0 0.25rem 0",
                }}
              >
                Delete Account
              </h4>
              <p
                style={{
                  color: "#6b7280",
                  fontSize: "0.9rem",
                  margin: 0,
                }}
              >
                Permanently delete your account and all associated data
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.9rem",
                fontWeight: "500",
                cursor: deleteLoading ? "not-allowed" : "pointer",
                transition: "background-color 0.2s ease",
                opacity: deleteLoading ? 0.7 : 1,
              }}
            >
              {deleteLoading ? "Deleting..." : "Delete Account"}
            </button>
          </div>

          {deleteMessage && (
            <div style={{ marginTop: "1rem" }}>
              <span
                style={{
                  color: deleteMessage.includes("Error") ? "#dc2626" : "#059669",
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  padding: "0.75rem 1rem",
                  backgroundColor: deleteMessage.includes("Error") ? "#fef2f2" : "#f0fdf4",
                  borderRadius: "8px",
                  display: "inline-block",
                  border: `1px solid ${deleteMessage.includes("Error") ? "#fecaca" : "#bbf7d0"}`,
                }}
              >
                {deleteMessage}
              </span>
            </div>
          )}
        </div>
      </div>

      {showPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "2.5rem",
              borderRadius: "20px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              maxWidth: "450px",
              width: "90%",
            }}
          >
            <h3
              style={{
                color: colors.textBrown,
                fontSize: "1.5rem",
                fontWeight: "600",
                margin: "0 0 2rem 0",
                textAlign: "center",
                letterSpacing: "-0.025em",
              }}
            >
              Select a Role to Delete
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                marginBottom: "2rem",
              }}
            >
              {userRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleClick(role)}
                  style={{
                    padding: "1rem 1.5rem",
                    backgroundColor: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontSize: "1rem",
                  }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#b91c1c")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#dc2626")}
                >
                  {role}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowPopup(false)}
              style={{
                width: "100%",
                padding: "1rem",
                backgroundColor: colors.lightBrown,
                color: colors.textBrown,
                border: "none",
                borderRadius: "12px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
                fontSize: "1rem",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = colors.mediumBrown)}
              onMouseOut={(e) => (e.target.style.backgroundColor = colors.lightBrown)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    
{showAddMemberModal && (
  <div style={{
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(4px)",
  }}>
    <div style={{
      backgroundColor: "white",
      padding: "2.5rem",
      borderRadius: "20px",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      maxWidth: "500px",
      width: "90%",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.5rem",
      }}>
        <h3 style={{
          color: colors.textBrown,
          fontSize: "1.5rem",
          fontWeight: "600",
          margin: 0,
        }}>
          Invite Team Member
        </h3>
        <button
          onClick={() => {
            setShowAddMemberModal(false);
            setInviteEmail("");
            setInviteError("");
            setInviteSuccess("");
          }}
          style={{
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            color: "#6b7280",
            cursor: "pointer",
            padding: "0.5rem",
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{
          display: "block",
          color: colors.textBrown,
          fontWeight: "500",
          marginBottom: "0.5rem",
          fontSize: "0.95rem",
        }}>
          Email Address
        </label>
        <input
          type="email"
          placeholder="team.member@example.com"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "0.875rem 1rem",
            border: `1px solid ${colors.mediumBrown}`,
            borderRadius: "8px",
            fontSize: "1rem",
            backgroundColor: "white",
            color: colors.textBrown,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{
          display: "block",
          color: colors.textBrown,
          fontWeight: "500",
          marginBottom: "0.5rem",
          fontSize: "0.95rem",
        }}>
          Role
        </label>
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value)}
          style={{
            width: "100%",
            padding: "0.875rem 1rem",
            border: `1px solid ${colors.mediumBrown}`,
            borderRadius: "8px",
            fontSize: "1rem",
            backgroundColor: "white",
            color: colors.textBrown,
            outline: "none",
          }}
        >
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="companyadmin">Admin</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      {inviteError && (
        <div style={{
          padding: "0.75rem 1rem",
          backgroundColor: "#fef2f2",
          color: "#dc2626",
          borderRadius: "8px",
          marginBottom: "1rem",
          fontSize: "0.95rem",
        }}>
          {inviteError}
        </div>
      )}

      {inviteSuccess && (
        <div style={{
          padding: "0.75rem 1rem",
          backgroundColor: "#f0fdf4",
          color: "#059669",
          borderRadius: "8px",
          marginBottom: "1rem",
          fontSize: "0.95rem",
        }}>
          {inviteSuccess}
        </div>
      )}

      <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
        <button
          onClick={() => setShowAddMemberModal(false)}
          style={{
            flex: 1,
            padding: "0.875rem",
            backgroundColor: colors.lightBrown,
            color: colors.textBrown,
            border: "none",
            borderRadius: "8px",
            fontSize: "0.95rem",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleInviteMember}
          disabled={inviteLoading}
          style={{
            flex: 2,
            padding: "0.875rem",
            backgroundColor: colors.primaryBrown,
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.95rem",
            fontWeight: "500",
            cursor: inviteLoading ? "not-allowed" : "pointer",
            opacity: inviteLoading ? 0.7 : 1,
          }}
        >
          {inviteLoading ? "Sending..." : "Send Invitation"}
        </button>
      </div>
    </div>
  </div>
)}


{show2FASetup && (
  <TwoFactorSetup
    isOpen={show2FASetup}
    onClose={() => setShow2FASetup(false)}
    onSuccess={handle2FASetupSuccess}
  />
)}
    </div>
    
  )
}