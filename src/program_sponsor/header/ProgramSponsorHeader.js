"use client";

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Calendar, Settings, LogOut, User, Upload, X } from "lucide-react";
import styles from "../../advisors/AdvisorHeader/advisor-header.module.css";
import { auth } from "../../firebaseConfig";
import { db, storage } from "../../firebaseConfig";
import { collection, query, where, onSnapshot, getDoc, updateDoc, doc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import Feedback from "../../Feedback";
import BookSession from "../../main_pages/BookSession";

function ProgramSponsorHeader({ companyName, profileImage, setProfileImage }) {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState("");
  const ROLE_OPTIONS = ["Investor", "SMSEs", "Advisors", "Accelerators", "Intern", "ProgramSponsor"];
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(user ? user.displayName || user.email.split("@")[0] : "User");
  const fileInputRef = useRef(null);
  const [logo, setLogo] = useState("/MainLogo.png");
  const [imageUploading, setImageUploading] = useState(false);
  const [profileData, setProfileData] = useState({});
  const profileRef = useRef(null);
  const modalRef = useRef(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Listen for sidebar state changes
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
      } else {
        setUserName("User");
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const GetuserName = async () => {
    try {
      if (!auth.currentUser) return;

      const userDocRef = doc(db, "programSponsorProfiles", auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        setUserName(
          userDocSnap.data().formData?.contactDetails?.primaryContactName ||
            userDocSnap.data().company ||
            auth.currentUser.email.split("@")[0] ||
            "Name Not Found/pre change profile",
        );
      } else {
        console.log("User document not found!");
        setUserName("User");
      }
    } catch (error) {
      console.error("Error getting username:", error);
      setUserName("User");
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

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

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
            companyLogo: downloadURL,
          },
        },
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(userDocRef, updatedData);
      setProfileData(updatedData);

      if (setProfileImage) {
        setProfileImage(downloadURL);
      }

      if (
        currentData.entityOverview?.companyLogo &&
        currentData.entityOverview.companyLogo !== downloadURL &&
        currentData.entityOverview.companyLogo.includes("firebase")
      ) {
        try {
          const oldImageRef = ref(storage, currentData.entityOverview.companyLogo);
          await deleteObject(oldImageRef);
        } catch (deleteError) {
          console.warn("Could not delete old image:", deleteError);
        }
      }
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

  const getAvailableRoleOptions = () => {
    return ROLE_OPTIONS.filter(role => {
      const hasSME = availableRoles.includes("SMEs") || 
                   availableRoles.includes("SME/BUSINESS") || 
                   availableRoles.includes("Small and Medium Social Enterprises")
      if (hasSME && role === "SMEs") return false
      return !availableRoles.includes(role)
    });
  };

  const triggerFileInput = () => fileInputRef.current.click();

  const handleLogout = () => {
    auth
      .signOut()
      .then(() => {
        navigate("/auth");
      })
      .catch((error) => {
        console.error("Error signing out: ", error);
      });
  };

  const userEmail = user ? user.email : "";
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (loading) {
    return <div className="loading">Loading user data...</div>;
  }

  if (!user) {
    return <div className="notSignedIn">Please sign in</div>;
  }

  return (
    <header 
      className="header"
      style={{
        marginLeft: isSidebarCollapsed ? '80px' : '280px',
        width: isSidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 280px)',
        transition: 'all 0.3s ease'
      }}
    >
      <div className="header-left">
        <div className="header-logo">
          <img src="/MainLogo.png" alt="Company Logo" className="logo-image" />
        </div>

        <div className={`welcome-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <h1 className="welcome-message">
            Welcome back, <span className="user-name">{userName}</span>
          </h1>
          <div className="date-display">
            <Calendar size={14} className="calendar-icon" />
            {formattedDate}
          </div>
        </div>

        <div className="header-buttons">
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

      <div className="header-right">
        <div className="header-icons">
          <div className="icon-wrapper">
            <button
              className="icon-button"
              aria-label="Messages"
              onClick={() => navigate("/program-sponsor-messages")}
            >
              <Mail size={20} />
            </button>
          </div>
        </div>

        <div className="profile-wrapper" ref={profileRef}>
          <button
            className="profile-button"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
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
            <div className="dropdown-menu">
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
                    <p className="profile-role">{selectedRole || "Program Sponsor"}</p>
                  </div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-menu-items">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate("/program-sponsor-profile");
                    setShowProfileMenu(false);
                  }}
                >
                  <User size={16} />
                  <span>My Profile</span>
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate("/program-sponsor-settings");
                    setShowProfileMenu(false);
                  }}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
                <button
                  className="dropdown-item add-role-trigger"
                  onClick={() => {
                    setShowAddRole(true);
                    setShowProfileMenu(false);
                  }}
                >
                  <User size={16} />
                  <span>+ Add New Role</span>
                </button>
              </div>
              
              {availableRoles.length > 1 && (
                <>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-subheader">Switch Profile</div>
                  {availableRoles.map((role, idx) => (
                    <button
                      key={idx}
                      className={`dropdown-item ${selectedRole === role ? "active-role" : ""}`}
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

      {/* Add Role Modal */}
      {showAddRole && (
        <div className="modal-overlay">
          <div className="add-role-modal" ref={modalRef}>
            <div className="modal-header">
              <h3>Add New Role</h3>
              <button 
                className="modal-close"
                onClick={() => setShowAddRole(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              <p className="modal-description">
                Select a new role to add to your profile:
              </p>
              <div className="role-selector">
                <label htmlFor="role-select">Available Roles:</label>
                <select
                  id="role-select"
                  value={newRoleInput}
                  onChange={(e) => setNewRoleInput(e.target.value)}
                  className="role-select"
                >
                  <option value="">Select a role</option>
                  {getAvailableRoleOptions().map((role, idx) => (
                    <option key={idx} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button 
                  className="btn-cancel" 
                  onClick={() => setShowAddRole(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-add" 
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

      <style jsx>{`
        .header {
          position: fixed;
          top: 0;
          height: 72px;
          background-color: #fff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          z-index: 100;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          min-width: 0;
          box-sizing: border-box;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex: 1;
        }

        .header-logo {
          height: 40px;
          display: flex;
          align-items: center;
        }

        .logo-image {
          height: 100%;
          width: auto;
          object-fit: contain;
          margin-left: 20px;
        }

        .welcome-container {
          display: flex;
          flex-direction: column;
          margin-left: 250px;
          transition: margin-left 0.3s ease;
        }

        /* Adjust welcome container margin when sidebar is collapsed */
        .welcome-container.sidebar-collapsed {
          margin-left: 200px;
        }

        .welcome-message {
          font-size: 1.15rem;
          color: #624635;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
          margin: 0;
        }

        .user-name {
          color: #5b4a43;
          font-weight: 700;
        }

        .date-display {
          font-size: 0.8rem;
          font-weight: 400;
          color: #878787;
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 4px;
        }

        .calendar-icon {
          color: #9E6E3C;
        }

        .header-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-left: 30px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 20px;
          padding-right: 20px;
        }

        .header-icons {
          display: flex;
          gap: 12px;
        }

        .icon-wrapper {
          position: relative;
        }

        .icon-button {
          background: none;
          border: none;
          cursor: pointer;
          position: relative;
          padding: 10px;
          border-radius: 50%;
          transition: all 0.2s ease;
          color: #372c27;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #F8F7F3;
          width: 42px;
          height: 42px;
        }

        .icon-button:hover {
          background-color: #F2EEE6;
          transform: translateY(-2px);
        }

        .icon-button.active {
          background-color: #9E6E3C;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(158, 110, 60, 0.3);
        }

        .profile-wrapper {
          position: relative;
        }

        .profile-button {
          padding: 3px;
          border-radius: 50%;
          background: none;
          border: none;
          cursor: pointer;
        }

        .profile-image-container {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background-color: #b89f8d;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: transform 0.3s ease;
          border: 2px solid #F2F0E6;
        }

        .profile-button:hover .profile-image-container {
          transform: scale(1.08);
          border-color: #372c27;
          box-shadow: 0 2px 8px rgba(158, 110, 60, 0.3);
        }

        .profile-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-placeholder {
          font-size: 1.2rem;
          color: #F2F0E6;
          font-weight: bold;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
          width: 320px;
          z-index: 1000;
          overflow: hidden;
          animation: dropdown-fade 0.2s ease;
          border: 1px solid rgba(117, 74, 45, 0.1);
        }

        @keyframes dropdown-fade {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-header {
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dropdown-divider {
          height: 1px;
          background-color: rgba(117, 74, 45, 0.1);
          margin: 0;
        }

        .dropdown-footer {
          padding: 12px 16px;
          text-align: center;
        }

        .profile-info-large {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .profile-image-large {
          position: relative;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          overflow: hidden;
          background-color: #9E6E3C;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .profile-image-large img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-placeholder-large {
          font-size: 2rem;
          color: #F2F0E6;
          font-weight: bold;
        }

        .change-avatar-button {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: rgba(0, 0, 0, 0.6);
          color: white;
          font-size: 0.7rem;
          text-align: center;
          padding: 2px 0;
          cursor: pointer;
          transition: opacity 0.2s ease;
          opacity: 0;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .profile-image-large:hover .change-avatar-button {
          opacity: 1;
        }

        .profile-name-large {
          margin: 0 0 2px;
          font-size: 1rem;
          font-weight: 600;
          color: #624635;
        }

        .profile-email-large {
          margin: 0 0 2px;
          font-size: 0.8rem;
          color: #878787;
          word-break: break-all;
        }

        .profile-role {
          margin: 0;
          font-size: 0.75rem;
          color: #9E6E3C;
          font-weight: 500;
        }

        .dropdown-menu-items {
          padding: 8px 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          width: 100%;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
          color: #624635;
          font-size: 0.9rem;
          border-radius: 6px;
          margin: 2px 0;
        }

        .dropdown-item:hover {
          background-color: #F8F7F3;
        }

        .dropdown-item.add-role-trigger {
          background: linear-gradient(135deg, #F8F7F3 0%, #F2EEE6 100%);
          border-left: 3px solid #9E6E3C;
          font-weight: 500;
        }

        .dropdown-item.add-role-trigger:hover {
          background: linear-gradient(135deg, #F2EEE6 0%, #EDE8DD 100%);
        }

        .dropdown-item.add-role-trigger span {
          background: linear-gradient(135deg, #9E6E3C 0%, #B8834F 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 600;
        }

        .dropdown-subheader {
          padding: 8px 16px 4px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #9E6E3C;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }

        .active-role {
          background-color: rgba(158, 110, 60, 0.1);
          border-left: 3px solid #9E6E3C;
        }

        .logout-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 10px;
          background-color: #F8F7F3;
          border: 1px solid rgba(117, 74, 45, 0.2);
          border-radius: 6px;
          color: #E74C3C;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .logout-button svg {
          color: #E74C3C;
        }

        .logout-button:hover {
          background-color: #FEEEED;
          border-color: #E74C3C;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .add-role-modal {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 420px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          background: linear-gradient(135deg, #9E6E3C 0%, #B8834F 100%);
          color: white;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        .modal-content {
          padding: 24px;
        }

        .modal-description {
          color: #666;
          font-size: 0.95rem;
          line-height: 1.5;
          margin: 0 0 24px;
          text-align: center;
        }

        .role-selector {
          margin-bottom: 24px;
        }

        .role-selector label {
          display: block;
          font-weight: 500;
          color: #624635;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }

        .role-select {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #F2EEE6;
          border-radius: 8px;
          font-size: 1rem;
          color: #624635;
          background: white;
          transition: all 0.2s ease;
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239E6E3C' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 12px center;
          background-repeat: no-repeat;
          background-size: 16px;
          padding-right: 40px;
        }

        .role-select:focus {
          outline: none;
          border-color: #9E6E3C;
          box-shadow: 0 0 0 3px rgba(158, 110, 60, 0.1);
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-cancel {
          padding: 10px 20px;
          border: 2px solid #E5E5E5;
          background: white;
          color: #666;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-cancel:hover {
          border-color: #D5D5D5;
          background: #F9F9F9;
        }

        .btn-add {
          padding: 10px 20px;
          background: linear-gradient(135deg, #9E6E3C 0%, #B8834F 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-add:hover:not(:disabled) {
          background: linear-gradient(135deg, #8A5F35 0%, #A67745 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(158, 110, 60, 0.3);
        }

        .btn-add:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .loading {
          padding: 20px;
          text-align: center;
          color: #624635;
        }

        .notSignedIn {
          padding: 20px;
          text-align: center;
          color: #E74C3C;
        }

        /* Spinner animation */
        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .uploading {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .welcome-container {
            margin-left: 200px;
          }
          
          .welcome-container.sidebar-collapsed {
            margin-left: 150px;
          }
          
          .header-buttons {
            margin-left: 20px;
          }
        }

        @media (max-width: 992px) {
          .header {
            padding: 12px 16px;
          }
          
          .welcome-message {
            font-size: 1rem;
          }
          
          .welcome-container {
            margin-left: 150px;
          }
          
          .welcome-container.sidebar-collapsed {
            margin-left: 100px;
          }
          
          .header-buttons {
            margin-left: 15px;
            gap: 8px;
          }
        }

        @media (max-width: 768px) {
          .header {
            margin-left: 0 !important;
            width: 100% !important;
          }
          
          .welcome-container {
            margin-left: 50px;
          }
          
          .welcome-container.sidebar-collapsed {
            margin-left: 50px;
          }
          
          .date-display {
            display: none;
          }
          
          .add-role-modal {
            width: 95%;
            margin: 20px;
            max-width: none;
          }
          
          .header-buttons {
            margin-left: 10px;
            gap: 6px;
          }
        }

        @media (max-width: 576px) {
          .header-buttons {
            flex-direction: column;
            gap: 4px;
            margin-left: 5px;
          }
          
          .welcome-container {
            margin-left: 20px;
          }
          
          .welcome-message {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </header>
  );
}

export default ProgramSponsorHeader;