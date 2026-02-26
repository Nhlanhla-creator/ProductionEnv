import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Trash2, Check, AlertTriangle, Info, CheckCircle2, AlertCircle } from 'lucide-react';

const InvestorNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);

  // Notification type styling
  const getNotificationStyle = (type) => {
    switch (type) {
      case 'new_application':
        return { 
          borderLeftColor: '#4caf50',
          icon: <CheckCircle2 size={16} className="text-green-500" />,
          title: 'New Application'
        };
      case 'status_change':
        return { 
          borderLeftColor: '#2196f3',
          icon: <Info size={16} className="text-blue-500" />,
          title: 'Status Update'
        };
      case 'warning':
        return { 
          borderLeftColor: '#ffc107',
          icon: <AlertTriangle size={16} className="text-yellow-500" />,
          title: 'Warning'
        };
      case 'error':
        return { 
          borderLeftColor: '#f44336',
          icon: <AlertCircle size={16} className="text-red-500" />,
          title: 'Error'
        };
      default:
        return { 
          borderLeftColor: '#2196f3',
          icon: <Info size={16} className="text-blue-500" />,
          title: 'Information'
        };
    }
  };

  // Load notifications from localStorage
  useEffect(() => {
    const savedNotifications = JSON.parse(localStorage.getItem('investorNotifications') || '[]');
    setNotifications(savedNotifications);
    setUnreadCount(savedNotifications.filter(n => !n.read).length);
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

  // Event listener for new notifications
  useEffect(() => {
    const handleNewNotification = (event) => {
      try {
        if (event.detail && event.detail.message) {
          addNotification(
            event.detail.message, 
            event.detail.type, 
            event.detail.applicationId,
            event.detail.companyName,
            event.detail.timestamp
          );
        }
      } catch (error) {
        console.error('Error handling notification:', error);
      }
    };

    window.addEventListener('newInvestorNotification', handleNewNotification, true);
    return () => window.removeEventListener('newInvestorNotification', handleNewNotification, true);
  }, []);

  const addNotification = (message, type = 'info', applicationId = null, companyName = null, timestamp = null) => {
    const notificationTimestamp = timestamp ? new Date(timestamp) : new Date();
    
    const newNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: notificationTimestamp.toISOString(), // Store as ISO string for consistency
      read: false,
      applicationId,
      companyName: companyName || 'Unknown Company'
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 50);
      localStorage.setItem('investorNotifications', JSON.stringify(updated));
      return updated;
    });

    setUnreadCount(prev => prev + 1);
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
    localStorage.setItem('investorNotifications', JSON.stringify(updatedNotifications));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('investorNotifications');
  };

  const deleteNotification = (id) => {
    const wasUnread = notifications.find(n => n.id === id)?.read === false;
    const updatedNotifications = notifications.filter(n => n.id !== id);
    setNotifications(updatedNotifications);
    if (wasUnread) {
      setUnreadCount(prev => prev - 1);
    }
    localStorage.setItem('investorNotifications', JSON.stringify(updatedNotifications));
  };

  const markAsRead = (id) => {
    const updatedNotifications = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    setUnreadCount(prev => prev - 1);
    localStorage.setItem('investorNotifications', JSON.stringify(updatedNotifications));
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const date = new Date(timestamp);
    
    // Check if the date is invalid
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    // Less than 1 minute ago
    if (diffInMinutes < 1) {
      return 'Just now';
    }
    
    // Less than 1 hour ago
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    // Less than 24 hours ago
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    // Less than 7 days ago
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }
    
    // More than 7 days ago, show the actual date and time
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      // Show full date and time for older notifications
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const handleNotificationClick = (id, isRead, applicationId) => {
    if (!isRead) {
      markAsRead(id);
    }
    if (applicationId) {
      // Navigate to investor matches - you can implement your navigation logic here
      console.log('Navigate to investor matches for application:', applicationId);
    }
  };

  // Format notification message to include company name properly
  const formatNotificationMessage = (notification) => {
    let message = notification.message || '';
    
    // Replace "unnamed" with the actual company name if available
    if (notification.companyName && notification.companyName !== 'Unknown Company') {
      message = message.replace(/unnamed/gi, notification.companyName);
      message = message.replace(/Unknown Company/gi, notification.companyName);
    }
    
    return message;
  };

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
            <h3>Notifications</h3>
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
                      backgroundColor: notification.read ? '#FFFFFF' : '#f8f9fa'
                    }}
                    onClick={() => handleNotificationClick(notification.id, notification.read, notification.applicationId)}
                  >
                    <div className="notification-icon-container">
                      {style.icon}
                    </div>
                    <div className="notification-content">
                      <div className="notification-header">
                        <span className="notification-title">{style.title}</span>
                        {notification.companyName && notification.companyName !== 'Unknown Company' && (
                          <span className="company-name">• {notification.companyName}</span>
                        )}
                      </div>
                      <p className="notification-text">
                        {formatNotificationMessage(notification)}
                      </p>
                      <div className="notification-meta">
                        <span className="notification-time">
                          {formatTimestamp(notification.timestamp)}
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
          background-color: #f8f9fa;
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
        }
        
        .notification-title {
          font-weight: 600;
          font-size: 14px;
          color: #333;
        }
        
        .company-name {
          font-size: 13px;
          color: #666;
          font-weight: 500;
        }
        
        .notification-text {
          margin: 0 0 8px 0;
          font-size: 14px;
          line-height: 1.4;
          white-space: normal;
          word-wrap: break-word;
          color: #555;
        }
        
        .notification-meta {
          display: flex;
          gap: 8px;
          font-size: 12px;
          color: #888;
          align-items: center;
          margin-top: 8px;
        }
        
        .notification-time {
          font-weight: 500;
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

// Updated function to properly handle company names and timestamps
export const addInvestorNotification = (message, type = 'info', applicationId = null, companyName = null, timestamp = null) => {
  const event = new CustomEvent('newInvestorNotification', {
    detail: { 
      message, 
      type, 
      applicationId,
      companyName: companyName || 'Unknown Company',
      timestamp: timestamp || new Date().toISOString()
    }
  });
  window.dispatchEvent(event);
};

export default InvestorNotifications;