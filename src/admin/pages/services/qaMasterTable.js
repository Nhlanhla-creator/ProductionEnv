// qa-components/qaTableFirebaseService.js
import { db, auth } from '../../../firebaseConfig';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { INITIAL_QA_TASKS } from '../structure/qaTableData';

const QA_TABLE_DOC = 'qa_master_table';

const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user;
};

/**
 * Load QA master table for current user.
 * Falls back to initial static data if none exists yet.
 */
export const loadQATable = async () => {
  try {
    const user = getCurrentUser();
    const docRef = doc(db, QA_TABLE_DOC, user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.tasks;
    }

    // First time – seed with static data and persist
    await setDoc(docRef, {
      userId: user.uid,
      tasks: INITIAL_QA_TASKS,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return INITIAL_QA_TASKS;
  } catch (error) {
    console.error('❌ Error loading QA table:', error);
    throw error;
  }
};

/**
 * Persist full tasks array back to Firestore (full-replace strategy).
 * Call this after any add / update / delete.
 */
export const saveQATable = async (tasks) => {
  try {
    const user = getCurrentUser();
    const docRef = doc(db, QA_TABLE_DOC, user.uid);
    await setDoc(docRef, {
      userId: user.uid,
      tasks,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving QA table:', error);
    throw error;
  }
};