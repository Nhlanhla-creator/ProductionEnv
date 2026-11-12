// firebaseConfig.js
// Firebase Configuration — Unified Compat + Modular Setup
//
// Initializes Firebase ONCE and exposes BOTH:
//   - Compat API    (`firebase.auth()`, `firebase.firestore()`, ...) for legacy call sites
//   - Modular API   (`auth`, `db`, `storage`, `functions`) for the modern SDK
//
// Both APIs share the SAME underlying app instance, so reads/writes via either
// view land in the same Firestore / Storage / Auth backend.

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/functions';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// ── Environment-specific configs ──────────────────────────────────────────
const devConfig = {
  apiKey: "AIzaSyDfcXO4GbNdPFY7qGbjwH1z3A78FwXiFAE",
  authDomain: "tuts-7ea8c.firebaseapp.com",
  projectId: "tuts-7ea8c",
  storageBucket: "tuts-7ea8c.appspot.com",
  messagingSenderId: "546514581101",
  appId: "1:546514581101:web:a34e661b6cad46f01db164",
  measurementId: "G-LK13NE8TBS"
};

const prodConfig = {
  apiKey: "AIzaSyBeidLheVERNRY4ZCzzw4NiQVjj9y2nIUU",
  authDomain: "production-environment-cf7da.firebaseapp.com",
  projectId: "production-environment-cf7da",
  storageBucket: "production-environment-cf7da.firebasestorage.app",
  messagingSenderId: "231695604224",
  appId: "1:231695604224:web:3bc3f9ef8acd92a5f8d6e5",
  measurementId: "G-QR0VH648XY"
};

// ── Environment detection ─────────────────────────────────────────────────
const isProdDomain =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'www.bigmarketplace.africa' ||
    window.location.hostname === 'bigmarketplace.africa' ||
    window.location.hostname === 'production-environment-cf7da.firebaseapp.com' ||
    window.location.hostname.endsWith('.africa'));

const firebaseConfig = isProdDomain ? prodConfig : devConfig;

// ── Initialize (idempotent) ───────────────────────────────────────────────
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const app = firebase.app();

// ── Modular Functions instance (region-pinned) ────────────────────────────
const functions = getFunctions(app, 'us-central1');

// ── Emulator wiring (localhost only) ──────────────────────────────────────
// Guarding on hostname === 'localhost' avoids the "works on my machine" bug
// where a LAN device or a preview deploy runs with NODE_ENV=development and
// tries to reach its own localhost:5001, which silently fails.
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('[Firebase] Connected to Functions emulator at localhost:5001');
  } catch (err) {
    console.warn('[Firebase] Could not connect to Functions emulator:', err?.message);
  }
}

// ── Compat services ───────────────────────────────────────────────────────
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// ── Compat auth helpers ───────────────────────────────────────────────────
const createUserWithEmailAndPassword = (authInstance, email, password) =>
  authInstance.createUserWithEmailAndPassword(email, password);

const signInWithEmailAndPassword = (authInstance, email, password) =>
  authInstance.signInWithEmailAndPassword(email, password);

const sendEmailVerification = (user) => user.sendEmailVerification();

const sendPasswordResetEmail = (authInstance, email) =>
  authInstance.sendPasswordResetEmail(email);

// ── Compat Firestore shims ────────────────────────────────────────────────
// Retained for backward compatibility. Modern call sites should use the
// modular API directly: `import { doc, getDoc } from 'firebase/firestore';`
const doc = (dbInstance, collection, id) => dbInstance.collection(collection).doc(id);

const setDoc = (docRef, data, options) => {
  if (options && options.merge) return docRef.set(data, { merge: true });
  return docRef.set(data);
};

const getDoc = async (docRef) => {
  const snapshot = await docRef.get();
  return { exists: () => snapshot.exists, data: () => snapshot.data() };
};

// ── Compat Storage shims ──────────────────────────────────────────────────
const ref = (storageInstance, path) => storageInstance.ref(path);
const uploadBytes = (storageRef, file) => storageRef.put(file);
const getDownloadURL = (storageRef) => storageRef.getDownloadURL();

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
  sendEmailVerification,
  sendPasswordResetEmail,
  firebaseConfig,
};