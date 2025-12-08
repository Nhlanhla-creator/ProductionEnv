"use client"

import { useState, useEffect } from "react"
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { onAuthStateChanged } from "firebase/auth"

const InvestorSettings = () => {
  const [activeTab, setActiveTab] = useState("Account")
  const [currentUser, setCurrentUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  // Danger Zone States
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState("")
  const [userRoles, setUserRoles] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [deletedRoles, setDeletedRoles] = useState([])

  const [formData, setFormData] = useState({
    account: {
      email: "",
      password: "••••••••••",
      name: "",
      phone: "",
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      matchAlerts: true,
      messageAlerts: true,
      documentAlerts: true,
      newsletterSubscription: true,
    },
      privacy: {
      anonymousName: false,
    },
    preferences: {
      language: "english",
      timezone: "Africa/Johannesburg",
      currency: "ZAR",
      theme: "light",
    },
  })

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        await fetchUserData(user.uid)
      } else {
        setCurrentUser(null)
        setUserData(null)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

 const fetchUserData = async (uid) => {
  try {
    setLoading(true)
    
    const userDocRef = doc(db, "MyuniversalProfiles", uid)
    const userDoc = await getDoc(userDocRef)
    
    if (userDoc.exists()) {
      const userData = userDoc.data()
      setUserData(userData)
      
      const user = auth.currentUser;
      
      setFormData(prev => ({
        ...prev,
        account: {
          ...prev.account,
          email: user?.email || userData.email || "",
          name: userData.formData?.fundManageOverview?.registeredName || "",
          phone: userData.formData?.contactDetails?.primaryContactMobile || "",
        }, 
         privacy: {
          ...prev.privacy,
          anonymousName: userData.anonymous || false, // ← This line sets the toggle state
        }
      }))
    }
  } catch (error) {
    console.error("Error fetching user data:", error)
  } finally {
    setLoading(false)
  }
}

  const handleInputChange = (section, field, value) => {
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [field]: value,
      },
    })
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordChange = (field, value) => {
    setChangePasswordData(prev => ({
      ...prev,
      [field]: value
    }))
  }
