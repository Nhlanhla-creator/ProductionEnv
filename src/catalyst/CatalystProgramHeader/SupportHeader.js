"use client"
import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Calendar, Settings, LogOut, User, Upload, X } from "lucide-react"
import styles from "../../advisors/AdvisorHeader/advisor-header.module.css"
import { auth } from "../../firebaseConfig"
import { db, storage } from "../../firebaseConfig"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { getDoc, updateDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { onAuthStateChanged } from "firebase/auth"
import { doc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import Feedback from "../../Feedback"
import CatalystNotifications from "../Notifications"
import BookSession from "../../main_pages/BookSession"

function AdvisorHeader({ companyName, profileImage, setProfileImage }) {
  const navigate = useNavigate()
  const [date, setDate] = useState(new Date())
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [availableRoles, setAvailableRoles] = useState([])
  const [selectedRole, setSelectedRole] = useState("")
  const [showAddRole, setShowAddRole] = useState(false)
  const [newRoleInput, setNewRoleInput] = useState("")
  const ROLE_OPTIONS = ["Investor", "SMEs", "Advisors", "Catalyst", "Interns"]
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState(user ? user.displayName || user.email.split("@")[0] : "User")
  const fileInputRef = useRef(null)
  const dropdownRef = useRef(null)
  const [logo, setLogo] = useState("/MainLogo.png")
  const [imageUploading, setImageUploading] = useState(false)
  const [profileData, setProfileData] = useState({})
  const profileRef = useRef(null)

  useEffect(() => {
    const fetchRoles = async () => {
      if (!auth.currentUser) return
      const userDocRef = doc(db, "users", auth.currentUser.uid)
      const userDocSnap = await getDoc(userDocRef)
      if (userDocSnap.exists()) {
        const data = userDocSnap.data()
        const rolesString = data.role || ""
        const parsedRoles = rolesString.split(',').map(r => r.trim())
        setAvailableRoles(parsedRoles)
        setSelectedRole(data.currentRole || parsedRoles[0] || "")
      }
    }
    fetchRoles()
  }, [])

  const handleSwitchRole = async (role) => {
    setSelectedRole(role)
    const userDocRef = doc(db, "users", auth.currentUser.uid)
    await updateDoc(userDocRef, { currentRole: role })
    switch (role) {
      case "Investor":
        navigate("/investor-profile")
        break
      case "SMEs":
      case "Small and Medium Social Enterprises":
      case "SME/BUSINESS":
        navigate("/profile")
        break
      case "Advisors":
        navigate("/advisor-profile")
        break
      case "Catalyst":
        navigate("/support-profile")
        break
      case "Interns":
        navigate("/intern-profile")
        break
      default:
        navigate("/auth")
    }
  }

  const addNewRole = async () => {
    if (!newRoleInput) return
    if (availableRoles.includes(newRoleInput)) {
      alert("Role already exists.")
      return
    }
    const updatedRoles = [...availableRoles, newRoleInput]
    const userDocRef = doc(db, "users", auth.currentUser.uid)
    try {
      await updateDoc(userDocRef, {
        role: updatedRoles.join(','),
        roleArray: updatedRoles,
        currentRole: newRoleInput
      })
      setAvailableRoles(updatedRoles)
      setSelectedRole(newRoleInput)
      setShowAddRole(false)
      setNewRoleInput("")
      handleSwitchRole(newRoleInput)
    } catch (err) {
      console.error("Failed to add role:", err)
      alert("Error adding role")
    }
  }

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        GetuserName()
      } else {
        setUserName("User")
      }
    })

    return () => unsubscribeAuth()
  }, [])

  const GetuserName = async () => {
    try {
      if (!auth.currentUser) return

      const userDocRef = doc(db, "catalystProfiles", auth.currentUser.uid)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        setUserName(
          userDocSnap.data().formData?.contactDetails?.primaryContactName ||
            userDocSnap.data().company ||
            auth.currentUser.email.split("@")[0] ||
            "Name Not Found/pre change profile",
        )
      } else {
        console.log("User document not found!")
        setUserName("User")
      }
    } catch (error) {
      console.error("Error getting username:", error)
      setUserName("User")
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

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

      if (!currentUser) {
        throw new Error("User not authenticated")
      }

      const timestamp = Date.now()
      const fileName = `profile_images/${currentUser.uid}/${timestamp}_${file.name}`

      const storageRef = ref(storage, fileName)
      const uploadResult = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(uploadResult.ref)

      const userDocRef = doc(db, "MyuniversalProfiles", currentUser.uid)
      const currentProfileDoc = await getDoc(userDocRef)
      const currentData = currentProfileDoc.exists() ? currentProfileDoc.data() : {}

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
      setProfileData(updatedData)
      if (setProfileImage) {
        setProfileImage(downloadURL)
      }

      if (
        currentData.entityOverview?.companyLogo &&
        currentData.entityOverview.companyLogo !== downloadURL &&
        currentData.entityOverview.companyLogo.includes("firebase")
      ) {
        try {
          const oldImageRef = ref(storage, currentData.entityOverview.companyLogo)
          await deleteObject(oldImageRef)
        } catch (deleteError) {
          console.warn("Could not delete old image:", deleteError)
        }
      }
    } catch (error) {
      console.error("Error uploading image:", error)
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
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleProfileClick = () => setDropdownOpen(!dropdownOpen)
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = (e) => setProfileImage(e.target.result)
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const triggerFileInput = () => fileInputRef.current.click()
  const handleLogout = () => {
    auth
      .signOut()
      .then(() => {
        navigate("/auth")
      })
      .catch((error) => {
        console.error("Error signing out: ", error)
      })
  }

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

        <div className={styles["header-buttons"]}>
          <Feedback 
            buttonStyle={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: '#333',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            title="Share your feedback"
          />
          <BookSession />
        </div>
      </div>

      <div className={styles["header-right"]}>
        <div className={styles["header-icons"]}>
          <CatalystNotifications />
          <div className={styles["icon-wrapper"]}>
            <button
              className={styles["icon-button"]}
              aria-label="Messages"
              onClick={() => navigate("/advisor-messages")}
            >
              <Mail size={20} />
            </button>
          </div>
        </div>

        <div className="profile-wrapper" ref={profileRef}>
          <button
            className="profile-button profile-button-simple"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu)
            }}
          >
            <div className="profile-image-container">
              {profileData.formData?.entityOverview?.companyLogo ? (
                <img
                  src={profileData.formData?.entityOverview?.companyLogo || "/placeholder.svg"}
                  alt="Profile"
                  className="profile-image"
                />
              ) : (
                <div className="profile-placeholder">{userName.charAt(0).toUpperCase()}</div>
              )}
            </div>
          </button>

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
                    <p className="profile-role">{selectedRole || "User"}</p>
                  </div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-menu-items">
                <button className="dropdown-item" onClick={() => navigate("/support-profile")}>
                  <User size={16} />
                  <span>My Profile</span>
                </button>

                <button
                  className={`dropdown-item add-role-trigger`}
                  onClick={() => setShowAddRole(true)}
                >
                  <User size={16} />
                  <span>+ Add New Role</span>
                </button>

                <button className="dropdown-item" onClick={() => navigate("/support-settings")}>
                  <Settings size={16} />
                  <span>Settings</span>
                </button>

                {availableRoles.length > 1 && (
                  <>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-subheader">Switch Roles</div>
                    {availableRoles.map((role, idx) => (
                      <button
                        key={idx}
                        className={`dropdown-item ${selectedRole === role ? "active-role" : ""}`}
                        onClick={() => handleSwitchRole(role)}
                      >
                        <User size={16} />
                        <span>{role}</span>
                      </button>
                    ))}
                  </>
                )}
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

      {showAddRole && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["add-role-modal"]}>
            <div className={styles["modal-header"]}>
              <h3>Add New Role</h3>
              <button 
                className={styles["modal-close"]}
                onClick={() => setShowAddRole(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles["modal-content"]}>
              <p className={styles["modal-description"]}>
                Select a new role to add to your profile:
              </p>
              <div className={styles["role-selector"]}>
                <label htmlFor="role-select">Available Roles:</label>
                <select
                  id="role-select"
                  value={newRoleInput}
                  onChange={(e) => setNewRoleInput(e.target.value)}
                  className={styles["role-select"]}
                >
                  <option value="">Select a role</option>
                  {ROLE_OPTIONS.filter(role => {
                    const hasSME = availableRoles.includes("SMEs") || 
                                 availableRoles.includes("SME/BUSINESS") || 
                                 availableRoles.includes("Small and Medium Social Enterprises")
                    if (hasSME && role === "SMEs") return false
                    return !availableRoles.includes(role)
                  }).map((role, idx) => (
                    <option key={idx} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div className={styles["modal-actions"]}>
                <button 
                  className={styles["btn-cancel"]} 
                  onClick={() => setShowAddRole(false)}
                >
                  Cancel
                </button>
                <button 
                  className={styles["btn-add"]} 
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

export default AdvisorHeader