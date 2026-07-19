import { useState, useEffect, useCallback, useRef } from 'react';
import { subscribeToNotifications } from '../admin/pages/services/notifications';

const STORAGE_KEY = 'qa_read_notification_ids';

/**
 * Read the set of notification IDs that this browser session has marked read.
 */
const getReadIds = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

/**
 * Persist read IDs to localStorage.
 */
const persistReadIds = (ids) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch (err) {
    console.warn('Could not persist read IDs:', err);
  }
};

/**
 * Custom hook for cross-session notifications.
 *
 * Notifications live in Firestore (shared across all sessions).
 * Read/unread state is tracked per-device in localStorage so
 * each session's badge is independent.
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => getReadIds());
  const unsubRef = useRef(null);

  // Subscribe to Firestore notifications
  useEffect(() => {
    unsubRef.current = subscribeToNotifications((notifs) => {
      setNotifications(notifs);
    });

    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  // Derived unread count
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  // Mark a single notification as read (localStorage only)
  const markAsRead = useCallback((id) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      persistReadIds(next);
      return next;
    });
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setReadIds(() => {
      const next = new Set(notifications.map(n => n.id));
      persistReadIds(next);
      return next;
    });
  }, [notifications]);

  // Check if a specific notification is read
  const isRead = useCallback((id) => readIds.has(id), [readIds]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isRead,
  };
};
