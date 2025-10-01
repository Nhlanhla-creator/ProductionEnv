"use client"
import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, Mail, Calendar, Settings, LogOut, User, HelpCircle, Upload, Users, Shield, Activity } from "lucide-react"
import styles from "./admin-header.module.css"
import { auth } from "../../firebaseConfig"
import { db, storage } from "../../firebaseConfig"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { getDoc, updateDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { onAuthStateChanged } from "firebase/auth"
import { doc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"

function AdminHeader({ companyName, profileImage, setProfileImage }) {
  const navigate = useNavigate()
  const [date, setDate] = useState(new Date())
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "user",
      message: "New SME registration pending approval",
      time: "30 minutes ago",
      read: false,
    },
    {
      id: 2,
      type: "document",
      message: "5 new documents require review",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      type: "system",
      message: "System backup completed successfully",
      time: "2 hours ago",
      read: true,
    },
    {
      id: 4,
      type: "alert",
      message: "High server load detected",
      time: "1 day ago",
      read: true,
    },
  ])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState(user ? user.displayName || user.email.split("@")[0] : "Admin")
  const [unreadMessages, setUnreadMessages] = useState(0)
  const fileInputRef = useRef(null)
  const dropdownRef = useRef(null)
  const notificationRef = useRef(null)
  const [logo, setLogo] = useState("/MainLogo.png")
  const [imageUploading, setImageUploading] = useState(false)
  const [profileData, setProfileData] = useState({})
  const notificationsRef = useRef(null)
  const messagesRef = useRef(null)
  const profileRef = useRef(null)
  const searchRef = useRef(null)

  const [showNotifications, setShowNotifications] = useState(false)
  const [showMessages, setShowMessages] = useState(false)

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, get their name
        GetuserName()

        // Your existing message notification code
        const q = query(collection(db, "messages"), where("to", "==", user.uid), where("read", "==", false))

        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
          setUnreadMessages(snapshot.size)
          // ... rest of your message handling code
        })

        return () => unsubscribeMessages()
      } else {
        // User is signed out
        setUserName("Admin")
      }
    })

    return () => unsubscribeAuth()
  }, [])

  const GetuserName = async () => {
    try {
      if (!auth.currentUser) return

      const userDocRef = doc(db, "users", auth.currentUser.uid)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        setUserName(
          userDocSnap.data().username ||
            userDocSnap.data().company ||
            auth.currentUser.email.split("@")[0] ||
            "Admin User",
        )
      } else {
        console.log("User document not found!")
        setUserName("Admin")
      }
    } catch (error) {
      console.error("Error getting username:", error)
      setUserName("Admin")
    }
  }

  // Update date every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      alert("Please select a valid image file (JPEG, PNG, GIF, or WebP)")
      return
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      alert("Image size must be less than 5MB")
      return
    }

    try {
      setImageUploading(true)
      const currentUser = auth.currentUser

      if (!currentUser) {
        throw new Error("User not authenticated")
      }

      // Create a unique filename
      const timestamp = Date.now()
      const fileName = `profile_images/${currentUser.uid}/${timestamp}_${file.name}`

      // Create storage reference
      const storageRef = ref(storage, fileName)

      // Upload file to Firebase Storage
      const uploadResult = await uploadBytes(storageRef, file)
      console.log("Image uploaded successfully:", uploadResult)

      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref)
      console.log("Download URL:", downloadURL)

      // Update user profile in Firestore
      const userDocRef = doc(db, "MyuniversalProfiles", currentUser.uid)

      // Get current profile data to preserve existing data
      const currentProfileDoc = await getDoc(userDocRef)
      const currentData = currentProfileDoc.exists() ? currentProfileDoc.data() : {}

      // Update with new image URL
      const updatedData = {
        ...currentData,
        formData: {
          ...currentData.formData,
          entityOverview: {
            ...currentData.formData?.entityOverview,
            companyLogo: downloadURL,
          },
        },
        updatedAt: new Date().toISOString(),
      }

      await updateDoc(userDocRef, updatedData)

      // Update local state
      setProfileData(updatedData)
      if (setProfileImage) {
        setProfileImage(downloadURL)
      }

      // Optional: Delete old image if it exists and is different
      if (
        currentData.entityOverview?.companyLogo &&
        currentData.entityOverview.companyLogo !== downloadURL &&
        currentData.entityOverview.companyLogo.includes("firebase")
      ) {
        try {
          const oldImageRef = ref(storage, currentData.entityOverview.companyLogo)
          await deleteObject(oldImageRef)
          console.log("Old image deleted successfully")
        } catch (deleteError) {
          console.warn("Could not delete old image:", deleteError)
          // Don't throw error here as the main operation succeeded
        }
      }

      console.log("Profile image updated successfully")
    } catch (error) {
      console.error("Error uploading image:", error)

      // Provide user-friendly error messages
      let errorMessage = "Failed to upload image. Please try again."

      if (error.code === "storage/unauthorized") {
        errorMessage = "You do not have permission to upload images."
      } else if (error.code === "storage/canceled") {
        errorMessage = "Upload was canceled."
      } else if (error.code === "storage/unknown") {
        errorMessage = "An unknown error occurred. Please check your internet connection."
      }

      alert(errorMessage)
    } finally {
      setImageUploading(false)
    }
  }

  // Helper function to handle image upload errors
  const handleImageError = (error) => {
    console.error("Image upload error:", error)
    setImageUploading(false)
  }

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profileRef = doc(db, "MyuniversalProfiles", user.uid)
          const profileSnap = await getDoc(profileRef)
          if (!profileSnap.exists()) return

          const data = profileSnap.data()
          setProfileData(data)
        } catch (err) {
          console.error("Failed to load user documents:", err)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleProfileClick = () => setDropdownOpen(!dropdownOpen)
  const handleNotificationClick = () => setNotificationsOpen(!notificationsOpen)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = (e) => setProfileImage(e.target.result)
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const triggerFileInput = () => fileInputRef.current.click()

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }))
    setNotifications(updated)
  }

  const handleLogout = () => {
    auth
      .signOut()
      .then(() => {
        navigate("/login")
      })
      .catch((error) => {
        console.error("Error signing out: ", error)
      })
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const userEmail = user ? user.email : ""

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  if (loading) {
    return <div className={styles.loading}>Loading user data...</div>
  }

  if (!user) {
    return <div className={styles.notSignedIn}>Please sign in</div>
  }

  return (
    <header className={styles.header}>
      <div className={styles["header-left"]}>
        <div className={styles["header-logo"]}>
          <img src="/MainLogo.png" alt="Company Logo" className={styles["logo-image"]} />
        </div>

        <div className={styles["welcome-container"]}>
          <h1 className={styles["welcome-message"]}>
            Welcome back, <span className={styles["user-name"]}>{userName}</span>
          </h1>
          <div className={styles["date-display"]}>
            <Calendar size={14} className={styles["calendar-icon"]} />
            {formattedDate}
          </div>
        </div>
      </div>

      <div className={styles["header-right"]}>
        <div className={styles["header-icons"]}>
          <div className={styles["icon-wrapper"]} ref={notificationRef}>
            <button
              className={`${styles["icon-button"]} ${notificationsOpen ? styles.active : ""}`}
              onClick={handleNotificationClick}
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className={styles["notification-badge"]}>{unreadCount}</span>}
            </button>

            {notificationsOpen && (
              <div className={styles["dropdown-menu"]}>
                <div className={styles["dropdown-header"]}>
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className={styles["mark-read-button"]}>
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className={styles["dropdown-divider"]}></div>
                <div className={styles["notifications-list"]}>
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`${styles["notification-item"]} ${!notification.read ? styles.unread : ""}`}
                      >
                        <div className={`${styles["notification-icon"]} ${styles[notification.type]}`}></div>
                        <div className={styles["notification-content"]}>
                          <p className={styles["notification-text"]}>{notification.message}</p>
                          <p className={styles["notification-time"]}>{notification.time}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles["no-notifications"]}>No notifications</p>
                  )}
                </div>
                <div className={styles["dropdown-footer"]}>
                  <button onClick={() => navigate("/admin/notifications")}>View all notifications</button>
                </div>
              </div>
            )}
          </div>

          <div className={styles["icon-wrapper"]}>
         
          </div>
        </div>

        <div className="profile-wrapper" ref={profileRef}>
          {showProfileMenu && (
            <div className="dropdown-menu profile-dropdown">
              <div className="dropdown-header">
                <div className="profile-info-large">
                  <div className="profile-image-large">
                    {profileData.formData?.entityOverview?.companyLogo ? (
                      <img
                        src={profileData.formData?.entityOverview?.companyLogo || "/placeholder.svg"}
                        alt="Profile"
                      />
                    ) : (
                      <div className="profile-placeholder-large">{userName.charAt(0).toUpperCase()}</div>
                    )}
                    <label
                      htmlFor="profile-upload"
                      className={`change-avatar-button ${imageUploading ? "uploading" : ""}`}
                    >
                      {imageUploading ? (
                        <>
                          <Upload size={12} className="upload-icon spinning" />
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
                    <h3 className="profile-name-large">{userName}</h3>
                    <p className="profile-email-large">{userEmail}</p>
                    <p className="profile-role">System Administrator</p>
                  </div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-menu-items">
                <button className="dropdown-item" onClick={() => navigate("/admin/profile")}>
                  <User size={16} />
                  <span>My Profile</span>
                </button>
                <button className="dropdown-item" onClick={() => navigate("/admin/dashboard")}>
                  <Activity size={16} />
                  <span>Dashboard</span>
                </button>
                <button className="dropdown-item" onClick={() => navigate("/admin/users")}>
                  <Users size={16} />
                  <span>User Management</span>
                </button>
                <button className="dropdown-item" onClick={() => navigate("/admin/permissions")}>
                  <Shield size={16} />
                  <span>Permissions</span>
                </button>
                <button className="dropdown-item" onClick={() => navigate("/admin/settings")}>
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
                <button className="dropdown-item" onClick={() => navigate("/help")}>
                  <HelpCircle size={16} />
                  <span>Help & Support</span>
                </button>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-footer">
                <button className="logout-button" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default AdminHeader