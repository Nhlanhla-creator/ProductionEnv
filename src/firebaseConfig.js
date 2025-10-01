// Import Firebase
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import { getAuth,  } from 'firebase/auth';
import 'firebase/compat/functions'; 
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { initializeApp } from 'firebase/app';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBeidLheVERNRY4ZCzzw4NiQVjj9y2nIUU",
  authDomain: "production-environment-cf7da.firebaseapp.com",
  projectId: "production-environment-cf7da",
  storageBucket: "production-environment-cf7da.firebasestorage.app",
  messagingSenderId: "231695604224",
  appId: "1:231695604224:web:3bc3f9ef8acd92a5f8d6e5",
  measurementId: "G-QR0VH648XY"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const app = initializeApp(firebaseConfig);
// Export Firebase services
const functions = getFunctions(app, 'us-central1');
if (window.location.hostname === 'localhost') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.log('Using Firebase Functions emulator');
}

if(process.env.NODE_ENV === "development"){
 
  connectFunctionsEmulator(getFunctions(app),"localhost",5001)
}

// Export Firebase services
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Export Firebase authentication functions
const createUserWithEmailAndPassword = (auth, email, password) => {
  return auth.createUserWithEmailAndPassword(email, password);
};

const signInWithEmailAndPassword = (auth, email, password) => {
  return auth.signInWithEmailAndPassword(email, password);
};

const sendEmailVerification = (user) => {
  return user.sendEmailVerification();
};


// Export Firestore functions
const doc = (db, collection, id) => {
  return db.collection(collection).doc(id);
};

const setDoc = (docRef, data, options) => {
  if (options && options.merge) {
    return docRef.set(data, { merge: true });
  }
  return docRef.set(data);
};

const getDoc = async (docRef) => {
  const snapshot = await docRef.get();
  return {
    exists: () => snapshot.exists,
    data: () => snapshot.data()
  };
};

// Export Storage functions
const ref = (storage, path) => {
  return storage.ref(path);
};

const uploadBytes = (storageRef, file) => {
  return storageRef.put(file);
};

const getDownloadURL = (storageRef) => {
  return storageRef.getDownloadURL();
};

export {
  functions,
  firebase,
  db,
  auth,
  storage,
  doc,
  setDoc,
  getDoc,
  ref,
  uploadBytes,
  getDownloadURL,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification
};