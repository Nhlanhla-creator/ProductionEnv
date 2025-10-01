"use client"

import { useState, useEffect } from "react"
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
    }

    // Check initial state
    checkSidebarState()

    // Watch for changes
    const observer = new MutationObserver(checkSidebarState)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const getContainerStyles = () => ({
    backgroundColor: colors.backgroundBrown,
    minHeight: "100vh",
    padding: "2rem",
    marginLeft: isSidebarCollapsed ? "100px" : "270px",
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
  
  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    setDeleteMessage("")
    try {
      const user = auth.currentUser
      if (user) {
        await deleteUser(user)
        await deleteDoc(doc(db, "users", user.uid))
        setDeleteMessage("Account deleted successfully.")
        setTimeout(() => {
          auth.signOut()
          window.location.href = "/"
        }, 2000)
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      setDeleteMessage(`Error deleting account: ${error.message}`)
    } finally {
      setDeleteLoading(false)
    }
  }

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
            marginTop: "3rem",
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
    </div>
  )
}