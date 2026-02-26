"use client"
import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, Trash2, Check, AlertTriangle, Info, CheckCircle2, AlertCircle, User, Briefcase, MessageSquare, Calendar } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, writeBatch } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const notificationsRef = useRef(null);
  const auth = getAuth();

  // Notification type styling
  const getNotificationStyle = (type) => {
    switch (type) {
      case 'new_applicant':
        return { 
          borderLeftColor: '#4caf50',
          icon: <User size={16} className="text-green-500" />,
          title: 'New Applicant'
        };
      case 'status_change':
        return { 
          borderLeftColor: '#2196f3',
          icon: <Briefcase size={16} className="text-blue-500" />,
          title: 'Status Update'
        };
      case 'message':
        return { 
          borderLeftColor: '#ff9800',
          icon: <MessageSquare size={16} className="text-orange-500" />,
          title: 'New Message'
        };
      case 'meeting':
        return { 
          borderLeftColor: '#9c27b0',
          icon: <Calendar size={16} className="text-purple-500" />,
          title: 'Meeting'
        };
      case 'error':
        return { 
          borderLeftColor: '#f44336',
          icon: <AlertCircle size={16} className="text-red-500" />,
          title: 'Alert'
        };
      default:
        return { 
          borderLeftColor: '#9e9e9e',
          icon: <Info size={16} className="text-gray-500" />,
          title: 'Notification'
        };
    }
  };

  // Load notifications from Firestore
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Query notifications for this advisor
        const q = query(
          collection(db, "notifications"),
          where("userId", "==", currentUser.uid),
          where("userType", "==", "advisor"),
          where("archived", "==", false)
        );
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const loadedNotifications = [];
          querySnapshot.forEach((doc) => {
            loadedNotifications.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          // Sort by timestamp (newest first)
          loadedNotifications.sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());
          
          setNotifications(loadedNotifications);
          setUnreadCount(loadedNotifications.filter(n => !n.read).length);
        });

        return () => unsubscribe();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
        setShowClearConfirm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to add a notification
  const addNotification = useCallback(async (message, type = 'info', data = {}) => {
    if (!user) return;

    try {
      const notification = {
        userId: user.uid,
        userType: 'advisor',
        message,
        type,
        data,
        read: false,
        timestamp: new Date(),
        archived: false
      };

      // In a real implementation, you would add this to Firestore
      // await addDoc(collection(db, "notifications"), notification);
      
      // For demo purposes, we'll add it to local state
      const newNotification = {
        ...notification,
        id: Date.now().toString()
      };
      
      setNotifications(prev => {
        const updated = [newNotification, ...prev].slice(0, 50);
        return updated;
      });
      
      setUnreadCount(prev => prev + 1);
    } catch (error) {
      console.error("Error adding notification:", error);
    }
  }, [user]);

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;

    try {
      // Update all unread notifications in Firestore
      const unreadNotifications = notifications.filter(n => !n.read);
      
      if (unreadNotifications.length > 0) {
        const batch = writeBatch(db);
        unreadNotifications.forEach(notification => {
          const docRef = doc(db, "notifications", notification.id);
          batch.update(docRef, { read: true });
        });
        await batch.commit();
      }

      // Update local state
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      // Fallback to local state update
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
    }
  };

  const clearAllNotifications = async () => {
    if (!user || notifications.length === 0) return;

    try {
      // Archive all notifications in Firestore
      const batch = writeBatch(db);
      notifications.forEach(notification => {
        const docRef = doc(db, "notifications", notification.id);
        batch.update(docRef, { archived: true });
      });
      await batch.commit();

      // Clear local state
      setNotifications([]);
      setUnreadCount(0);
      setShowClearConfirm(false);
    } catch (error) {
      console.error("Error clearing notifications:", error);
      // Fallback to local state update
      setNotifications([]);
      setUnreadCount(0);
      setShowClearConfirm(false);
    }
  };

  const deleteNotification = async (id) => {
    try {
      // Archive the notification in Firestore
      await updateDoc(doc(db, "notifications", id), { archived: true });
      
      // Update local state
      const wasUnread = notifications.find(n => n.id === id)?.read === false;
      const updatedNotifications = notifications.filter(n => n.id !== id);
      setNotifications(updatedNotifications);
      if (wasUnread) {
        setUnreadCount(prev => prev - 1);
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      // Fallback to local state update
      const wasUnread = notifications.find(n => n.id === id)?.read === false;
      const updatedNotifications = notifications.filter(n => n.id !== id);
      setNotifications(updatedNotifications);
      if (wasUnread) {
        setUnreadCount(prev => prev - 1);
      }
    }
  };

  const markAsRead = async (id) => {
    try {
      // Mark as read in Firestore
      await updateDoc(doc(db, "notifications", id), { read: true });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === id ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // Fallback to local state update
      setNotifications(prev => 
        prev.map(n => 
          n.id === id ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => prev - 1);
    }
  };

  const formatTimestamp = (date) => {
    if (!date) return "";
    
    const now = new Date();
    const notificationDate = date.toDate ? date.toDate() : new Date(date);
    const diffInHours = (now - notificationDate) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return notificationDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleNotificationClick = (id, isRead) => {
    if (!isRead) {
      markAsRead(id);
    }
    setShowNotifications(false);
  };

  // Listen for new SME applications and status changes
  useEffect(() => {
    if (!user) return;

    let previousApplications = new Map();

    // Listen for all applications assigned to this advisor
    const applicationsQuery = query(
      collection(db, "AdvisorApplications"),
      where("advisorId", "==", user.uid)
    );

    const unsubscribeApplications = onSnapshot(applicationsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const applicationId = change.doc.id;

        if (change.type === "added") {
          // Store the initial state
          previousApplications.set(applicationId, {
            status: data.status,
            smeName: data.smeName
          });

          // Check if this is a new application (status === "New Match")
          if (data.status === "New Match") {
            addNotification(
              `New SME applicant: ${data.smeName || 'Unknown SME'}`,
              'new_applicant',
              { 
                smeId: data.smeId,
                smeName: data.smeName,
                matchPercentage: data.matchPercentage,
                applicationId: applicationId
              }
            );
          }
        }

        if (change.type === "modified") {
          const newData = change.doc.data();
          const oldData = previousApplications.get(applicationId);

          if (oldData && newData.status !== oldData.status) {
            addNotification(
              `Application status changed from ${oldData.status} to ${newData.status} for ${newData.smeName || 'Unknown SME'}`,
              'status_change',
              {
                smeId: newData.smeId,
                smeName: newData.smeName,
                oldStatus: oldData.status,
                newStatus: newData.status,
                applicationId: applicationId
              }
            );
          }

          // Update the stored state
          previousApplications.set(applicationId, {
            status: newData.status,
            smeName: newData.smeName
          });
        }

        if (change.type === "removed") {
          previousApplications.delete(applicationId);
        }
      });
    });

    return () => {
      unsubscribeApplications();
      previousApplications.clear();
    };
  }, [user, addNotification]);

  const handleBellClick = () => {
    const newShowState = !showNotifications;
    setShowNotifications(newShowState);
    setShowClearConfirm(false);
    
    if (newShowState && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handleClearAllClick = () => {
    if (notifications.length === 0) return;
    setShowClearConfirm(true);
  };

  const confirmClearAll = () => {
    clearAllNotifications();
  };

  const cancelClearAll = () => {
    setShowClearConfirm(false);
  };

  return (
    <div className="notifications-container" ref={notificationsRef}>
      <button
        className={`icon-button ${showNotifications ? 'active' : ''}`}
        onClick={handleBellClick}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {showNotifications && (
        <div className="dropdown-menu notifications-dropdown">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              <button 
                className="mark-read-button" 
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check size={16} /> Mark all as read
              </button>
              <button 
                className="clear-all-button" 
                onClick={handleClearAllClick}
                disabled={notifications.length === 0}
              >
                <Trash2 size={16} /> Clear all
              </button>
            </div>
          </div>
          <div className="dropdown-divider"></div>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="notification-item empty">
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => {
                const style = getNotificationStyle(notification.type);
                return (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    style={{ 
                      borderLeftColor: style.borderLeftColor,
                      backgroundColor: notification.read ? '#FFFFFF' : '#f8ffff'
                    }}
                    onClick={() => handleNotificationClick(notification.id, notification.read)}
                  >
                    <div className="notification-icon-container">
                      {style.icon}
                      {!notification.read && <div className="unread-pulse"></div>}
                    </div>
                    <div className="notification-content">
                      <div className="notification-header">
                        <span className="notification-title">{style.title}</span>
                        <span className="notification-time">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                      <p className="notification-text">
                        {notification.message}
                      </p>
                      {notification.data && (
                        <div className="notification-details">
                          {notification.data.smeName && (
                            <span className="sme-name">{notification.data.smeName}</span>
                          )}
                          {notification.data.matchPercentage && (
                            <span className="match-percentage">{notification.data.matchPercentage}% match</span>
                          )}
                          {notification.data.oldStatus && notification.data.newStatus && (
                            <div className="status-change">
                              <span className="old-status">{notification.data.oldStatus}</span>
                              <span>→</span>
                              <span className="new-status">{notification.data.newStatus}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button 
                      className="delete-notification" 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      aria-label="Delete notification"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <AlertTriangle size={24} className="text-warning" />
              <h3>Clear All Notifications?</h3>
            </div>
            <p>Are you sure you want to clear all notifications? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={cancelClearAll}>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmClearAll}>
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .notifications-container {
          position: relative;
          display: inline-block;
          margin-right: 15px;
        }
        
        .icon-button {
          background: none;
          border: none;
          cursor: pointer;
          position: relative;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.3s;
          color: #333;
        }
        
        .icon-button:hover {
          background-color: rgba(0, 0, 0, 0.05);
          transform: scale(1.1);
        }
        
        .icon-button.active {
          background-color: rgba(0, 0, 0, 0.1);
        }
        
        .notification-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background-color: #ff4444;
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        .dropdown-menu {
          position: absolute;
          right: 0;
          top: 100%;
          width: 420px;
          max-height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          margin-top: 10px;
          overflow: hidden;
          animation: fadeIn 0.2s ease-out;
          transform-origin: top right;
          border: 1px solid #e0e0e0;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        
        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #f0f0f0;
          position: sticky;
          top: 0;
          background: white;
          z-index: 1;
        }
        
        .dropdown-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
        
        .notification-actions {
          display: flex;
          gap: 8px;
        }
        
        .mark-read-button, .clear-all-button {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #555;
          padding: 6px 10px;
          border-radius: 6px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        
        .mark-read-button:hover, 
        .clear-all-button:hover {
          background-color: #f5f5f5;
          color: #333;
        }
        
        .mark-read-button:disabled,
        .clear-all-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background-color: transparent;
        }
        
        .dropdown-divider {
          height: 1px;
          background-color: #f0f0f0;
          margin: 0;
        }
        
        .notifications-list {
          max-height: 400px;
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        
        .notification-item {
          display: flex;
          align-items: flex-start;
          padding: 16px 20px;
          border-bottom: 1px solid #f8f8f8;
          transition: all 0.2s;
          cursor: pointer;
          position: relative;
          border-left: 4px solid transparent;
          gap: 12px;
        }
        
        .notification-item.unread {
          background-color: #f8ffff;
        }
        
        .notification-item.read {
          background-color: #FFFFFF;
        }
        
        .notification-item:hover {
          background-color: rgba(0, 0, 0, 0.02) !important;
          transform: translateX(2px);
        }
        
        .notification-item.empty {
          justify-content: center;
          color: #888;
          padding: 40px 20px;
          text-align: center;
          cursor: default;
          background: white !important;
        }
        
        .notification-icon-container {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
          position: relative;
        }
        
        .unread-pulse {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background-color: #2196f3;
          border-radius: 50%;
          animation: pulse-dot 2s infinite;
        }
        
        @keyframes pulse-dot {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .notification-content {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          position: relative;
        }
        
        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        
        .notification-title {
          font-weight: 600;
          font-size: 14px;
          color: #333;
        }
        
        .notification-time {
          font-size: 11px;
          color: #888;
          font-weight: 500;
        }
        
        .notification-text {
          margin: 0 0 8px 0;
          font-size: 13px;
          line-height: 1.4;
          white-space: normal;
          word-wrap: break-word;
          color: #555;
        }
        
        .notification-details {
          display: flex;
          gap: 8px;
          font-size: 11px;
          color: #666;
          margin-top: 6px;
          flex-wrap: wrap;
          align-items: center;
        }
        
        .sme-name {
          font-weight: 500;
          color: #333;
          background: #f0f0f0;
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .match-percentage {
          color: #4caf50;
          font-weight: 600;
        }
        
        .status-change {
          display: flex;
          gap: 4px;
          align-items: center;
          background: #f8f9fa;
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .old-status {
          text-decoration: line-through;
          color: #999;
        }
        
        .new-status {
          font-weight: 600;
          color: #2196f3;
        }
        
        .delete-notification {
          background: none;
          border: none;
          cursor: pointer;
          color: #ccc;
          padding: 4px;
          margin-left: 8px;
          transition: all 0.2s;
          flex-shrink: 0;
          border-radius: 4px;
          opacity: 0;
        }
        
        .notification-item:hover .delete-notification {
          opacity: 1;
        }
        
        .delete-notification:hover {
          color: #ff4444;
          background-color: rgba(255, 68, 68, 0.1);
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          animation: fadeIn 0.2s ease-out;
        }
        
        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .modal-header h3 {
          margin: 0;
          color: #333;
          font-size: 18px;
        }
        
        .text-warning {
          color: #ff9800;
        }
        
        .modal-content p {
          margin: 0 0 24px 0;
          color: #666;
          line-height: 1.5;
        }
        
        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        
        .btn-secondary, .btn-danger {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .btn-secondary {
          background: #f5f5f5;
          color: #333;
        }
        
        .btn-secondary:hover {
          background: #e0e0e0;
        }
        
        .btn-danger {
          background: #ff4444;
          color: white;
        }
        
        .btn-danger:hover {
          background: #dd3333;
        }
        
        /* Scrollbar Styling */
        .notifications-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .notifications-list::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .notifications-list::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .notifications-list::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};

export default Notifications;