"use client";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Mail, Calendar, Settings, LogOut, User, HelpCircle, Upload, Users, Shield, Activity } from "lucide-react";
import styles from "./associate-header.module.css";
import { auth } from "../../firebaseConfig";
import { db, storage } from "../../firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

function AssociateHeader({ companyName, profileImage, setProfileImage, isSidebarCollapsed }) {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "user",
      message: "New match request received",
      time: "30 minutes ago",
      read: false,
    },
    {
      id: 2,
      type: "document",
      message: "New document shared with you",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      type: "system",
      message: "Your profile has been viewed by 5 members",
      time: "2 hours ago",
      read: true,
    },
    {
      id: 4,
      type: "alert",
      message: "Upcoming meeting reminder",
      time: "1 day ago",
      read: true,
    },
  ]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [profileData, setProfileData] = useState({});
  const notificationsRef = useRef(null);
  const messagesRef = useRef(null);
  const profileRef = useRef(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        GetuserName();
        
        // Message notifications for associator
        const q = query(collection(db, "messages"), where("to", "==", user.uid), where("read", "==", false));
        
        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
          setUnreadMessages(snapshot.size);
        });
        
        return () => unsubscribeMessages();
      } else {
        setUserName("Association");
      }
    });
    
    return () => unsubscribeAuth();
  }, []);

  const GetuserName = async () => {
    try {
      if (!auth.currentUser) return;
      
      const userDocRef = doc(db, "associatorProfiles", auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setUserName(
          data.username ||
          data.formData?.contactDetails?.primaryContactName ||
          data.formData?.entityOverview?.registeredName ||
          auth.currentUser.email?.split("@")[0] ||
          "Association"
        );
      } else {
        console.log("User document not found!");
        setUserName("Association");
      }
    } catch (error) {
      console.error("Error getting username:", error);
      setUserName("Association");
    }
  };

  // Update date every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }
    
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Image size must be less than 5MB");
      return;
    }
    
    try {
      setImageUploading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `profile_images/associator/${currentUser.uid}/${timestamp}_${file.name}`;
      
      // Create storage reference
      const storageRef = ref(storage, fileName);
      
      // Upload file to Firebase Storage
      const uploadResult = await uploadBytes(storageRef, file);
      console.log("Image uploaded successfully:", uploadResult);
      
      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log("Download URL:", downloadURL);
      
      // Update user profile in Firestore
      const userDocRef = doc(db, "associatorProfiles", currentUser.uid);
      
      // Get current profile data to preserve existing data
      const currentProfileDoc = await getDoc(userDocRef);
      const currentData = currentProfileDoc.exists() ? currentProfileDoc.data() : {};
      
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
      };
      
      await updateDoc(userDocRef, updatedData);
      
      // Update local state
      setProfileData(updatedData);
      if (setProfileImage) {
        setProfileImage(downloadURL);
      }
      
      // Optional: Delete old image if it exists and is different
      if (
        currentData.formData?.entityOverview?.companyLogo &&
        currentData.formData.entityOverview.companyLogo !== downloadURL &&
        currentData.formData.entityOverview.companyLogo.includes("firebase")
      ) {
        try {
          const oldImageRef = ref(storage, currentData.formData.entityOverview.companyLogo);
          await deleteObject(oldImageRef);
          console.log("Old image deleted successfully");
        } catch (deleteError) {
          console.warn("Could not delete old image:", deleteError);
        }
      }
      
      console.log("Profile image updated successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      
      let errorMessage = "Failed to upload image. Please try again.";
      
      if (error.code === "storage/unauthorized") {
        errorMessage = "You do not have permission to upload images.";
      } else if (error.code === "storage/canceled") {
        errorMessage = "Upload was canceled.";
      } else if (error.code === "storage/unknown") {
        errorMessage = "An unknown error occurred. Please check your internet connection.";
      }
      
      alert(errorMessage);
    } finally {
      setImageUploading(false);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profileRef = doc(db, "associatorProfiles", user.uid);
          const profileSnap = await getDoc(profileRef);
          if (!profileSnap.exists()) return;
          
          const data = profileSnap.data();
          setProfileData(data);
          
          // Set profile image if available
          if (setProfileImage && data.formData?.entityOverview?.companyLogo) {
            setProfileImage(data.formData.entityOverview.companyLogo);
          }
        } catch (err) {
          console.error("Failed to load user documents:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => setShowProfileMenu(!showProfileMenu);
  const handleNotificationClick = () => setNotificationsOpen(!notificationsOpen);

  const triggerFileInput = () => fileInputRef.current.click();

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
  };

  const handleLogout = () => {
    auth
      .signOut()
      .then(() => {
        navigate("/login");
      })
      .catch((error) => {
        console.error("Error signing out: ", error);
      });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const userEmail = user ? user.email : "";

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (loading) {
    return <div className={styles.loading}>Loading user data...</div>;
  }

  if (!user) {
    return <div className={styles.notSignedIn}>Please sign in</div>;
  }

  return (
    <header 
      className={styles.header} 
      style={isSidebarCollapsed ? {left: "80px", width: "calc(100% - 80px)"} : {left: "280px", width: "calc(100% - 280px)"}}
    >
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
                  <button onClick={() => navigate("/associator-notifications")}>View all notifications</button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className={styles["profile-wrapper"]} ref={profileRef}>
          <button onClick={handleProfileClick} className={styles["profile-button"]}>
            <div className={styles["profile-image-container"]}>
              {profileData.formData?.entityOverview?.companyLogo ? (
                <img
                  src={profileData.formData.entityOverview.companyLogo}
                  alt="Profile"
                  className={styles["profile-image"]}
                />
              ) : (
                <div className={styles["profile-placeholder"]}>
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </button>
          
          {showProfileMenu && (
            <div className={styles["dropdown-menu"]}>
              <div className={styles["dropdown-header"]}>
                <div className={styles["profile-info-large"]}>
                  <div className={styles["profile-image-large"]}>
                    {profileData.formData?.entityOverview?.companyLogo ? (
                      <img
                        src={profileData.formData.entityOverview.companyLogo || "/placeholder.svg"}
                        alt="Profile"
                      />
                    ) : (
                      <div className={styles["profile-placeholder-large"]}>
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <label
                      htmlFor="profile-upload"
                      className={`${styles["change-avatar-button"]} ${imageUploading ? styles.uploading : ""}`}
                    >
                      {imageUploading ? (
                        <>
                          <Upload size={12} className={styles["upload-icon"]} />
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
                    <h3 className={styles["profile-name-large"]}>{userName}</h3>
                    <p className={styles["profile-email-large"]}>{userEmail}</p>
                    <p className={styles["profile-role"]}>Association</p>
                  </div>
                </div>
              </div>
              <div className={styles["dropdown-divider"]}></div>
              <div className={styles["dropdown-menu-items"]}>
                <button className={styles["dropdown-item"]} onClick={() => navigate("/associator-profile")}>
                  <User size={16} />
                  <span>My Profile</span>
                </button>
                <button className={styles["dropdown-item"]} onClick={() => navigate("/associator-dashboard")}>
                  <Activity size={16} />
                  <span>Dashboard</span>
                </button>
                <button className={styles["dropdown-item"]} onClick={() => navigate("/associator-matches")}>
                  <Users size={16} />
                  <span>My Matches</span>
                </button>
                <button className={styles["dropdown-item"]} onClick={() => navigate("/associator-settings")}>
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
                <button className={styles["dropdown-item"]} onClick={() => navigate("/help")}>
                  <HelpCircle size={16} />
                  <span>Help & Support</span>
                </button>
              </div>
              <div className={styles["dropdown-divider"]}></div>
              <div className={styles["dropdown-footer"]}>
                <button className={styles["logout-button"]} onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AssociateHeader;