"use client";
import React, { useEffect, useRef, useState } from "react";
import { Bell, X, Trash2, Check, AlertTriangle, Info, CheckCircle2, AlertCircle, CalendarDays } from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
// Keep the same firebaseConfig path used by the reference component.
import { auth, db } from "../firebaseConfig";

// Override calendarSources if the investor Meetings page uses different names.
const DEFAULT_CALENDAR_SOURCES = [
  { collectionName: "investorCalendarEvents", userField: "investorId" },
];
const MAX_NOTIFICATIONS = 50;
const storageKey = (uid, kind) => `investorNotifications_${uid}_${kind}`;
const readStorage = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
};
const writeStorage = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (error) { console.warn("Could not save notification preferences:", error); }
};
const toDate = (value) => {
  if (value == null || value === "") return null;
  try {
    const date = typeof value?.toDate === "function" ? value.toDate()
      : typeof value === "object" && typeof value.seconds === "number"
        ? new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1000000)
        : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch { return null; }
};
const eventDate = (event) => {
  for (const value of [event.scheduledDate, event.start, event.date,
    event.meetingDetails?.date, event.availableDates?.[0]?.date]) {
    const date = toDate(value);
    if (date) return date;
  }
  return null;
};
const makeCalendarNotification = (event, uid) => {
  if (event.createdBy === uid && event.isInvitation !== true) return null;
  const status = String(event.status || event.meetingStatus || "pending").trim().toLowerCase();
  const date = eventDate(event);
  const title = event.title || event.name || event.purpose || "Meeting";
  const sender = event.createdByName || event.requesterName || event.customerName || event.smeName || event.host || "A user";
  const dateText = date ? ` on ${date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}` : "";
  const locationText = event.location ? ` at ${event.location}` : "";
  let notificationTitle = "Calendar Update";
  let message = `${sender} added "${title}" to your calendar${dateText}${locationText}.`;
  let type = "info";
  switch (status) {
    case "pending":
      notificationTitle = event.isInvitation ? "New Meeting Invitation" : "New Calendar Event";
      message = event.isInvitation
        ? `${sender} invited you to "${title}"${dateText}${locationText}.` : message;
      break;
    case "scheduled": case "confirmed":
      type = "success";
      notificationTitle = status === "scheduled" ? "Meeting Scheduled" : "Meeting Confirmed";
      message = `"${title}" has been ${status}${dateText}${locationText}.`;
      break;
    case "rescheduled":
      type = "warning"; notificationTitle = "Meeting Rescheduled";
      message = `"${title}" has been rescheduled${dateText}${locationText}.`;
      break;
    case "cancelled": case "canceled":
      type = "warning"; notificationTitle = "Meeting Cancelled";
      message = `"${title}" was cancelled.`;
      break;
    case "completed":
      type = "success"; notificationTitle = "Meeting Completed";
      message = `"${title}" was marked as completed.`;
      break;
  }
  // Changes to status or scheduled time become new unread updates.
  const id = `calendar:${event.collectionName}:${event.id}:${status}:${date?.toISOString() || ""}`;
  return {
    id, category: "calendar", title: notificationTitle, message, type, status,
    eventId: event.id, eventCollection: event.collectionName,
    timestamp: (toDate(event.updatedAt) || toDate(event.createdAt) || date || new Date(0)).toISOString(),
    companyName: event.companyName || event.smeName || null,
  };
};
const getNotificationStyle = (type) => {
  switch (type) {
    case "new_application": return { borderLeftColor: "#4caf50", icon: <CheckCircle2 size={16} />, title: "New Application" };
    case "status_change": return { borderLeftColor: "#2196f3", icon: <Info size={16} />, title: "Status Update" };
    case "success": return { borderLeftColor: "#4caf50", icon: <CheckCircle2 size={16} />, title: "Success" };
    case "warning": return { borderLeftColor: "#ffc107", icon: <AlertTriangle size={16} />, title: "Warning" };
    case "error": return { borderLeftColor: "#f44336", icon: <AlertCircle size={16} />, title: "Error" };
    default: return { borderLeftColor: "#2196f3", icon: <Info size={16} />, title: "Information" };
  }
};
const formatTimestamp = (value) => {
  const date = toDate(value);
  if (!date || date.getTime() === 0) return "";
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes >= 0 && minutes < 1) return "Just now";
  if (minutes >= 1 && minutes < 60) return `${minutes}m ago`;
  if (minutes >= 60 && minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
};
const formatMessage = (notification) => {
  const message = notification.message || "";
  return notification.companyName && notification.companyName !== "Unknown Company"
    ? message.replace(/unnamed|Unknown Company/gi, () => notification.companyName) : message;
};

