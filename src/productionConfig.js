import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBeidLheVERNRY4ZCzzw4NiQVjj9y2nIUU",
  authDomain: "production-environment-cf7da.firebaseapp.com",
  projectId: "production-environment-cf7da",
  storageBucket: "production-environment-cf7da.firebasestorage.app",
  messagingSenderId: "231695604224",
  appId: "1:231695604224:web:3bc3f9ef8acd92a5f8d6e5",
  measurementId: "G-QR0VH648XY"
};
// Initialize Firebase with a different name to avoid conflicts
export const productionApp = initializeApp(firebaseConfig, 'production-app');