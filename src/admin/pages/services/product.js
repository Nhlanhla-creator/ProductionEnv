import { db, auth, storage } from '../../../firebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

const PRODUCT_COLLECTION = 'product_content';

const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user;
};

/**
 * FIX: Use | as separator so path segments with spaces/underscores never collide.
 * e.g. ["1_Product Modules", "BIG Score"] → "uid_1_product_modules|big_score"
 */
const getDocId = (userId, path) => {
  const sanitized = path.map(s => s.toLowerCase().replace(/\s+/g, '_')).join('|');
  return `${userId}_${sanitized}`;
};

/**
 * Upload file — always reads existing files first, then appends.
 * Replaces both the old uploadFile and addFileToCollection.
 */
export const uploadFile = async (path, file) => {
  try {
    const user = getCurrentUser();
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storagePath = `product/${user.uid}/${path.map(s => s.replace(/\s+/g, '_')).join('/')}/${fileName}`;

    const fileRef = storageRef(storage, storagePath);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);

    const docId = getDocId(user.uid, path);
    const docRef = doc(db, PRODUCT_COLLECTION, docId);

    // Always read existing files before writing — never blindly overwrite
    const docSnap = await getDoc(docRef);
    const existingFiles = docSnap.exists() ? docSnap.data().files || [] : [];

    const newFile = {
      name: file.name,
      url: downloadURL,
      storagePath,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString()
    };

    await setDoc(docRef, {
      userId: user.uid,
      path,
      type: 'file',
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

/**
 * Delete a single file from a path's collection.
 */
export const deleteFile = async (path, fileIndex) => {
  try {
    const user = getCurrentUser();
    const docId = getDocId(user.uid, path);
    const docRef = doc(db, PRODUCT_COLLECTION, docId);

    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Document not found');

    const files = docSnap.data().files || [];
    const fileToDelete = files[fileIndex];
    if (!fileToDelete) throw new Error('File not found');

    // Delete from storage
    const fileRef = storageRef(storage, fileToDelete.storagePath);
    await deleteObject(fileRef);

    const updatedFiles = files.filter((_, i) => i !== fileIndex);

    if (updatedFiles.length === 0) {
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

/**
 * Load content by path.
 */
export const loadContent = async (path) => {
  try {
    const user = getCurrentUser();
    const docId = getDocId(user.uid, path);
    const docRef = doc(db, PRODUCT_COLLECTION, docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

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

/**
 * Load all content for the current user.
 */
export const loadAllContent = async () => {
  try {
    const user = getCurrentUser();
    const contentRef = collection(db, PRODUCT_COLLECTION);
    const q = query(contentRef, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);

    const content = {};
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const pathKey = data.path.join(' > ');
      // Only mark as having content if there are actual files
      if (!data.files || data.files.length === 0) return;
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

/**
 * Delete all content (files + Firestore doc) for a path.
 */
export const deleteContent = async (path) => {
  try {
    const user = getCurrentUser();
    const docId = getDocId(user.uid, path);
    const docRef = doc(db, PRODUCT_COLLECTION, docId);

    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const files = docSnap.data().files || [];
      for (const file of files) {
        const fileRef = storageRef(storage, file.storagePath);
        await deleteObject(fileRef).catch(err => console.warn('File already deleted:', err));
      }
    }

    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting content:', error);
    throw error;
  }
};