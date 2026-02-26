"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Trash2, Check, AlertTriangle, Info, CheckCircle2, AlertCircle } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);

  // Notification type styling
  const getNotificationStyle = (type) => {
    switch (type) {
      case 'success':
        return { 
          borderLeftColor: '#4caf50',
          icon: <CheckCircle2 size={16} className="text-green-500" />,
          title: 'Match Update'
        };
      case 'status_change':
        return { 
          borderLeftColor: '#2196f3',
          icon: <Info size={16} className="text-blue-500" />,
          title: 'Status Change'
        };
      case 'new_match':
        return { 
          borderLeftColor: '#9c27b0',
          icon: <AlertCircle size={16} className="text-purple-500" />,
          title: 'New Match'
        };
      default:
        return { 
          borderLeftColor: '#ff9800',
          icon: <AlertTriangle size={16} className="text-orange-500" />,
          title: 'Update'
        };
    }
  };

  // Load notifications from localStorage
  useEffect(() => {
    const savedNotifications = JSON.parse(localStorage.getItem('intern-notifications') || '[]');
    setNotifications(savedNotifications);
    setUnreadCount(savedNotifications.filter(n => !n.read).length);
  }, []);

  // Listen for status changes in the PROGRAM SPONSOR MATCHES table
  useEffect(() => {
    const handleStatusChange = (event) => {
      if (event.detail && event.detail.type === 'status_change') {
        addNotification(
          `Your application status with ${event.detail.company} changed to ${event.detail.newStatus}`,
          'status_change',
          {
            company: event.detail.company,
            internshipRole: event.detail.internshipRole,
            oldStatus: event.detail.oldStatus,
            newStatus: event.detail.newStatus
          }
        );
      }
    };

    const handleNewMatch = (event) => {
      if (event.detail && event.detail.type === 'new_match') {
        addNotification(
          `New match found with ${event.detail.company} for ${event.detail.role}`,
          'new_match',
          {
            company: event.detail.company,
            internshipRole: event.detail.role,
            matchPercentage: event.detail.matchPercentage
          }
        );
      }
    };

    window.addEventListener('intern_status_change', handleStatusChange);
    window.addEventListener('new_intern_match', handleNewMatch);

    return () => {
      window.removeEventListener('intern_status_change', handleStatusChange);
      window.removeEventListener('new_intern_match', handleNewMatch);
    };
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const addNotification = (message, type = 'info', metadata = {}) => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString(),
      read: false,
      metadata
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 50);
      localStorage.setItem('intern-notifications', JSON.stringify(updated));
      return updated;
    });

    setUnreadCount(prev => prev + 1);
    
    // Trigger native browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification('Intern Match Update', {
        body: message,
        icon: '/logo192.png'
      });
    }
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
    localStorage.setItem('intern-notifications', JSON.stringify(updatedNotifications));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('intern-notifications');
  };

  const deleteNotification = (id) => {
    const wasUnread = notifications.find(n => n.id === id)?.read === false;
    const updatedNotifications = notifications.filter(n => n.id !== id);
    setNotifications(updatedNotifications);
    if (wasUnread) {
      setUnreadCount(prev => prev - 1);
    }
    localStorage.setItem('intern-notifications', JSON.stringify(updatedNotifications));
  };

  const markAsRead = (id) => {
    const updatedNotifications = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    setUnreadCount(prev => prev - 1);
    localStorage.setItem('intern-notifications', JSON.stringify(updatedNotifications));
  };

  const formatTimestamp = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleNotificationClick = (id, isRead, metadata) => {
    if (!isRead) {
      markAsRead(id);
    }
    
    // You could add navigation logic here based on the metadata
    // For example, navigate to the specific internship application
    console.log('Notification metadata:', metadata);
  };

  const requestNotificationPermission = () => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted');
        }
      });
    }
  };

  // Request notification permission when component mounts
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <div className="notifications-container" ref={notificationsRef}>
      <button
        className={`icon-button ${showNotifications ? 'active' : ''}`}
        onClick={() => {
          setShowNotifications(!showNotifications);
          if (!showNotifications && unreadCount > 0) {
            markAllAsRead();
          }
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
            <h3>Internship Updates</h3>
            <div className="notification-actions">
              <button 
                className="mark-read-button" 
                onClick={markAllAsRead}
              >
                <Check size={16} /> Mark all as read
              </button>
              <button className="clear-all-button" onClick={clearAllNotifications}>
                <Trash2 size={16} /> Clear all
              </button>
            </div>
          </div>
          <div className="dropdown-divider"></div>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="notification-item empty">
                <p>No notifications yet</p>
                <p className="notification-subtext">You'll be notified about your internship matches</p>
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
                      backgroundColor: notification.read ? '#FFFFFF' : '#909090'
                    }}
                    onClick={() => handleNotificationClick(
                      notification.id, 
                      notification.read,
                      notification.metadata
                    )}
                  >
                    <div className="notification-icon-container">
                      {style.icon}
                    </div>
                    <div className="notification-content">
                      <div className="notification-header">
                        <span className="notification-title">{style.title}</span>
                        {notification.metadata?.company && (
                          <span className="notification-company">
                            {notification.metadata.company}
                          </span>
                        )}
                      </div>
                      <p className="notification-text">
                        {notification.message}
                      </p>
                      {notification.metadata?.internshipRole && (
                        <p className="notification-role">
                          Role: {notification.metadata.internshipRole}
                        </p>
                      )}
                      {notification.metadata?.matchPercentage && (
                        <p className="notification-match">
                          Match: {notification.metadata.matchPercentage}%
                        </p>
                      )}
                      <div className="notification-meta">
                        <span className="notification-time">
                          {formatTimestamp(notification.date)}
                        </span>
                        {!notification.read && <span className="unread-dot"></span>}
                      </div>
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
          width: 380px;
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
          color: #5D4037;
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
        
        .mark-read-button:hover, 
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
          cursor: pointer;
          position: relative;
          border-left: 3px solid transparent;
          gap: 12px;
        }
        
        .notification-item.unread {
          background-color: #909090;
        }
        
        .notification-item.read {
          background-color: #FFFFFF;
        }
        
        .notification-item:hover {
          background-color: rgba(0, 0, 0, 0.02) !important;
        }
        
        .notification-item.empty {
          justify-content: center;
          color: #888;
          padding: 20px;
          text-align: center;
          cursor: default;
          background: white !important;
          flex-direction: column;
        }
        
        .notification-subtext {
          font-size: 12px;
          color: #aaa;
          margin-top: 4px;
        }
        
        .notification-icon-container {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
        }
        
        .notification-content {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        
        .notification-header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .notification-title {
          font-weight: 600;
          font-size: 14px;
          color: #333;
        }
        
        .notification-company {
          font-size: 12px;
          background: #f0f0f0;
          padding: 2px 6px;
          border-radius: 4px;
          color: #555;
        }
        
        .notification-text {
          margin: 0 0 8px 0;
          font-size: 14px;
          line-height: 1.4;
          white-space: normal;
          word-wrap: break-word;
          color: #555;
        }
        
        .notification-role,
        .notification-match {
          font-size: 12px;
          color: #666;
          margin: 4px 0;
          padding: 2px 4px;
          background: #f5f5f5;
          border-radius: 3px;
          display: inline-block;
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
          width: 6px;
          height: 6px;
          background-color: #2196f3;
          border-radius: 50%;
          margin-left: 4px;
        }
        
        .delete-notification {
          background: none;
          border: none;
          cursor: pointer;
          color: #888;
          padding: 0;
          margin-left: 8px;
          transition: color 0.2s;
          flex-shrink: 0;
        }
        
        .delete-notification:hover {
          color: #ff4444;
        }
      `}</style>
    </div>
  );
};

// Helper function to dispatch status change events
export const notifyStatusChange = (company, role, oldStatus, newStatus) => {
  const event = new CustomEvent('intern_status_change', {
    detail: {
      type: 'status_change',
      company,
      internshipRole: role,
      oldStatus,
      newStatus
    }
  });
  window.dispatchEvent(event);
};

// Helper function to dispatch new match events
export const notifyNewMatch = (company, role, matchPercentage) => {
  const event = new CustomEvent('new_intern_match', {
    detail: {
      type: 'new_match',
      company,
      role,
      matchPercentage
    }
  });
  window.dispatchEvent(event);
};

export default Notifications;