import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Custom hook for notifications.
 *
 * Notifications ARE messages: this reads the same "messages" collection
 * useMessages() reads, filtered to whatever's addressed to this user via
 * `to == user.uid`. Read/unread state lives on the message doc itself in
 * Firestore (the `read` field), not in localStorage — so it's consistent
 * across every device/session for this user, not just the current browser.
 */
export const useNotifications = (user) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'messages'),
      where('to', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs
        // A user's own "sent" copies are addressed to the recipient, not to
        // themselves, so this should never match — filtered anyway as a
        // safety net in case that ever changes.
        .filter((docSnap) => docSnap.data().type !== 'sent')
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(async (id) => {
    try {
      await updateDoc(doc(db, 'messages', id), { read: true });
    } catch (err) {
      console.error('Could not mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(db);
      unread.forEach((n) => batch.update(doc(db, 'messages', n.id), { read: true }));
      await batch.commit();
    } catch (err) {
      console.error('Could not mark all notifications as read:', err);
    }
  }, [notifications]);

  const isRead = useCallback(
    (id) => {
      const match = notifications.find((n) => n.id === id);
      return match ? !!match.read : true;
    },
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isRead,
  };
};