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

const REPORTS_COLLECTION = 'reports_content';

const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user;
};

const getDocId = (userId, path) => {
  return `${userId}_${path.join('_').toLowerCase().replace(/\s+/g, '_')}`;
};

export const uploadFile = async (path, file) => {
  try {
    const user = getCurrentUser();
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `reports/${user.uid}/${path.join('/')}/${fileName}`;
    
    const fileRef = storageRef(storage, filePath);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);

    const docId = getDocId(user.uid, path);
    const docRef = doc(db, REPORTS_COLLECTION, docId);

    await setDoc(docRef, {
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
    }, { merge: true });

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    throw error;
  }
};

export const addFileToCollection = async (path, file) => {
  try {
    const user = getCurrentUser();
    const docId = getDocId(user.uid, path);
    const docRef = doc(db, REPORTS_COLLECTION, docId);

    const docSnap = await getDoc(docRef);
    const existingFiles = docSnap.exists() ? docSnap.data().files || [] : [];

    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `reports/${user.uid}/${path.join('/')}/${fileName}`;
    
    const fileRef = storageRef(storage, filePath);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);

    const updatedFiles = [...existingFiles, {
      name: file.name,
      url: downloadURL,
      storagePath: filePath,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString()
    }];

    await setDoc(docRef, {
      userId: user.uid,
      path: path,
      type: 'file',
      files: updatedFiles,
      updatedAt: serverTimestamp(),
      createdAt: docSnap.exists() ? docSnap.data().createdAt : serverTimestamp()
    }, { merge: true });

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('❌ Error adding file:', error);
    throw error;
  }
};

export const deleteFile = async (path, fileIndex) => {
  try {
    const user = getCurrentUser();
    const docId = getDocId(user.uid, path);
    const docRef = doc(db, REPORTS_COLLECTION, docId);

    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Document not found');

    const files = docSnap.data().files || [];
    const fileToDelete = files[fileIndex];
    if (!fileToDelete) throw new Error('File not found');

    const fileRef = storageRef(storage, fileToDelete.storagePath);
    await deleteObject(fileRef);

    const updatedFiles = files.filter((_, index) => index !== fileIndex);

    await setDoc(docRef, {
      files: updatedFiles,
      updatedAt: serverTimestamp()
    }, { merge: true });

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
    const docRef = doc(db, REPORTS_COLLECTION, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
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

export const loadAllContent = async () => {
  try {
    const user = getCurrentUser();
    const contentRef = collection(db, REPORTS_COLLECTION);
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
    const docRef = doc(db, REPORTS_COLLECTION, docId);

    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().type === 'file') {
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