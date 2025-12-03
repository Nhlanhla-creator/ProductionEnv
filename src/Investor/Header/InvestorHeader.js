import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Mail, Calendar, ChevronDown, Settings, LogOut, User, HelpCircle, Upload, MessageSquare, X } from "lucide-react";
import styles from "./InvestorHeader.module.css";
import { auth } from "../../firebaseConfig";
import { db, storage } from "../../firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getDoc, doc as docRef, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import Feedback from "../../Feedback";
import InvestorNotifications from "../NotificationInvestor";
import BookSession from "../../main_pages/BookSession";

function InvestorHeader({ companyName, profileImage, setProfileImage }) {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState("");
  const ROLE_OPTIONS = ["Investor", "SMSEs", "Advisors", "Accelerators"];
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(user ? user.displayName || user.email.split('@')[0] : "User");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const [logo, setLogo] = useState("/MainLogo.png");
  const [imageUploading, setImageUploading] = useState(false);
  const [profileData, setProfileData] = useState({});
  const notificationsRef = useRef(null);
  const messagesRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const modalRef = useRef(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Listen for sidebar state changes - Same as InternHeader
  useEffect(() => {
    const handleSidebarStateChange = () => {
      const collapsed = document.body.classList.contains("sidebar-collapsed");
      setIsSidebarCollapsed(collapsed);
    };

    // Check initial state
    handleSidebarStateChange();

    // Watch for changes
    const observer = new MutationObserver(handleSidebarStateChange);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!auth.currentUser) return;
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        const rolesString = data.role || "";
        const parsedRoles = rolesString.split(',').map(r => r.trim());
        setAvailableRoles(parsedRoles);
        setSelectedRole(data.currentRole || parsedRoles[0] || "");
      }
    };
    fetchRoles();
  }, []);

  const handleSwitchRole = async (role) => {
    setSelectedRole(role);
    const userDocRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userDocRef, { currentRole: role });
     switch (role) {
      case "Investor":
        navigate("/investor-profile");
        break;
      case "SMEs":
      case "Small and Medium Social Enterprises":
      case "SME/BUSINESS":
        case"SMSES":
        case"SMSEs":
        navigate("/profile");
        break;
      case "Advisor":
        case"Advisors":
        navigate("/advisor-profile");
        break;
      case "Catalyst":
        case"Catalysts":
        case"Accelerators":
        navigate("/support-profile");
        break;
      case "Program Sponsor":
        case"ProgramSponsor":
        navigate("/sponsor-profile");
        break;
      case "Intern":
      case "Interns":
        navigate("/intern-profile");
        break;
      default:
        navigate("/auth");
    }
  };

  const addNewRole = async () => {
    if (!newRoleInput) return;
    if (availableRoles.includes(newRoleInput)) {
      alert("Role already exists.");
      return;
    }
    const updatedRoles = [...availableRoles, newRoleInput];
    const userDocRef = doc(db, "users", auth.currentUser.uid);
    try {
      await updateDoc(userDocRef, {
        role: updatedRoles.join(','),
        roleArray: updatedRoles,
        currentRole: newRoleInput
      });
      setAvailableRoles(updatedRoles);
      setSelectedRole(newRoleInput);
      setShowAddRole(false);
      setNewRoleInput("");
      handleSwitchRole(newRoleInput);
    } catch (err) {
      console.error("Failed to add role:", err);
      alert("Error adding role");
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        GetuserName();

        const q = query(
          collection(db, "messages"),
          where("to", "==", user.uid),
          where("read", "==", false)
        );

        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
          setUnreadMessages(snapshot.size);
        });

        return () => unsubscribeMessages();
      } else {
        setUserName("User");
      }
    });

    return () => unsubscribeAuth();
  }, []);

