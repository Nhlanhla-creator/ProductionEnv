import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Calendar, Settings, LogOut, User, Upload, X, ChevronRight } from "lucide-react"
import styles from "./Header.module.css"
import { auth, db, storage } from "../../../firebaseConfig"
import { collection, query, where, onSnapshot, getDoc, updateDoc, doc, orderBy, limit, getDocs, writeBatch } from "firebase/firestore"
import { roleRoutes } from "../../../config/headerConfig"
import { useHeaderProfile } from "../../../hooks/useHeaderProfile"
import { useRoles } from "../../../hooks/useRoles"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import Feedback from "../../../Feedback"
import BookSession from "../../../main_pages/BookSession"

/**
 * Reusable Header Component with Advanced Messages Feature
 * @param {Object} props
 * @param {string} props.userCollection - Firestore collection for user data
 * @param {string} props.userNameField - Path to username field
 * @param {string} props.logoField - Path to logo/image field
 * @param {string} props.portalName - Portal name (e.g., "Investor Portal")
 * @param {React.Component} props.NotificationComponent - Notification component to render
 * @param {Array} props.roleOptions - Available role options
 * @param {Function} props.onRoleSwitch - Custom role switch handler
 * @param {boolean} props.enableAdvancedMessages - Enable advanced messages dropdown
 * @param {string} props.messagesRoute - Custom route for messages page
 * @param {string} props.messageSenderCollection - Collection to fetch sender names from
 */