const handleChangePassword = async () => {
  if (!currentUser) {
    alert("You must be logged in to change your password!")
    return
  }

  // Validation checks
  if (!changePasswordData.currentPassword) {
    alert("Please enter your current password!")
    return
  }

  if (!changePasswordData.newPassword) {
    alert("Please enter a new password!")
    return
  }

  if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
    alert("New passwords do not match!")
    return
  }

  // Enhanced password validation
  if (changePasswordData.newPassword.length < 8) {
    alert("Password must be at least 8 characters long!")
    return
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(changePasswordData.newPassword)) {
    alert("Password must contain at least one uppercase letter, one lowercase letter, and one number.")
    return
  }

  // Confirmation dialog
  const isConfirmed = window.confirm(
    "Are you sure you want to change your password? You will be logged out and need to sign in again with your new password."
  )
  
  if (!isConfirmed) {
    return
  }

  try {
    const credential = EmailAuthProvider.credential(
      currentUser.email,
      changePasswordData.currentPassword
    )
    
    await reauthenticateWithCredential(currentUser, credential)
    await updatePassword(currentUser, changePasswordData.newPassword)
    
    alert("Password changed successfully! You will now be logged out")
    
    // Clear form and log out
    setChangePasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    })
    
    // Sign out and redirect
    await auth.signOut()
    window.location.href = "/auth"
    
 } catch (error) {
  console.error("Error changing password:", error)
  
  if (error.code === 'auth/invalid-credential') {
    alert("Current password is incorrect. Please try again!")
  } else if (error.code === 'auth/requires-recent-login') {
    alert("For security reasons, your session has expired. Please log out and log in again to change your password.")
  } else {
    alert("Error changing password. Please try again!")
  }
}
}

  const handleSubmit = async (e) => {
  e.preventDefault()
  
  if (!currentUser) {
    alert("You must be logged in to update settings.")
    return
  }

  try {
    const userDocRef = doc(db, "MyuniversalProfiles", currentUser.uid)
    await updateDoc(userDocRef, {
      "formData.fundManageOverview.registeredName": formData.account.name,
      "formData.contactDetails.primaryContactMobile": formData.account.phone, 
      updatedAt: new Date()
    })

    alert("Settings saved successfully!")
  } catch (error) {
    console.error("Error saving settings:", error)
    alert("Error saving settings. Please try again.")
  }
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
      setShowPopup(false);
  
    } catch (err) {
      console.error("Error deleting role:", err);
      alert("Failed to delete role. Please try again.");
    }
  };
  
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteMessage("");
    
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No authenticated user found");
      }

      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      
      setDeleteMessage("Account deleted successfully.");
      auth.signOut();
      window.location.href = "/";
      
    } catch (error) {
      console.error("Error deleting account:", error);
      
      let errorMessage = "Error deleting account. Please try again.";
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = "For security, please re-authenticate before deleting your account.";
      }
      
      setDeleteMessage(errorMessage);
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "white",
          minHeight: "100vh",
          marginLeft: "240px",
          padding: "32px 48px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: "white",
        minHeight: "100vh",
        marginLeft: "240px",
        padding: "32px 48px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "600",
            color: colors.textBrown,
            margin: "0",
            marginTop: "5rem",
          }}
        >
          Settings
        </h1>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "40px",
        }}
      >
        <div style={{ display: "flex", gap: "32px" }}>
          {["Account", "Notifications", "Security", "Appearance"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "12px 0",
                backgroundColor: "transparent",
                border: "none",
                borderBottom: activeTab === tab ? `2px solid ${colors.primaryBrown}` : "2px solid transparent",
                color: activeTab === tab ? colors.primaryBrown : "#6b7280",
                fontSize: "16px",
                fontWeight: activeTab === tab ? "600" : "400",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === "Account" && (
          <div>
            <div style={{ marginBottom: "32px" }}>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: colors.textBrown,
                  margin: "0 0 8px 0",
                }}
              >
                Account Information
              </h2>
              <p
                style={{
                  color: colors.textBrown,
                  opacity: 0.7,
                  margin: "0 0 24px 0",
                  fontSize: "14px",
                }}
              >
                Update your basic account information
              </p>

              <div style={{ display: "grid", gap: "20px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: colors.textBrown,
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.account.email}
                    onChange={(e) => handleInputChange("account", "email", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${colors.mediumBrown}`,
                      borderRadius: "8px",
                      fontSize: "14px",
                      color: colors.textBrown,
                      backgroundColor: colors.backgroundBrown,
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: colors.textBrown,
                    }}
                  >
                    Change Password
                  </label>
                  <div style={{ display: "grid", gap: "12px" }}>
                    {/* Current Password */}
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPasswords.currentPassword ? "text" : "password"}
                        placeholder="Current Password"
                        value={changePasswordData.currentPassword}
                        onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          paddingRight: "48px",
                          border: `1px solid ${colors.mediumBrown}`,
                          borderRadius: "8px",
                          fontSize: "14px",
                          color: colors.textBrown,
                          backgroundColor: colors.backgroundBrown,
                          transition: "all 0.2s ease",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("currentPassword")}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: colors.textBrown,
                          opacity: 0.7,
                        }}
                      >
                        {showPasswords.currentPassword ? "🙈" : "👁️"}
                      </button>
                    </div>

                    {/* New Password */}
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPasswords.newPassword ? "text" : "password"}
                        placeholder="New Password"
                        value={changePasswordData.newPassword}
                        onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          paddingRight: "48px",
                          border: `1px solid ${colors.mediumBrown}`,
                          borderRadius: "8px",
                          fontSize: "14px",
                          color: colors.textBrown,
                          backgroundColor: colors.backgroundBrown,
                          transition: "all 0.2s ease",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("newPassword")}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: colors.textBrown,
                          opacity: 0.7,
                        }}
                      >
                        {showPasswords.newPassword ? "🙈" : "👁️"}
                      </button>
                    </div>

                    {/* Confirm Password */}
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPasswords.confirmPassword ? "text" : "password"}
                        placeholder="Confirm New Password"
                        value={changePasswordData.confirmPassword}
                        onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          paddingRight: "48px",
                          border: `1px solid ${colors.mediumBrown}`,
                          borderRadius: "8px",
                          fontSize: "14px",
                          color: colors.textBrown,
                          backgroundColor: colors.backgroundBrown,
                          transition: "all 0.2s ease",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("confirmPassword")}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: colors.textBrown,
                          opacity: 0.7,
                        }}
                      >
                        {showPasswords.confirmPassword ? "🙈" : "👁️"}
                      </button>
                    </div>

                    <button
                      onClick={handleChangePassword}
                      style={{
                        padding: "12px 24px",
                        backgroundColor: colors.accentBrown,
                        color: colors.textBrown,
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                        alignSelf: "flex-start",
                      }}
                    >
                      Change Password
                    </button>
                  </div>
                          {changePasswordData.newPassword && (
                            <div style={{ fontSize: "12px", marginTop: "4px" }}>
                              {changePasswordData.newPassword.length < 8 && (
                                <p style={{ color: "#dc2626", margin: "2px 0" }}>
                                  ✗ At least 8 characters
                                </p>
                              )}
                              {!/[a-z]/.test(changePasswordData.newPassword) && (
                                <p style={{ color: "#dc2626", margin: "2px 0" }}>
                                  ✗ One lowercase letter
                                </p>
                              )}
                              {!/[A-Z]/.test(changePasswordData.newPassword) && (
                                <p style={{ color: "#dc2626", margin: "2px 0" }}>
                                  ✗ One uppercase letter
                                </p>
                              )}
                              {!/\d/.test(changePasswordData.newPassword) && (
                                <p style={{ color: "#dc2626", margin: "2px 0" }}>
                                  ✗ One number
                                </p>
                              )}
                              {changePasswordData.newPassword.length >= 8 && 
                              /[a-z]/.test(changePasswordData.newPassword) && 
                              /[A-Z]/.test(changePasswordData.newPassword) && 
                              /\d/.test(changePasswordData.newPassword) && (
                                <p style={{ color: "#059669", margin: "2px 0" }}>
                                  ✓ Strong password
                                </p>
                              )}
                            </div>
                          )}

                          {changePasswordData.confirmPassword && changePasswordData.newPassword !== changePasswordData.confirmPassword && (
                            <p style={{ color: "#dc2626", fontSize: "12px", margin: "4px 0 0 0" }}>
                              ✗ Passwords do not match
                            </p>
                          )}

                          {changePasswordData.confirmPassword && changePasswordData.newPassword === changePasswordData.confirmPassword && (
                            <p style={{ color: "#059669", fontSize: "12px", margin: "4px 0 0 0" }}>
                              ✓ Passwords match
                            </p>
                          )}
                </div>
      
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: colors.textBrown,
                    }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.account.name}
                    onChange={(e) => handleInputChange("account", "name", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${colors.mediumBrown}`,
                      borderRadius: "8px",
                      fontSize: "14px",
                      color: colors.textBrown,
                      backgroundColor: colors.backgroundBrown,
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: colors.textBrown,
                    }}
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.account.phone}
                    onChange={(e) => handleInputChange("account", "phone", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${colors.mediumBrown}`,
                      borderRadius: "8px",
                      fontSize: "14px",
                      color: colors.textBrown,
                      backgroundColor: colors.backgroundBrown,
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Save Changes Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px" }}>
              <button
                style={{
                  padding: "12px 24px",
                  backgroundColor: colors.primaryBrown,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={handleSubmit}
              >
                Save Changes
              </button>
            </div>
            
            {/* DANGER ZONE SECTION  */}
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
          </div>
        )}

       {activeTab === "Notifications" && (
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: colors.textBrown,
                margin: "0 0 8px 0",
              }}
            >
              Notification Settings
            </h2>
            <p
              style={{
                color: colors.textBrown,
                opacity: 0.7,
                margin: "0 0 32px 0",
                fontSize: "14px",
              }}
            >
              Control how and when you receive notifications
            </p>

            <div style={{ display: "grid", gap: "24px" }}>
              {Object.entries(formData.notifications).map(([key, value]) => {
                const labels = {
                  emailNotifications: { title: "Email Notifications", desc: "Receive notifications via email" },
                  smsNotifications: { title: "SMS Notifications", desc: "Receive notifications via SMS" },
                  matchAlerts: { title: "Investment Alerts", desc: "Get notified about new investment opportunities" },
                  messageAlerts: { title: "Message Alerts", desc: "Get notified when you receive new messages" },
                  documentAlerts: {
                    title: "Document Alerts",
                    desc: "Get notified about document updates and requirements",
                  },
                  newsletterSubscription: {
                    title: "Newsletter Subscription",
                    desc: "Receive our monthly newsletter with updates and insights",
                  },
                }

                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "20px",
                      backgroundColor: "white",
                      borderRadius: "8px",
                      border: `1px solid ${colors.lightBrown}`,
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: colors.textBrown,
                          margin: "0 0 4px 0",
                        }}
                      >
                        {labels[key].title}
                      </h3>
                      <p
                        style={{
                          fontSize: "13px",
                          color: colors.textBrown,
                          opacity: 0.7,
                          margin: "0",
                        }}
                      >
                        {labels[key].desc}
                      </p>
                    </div>
                    <label
                      style={{
                        position: "relative",
                        display: "inline-block",
                        width: "44px",
                        height: "24px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleInputChange("notifications", key, e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          cursor: "pointer",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: value ? colors.primaryBrown : colors.mediumBrown,
                          transition: "0.2s",
                          borderRadius: "24px",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            content: "",
                            height: "18px",
                            width: "18px",
                            left: value ? "23px" : "3px",
                            bottom: "3px",
                            backgroundColor: "white",
                            transition: "0.2s",
                            borderRadius: "50%",
                          }}
                        />
                      </span>
                    </label>
                  </div>
                )
              })}
            </div>

            {/* Save Changes Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px" }}>
              <button
                style={{
                  padding: "12px 24px",
                  backgroundColor: colors.primaryBrown,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={handleSubmit}
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === "Security" && (
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: colors.textBrown,
                margin: "0 0 8px 0",
              }}
            >
              Privacy & Visibility
            </h2>
            <p
              style={{
                color: colors.textBrown,
                opacity: 0.7,
                margin: "0 0 32px 0",
                fontSize: "14px",
              }}
            >
              Control who can see your profile information
            </p>

              <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "20px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    border: `1px solid ${colors.lightBrown}`,
                  }}
                >
              <div>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: colors.textBrown,
                    margin: "0 0 4px 0",
                  }}
                >
                    Name Visibility
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: colors.textBrown,
                      opacity: 0.7,
                      margin: "0",
                    }}
                  >
                    Keep your name anonymous from other users
                  </p>
                </div>
          <label
            style={{
              position: "relative",
              display: "inline-block",
              width: "44px",
              height: "24px",
            }}
          >
        <input
              type="checkbox"
             checked={formData.privacy.anonymousName}
              onChange={async (e) => {
                const isAnonymous = e.target.checked;
                
                // Update local state immediately
                handleInputChange("privacy", "anonymousName", isAnonymous);
                
                // Save to database immediately
                if (currentUser) {
                  try {
                    const userDocRef = doc(db, "MyuniversalProfiles", currentUser.uid);
                    await updateDoc(userDocRef, {
                      anonymous: isAnonymous,
                      updatedAt: new Date()
                    });
                    
                    // Optional: Show quick feedback
                    console.log(`Anonymous mode ${isAnonymous ? 'enabled' : 'disabled'}`);
                  } catch (error) {
                    console.error("Error updating anonymous setting:", error);
                    alert("Error updating privacy setting. Please try again.");
                    
                    // Revert local state if save failed
                    handleInputChange("privacy", "anonymousName", !isAnonymous);
                  }
                }
              }}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: "absolute",
                cursor: "pointer",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: formData.privacy.anonymousName ? colors.primaryBrown : colors.mediumBrown,
                transition: "0.2s",
                borderRadius: "24px",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  content: "",
                  height: "18px",
                  width: "18px",
                  left: formData.privacy.anonymousName ? "23px" : "3px",
                  bottom: "3px",
                  backgroundColor: "white",
                  transition: "0.2s",
                  borderRadius: "50%",
                }}
              />
              </span>
          </label>
          </div>
        </div>
        )}

        {activeTab === "Appearance" && (
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: colors.textBrown,
                margin: "0 0 8px 0",
              }}
            >
              Preferences
            </h2>
            <p
              style={{
                color: colors.textBrown,
                opacity: 0.7,
                margin: "0 0 32px 0",
                fontSize: "14px",
              }}
            >
              Customize your experience
            </p>

            <div style={{ display: "grid", gap: "24px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: colors.textBrown,
                  }}
                >
                  Language
                </label>
                <div
                  style={{
                    padding: "12px 16px",
                    border: `1px solid ${colors.mediumBrown}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: colors.textBrown,
                    backgroundColor: colors.backgroundBrown,
                  }}
                >
                  English
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: colors.textBrown,
                  }}
                >
                  Timezone
                </label>
                <select
                  value={formData.preferences.timezone}
                  onChange={(e) => handleInputChange("preferences", "timezone", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${colors.mediumBrown}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: colors.textBrown,
                    backgroundColor: colors.backgroundBrown,
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                >
                  <option value="Africa/Johannesburg">Africa/Johannesburg (GMT+2)</option>
                  <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                  <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</option>
                  <option value="Africa/Casablanca">Africa/Casablanca (GMT+1)</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: colors.textBrown,
                  }}
                >
                  Preferred Currency
                </label>
                <select
                  value={formData.preferences.currency}
                  onChange={(e) => handleInputChange("preferences", "currency", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${colors.mediumBrown}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: colors.textBrown,
                    backgroundColor: colors.backgroundBrown,
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                >
                  <option value="ZAR">South African Rand (ZAR)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">British Pound (GBP)</option>
                  <option value="NGN">Nigerian Naira (NGN)</option>
                  <option value="KES">Kenyan Shilling (KES)</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: colors.textBrown,
                  }}
                >
                  Theme
                </label>
                <select
                  value={formData.preferences.theme}
                  onChange={(e) => handleInputChange("preferences", "theme", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${colors.mediumBrown}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: colors.textBrown,
                    backgroundColor: colors.backgroundBrown,
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </select>
              </div>
            </div>

            {/* Save Changes Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px" }}>
              <button
                style={{
                  padding: "12px 24px",
                  backgroundColor: colors.primaryBrown,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={handleSubmit}
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InvestorSettings