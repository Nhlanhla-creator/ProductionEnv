"use client"

import { useState, useEffect } from "react"
import { auth, db } from '../../firebaseConfig';
import { 
  doc, getDoc, updateDoc, deleteDoc, 
  collection, addDoc, query, where, 
  getDocs, arrayUnion, arrayRemove ,setDoc
} from "firebase/firestore"
import TwoFactorSetup from '../../TwoFactorSetup';
import { updatePassword, deleteUser } from "firebase/auth"
import { differenceInDays } from "date-fns"; 

const AssociateSettings = () => {
  const [activeTab, setActiveTab] = useState("Account")
  const [showDeleteRolePopup, setShowDeleteRolePopup] = useState(false)
  const [showDeleteAccountPopup, setShowDeleteAccountPopup] = useState(false)
  const [userRoles, setUserRoles] = useState([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState("")
  const [message, setMessage] = useState("")
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [disabling2FA, setDisabling2FA] = useState(false)
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [companyMembers, setCompanyMembers] = useState([])
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("associate")
  const [companyId, setCompanyId] = useState(null)
  const [isCompanyOwner, setIsCompanyOwner] = useState(false)
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState("")
  const [inviteError, setInviteError] = useState("")
  const [invitations, setInvitations] = useState([])
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false)
  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    type: "LLC",
    industry: "",
    employeeCount: "1-10",
    registrationNumber: "",
    website: "",
    description: "",
    foundedYear: "",
    country: "South Africa",
    city: "",
    address: "",
  })
  const [companyTypes] = useState([
    "LLC", "Corporation", "Partnership", "Sole Proprietorship", 
    "Non-Profit", "Public Company", "Private Company", "Other"
  ])
  const [employeeRanges] = useState([
    "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"
  ])
  const [industries] = useState([
    "Technology", "Retail", "Manufacturing", "Finance", "Healthcare",
    "Education", "Construction", "Transportation", "Energy", "Agriculture",
    "Media", "Hospitality", "Real Estate", "Consulting", "Other"
  ])
  const [countries] = useState([
    "South Africa", "Nigeria", "Kenya", "Ghana", "Botswana",
    "Zambia", "Zimbabwe", "Mozambique", "Namibia", "Uganda",
    "Tanzania", "Rwanda", "United States", "United Kingdom", "Other"
  ])
  const [companyLoading, setCompanyLoading] = useState(false)
  const [companyError, setCompanyError] = useState("")
  const [companySuccess, setCompanySuccess] = useState("")
  const [companyData, setCompanyData] = useState(null)

  // Associate-specific state
  const [associateInfo, setAssociateInfo] = useState({
    specialization: "",
    yearsOfExperience: "",
    certifications: [],
    linkedInProfile: "",
    portfolioUrl: "",
    areasOfExpertise: [],
    hourlyRate: "",
    availability: "available"
  })
  const [showEditAssociateInfo, setShowEditAssociateInfo] = useState(false)
  const [associateLoading, setAssociateLoading] = useState(false)

  const generateCompanyId = () => {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 11).toUpperCase()
    return `COMP_${timestamp}_${randomStr}`
  }

  const checkUserCompany = async () => {
    const user = auth.currentUser
    if (!user) return

    try {
      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists() && userSnap.data().companyId) {
        const companyId = userSnap.data().companyId
        const companyRef = doc(db, "companies", companyId)
        const companySnap = await getDoc(companyRef)
        
        if (companySnap.exists()) {
          setCompanyData({
            id: companySnap.id,
            ...companySnap.data()
          })
          
          // Check if user is owner or admin
          const userRole = userSnap.data().userRole
          setIsCompanyOwner(userRole === 'owner')
          setIsCompanyAdmin(userRole === 'companyadmin' || userRole === 'owner')
        }
      }
    } catch (error) {
      console.error("Error checking user company:", error)
    }
  }

  useEffect(() => {
    loadUserData()
    check2FAStatus()
    checkUserCompany()
    loadAssociateInfo()
  }, [])

  useEffect(() => {
    if (companyId && isCompanyAdmin) {
      loadInvitations(companyId)
      loadCompanyMembers(companyId)
    }
  }, [companyId, isCompanyAdmin])

  // Load associate-specific information
  const loadAssociateInfo = async () => {
    const user = auth.currentUser
    if (!user) return

    try {
      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        const data = userSnap.data()
        if (data.associateInfo) {
          setAssociateInfo(data.associateInfo)
        }
      }
    } catch (error) {
      console.error("Error loading associate info:", error)
    }
  }

  const loadUserData = async () => {
    const user = auth.currentUser
    if (!user) return

    try {
      const docRef = doc(db, "users", user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        
        setFormData(prev => ({
          ...prev,
          account: {
            email: data.email || "",
            name: data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            phone: data.phone || "",
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            bio: data.bio || "",
          },
          notifications: {
            emailNotifications: data.notifications?.email ?? true,
            smsNotifications: data.notifications?.sms ?? false,
            matchAlerts: data.notifications?.matchAlerts ?? true,
            messageAlerts: data.notifications?.messageAlerts ?? true,
            documentAlerts: data.notifications?.documentAlerts ?? true,
            newsletterSubscription: data.notifications?.newsletter ?? true,
          },
          privacy: {
            profileVisibility: data.privacy?.profileVisibility || "public",
            contactInfoVisibility: data.privacy?.contactInfoVisibility || "matches",
            experienceVisibility: data.privacy?.experienceVisibility || "public",
            allowDataSharing: data.privacy?.allowDataSharing ?? true,
          },
          preferences: {
            language: data.language || "en",
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            currency: data.currency || "ZAR",
            theme: data.theme || "light",
          }
        }))

        if (Array.isArray(data.roleArray)) {
          setUserRoles(data.roleArray)
        } else if (typeof data.role === "string") {
          setUserRoles(data.role.split(",").map(r => r.trim()))
        }

        if (data.companyId) {
          setCompanyId(data.companyId)
          setIsCompanyOwner(data.userRole === 'owner')
          setIsCompanyAdmin(data.userRole === 'companyadmin' || data.userRole === 'owner')
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  const check2FAStatus = async () => {
    const user = auth.currentUser
    if (user) {
      const docRef = doc(db, "users", user.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setTwoFactorEnabled(data?.twoFactorEnabled || false)
      }
    }
  }

  const loadInvitations = async (companyId) => {
    if (!isCompanyAdmin) return
    
    try {
      const invitationsQuery = query(
        collection(db, "invitations"),
        where("companyId", "==", companyId),
        where("status", "==", "pending")
      )
      
      const invitationsSnapshot = await getDocs(invitationsQuery)
      const invitationsList = []
      
      invitationsSnapshot.forEach((doc) => {
        invitationsList.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      setInvitations(invitationsList)
    } catch (error) {
      console.error("Error loading invitations:", error)
    }
  }

  const loadCompanyMembers = async (companyId) => {
    if (!isCompanyAdmin) return
    
    try {
      const usersQuery = query(
        collection(db, "users"),
        where("companyId", "==", companyId)
      )
      
      const usersSnapshot = await getDocs(usersQuery)
      const members = []
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data()
        members.push({
          id: doc.id,
          email: userData.email,
          username: userData.username || userData.displayName,
          role: userData.userRole || 'associate',
          joinedAt: userData.createdAt || new Date().toISOString()
        })
      })
      
      setCompanyMembers(members)
    } catch (error) {
      console.error("Error loading company members:", error)
    }
  }

  const handleInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  const handleAssociateInfoChange = (field, value) => {
    setAssociateInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveAssociateInfo = async () => {
    setAssociateLoading(true)
    try {
      const user = auth.currentUser
      if (!user) return

      await updateDoc(doc(db, "users", user.uid), {
        associateInfo: associateInfo
      })
      
      alert("Associate information saved successfully!")
      setShowEditAssociateInfo(false)
    } catch (error) {
      console.error("Error saving associate info:", error)
      alert("Failed to save associate information")
    } finally {
      setAssociateLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const user = auth.currentUser
      if (!user) return

      const updateData = {
        firstName: formData.account.firstName,
        lastName: formData.account.lastName,
        displayName: formData.account.name,
        email: formData.account.email,
        phone: formData.account.phone,
        bio: formData.account.bio,
        notifications: {
          email: formData.notifications.emailNotifications,
          sms: formData.notifications.smsNotifications,
          matchAlerts: formData.notifications.matchAlerts,
          messageAlerts: formData.notifications.messageAlerts,
          documentAlerts: formData.notifications.documentAlerts,
          newsletter: formData.notifications.newsletterSubscription,
        },
        privacy: {
          profileVisibility: formData.privacy.profileVisibility,
          contactInfoVisibility: formData.privacy.contactInfoVisibility,
          experienceVisibility: formData.privacy.experienceVisibility,
          allowDataSharing: formData.privacy.allowDataSharing,
        },
        language: formData.preferences.language,
        timezone: formData.preferences.timezone,
        currency: formData.preferences.currency,
        theme: formData.preferences.theme,
      }

      await updateDoc(doc(db, "users", user.uid), updateData)
      setMessage("Settings saved successfully!")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Save error:", error)
      setMessage(`Error saving settings: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

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

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return
    }

    setDisabling2FA(true)
    try {
      const user = auth.currentUser
      await updateDoc(doc(db, "users", user.uid), {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorSetupDate: null
      })
      setTwoFactorEnabled(false)
      alert('Two-factor authentication has been disabled.')
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      alert('Failed to disable 2FA. Please try again.')
    } finally {
      setDisabling2FA(false)
    }
  }

  const handle2FASetupSuccess = () => {
    setTwoFactorEnabled(true)
    alert('Two-factor authentication has been enabled successfully!')
  }

  const handleDeleteRole = async () => {
    setLoadingRoles(true)
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
        setShowDeleteRolePopup(true)
      }
    } catch (error) {
      console.error("Error fetching user roles:", error)
      alert("Failed to fetch roles")
    } finally {
      setLoadingRoles(false)
    }
  }

  const confirmDeleteRole = async (roleToDelete) => {
    try {
      const user = auth.currentUser
      if (!user) return

      const userDocRef = doc(db, "users", user.uid)
      const userDocSnap = await getDoc(userDocRef)
      
      if (!userDocSnap.exists()) {
        alert("User profile not found.")
        return
      }

      const userData = userDocSnap.data()

      let updatedRoleArray = []
      if (userData.roleArray && Array.isArray(userData.roleArray)) {
        updatedRoleArray = userData.roleArray.filter(r => r !== roleToDelete)
      }

      let updatedRoleString = ""
      if (userData.role && typeof userData.role === "string") {
        const rolesSplit = userData.role.split(",").map(r => r.trim())
        const filteredRoles = rolesSplit.filter(r => r !== roleToDelete)
        updatedRoleString = filteredRoles.join(",")
      }

      const updatedRolesMap = { ...(userData.roles || {}) }
      updatedRolesMap[roleToDelete] = {
        deletedStatus: true,
        deletedAt: Date.now(),
      }

      await updateDoc(userDocRef, {
        roleArray: updatedRoleArray,
        role: updatedRoleString,
        roles: updatedRolesMap,
      })

      alert(`Role "${roleToDelete}" has been soft-deleted. You can retrieve it within 30 days.`)

      setUserRoles(prev => prev.filter(r => r !== roleToDelete))
      setShowDeleteRolePopup(false)

    } catch (err) {
      console.error("Error deleting role:", err)
      alert("Failed to delete role. Please try again.")
    }
  }

  const handleDeleteAccount = async () => {
    const confirmAction = window.confirm(
      "⚠️ Account Deletion Request\n\n" +
      "Your account will be scheduled for deletion with a 30-day grace period.\n\n" +
      "During this time:\n" +
      "• Your data will be hidden from the platform\n" +
      "• You can recover your account anytime\n" +
      "• After 30 days, all data will be permanently deleted\n\n" +
      "Do you want to proceed?"
    )
    
    if (!confirmAction) return

    setDeleteLoading(true)
    setDeleteMessage("")
    
    try {
      const user = auth.currentUser
      if (!user) {
        setDeleteMessage("No user logged in.")
        return
      }

      const userId = user.uid
      const deletionTimestamp = Date.now()
      const hardDeleteDate = new Date(deletionTimestamp + 30 * 24 * 60 * 60 * 1000)

      const collectionsToMark = [
        'advisorProfiles', 'catalystProfiles', 'messages', 'notifications',
        'userPreferences', 'users', 'subscriptions', 'payments'
      ]

      for (const collectionName of collectionsToMark) {
        try {
          const docRef = doc(db, collectionName, userId)
          const docSnap = await getDoc(docRef)
          
          if (docSnap.exists()) {
            await updateDoc(docRef, {
              deletedAt: deletionTimestamp,
              deletedStatus: true,
              hardDeleteDate: hardDeleteDate.toISOString(),
              deletionReason: 'user_requested',
            })
          }
        } catch (err) {
          console.error(`Failed to mark deletion in ${collectionName}:`, err)
        }
      }

      await auth.signOut()
      
      setDeleteMessage(`Account scheduled for deletion. You can recover your account within 30 days.`)
      
      setTimeout(() => {
        window.location.href = "/"
      }, 3000)

    } catch (error) {
      console.error("Error scheduling account deletion:", error)
      
      if (error.code === 'auth/requires-recent-login') {
        setDeleteMessage("For security, please log out and log back in before deleting your account.")
      } else {
        setDeleteMessage(`Error scheduling deletion: ${error.message}`)
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleInviteMember = async () => {
    // Associates can only invite if they are admins
    if (!isCompanyAdmin) {
      setInviteError("You don't have permission to invite team members.")
      return
    }

    const validateEmail = (email) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    }

    if (!inviteEmail || !validateEmail(inviteEmail)) {
      setInviteError("Please enter a valid email address.")
      return
    }

    setInviteLoading(true)
    setInviteError("")
    setInviteSuccess("")

    try {
      const user = auth.currentUser
      if (!user || !companyId) {
        setInviteError("You need to be logged in and have a company.")
        return
      }

      const companyRef = doc(db, "companies", companyId)
      const companySnap = await getDoc(companyRef)
      
      if (!companySnap.exists()) {
        setInviteError("Company not found.")
        return
      }
      
      const companyData = companySnap.data()

      const invitationToken = Math.random().toString(36).substring(2, 15) + 
                             Math.random().toString(36).substring(2, 15)

      const invitationData = {
        email: inviteEmail,
        companyId: companyId,
        companyName: companyData.name || "Your Company",
        role: inviteRole,
        invitedBy: user.uid,
        invitedByEmail: user.email,
        invitedByName: formData.account.name,
        status: 'pending',
        token: invitationToken,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        emailSent: false,
        emailSentAt: null
      }

      await addDoc(collection(db, "invitations"), invitationData)

      setInviteSuccess(`Invitation sent to ${inviteEmail}!`)
      setInviteEmail("")
      setInviteRole("associate")
      setShowAddMemberModal(false)

    } catch (error) {
      console.error("Error inviting member:", error)
      setInviteError("Failed to create invitation. Please try again.")
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemoveMember = async (memberId) => {
    // Only company owners can remove members
    if (!isCompanyOwner) {
      alert("Only company owners can remove team members.")
      return
    }

    if (!window.confirm("Are you sure you want to remove this team member?")) {
      return
    }

    try {
      if (!companyId) return

      await updateDoc(doc(db, "users", memberId), {
        companyId: null,
        userRole: null
      })

      await loadCompanyMembers(companyId)

    } catch (error) {
      console.error("Error removing member:", error)
      alert("Failed to remove team member.")
    }
  }

  const handleUpdateRole = async (memberId, newRole) => {
    // Only company owners can update roles
    if (!isCompanyOwner) {
      alert("Only company owners can update team member roles.")
      return
    }

    try {
      await updateDoc(doc(db, "users", memberId), {
        userRole: newRole
      })

      await loadCompanyMembers(companyId)
      
    } catch (error) {
      console.error("Error updating role:", error)
      alert("Failed to update role.")
    }
  }

  const [formData, setFormData] = useState({
    account: {
      email: "",
      name: "",
      phone: "",
      firstName: "",
      lastName: "",
      bio: "",
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
      profileVisibility: "public",
      contactInfoVisibility: "matches",
      experienceVisibility: "public",
      allowDataSharing: true,
    },
    preferences: {
      language: "en",
      timezone: "",
      currency: "ZAR",
      theme: "light",
    },
    security: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
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
          Association Settings
        </h1>
        <p style={{ color: colors.textBrown, opacity: 0.7, marginTop: "0.5rem" }}>
          Manage your associate profile and preferences
        </p>
      </div>

      <div
        style={{
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "40px",
        }}
      >
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          {["Account", "Notifications", "Security", "Appearance", "Association Info", "Team"].map((tab) => (
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.account.firstName}
                      onChange={(e) => handleInputChange("account", "firstName", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: `1px solid ${colors.mediumBrown}`,
                        borderRadius: "8px",
                        fontSize: "14px",
                        color: colors.textBrown,
                        backgroundColor: colors.backgroundBrown,
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
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.account.lastName}
                      onChange={(e) => handleInputChange("account", "lastName", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: `1px solid ${colors.mediumBrown}`,
                        borderRadius: "8px",
                        fontSize: "14px",
                        color: colors.textBrown,
                        backgroundColor: colors.backgroundBrown,
                        outline: "none",
                      }}
                    />
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
                    Display Name
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
                    Bio
                  </label>
                  <textarea
                    value={formData.account.bio}
                    onChange={(e) => handleInputChange("account", "bio", e.target.value)}
                    rows="4"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${colors.mediumBrown}`,
                      borderRadius: "8px",
                      fontSize: "14px",
                      color: colors.textBrown,
                      backgroundColor: colors.backgroundBrown,
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>

              {message && (
                <div style={{ 
                  marginTop: "1rem", 
                  padding: "0.75rem 1rem", 
                  backgroundColor: message.includes("Error") ? "#fef2f2" : "#f0fdf4",
                  color: message.includes("Error") ? "#dc2626" : "#059669",
                  borderRadius: "8px",
                  fontSize: "0.95rem"
                }}>
                  {message}
                </div>
              )}

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
                    opacity: loading ? 0.7 : 1,
                  }}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
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
                  matchAlerts: { title: "Opportunity Alerts", desc: "Get notified about new matching opportunities" },
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
                        {labels[key]?.title || key}
                      </h3>
                      <p
                        style={{
                          fontSize: "13px",
                          color: colors.textBrown,
                          opacity: 0.7,
                          margin: "0",
                        }}
                      >
                        {labels[key]?.desc || ""}
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
                  opacity: loading ? 0.7 : 1,
                }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
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
              Security Settings
            </h2>
            <p
              style={{
                color: colors.textBrown,
                opacity: 0.7,
                margin: "0 0 32px 0",
                fontSize: "14px",
              }}
            >
              Manage your password and security settings
            </p>

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
                    Add an extra layer of security to your account
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
                      ✓ Two-factor authentication is active
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
            <div style={{ marginBottom: "32px" }}>
              <h3 style={{
                color: colors.textBrown,
                fontSize: "1rem",
                fontWeight: "600",
                margin: "0 0 1rem 0",
              }}>
                Change Password
              </h3>

              {!showPasswordFields ? (
                <button
                  onClick={() => setShowPasswordFields(true)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: colors.accentBrown,
                    color: colors.textBrown,
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  Change Password
                </button>
              ) : (
                <div style={{ display: "grid", gap: "16px", maxWidth: "400px" }}>
                  <div>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: colors.textBrown,
                    }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: `1px solid ${colors.mediumBrown}`,
                        borderRadius: "8px",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: colors.textBrown,
                    }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: `1px solid ${colors.mediumBrown}`,
                        borderRadius: "8px",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  {passwordError && (
                    <div style={{ color: "#dc2626", fontSize: "14px" }}>
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div style={{ color: "#059669", fontSize: "14px" }}>
                      Password updated successfully!
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      onClick={handlePasswordChange}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: colors.primaryBrown,
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "500",
                        cursor: "pointer",
                      }}
                    >
                      Update Password
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordFields(false)
                        setNewPassword("")
                        setConfirmNewPassword("")
                        setPasswordError("")
                      }}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: colors.mediumBrown,
                        color: colors.textBrown,
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "500",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Section */}
            <div style={{ marginTop: "48px" }}>
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
                  margin: "0 0 24px 0",
                  fontSize: "14px",
                }}
              >
                Control who can see your profile information
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
                    Profile Visibility
                  </label>
                  <select
                    value={formData.privacy.profileVisibility}
                    onChange={(e) => handleInputChange("privacy", "profileVisibility", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${colors.mediumBrown}`,
                      borderRadius: "8px",
                      fontSize: "14px",
                      color: colors.textBrown,
                      backgroundColor: colors.backgroundBrown,
                      outline: "none",
                    }}
                  >
                    <option value="public">Public - Visible to all users</option>
                    <option value="matches">Matches Only - Visible to matched users</option>
                    <option value="private">Private - Limited visibility</option>
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
                    Contact Information Visibility
                  </label>
                  <select
                    value={formData.privacy.contactInfoVisibility}
                    onChange={(e) => handleInputChange("privacy", "contactInfoVisibility", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${colors.mediumBrown}`,
                      borderRadius: "8px",
                      fontSize: "14px",
                      color: colors.textBrown,
                      backgroundColor: colors.backgroundBrown,
                      outline: "none",
                    }}
                  >
                    <option value="public">Public - Visible to all users</option>
                    <option value="matches">Matches Only - Visible to matched users</option>
                    <option value="private">Private - Not visible to others</option>
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
                    Experience & Expertise Visibility
                  </label>
                  <select
                    value={formData.privacy.experienceVisibility}
                    onChange={(e) => handleInputChange("privacy", "experienceVisibility", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${colors.mediumBrown}`,
                      borderRadius: "8px",
                      fontSize: "14px",
                      color: colors.textBrown,
                      backgroundColor: colors.backgroundBrown,
                      outline: "none",
                    }}
                  >
                    <option value="public">Public - Visible to all users</option>
                    <option value="matches">Matches Only - Visible to matched users</option>
                    <option value="private">Private - Limited visibility</option>
                  </select>
                </div>

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
                      Data Sharing for Matching
                    </h3>
                    <p
                      style={{
                        fontSize: "13px",
                        color: colors.textBrown,
                        opacity: 0.7,
                        margin: "0",
                      }}
                    >
                      Allow your profile data to be used for improved matching algorithms
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
                      checked={formData.privacy.allowDataSharing}
                      onChange={(e) => handleInputChange("privacy", "allowDataSharing", e.target.checked)}
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
                        backgroundColor: formData.privacy.allowDataSharing ? colors.primaryBrown : colors.mediumBrown,
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
                          left: formData.privacy.allowDataSharing ? "23px" : "3px",
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
            </div>

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
                  opacity: loading ? 0.7 : 1,
                }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
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
                <select
                  value={formData.preferences.language}
                  onChange={(e) => handleInputChange("preferences", "language", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${colors.mediumBrown}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: colors.textBrown,
                    backgroundColor: colors.backgroundBrown,
                    outline: "none",
                  }}
                >
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                  <option value="de">German</option>
                  <option value="pt">Portuguese</option>
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
                    outline: "none",
                  }}
                >
                  <option value="Africa/Johannesburg">Africa/Johannesburg (GMT+2)</option>
                  <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                  <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</option>
                  <option value="Africa/Casablanca">Africa/Casablanca (GMT+1)</option>
                  <option value="UTC">UTC</option>
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
                    outline: "none",
                  }}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </select>
              </div>
            </div>

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
                  opacity: loading ? 0.7 : 1,
                }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "Association Info" && (
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: colors.textBrown,
                margin: "0 0 8px 0",
              }}
            >
              Association Information
            </h2>
            <p
              style={{
                color: colors.textBrown,
                opacity: 0.7,
                margin: "0 0 32px 0",
                fontSize: "14px",
              }}
            >
              Share your professional background and expertise
            </p>

            {!showEditAssociateInfo ? (
              <div>
                <div style={{
                  backgroundColor: colors.backgroundBrown,
                  borderRadius: "12px",
                  padding: "1.5rem",
                  marginBottom: "2rem",
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1.5rem",
                  }}>
                    <h3 style={{ color: colors.textBrown, fontSize: "1.1rem", fontWeight: "600", margin: 0 }}>
                      Professional Details
                    </h3>
                    <button
                      onClick={() => setShowEditAssociateInfo(true)}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: colors.primaryBrown,
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: "1rem" }}>
                    <div>
                      <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: "0 0 0.25rem 0" }}>Specialization</p>
                      <p style={{ fontSize: "1rem", color: colors.textBrown, margin: 0 }}>
                        {associateInfo.specialization || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: "0 0 0.25rem 0" }}>Years of Experience</p>
                      <p style={{ fontSize: "1rem", color: colors.textBrown, margin: 0 }}>
                        {associateInfo.yearsOfExperience || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: "0 0 0.25rem 0" }}>Certifications</p>
                      <p style={{ fontSize: "1rem", color: colors.textBrown, margin: 0 }}>
                        {associateInfo.certifications?.length > 0 
                          ? associateInfo.certifications.join(", ") 
                          : "None specified"}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: "0 0 0.25rem 0" }}>Areas of Expertise</p>
                      <p style={{ fontSize: "1rem", color: colors.textBrown, margin: 0 }}>
                        {associateInfo.areasOfExpertise?.length > 0 
                          ? associateInfo.areasOfExpertise.join(", ") 
                          : "None specified"}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: "0 0 0.25rem 0" }}>Availability</p>
                      <p style={{ fontSize: "1rem", color: colors.textBrown, margin: 0 }}>
                        {associateInfo.availability || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: "0 0 0.25rem 0" }}>Hourly Rate</p>
                      <p style={{ fontSize: "1rem", color: colors.textBrown, margin: 0 }}>
                        {associateInfo.hourlyRate ? `$${associateInfo.hourlyRate}/hr` : "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: colors.backgroundBrown,
                borderRadius: "12px",
                padding: "1.5rem",
              }}>
                <div style={{ display: "grid", gap: "1.5rem" }}>
                  <div>
                    <label style={{
                      display: "block",
                      color: colors.textBrown,
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}>
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={associateInfo.specialization}
                      onChange={(e) => handleAssociateInfoChange("specialization", e.target.value)}
                      placeholder="e.g., Financial Consulting, Digital Marketing"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: `1px solid ${colors.mediumBrown}`,
                        borderRadius: "8px",
                        fontSize: "1rem",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: "block",
                      color: colors.textBrown,
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}>
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      value={associateInfo.yearsOfExperience}
                      onChange={(e) => handleAssociateInfoChange("yearsOfExperience", e.target.value)}
                      placeholder="e.g., 5"
                      min="0"
                      max="50"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: `1px solid ${colors.mediumBrown}`,
                        borderRadius: "8px",
                        fontSize: "1rem",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: "block",
                      color: colors.textBrown,
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}>
                      Certifications (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={associateInfo.certifications?.join(", ")}
                      onChange={(e) => handleAssociateInfoChange("certifications", 
                        e.target.value.split(",").map(c => c.trim()).filter(c => c)
                      )}
                      placeholder="e.g., CFA, PMP, Google Analytics"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: `1px solid ${colors.mediumBrown}`,
                        borderRadius: "8px",
                        fontSize: "1rem",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: "block",
                      color: colors.textBrown,
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}>
                      Areas of Expertise (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={associateInfo.areasOfExpertise?.join(", ")}
                      onChange={(e) => handleAssociateInfoChange("areasOfExpertise",
                        e.target.value.split(",").map(a => a.trim()).filter(a => a)
                      )}
                      placeholder="e.g., Strategic Planning, Data Analysis, Risk Management"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: `1px solid ${colors.mediumBrown}`,
                        borderRadius: "8px",
                        fontSize: "1rem",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: "block",
                      color: colors.textBrown,
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}>
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      value={associateInfo.linkedInProfile}
                      onChange={(e) => handleAssociateInfoChange("linkedInProfile", e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: `1px solid ${colors.mediumBrown}`,
                        borderRadius: "8px",
                        fontSize: "1rem",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: "block",
                      color: colors.textBrown,
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}>
                      Portfolio URL
                    </label>
                    <input
                      type="url"
                      value={associateInfo.portfolioUrl}
                      onChange={(e) => handleAssociateInfoChange("portfolioUrl", e.target.value)}
                      placeholder="https://yourportfolio.com"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: `1px solid ${colors.mediumBrown}`,
                        borderRadius: "8px",
                        fontSize: "1rem",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: "block",
                      color: colors.textBrown,
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}>
                      Hourly Rate (USD)
                    </label>
                    <input
                      type="number"
                      value={associateInfo.hourlyRate}
                      onChange={(e) => handleAssociateInfoChange("hourlyRate", e.target.value)}
                      placeholder="e.g., 150"
                      min="0"
                      step="5"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: `1px solid ${colors.mediumBrown}`,
                        borderRadius: "8px",
                        fontSize: "1rem",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: "block",
                      color: colors.textBrown,
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}>
                      Availability
                    </label>
                    <select
                      value={associateInfo.availability}
                      onChange={(e) => handleAssociateInfoChange("availability", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: `1px solid ${colors.mediumBrown}`,
                        borderRadius: "8px",
                        fontSize: "1rem",
                      }}
                    >
                      <option value="available">Available for Work</option>
                      <option value="limited">Limited Availability</option>
                      <option value="unavailable">Not Available</option>
                      <option value="contract">Seeking Contract Work</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <button
                      onClick={() => setShowEditAssociateInfo(false)}
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        backgroundColor: colors.lightBrown,
                        color: colors.textBrown,
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveAssociateInfo}
                      disabled={associateLoading}
                      style={{
                        flex: 2,
                        padding: "0.75rem",
                        backgroundColor: colors.primaryBrown,
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: associateLoading ? "not-allowed" : "pointer",
                        opacity: associateLoading ? 0.7 : 1,
                      }}
                    >
                      {associateLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Team" && (
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: colors.textBrown,
                margin: "0 0 8px 0",
              }}
            >
              Team Management
            </h2>
            <p
              style={{
                color: colors.textBrown,
                opacity: 0.7,
                margin: "0 0 32px 0",
                fontSize: "14px",
              }}
            >
              View your company team members
            </p>

            {!companyId && !companyData ? (
              <div style={{
                padding: "3rem",
                backgroundColor: colors.lightBrown,
                borderRadius: "12px",
                textAlign: "center",
              }}>
                <p style={{ color: colors.textBrown, fontSize: "1rem", marginBottom: "1rem" }}>
                  You are not part of a company team yet.
                </p>
                <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                  Associates are typically invited to join company teams by company owners or admins.
                </p>
              </div>
            ) : (
              <>
                {/* Company Info Card - Read Only for Associates */}
                {companyData && (
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
                      <h3 style={{
                        color: colors.textBrown,
                        fontSize: "1.2rem",
                        fontWeight: "600",
                        margin: 0,
                      }}>
                        {companyData.name}
                      </h3>
                      <span style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: colors.primaryBrown + "20",
                        color: colors.primaryBrown,
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                      }}>
                        {companyData.type}
                      </span>
                    </div>
                    
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "1rem",
                      marginBottom: "1.5rem",
                    }}>
                      <div>
                        <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: "0 0 0.25rem 0" }}>Industry</p>
                        <p style={{ fontSize: "1rem", color: colors.textBrown, margin: 0 }}>{companyData.industry}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: "0 0 0.25rem 0" }}>Employee Count</p>
                        <p style={{ fontSize: "1rem", color: colors.textBrown, margin: 0 }}>{companyData.employeeCount}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: "0 0 0.25rem 0" }}>Country</p>
                        <p style={{ fontSize: "1rem", color: colors.textBrown, margin: 0 }}>{companyData.country}</p>
                      </div>
                    </div>

                    {!isCompanyAdmin && (
                      <p style={{ fontSize: "0.875rem", color: "#6b7280", fontStyle: "italic" }}>
                        You have view-only access to company information.
                      </p>
                    )}
                  </div>
                )}

                {/* Team Members List - Associates can view but not manage */}
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
                      No team members found.
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

                          <div>
                            <span style={{
                              padding: "0.25rem 0.75rem",
                              backgroundColor: colors.primaryBrown + "10",
                              color: colors.primaryBrown,
                              borderRadius: "12px",
                              fontSize: "0.875rem",
                              fontWeight: "500",
                              textTransform: "capitalize",
                            }}>
                              {member.role}
                            </span>
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
                    Your Role: Associate
                  </h3>
                  
                  <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
                    As an associate, you have the following permissions:
                  </p>
                  
                  <ul style={{ color: "#6b7280", paddingLeft: "1.5rem", margin: 0 }}>
                    <li>✓ View company information</li>
                    <li>✓ View team members list</li>
                    <li>✓ Update your own profile and associate information</li>
                    <li>✓ Participate in company projects and tasks</li>
                    <li>✗ Cannot add or remove team members</li>
                    <li>✗ Cannot change member roles</li>
                    <li>✗ Cannot edit company details</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Danger Zone - Separate Section - Associates can only delete their own account/roles */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
        marginTop: "2rem",
      }}>
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
                Remove a specific role from your associate account
              </p>
            </div>
            <button
              onClick={handleDeleteRole}
              disabled={loadingRoles}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.9rem",
                fontWeight: "500",
                cursor: loadingRoles ? "not-allowed" : "pointer",
                opacity: loadingRoles ? 0.7 : 1,
              }}
            >
              {loadingRoles ? "Loading..." : "Delete Role"}
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
                Permanently delete your associate account and all associated data
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

      {/* Delete Role Popup */}
      {showDeleteRolePopup && (
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
                  onClick={() => confirmDeleteRole(role)}
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
              onClick={() => setShowDeleteRolePopup(false)}
              style={{
                width: "100%",
                padding: "1rem",
                backgroundColor: colors.lightBrown,
                color: colors.textBrown,
                border: "none",
                borderRadius: "12px",
                fontWeight: "500",
                cursor: "pointer",
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

      {/* Add Member Modal - Only visible if associate is admin */}
      {showAddMemberModal && isCompanyAdmin && (
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
                  setShowAddMemberModal(false)
                  setInviteEmail("")
                  setInviteError("")
                  setInviteSuccess("")
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
                <option value="associate">Associate</option>
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

      {/* 2FA Setup Modal */}
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

export default AssociateSettings