function Header({
  user: propUser = null,
  userName: propUserName = null,
  profileLogo: propProfileLogo = null,
  profileData: propProfileData = null,
  userCollection = "universalProfiles",
  userNameField = "contactDetails.contactName",
  logoField = "entityOverview.companyLogo",
  portalName = "Portal",
  NotificationComponent,
  roleOptions = [],
  onRoleSwitch,
  enableAdvancedMessages = false,
  messagesRoute = "/messages",
  messageSenderCollection = "MyuniversalProfiles",
}) {
  const navigate = useNavigate()
  const [date, setDate] = useState(new Date())
  const { user, userName, profileLogo, profileData, loading, error, refreshProfile } = useHeaderProfile(
    userCollection,
    userNameField,
    logoField,
    portalName === 'Portal' ? 'User' : portalName
  )
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMessages, setShowMessages] = useState(false)
  const [showAddRole, setShowAddRole] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [recentMessages, setRecentMessages] = useState([])
  const [imageUploading, setImageUploading] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const roleFromLocalStorage = localStorage.getItem("selectedRole") || null
  const { availableRoles, selectedRole, addRole, switchRole } = useRoles(roleFromLocalStorage)
  const [newRoleInput, setNewRoleInput] = useState("")

  const profileRef = useRef(null)
  const messagesRef = useRef(null)
  const modalRef = useRef(null)

  // Listen for sidebar state changes
  useEffect(() => {
    const handleSidebarStateChange = () => {
      const collapsed = document.body.classList.contains("sidebar-collapsed")
      setIsSidebarCollapsed(collapsed)
    }

    handleSidebarStateChange()
    const observer = new MutationObserver(handleSidebarStateChange)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  // Profile & roles managed by hooks (useHeaderProfile, useRoles)

  // Fetch unread messages and recent messages if enabled
  const effectiveUser = propUser || user
  useEffect(() => {
    if (!effectiveUser) return

    // Query for unread messages
    const unreadQuery = query(
      collection(db, "messages"),
      where("to", "==", effectiveUser.uid),
      where("read", "==", false)
    )

    const unsubscribeUnread = onSnapshot(unreadQuery, (snapshot) => {
      setUnreadMessages(snapshot.size)
    })

    // If advanced messages is enabled, fetch recent messages with sender info
    if (enableAdvancedMessages) {
      const recentQuery = query(
        collection(db, "messages"),
        where("to", "==", effectiveUser.uid),
        where("read", "==", false),
        orderBy("date", "desc"),
        limit(5)
      )

      const unsubscribeRecent = onSnapshot(recentQuery, async (snapshot) => {
        const messagesWithSenders = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const msg = docSnap.data()
            
            // Try to fetch sender name
            let senderName = "Unknown Funder"
            if (msg.from) {
              try {
                const senderDoc = await getDoc(doc(db, messageSenderCollection, msg.from))
                if (senderDoc.exists()) {
                  const data = senderDoc.data()
                  // Try different paths for sender name
                  const fundName = data?.formData?.productsServices?.funds?.[0]?.name
                  const contactName = data?.formData?.contactDetails?.primaryContactName
                  const registeredName = data?.formData?.entityOverview?.registeredName
                  const companyName = data?.company
                  
                  senderName = fundName || contactName || registeredName || companyName || "Unnamed Funder"
                }
              } catch (err) {
                console.error("Error fetching sender name:", err)
              }
            }
            
            return {
              ...msg,
              id: docSnap.id,
              senderName,
              date: msg.date?.toDate?.() || new Date(msg.date)
            }
          })
        )
        
        setRecentMessages(messagesWithSenders)
      })

      return () => {
        unsubscribeUnread()
        unsubscribeRecent()
      }
    }

    return () => unsubscribeUnread()
  }, [effectiveUser, enableAdvancedMessages, messageSenderCollection])

  // Update date every minute
  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target)) {
        setShowMessages(false)
      }
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowAddRole(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // ESC key handler
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (showAddRole) setShowAddRole(false)
        if (showMessages) setShowMessages(false)
        if (showProfileMenu) setShowProfileMenu(false)
      }
    }

    document.addEventListener("keydown", handleEscKey)
    return () => document.removeEventListener("keydown", handleEscKey)
  }, [showAddRole, showMessages, showProfileMenu])

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      alert("Please select a valid image file (JPEG, PNG, GIF, or WebP)")
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert("Image size must be less than 5MB")
      return
    }

    try {
      setImageUploading(true)
      const currentUser = auth.currentUser
      if (!currentUser) throw new Error("User not authenticated")

      const timestamp = Date.now()
      const fileName = `profile_images/${currentUser.uid}/${timestamp}_${file.name}`
      const storageRef = ref(storage, fileName)

      const uploadResult = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(uploadResult.ref)

      const userDocRef = doc(db, userCollection, currentUser.uid)
      const currentProfileDoc = await getDoc(userDocRef)
      const currentData = currentProfileDoc.exists() ? currentProfileDoc.data() : {}

      // Update nested field
      const updatePath = logoField.split('.')
      let updatedData = { ...currentData }
      let current = updatedData

      for (let i = 0; i < updatePath.length - 1; i++) {
        if (!current[updatePath[i]]) current[updatePath[i]] = {}
        current = current[updatePath[i]]
      }
      current[updatePath[updatePath.length - 1]] = downloadURL
      updatedData.updatedAt = new Date().toISOString()

      await updateDoc(userDocRef, updatedData)
      // Call refreshProfile to get latest profile data from hook
      if (typeof refreshProfile === "function") {
        await refreshProfile()
      }

      // Delete old image if exists
      const oldImagePath = logoField.split('.').reduce((obj, key) => obj?.[key], currentData)
      if (oldImagePath && oldImagePath !== downloadURL && oldImagePath.includes("firebase")) {
        try {
          const oldImageRef = ref(storage, oldImagePath)
          await deleteObject(oldImageRef)
        } catch (deleteError) {
          console.warn("Could not delete old image:", deleteError)
        }
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Failed to upload image. Please try again.")
    } finally {
      setImageUploading(false)
    }
  }

  const handleRoleSwitch = async (role) => {
    if (onRoleSwitch) {
      onRoleSwitch(role)
    } else {
      // Default role switch behavior
      try {
        await switchRole(role)
      } catch (err) {
        console.error('Failed to switch role', err)
      }
      
      // Navigate based on centralized roleRoutes
      navigate(roleRoutes[role] || "/auth")
    }
  }

  const addNewRole = async () => {
    if (!newRoleInput) return
    if (availableRoles.includes(newRoleInput)) {
      alert("Role already exists.")
      return
    }

    try {
      await addRole(newRoleInput)
      setShowAddRole(false)
      setNewRoleInput("")
      handleRoleSwitch(newRoleInput)
    } catch (err) {
      console.error("Failed to add role:", err)
      alert("Error adding role")
    }
  }

  const handleLogout = () => {
    auth.signOut().then(() => navigate("/auth"))
  }

  // Mark all messages as read
  const markAllAsRead = async () => {
    try {
      const q = query(
        collection(db, "messages"),
        where("to", "==", effectiveUser.uid),
        where("read", "==", false)
      )
      
      const snapshot = await getDocs(q)
      const batch = writeBatch(db)
      
      snapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { read: true })
      })
      
      await batch.commit()
      setUnreadMessages(0)
      setRecentMessages([])
    } catch (err) {
      console.error("Error marking messages as read:", err)
    }
  }

  const getAvailableRoleOptions = () => {
    return roleOptions.filter((role) => !availableRoles.includes(role))
  }

  const effectiveUserName = propUserName || userName
  const effectiveProfileLogo = propProfileLogo || profileLogo
  const effectiveProfileData = propProfileData || profileData
  const getProfileImage = () => {
    return effectiveProfileLogo || (logoField.split('.').reduce((obj, key) => obj?.[key], effectiveProfileData))
  }

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  if (loading) {
    return <div className={styles.loading}>Loading user data...</div>
  }

  if (error) {
    return <div className={styles.error}>{error}</div>
  }

  return (
    <header
      className={styles.header}
      data-sidebar-collapsed={isSidebarCollapsed}
    >
      <div className={styles.headerLeft}>
        <div className={styles.headerLogo}>
          <img src="/MainLogo.png" alt="Logo" className={styles.logoImage} />
        </div>

        <div className={styles.welcomeContainer}>
          <h1 className={styles.welcomeMessage}>
            Welcome back, <span className={styles.userName}>{effectiveUserName}</span>
          </h1>
          <div className={styles.dateDisplay}>
            <Calendar size={14} className={styles.calendarIcon} />
            {formattedDate}
          </div>
        </div>

        <div className={styles.headerButtons}>
          <Feedback />
          <BookSession />
        </div>
      </div>

      <div className={styles.headerRight}>
        <div className={styles.headerIcons}>
          {NotificationComponent && (
            <div className={styles.iconWrapper}>
              <NotificationComponent />
            </div>
          )}

          <div className={styles.iconWrapper} ref={messagesRef}>
            <button
              className={`${styles.iconButton} ${showMessages ? styles.active : ""}`}
              onClick={() => {
                setShowMessages(!showMessages)
                setShowProfileMenu(false)
              }}
              aria-label="Messages"
            >
              <div className={styles.messageIconContainer}>
                <Mail size={20} />
                {unreadMessages > 0 && (
                  <span className={styles.messageBadge}>
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </div>
            </button>

            {showMessages && enableAdvancedMessages && (
              <div className={`${styles.dropdownMenu} ${styles.messagesDropdown}`}>
                <div className={styles.dropdownHeader}>
                  <h3>Messages</h3>
                  {unreadMessages > 0 && (
                    <button 
                      className={styles.markReadButton}
                      onClick={markAllAsRead}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className={styles.dropdownDivider}></div>
                <div className={styles.messagesList}>
                  {recentMessages.length === 0 ? (
                    <div className={styles.messageItem}>
                      <div className={styles.noMessages}>
                        <Mail size={24} className={styles.noMessagesIcon} />
                        <p>No new messages</p>
                      </div>
                    </div>
                  ) : (
                    recentMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`${styles.messageItem} ${styles.unread}`}
                        onClick={() => {
                          navigate(messagesRoute)
                          setShowMessages(false)
                        }}
                      >
                        <div className={styles.messageAvatar}>
                          <div className={styles.avatarPlaceholder}>
                            {msg.senderName?.charAt(0).toUpperCase() || "U"}
                          </div>
                        </div>
                        <div className={styles.messageContent}>
                          <p className={styles.messageSender}>
                            {msg.senderName || "Unknown Funder"}
                          </p>
                          <p className={styles.messageText}>
                            {msg.subject || "No subject"}
                          </p>
                          <p className={styles.messageTime}>
                            {msg.date.toLocaleString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "numeric",
                              month: "short"
                            })}
                          </p>
                        </div>
                        <ChevronRight size={16} className={styles.messageArrow} />
                      </div>
                    ))
                  )}
                </div>
                <div className={styles.dropdownFooter}>
                  <button 
                    className={styles.viewAllButton}
                    onClick={() => {
                      navigate(messagesRoute)
                      setShowMessages(false)
                    }}
                  >
                    View all messages
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.profileWrapper} ref={profileRef}>
          <button
            className={styles.profileButton}
            onClick={() => {
              setShowProfileMenu(!showProfileMenu)
              setShowMessages(false)
            }}
          >
            <div className={styles.profileImageContainer}>
              {getProfileImage() ? (
                <img
                  src={getProfileImage()}
                  alt="Profile"
                  className={styles.profileImage}
                />
              ) : (
                <div className={styles.profilePlaceholder}>
                  {effectiveUserName?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </button>

          {showProfileMenu && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownHeader}>
                <div className={styles.profileInfoLarge}>
                  <div className={styles.profileImageLarge}>
                    {getProfileImage() ? (
                      <img src={getProfileImage()} alt="Profile" />
                    ) : (
                      <div className={styles.profilePlaceholderLarge}>
                        {effectiveUserName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <label
                      htmlFor="profile-upload"
                      className={`${styles.changeAvatarButton} ${
                        imageUploading ? styles.uploading : ""
                      }`}
                    >
                      {imageUploading ? (
                        <>
                          <Upload size={12} className={styles.spinning} />
                          Uploading...
                        </>
                      ) : (
                        "Change"
                      )}
                      <input
                        id="profile-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleImageUpload}
                        disabled={imageUploading}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                  <div>
                    <h3 className={styles.profileNameLarge}>{effectiveUserName}</h3>
                    <p className={styles.profileEmailLarge}>{user?.email}</p>
                    <p className={styles.profileRole}>{portalName}</p>
                  </div>
                </div>
              </div>

              <div className={styles.dropdownDivider}></div>

              <div className={styles.dropdownMenuItems}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    navigate("/settings")
                    setShowProfileMenu(false)
                  }}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>

                <button
                  className={`${styles.dropdownItem} ${styles.addRoleTrigger}`}
                  onClick={() => {
                    setShowAddRole(true)
                    setShowProfileMenu(false)
                  }}
                >
                  <User size={16} />
                  <span>+ Add New Role</span>
                </button>
              </div>

              {availableRoles.length > 1 && (
                <>
                  <div className={styles.dropdownDivider}></div>
                  <div className={styles.dropdownSubheader}>Switch Profile</div>

                  {/* Scrollable roles list */}
                  <div className={styles.rolesList}>
                    {availableRoles.map((role, idx) => (
                      <button
                        key={idx}
                        className={`${styles.dropdownItem} ${
                          selectedRole === role ? styles.activeRole : ""
                        }`}
                        onClick={() => {
                          // Defensive: prevent switching to the same role
                          if (selectedRole === role) {
                            setShowProfileMenu(false)
                            return
                          }

                          handleRoleSwitch(role)
                          setShowProfileMenu(false)
                        }}
                        disabled={selectedRole === role}
                        aria-current={selectedRole === role ? "true" : undefined}
                        aria-disabled={selectedRole === role}
                        title={selectedRole === role ? "Currently selected" : undefined}
                      >
                        <User size={16} />
                        <span>{role}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className={styles.dropdownDivider}></div>
              <div className={styles.dropdownFooter}>
                <button className={styles.logoutButton} onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Role Modal */}
      {showAddRole && (
        <div className={styles.modalOverlay}>
          <div className={styles.addRoleModal} ref={modalRef}>
            <div className={styles.modalHeader}>
              <h3>Add New Role</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowAddRole(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalContent}>
              <p className={styles.modalDescription}>
                Select a new role to add to your profile:
              </p>
              <div className={styles.roleSelector}>
                <label htmlFor="role-select">Available Roles:</label>
                <select
                  id="role-select"
                  value={newRoleInput}
                  onChange={(e) => setNewRoleInput(e.target.value)}
                  className={styles.roleSelect}
                >
                  <option value="">Select a role</option>
                  {getAvailableRoleOptions().map((role, idx) => (
                    <option key={idx} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.btnCancel}
                  onClick={() => setShowAddRole(false)}
                >
                  Cancel
                </button>
                <button
                  className={styles.btnAdd}
                  onClick={addNewRole}
                  disabled={!newRoleInput}
                >
                  <User size={16} />
                  Add Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header