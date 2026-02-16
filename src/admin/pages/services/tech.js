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

const TECH_COLLECTION = 'tech_content';

/**
 * Get current user
 */
const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
};

/**
 * Generate document ID from path
 */
const getDocId = (userId, path) => {
  return `${userId}_${path.join('_').toLowerCase().replace(/\s+/g, '_')}`;
};

/**
 * Upload file
 */
export const uploadFile = async (path, file) => {
  try {
    const user = getCurrentUser();
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `tech/${user.uid}/${path.join('/')}/${fileName}`;
    
    const fileRef = storageRef(storage, filePath);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);

    const docId = getDocId(user.uid, path);
    const docRef = doc(db, TECH_COLLECTION, docId);

    const data = {
      userId: user.uid,
      path: path,
      type: 'file',
      files: [{
        name: file.name,
        url: downloadURL,
        storagePath: filePath,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString()
      }],
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    await setDoc(docRef, data, { merge: true });
    console.log('✅ Uploaded tech file:', file.name);
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    throw error;
  }
};

/**
 * Add file to existing collection
 */
export const addFileToCollection = async (path, file) => {
  try {
    const user = getCurrentUser();
    const docId = getDocId(user.uid, path);
    const docRef = doc(db, TECH_COLLECTION, docId);

    const docSnap = await getDoc(docRef);
    const existingFiles = docSnap.exists() ? docSnap.data().files || [] : [];

    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `tech/${user.uid}/${path.join('/')}/${fileName}`;
    
    const fileRef = storageRef(storage, filePath);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);

    const newFile = {
      name: file.name,
      url: downloadURL,
      storagePath: filePath,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString()
    };

    const updatedFiles = [...existingFiles, newFile];

    await setDoc(docRef, {
      userId: user.uid,
      path: path,
      type: 'file',
      files: updatedFiles,
      updatedAt: serverTimestamp(),
      createdAt: docSnap.exists() ? docSnap.data().createdAt : serverTimestamp()
    }, { merge: true });

    console.log('✅ Added tech file to collection:', file.name);
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('❌ Error adding file:', error);
    throw error;
  }
};

/**
 * Delete file from collection
 */
export const deleteFile = async (path, fileIndex) => {
  try {
    const user = getCurrentUser();
    const docId = getDocId(user.uid, path);
    const docRef = doc(db, TECH_COLLECTION, docId);

    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }

    const files = docSnap.data().files || [];
    const fileToDelete = files[fileIndex];

    if (!fileToDelete) {
      throw new Error('File not found');
    }

    const fileRef = storageRef(storage, fileToDelete.storagePath);
    await deleteObject(fileRef);

    const updatedFiles = files.filter((_, index) => index !== fileIndex);

    await setDoc(docRef, {
      files: updatedFiles,
      updatedAt: serverTimestamp()
    }, { merge: true });

    console.log('✅ Deleted tech file:', fileToDelete.name);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    throw error;
  }
};

/**
 * Load content by path
 */
export const loadContent = async (path) => {
  try {
    const user = getCurrentUser();
    const docId = getDocId(user.uid, path);
    const docRef = doc(db, TECH_COLLECTION, docId);

    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('✅ Loaded tech content:', path.join(' > '));
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt)
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Error loading content:', error);
    throw error;
  }
};

/**
 * Load all content for user
 */
export const loadAllContent = async () => {
  try {
    const user = getCurrentUser();
    const contentRef = collection(db, TECH_COLLECTION);
    const q = query(contentRef, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);

    const content = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const pathKey = data.path.join(' > ');
      content[pathKey] = {
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt)
      };
    });

    console.log('✅ Loaded all tech content:', Object.keys(content).length);
    return content;
  } catch (error) {
    console.error('❌ Error loading all content:', error);
    throw error;
  }
};

/**
 * Delete content by path
 */
export const deleteContent = async (path) => {
  try {
    const user = getCurrentUser();
    const docId = getDocId(user.uid, path);
    const docRef = doc(db, TECH_COLLECTION, docId);

    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().type === 'file') {
      const files = docSnap.data().files || [];
      for (const file of files) {
        const fileRef = storageRef(storage, file.storagePath);
        await deleteObject(fileRef).catch(err => console.warn('File already deleted:', err));
      }
    }

    await deleteDoc(docRef);
    console.log('✅ Deleted tech content:', path.join(' > '));
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting content:', error);
    throw error;
  }
};