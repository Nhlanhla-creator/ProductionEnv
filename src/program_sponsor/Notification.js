"use client"
import { useState, useEffect, useRef } from "react"
import { Bell, X, Trash2, Check, AlertTriangle, Info, CheckCircle2, AlertCircle, User, Mail, Briefcase } from "lucide-react"
import { db } from ".././firebaseConfig"
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore"
import { getAuth, onAuthStateChanged } from "firebase/auth"

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [user, setUser] = useState(null)
  const notificationsRef = useRef(null)
  const auth = getAuth()

  // Notification type styling
  const getNotificationStyle = (type) => {
    switch (type) {
      case 'new_match':
        return { 
          borderLeftColor: '#4caf50',
          icon: <User size={16} className="text-green-500" />,
          title: 'New Match'
        }
      case 'status_change':
        return { 
          borderLeftColor: '#2196f3',
          icon: <Briefcase size={16} className="text-blue-500" />,
          title: 'Status Update'
        }
      case 'message':
        return { 
          borderLeftColor: '#ff9800',
          icon: <Mail size={16} className="text-orange-500" />,
          title: 'New Message'
        }
      case 'error':
        return { 
          borderLeftColor: '#f44336',
          icon: <AlertCircle size={16} className="text-red-500" />,
          title: 'Error'
        }
      default:
        return { 
          borderLeftColor: '#9e9e9e',
          icon: <Info size={16} className="text-gray-500" />,
          title: 'Notification'
        }
    }
  }

  // Load notifications from Firestore
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        // Load notifications from Firestore
        const q = query(
          collection(db, "notifications"),
          where("userId", "==", currentUser.uid),
          where("userType", "==", "program_sponsor")
        )
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const loadedNotifications = []
          querySnapshot.forEach((doc) => {
            loadedNotifications.push({
              id: doc.id,
              ...doc.data()
            })
          })
          setNotifications(loadedNotifications)
          setUnreadCount(loadedNotifications.filter(n => !n.read).length)
        })

        return () => unsubscribe()
      }
    })

    return () => unsubscribeAuth()
  }, [])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Function to add a notification (can be called from other components)
  const addNotification = async (message, type = 'info', internData = null) => {
    if (!user) return

    const notification = {
      userId: user.uid,
      userType: 'program_sponsor',
      message,
      type,
      read: false,
      timestamp: new Date(),
      internData
    }

    try {
      // In a real implementation, you would add this to Firestore
      // await addDoc(collection(db, "notifications"), notification)
      
      // For demo purposes, we'll add it to local state
      const newNotification = {
        ...notification,
        id: Date.now().toString()
      }
      
      setNotifications(prev => {
        const updated = [newNotification, ...prev].slice(0, 50)
        return updated
      })
      
      setUnreadCount(prev => prev + 1)
    } catch (error) {
      console.error("Error adding notification:", error)
    }
  }

  // Watch for intern status changes and add notifications
  useEffect(() => {
    // This would be connected to your Firestore listener for intern status changes
    // For demo purposes, we'll simulate it with a timeout
    const timer = setTimeout(() => {
      addNotification(
        "New intern match: Jane Mokoena (95% match)",
        "new_match",
        { id: "INT-001", name: "Jane Mokoena", matchPercentage: 95 }
      )
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const markAllAsRead = async () => {
    if (!user) return

    try {
      // In a real implementation, you would update all notifications in Firestore
      // For demo purposes, we'll update local state
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }))
      setNotifications(updatedNotifications)
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    }
  }

  const clearAllNotifications = async () => {
    if (!user) return

    try {
      // In a real implementation, you would delete notifications from Firestore
      // For demo purposes, we'll clear local state
      setNotifications([])
      setUnreadCount(0)
    } catch (error) {
      console.error("Error clearing notifications:", error)
    }
  }

  const deleteNotification = async (id) => {
    try {
      // In a real implementation, you would delete from Firestore
      // For demo purposes, we'll update local state
      const wasUnread = notifications.find(n => n.id === id)?.read === false
      const updatedNotifications = notifications.filter(n => n.id !== id)
      setNotifications(updatedNotifications)
      if (wasUnread) {
        setUnreadCount(prev => prev - 1)
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const markAsRead = async (id) => {
    try {
      // In a real implementation, you would update in Firestore
      // For demo purposes, we'll update local state
      const updatedNotifications = notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
      setNotifications(updatedNotifications)
      setUnreadCount(prev => prev - 1)
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const formatTimestamp = (date) => {
    if (!date) return ""
    
    const now = new Date()
    const notificationDate = date.toDate ? date.toDate() : new Date(date)
    const diffInHours = (now - notificationDate) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return notificationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return notificationDate.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const handleNotificationClick = (id, isRead) => {
    if (!isRead) {
      markAsRead(id)
    }
    setShowNotifications(false)
    // You could add navigation logic here based on the notification type
  }

  return (
    <div className="notifications-container" ref={notificationsRef}>
      <button
        className={`icon-button ${showNotifications ? 'active' : ''}`}
        onClick={() => {
          setShowNotifications(!showNotifications)
          if (!showNotifications && unreadCount > 0) {
            markAllAsRead()
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
                const style = getNotificationStyle(notification.type)
                return (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    style={{ 
                      borderLeftColor: style.borderLeftColor,
                      backgroundColor: notification.read ? '#FFFFFF' : '#F5F5F5'
                    }}
                    onClick={() => handleNotificationClick(notification.id, notification.read)}
                  >
                    <div className="notification-icon-container">
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
                      {notification.internData && (
                        <div className="intern-info">
                          <span className="intern-name">{notification.internData.name}</span>
                          {notification.internData.matchPercentage && (
                            <span className="match-percentage">{notification.internData.matchPercentage}% match</span>
                          )}
                        </div>
                      )}
                    </div>
                    <button 
                      className="delete-notification" 
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification.id)
                      }}
                      aria-label="Delete notification"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )
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
          background-color: #F5F5F5;
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
        
        .intern-info {
          display: flex;
          gap: 8px;
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }
        
        .intern-name {
          font-weight: 500;
        }
        
        .match-percentage {
          color: #4caf50;
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
  )
}

// Export the component and the addNotification function
export { Notifications as default, Notifications }