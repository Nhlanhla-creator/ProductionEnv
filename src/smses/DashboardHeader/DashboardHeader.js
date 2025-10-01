import React, { useState, useEffect, useRef } from 'react';
import {
  Mail, Search, Calendar, ChevronDown,
  Settings, LogOut, User, HelpCircle, Upload, MessageSquare, Send, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './DashboardHeader.css';
import { auth } from "../../firebaseConfig";
import { db, storage } from "../../firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getDoc, doc as docRef, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import Feedback from "../../Feedback";
import Notifications from '../../Notifications';

// Add sidebarCollapsed as a prop
const Header = ({ companyName, profileImage, setProfileImage, sidebarCollapsed }) => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState("");
  const ROLE_OPTIONS = ["Investor", "Advisor", "Catalyst", "Program Sponsor", "Intern"];
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [imageUploading, setImageUploading] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [showMessages, setShowMessages] = useState(false);
  const [recentMessages, setRecentMessages] = useState([]);
  const [logo, setLogo] = useState("/MainLogo.png");

  const messagesRef = useRef(null);
  const profileRef = useRef(null);
  const modalRef = useRef(null);

  // ... (keep all your existing useEffect hooks and functions as they are)

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
        navigate("/profile");
        break;
      case "Advisor":
        navigate("/advisor-profile");
        break;
      case "Catalyst":
        navigate("/catalyst-profile");
        break;
      case "Program Sponsor":
        navigate("/sponsor-profile");
        break;
      case "Intern":
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
        navigate("/LoginRegister");
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
        setUserName(
          data.contactDetails?.contactName || 
          data.company || 
          auth.currentUser.displayName || 
          auth.currentUser.email.split('@')[0] || 
          "User"
        );
      } else {
        console.log('Universal profile document not found!');
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

      const userDocRef = doc(db, "universalProfiles", currentUser.uid);
      const currentProfileDoc = await getDoc(userDocRef);
      const currentData = currentProfileDoc.exists() ? currentProfileDoc.data() : {};

      const updatedData = {
        ...currentData,
        entityOverview: {
          ...currentData.entityOverview,
          companyLogo: downloadURL
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
          const profileRef = doc(db, "universalProfiles", user.uid);
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
    const unsubscribeAuth = getAuth().onAuthStateChanged((user) => {
      if (!user) return;

      const q = query(
        collection(db, "messages"),
        where("to", "==", user.uid),
        where("read", "==", false)
      );

      const unsubscribeMessages = onSnapshot(q, (snapshot) => {
        setUnreadMessages(snapshot.size);

        const fetchSenderNames = async () => {
          const limitedDocs = snapshot.docs.slice(0, 5);

          const messagesWithNames = await Promise.all(
            limitedDocs.map(async (doc) => {
              const msg = doc.data();
              const fromUID = msg.from;

              try {
                const senderDoc = await getDoc(docRef(db, "MyuniversalProfiles", fromUID));
                if (senderDoc.exists()) {
                  const data = senderDoc.data();
                  const fundName = data?.formData?.productsServices?.funds?.[0]?.name || data?.formData?.fundManageOverview?.registeredName ;
                  return {
                    ...msg,
                    senderName: fundName || "Unnamed Funder",
                  };
                } else {
                  return {
                    ...msg,
                    senderName: "Unknown Funder",
                  };
                }
              } catch (err) {
                console.error("Error fetching sender name:", err);
                return {
                  ...msg,
                  senderName: "Unknown Funder",
                };
              }
            })
          );

          setRecentMessages(messagesWithNames);
        };

        fetchSenderNames();
      });

      return () => unsubscribeMessages();
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target)) {
        setShowMessages(false);
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

  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        navigate('/auth');
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
    return ROLE_OPTIONS.filter(role => !availableRoles.includes(role));
  };

  if (loading) {
    return <div>Loading user data...</div>;
  }

  if (!user) {
    return <div>Please sign in</div>;
  }

  return (
    <>
      <header className={`dashboard-header ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="header-left">
          <div className="logo-container">
            <img
              src="/MainLogo.png"
              alt="Company Logo"
              className="logo-image"
            />
          </div>
        </div>

        <div className="header-center">
          <div className="welcome-section">
            <div className="welcome-message">
              Welcome back, <span className="user-name">{userName}</span>
            </div>
            <div className="date-display">
              <Calendar size={14} className="calendar-icon" />
              {formattedDate}
            </div>
          </div>
          
          <Feedback />
        </div>

        <div className="header-right">
          <div className="header-icons">
            <div className="icon-wrapper">
              <Notifications />
            </div>

            <div className="icon-wrapper" ref={messagesRef}>
              <button
                className={`icon-button ${showMessages ? 'active' : ''}`}
                onClick={() => {
                  setShowMessages(!showMessages);
                  setShowProfileMenu(false);
                }}
                aria-label="Messages"
              >
                <Mail size={20} />
                {unreadMessages > 0 && (
                  <span className="message-badge">{unreadMessages}</span>
                )}
              </button>

              {showMessages && (
                <div className="dropdown-menu messages-dropdown">
                  <div className="dropdown-header">
                    <h3>Messages</h3>
                    <button className="mark-read-button">Mark all as read</button>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="messages-list">
                    {recentMessages.length === 0 ? (
                      <div className="message-item">No new messages</div>
                    ) : (
                      recentMessages.map((msg, index) => (
                        <div key={index} className="message-item unread">
                          <div className="message-avatar">
                            <img src={logo} alt="Avatar" />
                          </div>
                          <div className="message-content">
                            <p className="message-sender">{msg.senderName || "Unknown Funder"}</p>
                            <p className="message-text">{msg.subject}</p>
                            <p className="message-time">{new Date(msg.date).toLocaleString("en-ZA", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "numeric",
                              month: "short"
                            })}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="dropdown-footer">
                    <button onClick={() => navigate('/messages')}>View all messages</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="profile-wrapper" ref={profileRef}>
            <button
              className="profile-button profile-button-simple"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowMessages(false);
              }}
            >
              <div className="profile-image-container">
                {profileData.entityOverview?.companyLogo ? (
                  <img
                    src={profileData.entityOverview?.companyLogo}
                    alt="Profile"
                    className="profile-image"
                  />
                ) : (
                  <div className="profile-placeholder">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </button>

            {showProfileMenu && (
              <div className="dropdown-menu profile-dropdown">
                <div className="dropdown-header">
                  <div className="profile-info-large">
                    <div className="profile-image-large">
                      {profileData.entityOverview?.companyLogo ? (
                        <img src={profileData.entityOverview?.companyLogo} alt="Profile" />
                      ) : (
                        <div className="profile-placeholder-large">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <label htmlFor="profile-upload" className={`change-avatar-button ${imageUploading ? 'uploading' : ''}`}>
                        {imageUploading ? (
                          <>
                            <Upload size={12} className="upload-icon spinning" />
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
                      <h3 className="profile-name-large">{userName}</h3>
                      <p className="profile-email-large">{userEmail}</p>
                      <p className="profile-role">{companyName || "Company Name"}</p>
                    </div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-menu-items">
                  <button
                    className="dropdown-item"
                    onClick={() => navigate('/settings')}
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
                  
                  {availableRoles.length > 1 && (
                    <>
                      <div className="dropdown-divider"></div>
                      <div className="dropdown-subheader">Switch Profile</div>
                      {availableRoles.map((role, idx) => (
                        <button
                          key={idx}
                          className={`dropdown-item ${selectedRole === role ? 'active-role' : ''}`}
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
                  <button className="dropdown-item" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Keep your existing modal code as-is */}
      {showAddRole && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
          {/* Your existing modal JSX */}
          <div 
            ref={modalRef}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '420px',
              maxWidth: '90vw',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              position: 'relative',
              animation: 'modalSlideIn 0.3s ease-out'
            }}
          >
            {/* Your existing modal content */}
            <div style={{
              backgroundColor: '#8B4513',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'white'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: '600',
                color: 'white'
              }}>
                Add New Role
              </h3>
              <button 
                onClick={() => {
                  setShowAddRole(false);
                  setNewRoleInput('');
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '10px',
                  borderRadius: '50%',
                  color: 'white',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ 
              padding: '24px',
              backgroundColor: '#ffffff'
            }}>
              <p style={{
                margin: '0 0 20px 0',
                color: '#6b7280',
                fontSize: '1rem',
                lineHeight: '1.5',
                textAlign: 'left'
              }}>
                Expand your presence by adding a new professional role to your profile.
              </p>
              
              <div style={{ 
                marginBottom: '24px' 
              }}>
                <label 
                  htmlFor="role-select-modal" 
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#374151'
                  }}
                >
                  Choose your role:
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    id="role-select-modal"
                    value={newRoleInput}
                    onChange={(e) => setNewRoleInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      paddingRight: '40px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      backgroundColor: 'white',
                      color: '#111827',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      appearance: 'none',
                      cursor: 'pointer',
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 12px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#8B4513'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  >
                    <option value="" style={{ color: '#9ca3af' }}>Select a role</option>
                    {getAvailableRoleOptions().map((role, idx) => (
                      <option key={idx} value={role} style={{ color: '#111827' }}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button 
                  onClick={() => {
                    setShowAddRole(false);
                    setNewRoleInput('');
                  }}
                  style={{
                    padding: '10px 20px',
                    border: '2px solid #e5e7eb',
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minWidth: '80px'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.borderColor = '#d1d5db';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.borderColor = '#e5e7eb';
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={addNewRole} 
                  disabled={!newRoleInput}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    backgroundColor: newRoleInput ? '#8B4513' : '#d1d5db',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: newRoleInput ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    minWidth: '110px',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => {
                    if (newRoleInput) {
                      e.target.style.backgroundColor = '#5D2F06';
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(139, 69, 19, 0.4)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (newRoleInput) {
                      e.target.style.backgroundColor = '#8B4513';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                >
                  <User size={16} />
                  Add Role
                </button>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes modalSlideIn {
              from {
                opacity: 0;
                transform: translateY(-20px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
};

export default Header;