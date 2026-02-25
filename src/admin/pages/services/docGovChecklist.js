// services/docChecklist.js
import { db, auth } from '../../../firebaseConfig';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { INITIAL_DOC_CHECKLIST } from '../structure/docGovChecklistData';

const DOC_CHECKLIST_COLLECTION = 'doc_governance_checklist';

const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user;
};

/**
 * Load documentation checklist for current user.
 * Seeds with initial data on first load.
 */
export const loadDocChecklist = async () => {
  try {
    const user = getCurrentUser();
    const docRef = doc(db, DOC_CHECKLIST_COLLECTION, user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().items;
    }

    // First time – seed and persist
    await setDoc(docRef, {
      userId: user.uid,
      items: INITIAL_DOC_CHECKLIST,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return INITIAL_DOC_CHECKLIST;
  } catch (error) {
    console.error('❌ Error loading doc checklist:', error);
    throw error;
  }
};

/**
 * Persist full items array back to Firestore (full-replace strategy).
 */
export const saveDocChecklist = async (items) => {
  try {
    const user = getCurrentUser();
    const docRef = doc(db, DOC_CHECKLIST_COLLECTION, user.uid);
    await setDoc(docRef, {
      userId: user.uid,
      items,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving doc checklist:', error);
    throw error;
  }
};