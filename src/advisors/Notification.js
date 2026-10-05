"use client";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Bell,
  X,
  Trash2,
  Check,
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
} from "lucide-react";

import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

// Notifications.jsx appears to be inside src/
// Change this path only if your file is somewhere else.
import { auth, db } from "./firebaseConfig";

const Notifications = () => {
  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [currentUser, setCurrentUser] =
    useState(null);

  const notificationsRef = useRef(null);

  /*
   * Holds the actual Firestore calendar events.
   *
   * key:
   * smeCalendarEvents:firestoreDocId
   *
   * value:
   * {
   *   id,
   *   collectionName,
   *   ...firestoreData
   * }
   */
  const calendarEventsRef = useRef(new Map());

  // --------------------------------------------------
  // STORAGE HELPERS
  // --------------------------------------------------

  const getReadStorageKey = (uid) =>
    `calendarNotificationReads_${uid}`;

  const getDismissedStorageKey = (uid) =>
    `calendarNotificationDismissed_${uid}`;

  const getStoredSet = (key) => {
    try {
      return new Set(
        JSON.parse(
          localStorage.getItem(key) || "[]"
        )
      );
    } catch (error) {
      console.error(
        "Failed reading notification storage:",
        error
      );

      return new Set();
    }
  };

  const saveStoredSet = (key, set) => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify([...set])
      );
    } catch (error) {
      console.error(
        "Failed saving notification storage:",
        error
      );
    }
  };

  // --------------------------------------------------
  // DATE HELPERS
  // --------------------------------------------------

  const convertToDate = (value) => {
    if (!value) return null;

    try {
      // Firestore Timestamp
      if (typeof value?.toDate === "function") {
        return value.toDate();
      }

      // Firestore timestamp-shaped object
      if (
        typeof value === "object" &&
        value.seconds
      ) {
        return new Date(
          value.seconds * 1000
        );
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return null;
      }

      return date;
    } catch {
      return null;
    }
  };

  const getEventDate = (event) => {
    // Confirmed / scheduled meeting date
    if (event.scheduledDate) {
      const scheduled =
        convertToDate(event.scheduledDate);

      if (scheduled) return scheduled;
    }

    // Normal calendar date
    if (event.date) {
      const date =
        convertToDate(event.date);

      if (date) return date;
    }

    // Meeting availability dates
    if (
      Array.isArray(event.availableDates) &&
      event.availableDates.length > 0
    ) {
      const date =
        convertToDate(
          event.availableDates[0]?.date
        );

      if (date) return date;
    }

    return null;
  };

  const getCreatedDate = (event) => {
    return (
      convertToDate(event.updatedAt) ||
      convertToDate(event.createdAt) ||
      getEventDate(event) ||
      new Date()
    );
  };

  const formatEventDate = (date) => {
    if (!date) return "";

    return date.toLocaleDateString(
      "en-ZA",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  // --------------------------------------------------
  // NOTIFICATION TYPE
  // --------------------------------------------------

  const getNotificationStyle = (type) => {
    switch (type) {
      case "success":
        return {
          borderLeftColor: "#4caf50",
          icon: (
            <CheckCircle2
              size={16}
              className="text-green-500"
            />
          ),
          title: "Success",
        };

      case "error":
        return {
          borderLeftColor: "#f44336",
          icon: (
            <AlertCircle
              size={16}
              className="text-red-500"
            />
          ),
          title: "Error",
        };

      case "warning":
        return {
          borderLeftColor: "#ffc107",
          icon: (
            <AlertTriangle
              size={16}
              className="text-yellow-500"
            />
          ),
          title: "Warning",
        };

      default:
        return {
          borderLeftColor: "#2196f3",
          icon: (
            <Info
              size={16}
              className="text-blue-500"
            />
          ),
          title: "Information",
        };
    }
  };

  // --------------------------------------------------
  // TURN CALENDAR EVENT INTO NOTIFICATION
  // --------------------------------------------------

  const createCalendarNotification = (
    event,
    uid,
    readIds,
    dismissedIds
  ) => {
    const status = String(
      event.status ||
      event.meetingStatus ||
      "pending"
    ).toLowerCase();

    /*
     * Status is deliberately part of the notification ID.
     *
     * Example:
     *
     * event1:pending
     * event1:scheduled
     *
     * This means if the user already read the
     * "pending invitation", changing the meeting to
     * "scheduled" can produce a NEW unread update.
     */
    const notificationId =
      `${event.collectionName}:` +
      `${event.id}:` +
      `${status}`;

    if (dismissedIds.has(notificationId)) {
      return null;
    }

    /*
     * Don't notify somebody about the event they
     * themselves just created.
     *
     * Recipient copies have the original creator
     * in createdBy but the recipient's uid in smeId.
     */
    const createdByCurrentUser =
      event.createdBy === uid;

    const isRecipientInvitation =
      event.isInvitation === true;

    if (
      createdByCurrentUser &&
      !isRecipientInvitation
    ) {
      return null;
    }

    const eventTitle =
      event.title ||
      event.name ||
      event.purpose ||
      "Meeting";

    const senderName =
      event.createdByName ||
      event.requesterName ||
      event.customerName ||
      event.smeName ||
      event.host ||
      "A user";

    const meetingDate =
      getEventDate(event);

    const dateText =
      meetingDate
        ? ` on ${formatEventDate(
            meetingDate
          )}`
        : "";

    const location =
      event.location &&
      event.location !== "Virtual"
        ? ` at ${event.location}`
        : "";

    let type = "info";
    let title =
      "New Calendar Event";
    let message =
      `${senderName} added "${eventTitle}" ` +
      `to your calendar${dateText}${location}.`;

    switch (status) {
      case "pending":
        type = "info";
        title =
          isRecipientInvitation
            ? "New Meeting Invitation"
            : "New Calendar Event";

        message =
          `${senderName} invited you to ` +
          `"${eventTitle}"${dateText}${location}.`;
        break;

      case "scheduled":
        type = "success";
        title = "Meeting Scheduled";

        message =
          `"${eventTitle}" has been scheduled` +
          `${dateText}${location}.`;
        break;

      case "confirmed":
        type = "success";
        title = "Meeting Confirmed";

        message =
          `"${eventTitle}" has been confirmed` +
          `${dateText}${location}.`;
        break;

      case "rescheduled":
        type = "warning";
        title = "Meeting Rescheduled";

        message =
          `"${eventTitle}" has been rescheduled` +
          `${dateText}${location}.`;
        break;

      case "cancelled":
      case "canceled":
        type = "warning";
        title = "Meeting Cancelled";

        message =
          `"${eventTitle}" was cancelled.`;
        break;

      case "completed":
        type = "success";
        title = "Meeting Completed";

        message =
          `"${eventTitle}" was marked as completed.`;
        break;

      default:
        type = "info";
        title = "Calendar Update";
        break;
    }

    const createdDate =
      getCreatedDate(event);

    return {
      id: notificationId,

      // Keep original Firestore information
      eventId: event.id,
      eventCollection:
        event.collectionName,

      category: "calendar",

      title,
      message,
      type,

      status,

      timestamp: createdDate,

      date:
        createdDate.toISOString(),

      read:
        readIds.has(
          notificationId
        ),

      eventDate:
        meetingDate,

      location:
        event.location ||
        "Virtual",
    };
  };

  // --------------------------------------------------
  // BUILD THE NOTIFICATION LIST
  // --------------------------------------------------

  const rebuildNotifications = (uid) => {
    if (!uid) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const readIds =
      getStoredSet(
        getReadStorageKey(uid)
      );

    const dismissedIds =
      getStoredSet(
        getDismissedStorageKey(uid)
      );

    const builtNotifications = [
      ...calendarEventsRef.current.values(),
    ]
      .map((event) =>
        createCalendarNotification(
          event,
          uid,
          readIds,
          dismissedIds
        )
      )
      .filter(Boolean)
      .sort(
        (a, b) =>
          b.timestamp.getTime() -
          a.timestamp.getTime()
      )
      .slice(0, 50);

    setNotifications(
      builtNotifications
    );

    setUnreadCount(
      builtNotifications.filter(
        (notification) =>
          !notification.read
      ).length
    );
  };

  // --------------------------------------------------
  // AUTH LISTENER
  // --------------------------------------------------

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          setCurrentUser(user);

          if (!user) {
            calendarEventsRef.current.clear();
            setNotifications([]);
            setUnreadCount(0);
          }
        }
      );

    return unsubscribe;
  }, []);

  // --------------------------------------------------
  // REAL-TIME FIRESTORE CALENDAR LISTENERS
  // --------------------------------------------------

  useEffect(() => {
    if (!currentUser?.uid) {
      return;
    }

    const uid = currentUser.uid;

    calendarEventsRef.current.clear();

    /*
     * These are the exact collections currently used
     * by your Meetings page.
     */
    const calendarSources = [
      {
        collectionName:
          "smeCalendarEvents",

        userField:
          "smeId",
      },
      {
        collectionName:
          "supplierCalendarEvents",

        userField:
          "supplierId",
      },
    ];

    const unsubscribers =
      calendarSources.map(
        ({
          collectionName,
          userField,
        }) => {
          const calendarQuery =
            query(
              collection(
                db,
                collectionName
              ),
              where(
                userField,
                "==",
                uid
              )
            );

          return onSnapshot(
            calendarQuery,

            (snapshot) => {
              /*
               * Remove the old snapshot for this
               * particular collection first.
               */
              const prefix =
                `${collectionName}:`;

              for (
                const key of
                calendarEventsRef.current.keys()
              ) {
                if (
                  key.startsWith(
                    prefix
                  )
                ) {
                  calendarEventsRef.current.delete(
                    key
                  );
                }
              }

              /*
               * Put current Firestore data back.
               */
              snapshot.forEach(
                (docSnap) => {
                  const event =
                    docSnap.data();

                  const mapKey =
                    `${collectionName}:` +
                    docSnap.id;

                  calendarEventsRef.current.set(
                    mapKey,
                    {
                      id:
                        docSnap.id,

                      collectionName,

                      ...event,
                    }
                  );
                }
              );

              rebuildNotifications(
                uid
              );
            },

            (error) => {
              console.error(
                `Error listening to ${collectionName}:`,
                error
              );
            }
          );
        }
      );

    return () => {
      unsubscribers.forEach(
        (unsubscribe) =>
          unsubscribe()
      );

      calendarEventsRef.current.clear();
    };
  }, [currentUser?.uid]);

  // --------------------------------------------------
  // CLICK OUTSIDE
  // --------------------------------------------------

  useEffect(() => {
    const handleClickOutside = (
      event
    ) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(
          event.target
        )
      ) {
        setShowNotifications(
          false
        );
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // --------------------------------------------------
  // MARK ONE AS READ
  // --------------------------------------------------

  const markAsRead = (id) => {
    if (!currentUser?.uid) return;

    const storageKey =
      getReadStorageKey(
        currentUser.uid
      );

    const readIds =
      getStoredSet(storageKey);

    readIds.add(id);

    saveStoredSet(
      storageKey,
      readIds
    );

    setNotifications(
      (previous) =>
        previous.map(
          (notification) =>
            notification.id === id
              ? {
                  ...notification,
                  read: true,
                }
              : notification
        )
    );

    setUnreadCount(
      (previous) =>
        Math.max(
          0,
          previous - 1
        )
    );
  };

  // --------------------------------------------------
  // MARK ALL READ
  // --------------------------------------------------

  const markAllAsRead = () => {
    if (!currentUser?.uid) return;

    const storageKey =
      getReadStorageKey(
        currentUser.uid
      );

    const readIds =
      getStoredSet(storageKey);

    notifications.forEach(
      (notification) => {
        readIds.add(
          notification.id
        );
      }
    );

    saveStoredSet(
      storageKey,
      readIds
    );

    setNotifications(
      (previous) =>
        previous.map(
          (notification) => ({
            ...notification,
            read: true,
          })
        )
    );

    setUnreadCount(0);
  };

  // --------------------------------------------------
  // DELETE ONE
  // --------------------------------------------------

  const deleteNotification = (
    id
  ) => {
    if (!currentUser?.uid) return;

    const dismissedKey =
      getDismissedStorageKey(
        currentUser.uid
      );

    const dismissedIds =
      getStoredSet(
        dismissedKey
      );

    dismissedIds.add(id);

    saveStoredSet(
      dismissedKey,
      dismissedIds
    );

    setNotifications(
      (previous) => {
        const target =
          previous.find(
            (item) =>
              item.id === id
          );

        if (
          target &&
          !target.read
        ) {
          setUnreadCount(
            (count) =>
              Math.max(
                0,
                count - 1
              )
          );
        }

        return previous.filter(
          (item) =>
            item.id !== id
        );
      }
    );
  };

  // --------------------------------------------------
  // CLEAR ALL
  // --------------------------------------------------

  const clearAllNotifications =
    () => {
      if (!currentUser?.uid) return;

      const dismissedKey =
        getDismissedStorageKey(
          currentUser.uid
        );

      const dismissedIds =
        getStoredSet(
          dismissedKey
        );

      notifications.forEach(
        (notification) => {
          dismissedIds.add(
            notification.id
          );
        }
      );

      saveStoredSet(
        dismissedKey,
        dismissedIds
      );

      setNotifications([]);
      setUnreadCount(0);
    };

  // --------------------------------------------------
  // DISPLAY TIME
  // --------------------------------------------------

  const formatTimestamp = (
    timestamp
  ) => {
    const date =
      timestamp instanceof Date
        ? timestamp
        : new Date(timestamp);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    const now = new Date();

    const difference =
      now.getTime() -
      date.getTime();

    const minutes =
      difference /
      (1000 * 60);

    const hours =
      difference /
      (1000 * 60 * 60);

    if (
      minutes >= 0 &&
      minutes < 1
    ) {
      return "Just now";
    }

    if (
      minutes >= 1 &&
      minutes < 60
    ) {
      return `${Math.floor(
        minutes
      )}m ago`;
    }

    if (
      hours >= 0 &&
      hours < 24
    ) {
      return date.toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    }

    return date.toLocaleDateString(
      "en-ZA",
      {
        day: "numeric",
        month: "short",
      }
    );
  };

  // --------------------------------------------------
  // NOTIFICATION CLICK
  // --------------------------------------------------

  const handleNotificationClick = (
    notification
  ) => {
    if (!notification.read) {
      markAsRead(
        notification.id
      );
    }

    /*
     * Optional:
     *
     * If you want clicking a calendar notification
     * to open your Calendar page, uncomment:
     *
     * window.location.href = "/calendar";
     */
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div
      className="notifications-container"
      ref={notificationsRef}
    >
      <button
        className={`icon-button ${
          showNotifications
            ? "active"
            : ""
        }`}
        onClick={() => {
          const opening =
            !showNotifications;

          setShowNotifications(
            opening
          );

          /*
           * This preserves the behaviour
           * from your existing component:
           * opening the dropdown marks
           * everything as read.
           *
           * Remove this block if you want
           * notifications to remain unread
           * until each one is clicked.
           */
          if (
            opening &&
            unreadCount > 0
          ) {
            markAllAsRead();
          }
        }}
        aria-label="Notifications"
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9
              ? "9+"
              : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="dropdown-menu notifications-dropdown">
          <div className="dropdown-header">
            <h3>
              Notifications
            </h3>

            <div className="notification-actions">
              <button
                className="mark-read-button"
                onClick={
                  markAllAsRead
                }
              >
                <Check size={16} />
                Mark all as read
              </button>

              <button
                className="clear-all-button"
                onClick={
                  clearAllNotifications
                }
              >
                <Trash2
                  size={16}
                />
                Clear all
              </button>
            </div>
          </div>

          <div className="dropdown-divider" />

          <div className="notifications-list">
            {notifications.length ===
            0 ? (
              <div className="notification-item empty">
                <p>
                  No notifications
                  yet
                </p>
              </div>
            ) : (
              notifications.map(
                (notification) => {
                  const style =
                    getNotificationStyle(
                      notification.type
                    );

                  return (
                    <div
                      key={
                        notification.id
                      }
                      className={`notification-item ${
                        notification.read
                          ? "read"
                          : "unread"
                      }`}
                      style={{
                        borderLeftColor:
                          style.borderLeftColor,

                        backgroundColor:
                          notification.read
                            ? "#FFFFFF"
                            : "#F5F8FF",
                      }}
                      onClick={() =>
                        handleNotificationClick(
                          notification
                        )
                      }
                    >
                      <div className="notification-icon-container">
                        {notification.category ===
                        "calendar" ? (
                          <CalendarDays
                            size={18}
                          />
                        ) : (
                          style.icon
                        )}
                      </div>

                      <div className="notification-content">
                        <div className="notification-header">
                          <span className="notification-title">
                            {
                              notification.title
                            }
                          </span>
                        </div>

                        <p className="notification-text">
                          {
                            notification.message
                          }
                        </p>

                        <div className="notification-meta">
                          <span className="notification-time">
                            {formatTimestamp(
                              notification.timestamp
                            )}
                          </span>

                          {notification.status && (
                            <span className="notification-status">
                              {
                                notification.status
                              }
                            </span>
                          )}

                          {!notification.read && (
                            <span className="unread-dot" />
                          )}
                        </div>
                      </div>

                      <button
                        className="delete-notification"
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          deleteNotification(
                            notification.id
                          );
                        }}
                        aria-label="Delete notification"
                      >
                        <X
                          size={16}
                        />
                      </button>
                    </div>
                  );
                }
              )
            )}
          </div>
        </div>
      )}

   <style>{`
      .notification-status {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 10px;
  background: #f1ece9;
  color: #5d4037;
  font-size: 10px;
  font-weight: 600;
  text-transform: capitalize;
}
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
        }
        
        .notification-title {
          font-weight: 600;
          font-size: 14px;
          color: #333;
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

export default Notifications;