const InvestorNotifications = ({
  calendarSources = DEFAULT_CALENDAR_SOURCES,
  onNotificationClick,
  markReadOnOpen = true,
}) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [listenerError, setListenerError] = useState("");
  const notificationsRef = useRef(null);
  const storeRef = useRef({ uid: null, local: [], events: new Map(), reads: new Set(), dismissed: new Set() });
  const unreadCount = notifications.filter(n => !n.read).length;
  // A stable primitive prevents inline calendarSources arrays from repeatedly subscribing.
  const sourcesKey = JSON.stringify(calendarSources);
  const rebuild = () => {
    const store = storeRef.current;
    if (!store.uid) { setNotifications([]); return; }
    const calendar = [...store.events.values()].map(event => makeCalendarNotification(event, store.uid)).filter(Boolean);
    const unique = new Map();
    [...store.local, ...calendar].forEach(item => {
      if (!item || typeof item.message !== "string" || !item.id) return;
      const id = String(item.id);
      if (!store.dismissed.has(id)) unique.set(id, { ...item, id, read: item.read === true || store.reads.has(id) });
    });
    setNotifications([...unique.values()]
      .sort((a, b) => (toDate(b.timestamp)?.getTime() || 0) - (toDate(a.timestamp)?.getTime() || 0))
      .slice(0, MAX_NOTIFICATIONS));
  };
  const persistPreferences = () => {
    const store = storeRef.current;
    if (!store.uid) return;
    writeStorage(storageKey(store.uid, "reads"), [...store.reads]);
    writeStorage(storageKey(store.uid, "dismissed"), [...store.dismissed]);
    writeStorage(storageKey(store.uid, "items"), store.local);
  };
  useEffect(() => {
    let active = true;
    let generation = 0;
    let unsubscribers = [];
    const stopListeners = () => { unsubscribers.forEach(fn => fn()); unsubscribers = []; };
    const unsubscribeAuth = onAuthStateChanged(auth, user => {
      stopListeners();
      const currentGeneration = ++generation;
      setShowNotifications(false);
      setListenerError("");
      storeRef.current = { uid: user?.uid || null, local: [], events: new Map(), reads: new Set(), dismissed: new Set() };
      setNotifications([]);
      if (!user) return;
      const store = storeRef.current;
      store.local = readStorage(storageKey(user.uid, "items"));
      store.reads = new Set(readStorage(storageKey(user.uid, "reads")).map(String));
      store.dismissed = new Set(readStorage(storageKey(user.uid, "dismissed")).map(String));
      // The old global investorNotifications cache is intentionally not imported:
      // it has no owner UID and may belong to another signed-in account.
      rebuild();
      const errors = new Set();
      JSON.parse(sourcesKey).forEach(({ collectionName, userField }) => {
        if (!collectionName || !userField) return;
        const source = `${collectionName}:${userField}`;
        const calendarQuery = query(collection(db, collectionName), where(userField, "==", user.uid));
        unsubscribers.push(onSnapshot(calendarQuery, snapshot => {
          if (!active || generation !== currentGeneration) return;
          errors.delete(source);
          setListenerError(errors.size ? "Some meeting notifications could not load. Check calendar access." : "");
          // Replace only this query's records, keeping other configured sources.
          for (const [key, event] of store.events) if (event.source === source) store.events.delete(key);
          snapshot.forEach(docSnap => store.events.set(`${source}:${docSnap.id}`, {
            ...docSnap.data(), id: docSnap.id, collectionName, source,
          }));
          rebuild();
        }, error => {
          if (!active || generation !== currentGeneration) return;
          console.error(`Investor calendar notifications (${source}):`, error);
          errors.add(source);
          setListenerError("Some meeting notifications could not load. Check calendar access.");
        }));
      });
    });
    return () => { active = false; generation++; unsubscribeAuth(); stopListeners(); };
  }, [sourcesKey]);
  useEffect(() => {
    const outside = event => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) setShowNotifications(false);
    };
    const escape = event => { if (event.key === "Escape") setShowNotifications(false); };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", escape); };
  }, []);
  useEffect(() => {
    const receive = event => {
      const detail = event.detail;
      const store = storeRef.current;
      if (!store.uid || auth.currentUser?.uid !== store.uid || typeof detail?.message !== "string" || !detail.message.trim()) return;
      if (detail.recipientId && detail.recipientId !== store.uid) return;
      const timestamp = (toDate(detail.timestamp) || new Date()).toISOString();
      const id = detail.id ? `local:${detail.id}`
        : `local:${JSON.stringify([detail.type || "info", detail.applicationId || null, detail.message, timestamp])}`;
      if (store.local.some(n => n.id === id)) return;
      store.local = [{ ...detail, id, timestamp, read: false, category: "application" }, ...store.local].slice(0, MAX_NOTIFICATIONS);
      persistPreferences(); rebuild();
    };
    window.addEventListener("newInvestorNotification", receive);
    window.addEventListener("newCommunityNotification", receive);
    const storageChanged = event => {
      const store = storeRef.current;
      if (!store.uid || (event.key !== null && !event.key.startsWith(`investorNotifications_${store.uid}_`))) return;
      store.local = readStorage(storageKey(store.uid, "items"));
      store.reads = new Set(readStorage(storageKey(store.uid, "reads")).map(String));
      store.dismissed = new Set(readStorage(storageKey(store.uid, "dismissed")).map(String));
      rebuild();
    };
    window.addEventListener("storage", storageChanged);
    return () => {
      window.removeEventListener("newInvestorNotification", receive);
      window.removeEventListener("newCommunityNotification", receive);
      window.removeEventListener("storage", storageChanged);
    };
  }, []);
  const markAsRead = id => {
    storeRef.current.reads.add(String(id)); persistPreferences(); rebuild();
  };
  const markAllAsRead = () => {
    notifications.forEach(n => storeRef.current.reads.add(String(n.id)));
    persistPreferences(); rebuild();
  };
  const deleteNotification = id => {
    storeRef.current.dismissed.add(String(id)); persistPreferences(); rebuild();
  };
  const clearAllNotifications = () => {
    notifications.forEach(n => storeRef.current.dismissed.add(String(n.id)));
    persistPreferences(); rebuild();
  };
  const handleNotificationClick = notification => {
    if (!notification.read) markAsRead(notification.id);
    // The parent supplies its existing investor application / calendar route.
    if (typeof onNotificationClick === "function") {
      onNotificationClick(notification); setShowNotifications(false);
    }
  };
  return (
    <div
      className="notifications-container investor-notifications"
      ref={notificationsRef}
    >
      <button
                type="button"
        className={`icon-button ${
          showNotifications
            ? "active"
            : ""
        }`}
        aria-expanded={showNotifications}
        aria-controls="investor-notifications-panel"
        onClick={() => {
          if (!showNotifications && markReadOnOpen) markAllAsRead();
          setShowNotifications(previous => !previous);
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
        <div id="investor-notifications-panel" className="dropdown-menu notifications-dropdown">
          <div className="dropdown-header">
            <h3>
              Notifications
            </h3>
            <div className="notification-actions">
              <button
                type="button"
                className="mark-read-button"
                onClick={
                  markAllAsRead
                }
              >
                <Check size={16} />
                Mark all as read
              </button>
              <button
                type="button"
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
          {listenerError && <p role="status" className="notification-load-error">{listenerError}</p>}
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
                      role="button"
                      tabIndex={0}
                      onKeyDown={event => {
                        if (event.target === event.currentTarget && ["Enter", " "].includes(event.key)) {
                          event.preventDefault(); handleNotificationClick(notification);
                        }
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
                              notification.title || style.title
                            }
                          </span>
                        </div>
                        <p className="notification-text">
                          {
                            formatMessage(notification)
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
                type="button"
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
      .investor-notifications .notification-status {
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
        .investor-notifications.notifications-container {
          position: relative;
          display: inline-block;
          margin-right: 15px;
        }
        .investor-notifications .icon-button {
          background: none;
          border: none;
          cursor: pointer;
          position: relative;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.3s;
          color: #333;
        }
        .investor-notifications .icon-button:hover {
          background-color: rgba(0, 0, 0, 0.05);
          transform: scale(1.1);
        }
        .investor-notifications .icon-button.active {
          background-color: rgba(0, 0, 0, 0.1);
        }
        .investor-notifications .notification-badge {
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
        .investor-notifications .dropdown-menu {
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
        .investor-notifications .dropdown-header {
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
        .investor-notifications .dropdown-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        .investor-notifications .notification-actions {
          display: flex;
          gap: 8px;
        }
        .investor-notifications .mark-read-button, .investor-notifications .clear-all-button {
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
        .investor-notifications .mark-read-button:hover, 
        .investor-notifications .clear-all-button:hover {
          background-color: #f5f5f5;
        }
        .investor-notifications .dropdown-divider {
          height: 1px;
          background-color: #eee;
          margin: 0;
        }
        .investor-notifications .notifications-list {
          max-height: 400px;
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        .investor-notifications .notification-item {
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
        .investor-notifications .notification-item.unread {
          background-color: #909090;
        }
        .investor-notifications .notification-item.read {
          background-color: #FFFFFF;
        }
        .investor-notifications .notification-item:hover {
          background-color: rgba(0, 0, 0, 0.02) !important;
        }
        .investor-notifications .notification-item.empty {
          justify-content: center;
          color: #888;
          padding: 20px;
          text-align: center;
          cursor: default;
          background: white !important;
        }
        .investor-notifications .notification-icon-container {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
        }
        .investor-notifications .notification-content {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        .investor-notifications .notification-header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        .investor-notifications .notification-title {
          font-weight: 600;
          font-size: 14px;
          color: #333;
        }
        .investor-notifications .notification-text {
          margin: 0 0 8px 0;
          font-size: 14px;
          line-height: 1.4;
          white-space: normal;
          word-wrap: break-word;
          color: #555;
        }
        .investor-notifications .notification-meta {
          display: flex;
          gap: 8px;
          font-size: 12px;
          color: #888;
          align-items: center;
          margin-top: 8px;
        }
        .investor-notifications .unread-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          background-color: #2196f3;
          border-radius: 50%;
          margin-left: 4px;
        }
        .investor-notifications .delete-notification {
          background: none;
          border: none;
          cursor: pointer;
          color: #888;
          padding: 0;
          margin-left: 8px;
          transition: color 0.2s;
          flex-shrink: 0;
        }
        .investor-notifications .delete-notification:hover {
          color: #ff4444;
        }
      
        .investor-notifications .dropdown-menu { width: min(420px, calc(100vw - 24px)); }
        .investor-notifications .dropdown-header { flex-wrap: wrap; gap: 10px; }
        .investor-notifications .notification-header { flex-wrap: wrap; }
        .investor-notifications .notification-item:focus-visible { outline: 2px solid #a67c52; outline-offset: -2px; }
        .investor-notifications .notification-load-error { margin: 0; padding: 12px 16px; color: #8a4a19; background: #fff8e6; font-size: 13px; }
`}</style>
    </div>
  );
};

// Existing positional arguments remain compatible with current application code.
export const addInvestorNotification = (message, type = "info", applicationId = null, companyName = null, timestamp = null) => {
  if (typeof window === "undefined" || typeof message !== "string") return;
  window.dispatchEvent(new CustomEvent("newInvestorNotification", {
    detail: { message, type, applicationId, companyName,
      timestamp: (toDate(timestamp) || new Date()).toISOString(),
      recipientId: auth.currentUser?.uid || null },
  }));
};
export default InvestorNotifications;