const GetuserName = async () => {
  try {
    if (!auth.currentUser) return;

    const userDocRef = doc(db, 'universalProfiles', auth.currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      // Check for registeredName in entityOverview first, then fall back to other options
      setUserName(
        data.entityOverview?.registeredName || 
        data.company || 
        auth.currentUser.displayName || 
        auth.currentUser.email.split('@')[0] || 
        "User"
      );
    } else {
      console.log('Universal profile document not found!');
      // Fallback to users collection if universal profile doesn't exist
      const fallbackDocRef = doc(db, 'MyuniversalProfiles', auth.currentUser.uid);
      const fallbackDocSnap = await getDoc(fallbackDocRef);
      
      if (fallbackDocSnap.exists()) {
        const fallbackData = fallbackDocSnap.data().formData;
        setUserName(
          fallbackData.contactDetails?.primaryContactName || 
          fallbackData.fundManageOverview?.registeredName || 
          auth.currentUser.displayName || 
          auth.currentUser.email.split('@')[0] || 
          "User"
        );
      } else {
        setUserName(auth.currentUser.displayName || auth.currentUser.email.split('@')[0] || "User");
      }
    }
  } catch (error) {
    console.error('Error getting username:', error);
    setUserName(auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "User");
  }
};

  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      setImageUploading(true);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const timestamp = Date.now();
      const fileName = `profile_images/${currentUser.uid}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);

      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      const userDocRef = doc(db, "MyuniversalProfiles", currentUser.uid);
      const currentProfileDoc = await getDoc(userDocRef);
      const currentData = currentProfileDoc.exists() ? currentProfileDoc.data() : {};

      const updatedData = {
        ...currentData,
        formData: {
          ...currentData.formData,
          entityOverview: {
            ...currentData.formData?.entityOverview,
            companyLogo: downloadURL
          }
        },
        updatedAt: new Date().toISOString()
      };

      await updateDoc(userDocRef, updatedData);
      setProfileData(updatedData);
      if (setProfileImage) {
        setProfileImage(downloadURL);
      }

      if (currentData.entityOverview?.companyLogo &&
        currentData.entityOverview.companyLogo !== downloadURL &&
        currentData.entityOverview.companyLogo.includes('firebase')) {
        try {
          const oldImageRef = ref(storage, currentData.entityOverview.companyLogo);
          await deleteObject(oldImageRef);
        } catch (deleteError) {
          console.warn('Could not delete old image:', deleteError);
        }
      }

    } catch (error) {
      console.error('Error uploading image:', error);
      let errorMessage = 'Failed to upload image. Please try again.';

      if (error.code === 'storage/unauthorized') {
        errorMessage = 'You do not have permission to upload images.';
      } else if (error.code === 'storage/canceled') {
        errorMessage = 'Upload was canceled.';
      } else if (error.code === 'storage/unknown') {
        errorMessage = 'An unknown error occurred. Please check your internet connection.';
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
          const profileRef = doc(db, "MyuniversalProfiles", user.uid);
          const profileSnap = await getDoc(profileRef);
          if (!profileSnap.exists()) return;

          const data = profileSnap.data();
          setProfileData(data);

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
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowAddRole(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close modal with ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showAddRole) {
        setShowAddRole(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [showAddRole]);

  const handleProfileClick = () => setDropdownOpen(!dropdownOpen);
  const handleNotificationClick = () => setNotificationsOpen(!notificationsOpen);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => setProfileImage(e.target.result);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const triggerFileInput = () => fileInputRef.current.click();

  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        navigate('/login');
      })
      .catch((error) => {
        console.error("Error signing out: ", error);
      });
  };

  const userEmail = user ? user.email : "";

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const getAvailableRoleOptions = () => {
    return ROLE_OPTIONS.filter(role => {
      const hasSME = availableRoles.includes("SMEs") || 
                   availableRoles.includes("SME/BUSINESS") || 
                   availableRoles.includes("Small and Medium Social Enterprises")
      if (hasSME && role === "SMEs") return false
      return !availableRoles.includes(role)
    });
  };

  if (loading) {
    return <div className={styles.loading}>Loading user data...</div>;
  }

  if (!user) {
    return <div className={styles.notSignedIn}>Please sign in</div>;
  }

  return (
    <header 
      className={styles.header}
      style={{
        marginLeft: isSidebarCollapsed ? '80px' : '280px',
        width: isSidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 280px)',
        transition: 'all 0.3s ease'
      }}
    >
      <div className={styles["header-left"]}>
        <div className={styles["header-logo"]}>
          <img
            src="/MainLogo.png"
            alt="Company Logo"
            className={styles["logo-image"]}
          />
        </div>

        <div className={`${styles["welcome-container"]} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
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
          <div className={styles["icon-wrapper"]} ref={notificationRef}>
            <InvestorNotifications />
          </div>

          <div className={styles["icon-wrapper"]}>
            <button
              className={styles["icon-button"]}
              aria-label="Messages"
              onClick={() => navigate('/investor-messages')}
            >
              <Mail size={20} />
              {unreadMessages > 0 && (
                <span className={styles["notification-badge"]}>
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className={styles["profile-wrapper"]} ref={profileRef}>
          <button
            className={styles["profile-button"]}
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
              setShowMessages(false);
            }}
          >
            <div className={styles["profile-image-container"]}>
              {profileData.formData?.entityOverview?.companyLogo ? (
                <img
                  src={profileData.formData?.entityOverview?.companyLogo}
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
                      <img src={profileData.formData?.entityOverview?.companyLogo} alt="Profile" />
                    ) : (
                      <div className={styles["profile-placeholder-large"]}>
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <label htmlFor="profile-upload" className={`${styles["change-avatar-button"]} ${imageUploading ? styles.uploading : ''}`}>
                      {imageUploading ? (
                        <>
                          <Upload size={12} className={`${styles["upload-icon"]} ${styles.spinning}`} />
                          Uploading...
                        </>
                      ) : (
                        'Change'
                      )}
                      <input
                        id="profile-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleImageUpload}
                        disabled={imageUploading}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  <div>
                    <h3 className={styles["profile-name-large"]}>{userName}</h3>
                    <p className={styles["profile-email-large"]}>{userEmail}</p>
                    <p className={styles["profile-role"]}>{companyName || "Company Name"}</p>
                  </div>
                </div>
              </div>
              <div className={styles["dropdown-divider"]}></div>
              <div className={styles["dropdown-menu-items"]}>
                <button
                  className={`${styles["dropdown-item"]} ${styles["add-role-trigger"]}`}
                  onClick={() => {
                    setShowAddRole(true);
                    setShowProfileMenu(false);
                  }}
                >
                  <User size={16} />
                  <span>+ Add New Role</span>
                </button>
                
                {availableRoles.length > 1 && (
                  <>
                    <div className={styles["dropdown-divider"]}></div>
                    <div className={styles["dropdown-subheader"]}>Switch Profile</div>
                    {availableRoles.map((role, idx) => (
                      <button
                        key={idx}
                        className={`${styles["dropdown-item"]} ${selectedRole === role ? styles["active-role"] : ''}`}
                        onClick={() => {
                          handleSwitchRole(role);
                          setShowProfileMenu(false);
                        }}
                      >
                        <User size={16} />
                        <span>{role}</span>
                      </button>
                    ))}
                  </>
                )}
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

      {/* Enhanced Add Role Modal */}
      {showAddRole && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["add-role-modal"]} ref={modalRef}>
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
                  {getAvailableRoleOptions().map((role, idx) => (
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
  );
}

export default InvestorHeader;