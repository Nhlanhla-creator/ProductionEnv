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
  apiKey: "AIzaSyDfcXO4GbNdPFY7qGbjwH1z3A78FwXiFAE",
  authDomain: "tuts-7ea8c.firebaseapp.com",
  projectId: "tuts-7ea8c",
  storageBucket: "tuts-7ea8c.appspot.com",
  messagingSenderId: "546514581101",
  appId: "1:546514581101:web:a34e661b6cad46f01db164",
  measurementId: "G-LK13NE8TBS"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Get the app instance for modular functions
const app = firebase.app();

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