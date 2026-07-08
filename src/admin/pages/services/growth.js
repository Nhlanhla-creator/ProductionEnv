import { db, auth, storage } from '../../../firebaseConfig';
import { collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const COLLECTION = 'growth_content';
const STRUCTURE_COLLECTION = 'growth_structure';

const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user;
};

// FIX: | separator prevents path segment collisions
const getDocId = (userId, path) => {
  const sanitized = path.map(s => s.toLowerCase().replace(/\s+/g, '_')).join('|');
  return `${userId}_${sanitized}`;
};

export const saveTextContent = async (path, content) => {
  try {
    const user = getCurrentUser();
    const docId = getDocId(user.uid, path);
    const docRef = doc(db, COLLECTION, docId);
    await setDoc(docRef, {
      userId: user.uid, path, type: 'text', content,
      updatedAt: serverTimestamp(), createdAt: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving text content:', error);
    throw error;
  }
};

// FIX: always reads existing files before writing — never blindly overwrites
export const uploadFile = async (path, file) => {
  try {
    const user = getCurrentUser();
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storagePath = `growth/${user.uid}/${path.map(s => s.replace(/\s+/g, '_')).join('/')}/${fileName}`;

    const fileRef = storageRef(storage, storagePath);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);

    const docId = getDocId(user.uid, path);
    const docRef = doc(db, COLLECTION, docId);

    const docSnap = await getDoc(docRef);
    const existingFiles = docSnap.exists() ? docSnap.data().files || [] : [];

    const newFile = {
      name: file.name, url: downloadURL, storagePath,
      size: file.size, mimeType: file.type,
      uploadedAt: new Date().toISOString()
    };

    await setDoc(docRef, {
      userId: user.uid, path, type: 'file',
      files: [...existingFiles, newFile],
      updatedAt: serverTimestamp(),
      createdAt: docSnap.exists() ? docSnap.data().createdAt : serverTimestamp()
    });

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    throw error;
  }
};

export const deleteFile = async (path, fileIndex) => {
  try {
    const user = getCurrentUser();
    const docId = getDocId(user.uid, path);
    const docRef = doc(db, COLLECTION, docId);

    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Document not found');

    const files = docSnap.data().files || [];
    const fileToDelete = files[fileIndex];
    if (!fileToDelete) throw new Error('File not found');

    await deleteObject(storageRef(storage, fileToDelete.storagePath));

    const updatedFiles = files.filter((_, i) => i !== fileIndex);

    if (updatedFiles.length === 0) {
      // No files left — delete the document entirely so no empty ghost remains
      await deleteDoc(docRef);
    } else {
      await setDoc(docRef, {
        files: updatedFiles,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    throw error;
  }
};

export const loadContent = async (path) => {
  try {
    const user = getCurrentUser();
    const docId = getDocId(user.uid, path);
    const docRef = doc(db, COLLECTION, docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Automatic migration:
      // If we are loading Growth > Business Development > Target List > Corporate or Government,
      // check if they exist under the old paths in partners_content
      const pathString = path.join(' > ');
      if (pathString === 'Business Development > Target List > Corporate' || pathString === 'Business Development > Target List > Government') {
        const oldPath = pathString.endsWith('Corporate') ? ['Corporates ESD'] : ['Government'];
        // Sanitize old path
        const oldSanitized = oldPath.map(s => s.toLowerCase().replace(/\s+/g, '_')).join('|');
        const oldDocId = `${user.uid}_${oldSanitized}`;
        const oldDocRef = doc(db, 'partners_content', oldDocId);
        const oldDocSnap = await getDoc(oldDocRef);
        if (oldDocSnap.exists()) {
          const oldData = oldDocSnap.data();
          // Write migrated doc to growth_content
          const migratedData = {
            userId: user.uid,
            path,
            type: 'table',
            tableData: oldData.tableData || null,
            createdAt: oldData.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          await setDoc(docRef, migratedData);
          // Delete old document to clean up partners_content
          try {
            await deleteDoc(oldDocRef);
            console.log(`Successfully migrated and deleted old document at ${oldDocId}`);
          } catch (delErr) {
            console.warn('Failed to delete old document after migration:', delErr);
          }
          return {
            ...migratedData,
            createdAt: migratedData.createdAt?.toDate?.() || new Date(migratedData.createdAt),
            updatedAt: migratedData.updatedAt?.toDate?.() || new Date(migratedData.updatedAt)
          };
        }
      }
      return null;
    }

    const data = docSnap.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt)
    };
  } catch (error) {
    console.error('❌ Error loading content:', error);
    throw error;
  }
};

export const loadAllContent = async () => {
  try {
    const user = getCurrentUser();
    const q = query(collection(db, COLLECTION), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);

    const content = {};
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const pathKey = data.path.join(' > ');
      // Only mark as having content if there are actual files or table data
      if ((!data.files || data.files.length === 0) && data.type !== 'table') return;
      content[pathKey] = {
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt)
      };
    });

    return content;
  } catch (error) {
    console.error('❌ Error loading all content:', error);
    throw error;
  }
};

export const deleteContent = async (path) => {
  try {
    const user = getCurrentUser();
    const docId = getDocId(user.uid, path);
    const docRef = doc(db, COLLECTION, docId);

    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const files = docSnap.data().files || [];
      for (const file of files) {
        await deleteObject(storageRef(storage, file.storagePath))
          .catch(err => console.warn('File already deleted:', err));
      }
    }

    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting content:', error);
    throw error;
  }
};

export const saveTableContent = async (path, tableData) => {
  try {
    const user = getCurrentUser();
    const docId = getDocId(user.uid, path);
    const docRef = doc(db, COLLECTION, docId);
    
    // Check if doc exists to preserve createdAt
    const docSnap = await getDoc(docRef);
    
    await setDoc(docRef, {
      userId: user.uid,
      path,
      type: 'table',
      tableData,
      updatedAt: serverTimestamp(),
      createdAt: docSnap.exists() ? docSnap.data().createdAt : serverTimestamp()
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving table content:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// User-custom structure (folders/file entries created on the frontend)
// Stored at growth_structure/{userId} so it stays separate from uploaded
// content documents and never collides with growth_content.
// ---------------------------------------------------------------------------

export const loadUserStructure = async () => {
  try {
    const user = getCurrentUser();
    const docRef = doc(db, STRUCTURE_COLLECTION, user.uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return {};
    return docSnap.data().structure || {};
  } catch (error) {
    console.error('❌ Error loading user structure:', error);
    return {};
  }
};

export const saveUserStructure = async (structure) => {
  try {
    const user = getCurrentUser();
    const docRef = doc(db, STRUCTURE_COLLECTION, user.uid);
    await setDoc(docRef, {
      userId: user.uid,
      structure: structure || {},
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving user structure:', error);
    throw error;
  }
};

export const subscribeToContent = (path, callback) => {
  try {
    const user = getCurrentUser();
    const docId = getDocId(user.uid, path);
    const docRef = doc(db, COLLECTION, docId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt)
        });
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('❌ Error in content subscription:', error);
    });

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error subscribing to content:', error);
    throw error;
  }
};