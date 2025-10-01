"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, Trash2, Check, AlertTriangle, Info } from 'lucide-react';

const CatalystNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [ignoredNotifications, setIgnoredNotifications] = useState(new Set());
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const notificationsRef = useRef(null);
  const lastApplicationsRef = useRef([]);

  // Load state from localStorage on component mount
  useEffect(() => {
    const savedIgnored = localStorage.getItem('ignoredNotifications');
    const savedNotifications = localStorage.getItem('catalystNotifications');
    const savedUnreadCount = localStorage.getItem('unreadCount');
    const savedLastApplications = localStorage.getItem('lastApplications');
    
    if (savedIgnored) {
      setIgnoredNotifications(new Set(JSON.parse(savedIgnored)));
    }
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
    if (savedUnreadCount) {
      setUnreadCount(parseInt(savedUnreadCount));
    }
    if (savedLastApplications) {
      lastApplicationsRef.current = JSON.parse(savedLastApplications);
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('catalystNotifications', JSON.stringify(notifications));
    localStorage.setItem('unreadCount', unreadCount.toString());
  }, [notifications, unreadCount]);

  // Save ignored notifications to localStorage when they change
  useEffect(() => {
    if (ignoredNotifications.size > 0) {
      localStorage.setItem('ignoredNotifications', JSON.stringify(Array.from(ignoredNotifications)));
    } else {
      localStorage.removeItem('ignoredNotifications');
    }
  }, [ignoredNotifications]);

  // Notification type styling
  const getNotificationStyle = (type) => {
    switch (type) {
      case 'new_application':
        return { 
          borderLeftColor: '#4caf50',
          title: 'New Application',
          icon: <Info size={16} color="#4caf50" />
        };
      case 'status_change':
        return { 
          borderLeftColor: '#2196f3',
          title: 'Status Update',
          icon: <AlertTriangle size={16} color="#2196f3" />
        };
      default:
        return { 
          borderLeftColor: '#9e9e9e',
          title: 'Notification',
          icon: <Bell size={16} color="#9e9e9e" />
        };
    }
  };

  // Function to check for new applications and status changes
  const checkForChanges = useCallback((currentApplications) => {
    const lastApplications = lastApplicationsRef.current;
    
    // Detect new applications
    const newApps = currentApplications.filter(app => 
      !lastApplications.some(lastApp => lastApp.id === app.id)
    );
    
    // Detect status changes
    const statusChanges = currentApplications.filter(app => {
      const oldApp = lastApplications.find(lastApp => lastApp.id === app.id);
      return oldApp && oldApp.pipelineStage !== app.pipelineStage;
    });
    
    console.log('New apps:', newApps.length, 'Status changes:', statusChanges.length);
    
    // Create notifications
    const newNotifications = [];
    
    newApps.forEach(app => {
      const notificationId = `new-${app.id}-${Date.now()}`;
      if (!ignoredNotifications.has(notificationId)) {
        newNotifications.push({
          id: notificationId,
          type: 'new_application',
          message: `New support application received from ${app.smeName || app.name || 'an SMSE'}`,
          smeName: app.smeName || app.name,
          stage: app.pipelineStage || app.currentStatus || 'Application Received',
          timestamp: new Date(),
          read: false,
          applicationId: app.id
        });
      }
    });
    
    statusChanges.forEach(app => {
      const oldApp = lastApplications.find(lastApp => lastApp.id === app.id);
      const notificationId = `status-${app.id}-${Date.now()}`;
      if (!ignoredNotifications.has(notificationId)) {
        newNotifications.push({
          id: notificationId,
          type: 'status_change',
          message: `Application status changed from "${oldApp.pipelineStage || oldApp.currentStatus}" to "${app.pipelineStage || app.currentStatus}"`,
          smeName: app.smeName || app.name,
          stage: app.pipelineStage || app.currentStatus,
          oldStage: oldApp.pipelineStage || oldApp.currentStatus,
          timestamp: new Date(),
          read: false,
          applicationId: app.id
        });
      }
    });
    
    if (newNotifications.length > 0) {
      console.log('Adding new notifications:', newNotifications.length);
      setNotifications(prev => {
        const updated = [...newNotifications, ...prev.filter(n => !ignoredNotifications.has(n.id))]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 50); // Keep only 50 most recent
        return updated;
      });
      setUnreadCount(prev => prev + newNotifications.length);
    }
    
    // Update last applications
    lastApplicationsRef.current = currentApplications;
    localStorage.setItem('lastApplications', JSON.stringify(currentApplications));
  }, [ignoredNotifications]);

  // Expose the checkForChanges function to parent components
  useEffect(() => {
    // Make the function available globally so the table can call it
    window.catalystNotifications = {
      checkForChanges
    };
    
    return () => {
      // Cleanup
      delete window.catalystNotifications;
    };
  }, [checkForChanges]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
        setShowClearAllConfirm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  const confirmClearAll = () => {
    setShowClearAllConfirm(true);
  };

  const clearAllNotifications = () => {
    const allNotificationIds = notifications.map(n => n.id);
    setIgnoredNotifications(prev => {
      const newSet = new Set(prev);
      allNotificationIds.forEach(id => newSet.add(id));
      return newSet;
    });
    setNotifications([]);
    setUnreadCount(0);
    setShowClearAllConfirm(false);
  };

  const cancelClearAll = () => {
    setShowClearAllConfirm(false);
  };

  const markAsRead = (id) => {
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const deleteNotification = (id) => {
    const wasUnread = notifications.find(n => n.id === id)?.read === false;
    setIgnoredNotifications(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    }
  };

  const getStageColor = (stage) => {
    switch (stage?.toLowerCase()) {
      case "support approved":
      case "active support":
        return { backgroundColor: "#2e7d32", color: "#ffffff" };
      case "support declined":
      case "closed":
        return { backgroundColor: "#d32f2f", color: "#ffffff" };
      case "under review":
        return { backgroundColor: "#795548", color: "#ffffff" };
      case "evaluation":
        return { backgroundColor: "#388e3c", color: "#ffffff" };
      case "due diligence":
        return { backgroundColor: "#4e342e", color: "#ffffff" };
      default:
        return { backgroundColor: "#5d4037", color: "#ffffff" };
    }
  };

  return (
    <div className="notifications-container" ref={notificationsRef}>
      <button
        className={`icon-button ${showNotifications ? 'active' : ''}`}
        onClick={() => {
          setShowNotifications(!showNotifications);
        }}
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
              {notifications.length > 0 && (
                <>
                  <button 
                    className="mark-read-button" 
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    <Check size={16} /> Mark all as read
                  </button>
                  <button className="clear-all-button" onClick={confirmClearAll}>
                    <Trash2 size={16} /> Clear all
                  </button>
                </>
              )}
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
                const stageStyle = getStageColor(notification.stage);
                return (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${notification.read ? '' : 'unread'}`}
                    style={{ borderLeftColor: style.borderLeftColor }}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="notification-icon">
                      {style.icon}
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
                      {notification.smeName && (
                        <p className="notification-sme">
                          <strong>SMSE:</strong> {notification.smeName}
                        </p>
                      )}
                      {notification.stage && (
                        <div className="notification-stage">
                          <span className="stage-label">Current Stage:</span>
                          <span 
                            className="stage-value"
                            style={{ 
                              backgroundColor: stageStyle.backgroundColor,
                              color: stageStyle.color
                            }}
                          >
                            {notification.stage}
                          </span>
                        </div>
                      )}
                      {!notification.read && (
                        <div className="notification-meta">
                          <span className="unread-dot"></span>
                          <span className="unread-text">Unread</span>
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
      {showClearAllConfirm && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal">
            <div className="modal-icon">
              <AlertTriangle size={48} className="text-warning" />
            </div>
            <h3 className="modal-title">Clear All Notifications?</h3>
            <p className="modal-message">Are you sure you want to clear all notifications?</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={cancelClearAll}>
                Cancel
              </button>
              <button className="btn-danger" onClick={clearAllNotifications}>
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
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
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          margin-top: 10px;
          overflow: hidden;
          animation: fadeIn 0.2s ease-out;
          transform-origin: top right;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #eee;
          position: sticky;
          top: 0;
          background: white;
          z-index: 1;
        }
        
        .dropdown-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
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
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .mark-read-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .mark-read-button:hover:not(:disabled), 
        .clear-all-button:hover {
          background-color: #f5f5f5;
        }
        
        .dropdown-divider {
          height: 1px;
          background-color: #eee;
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
          padding: 16px;
          border-bottom: 1px solid #f5f5f5;
          transition: all 0.2s;
          background-color: #ffffff;
          cursor: pointer;
          position: relative;
          border-left: 3px solid transparent;
          gap: 12px;
        }
        
        .notification-item.unread {
          background-color: #f8f9fa;
        }
        
        .notification-item.unread::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to right, rgba(0,0,0,0.03) 0%, transparent 100%);
          pointer-events: none;
        }
        
        .notification-item:hover {
          background-color: #f9f9f9;
        }
        
        .notification-item.empty {
          justify-content: center;
          color: #888;
          padding: 20px;
          text-align: center;
          cursor: default;
        }
        
        .notification-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }
        
        .notification-content {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        
        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .notification-title {
          font-weight: 600;
          font-size: 14px;
          color: #333;
        }
        
        .notification-time {
          font-size: 12px;
          color: #888;
        }
        
        .notification-text {
          margin: 0 0 8px 0;
          font-size: 14px;
          line-height: 1.4;
          white-space: normal;
          word-wrap: break-word;
          color: #555;
        }
        
        .notification-sme {
          margin: 4px 0 8px 0;
          font-size: 13px;
          color: #666;
        }
        
        .notification-stage {
          display: flex;
          align-items: center;
          margin: 8px 0;
          font-size: 13px;
          gap: 6px;
        }
        
        .stage-label {
          color: #666;
        }
        
        .stage-value {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .notification-meta {
          display: flex;
          gap: 8px;
          font-size: 12px;
          color: #888;
          align-items: center;
          margin-top: 8px;
        }
        
        .unread-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          background-color: #2196f3;
          border-radius: 50%;
        }
        
        .unread-text {
          color: #2196f3;
          font-weight: 500;
        }
        
        .delete-notification {
          background: none;
          border: none;
          cursor: pointer;
          color: #888;
          padding: 4px;
          align-self: flex-start;
          transition: color 0.2s;
          flex-shrink: 0;
          border-radius: 4px;
        }
        
        .delete-notification:hover {
          background-color: #f5f5f5;
          color: #ff4444;
        }

        /* Clean Modal Styles - No Scroll */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          animation: fadeIn 0.2s ease-out;
          backdrop-filter: blur(4px);
          padding: 20px;
          box-sizing: border-box;
        }
        
        .confirm-modal {
          background: white;
          border-radius: 20px;
          padding: 40px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease-out;
          border: 1px solid #e0e0e0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          overflow: visible;
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .modal-icon {
          margin-bottom: 20px;
          display: flex;
          justify-content: center;
        }
        
        .text-warning {
          color: #ff9800;
        }
        
        .modal-title {
          margin: 0 0 16px 0;
          color: #333;
          font-size: 24px;
          font-weight: 600;
          line-height: 1.3;
        }
        
        .modal-message {
          margin: 0 0 32px 0;
          color: #666;
          line-height: 1.5;
          font-size: 16px;
          max-width: 300px;
        }
        
        .modal-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          width: 100%;
          max-width: 300px;
        }
        
        .btn-secondary, .btn-danger {
          padding: 14px 32px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.2s;
          flex: 1;
          min-width: 120px;
        }
        
        .btn-secondary {
          background: #f8f9fa;
          color: #333;
          border: 2px solid #e0e0e0;
        }
        
        .btn-secondary:hover {
          background: #e9ecef;
          border-color: #d0d0d0;
          transform: translateY(-2px);
        }
        
        .btn-danger {
          background: #dc3545;
          color: white;
          border: 2px solid #dc3545;
        }
        
        .btn-danger:hover {
          background: #c82333;
          border-color: #c82333;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
        }
        
        /* Ensure no scrollbars on modals */
        .confirm-modal::-webkit-scrollbar {
          display: none;
        }
        
        .confirm-modal {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default CatalystNotifications;