// ============================================================================
// NOTIFICATIONS SERVICE — Firestore-backed, cross-session notifications
// ============================================================================
import { db, auth } from '../../../firebaseConfig';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

const NOTIFICATIONS_COLLECTION = 'qa_notifications';

/**
 * Add a notification to the shared Firestore collection.
 * All admin sessions will pick this up via onSnapshot.
 */
export const addNotification = async (payload) => {
  try {
    const user = auth.currentUser;
    const docData = {
      ...payload,
      createdBy: user?.uid || 'system',
      createdByEmail: user?.email || 'system',
      timestamp: serverTimestamp(),
    };
    const colRef = collection(db, NOTIFICATIONS_COLLECTION);
    const docRef = await addDoc(colRef, docData);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error adding notification:', error);
    throw error;
  }
};

/**
 * Subscribe to the most recent notifications (real-time).
 * Returns an unsubscribe function.
 */
export const subscribeToNotifications = (callback, maxCount = 50) => {
  const colRef = collection(db, NOTIFICATIONS_COLLECTION);
  const q = query(colRef, orderBy('timestamp', 'desc'), limit(maxCount));

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore Timestamp to ISO string for display
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    callback(notifications);
  }, (error) => {
    console.error('❌ Notification subscription error:', error);
  });
};
