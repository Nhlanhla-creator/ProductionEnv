import { db, auth, storage } from '../../../firebaseConfig';
import { collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const COLLECTION = 'users_content';

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

// FIX: always reads existing files before writing — never blindly overwrites
export const uploadFile = async (path, file) => {
  try {
    const user = getCurrentUser();
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storagePath = `users/${user.uid}/${path.map(s => s.replace(/\s+/g, '_')).join('/')}/${fileName}`;

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

export const loadAllContent = async () => {
  try {
    const user = getCurrentUser();
    const q = query(collection(db, COLLECTION), where('userId', '==', user.uid));
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