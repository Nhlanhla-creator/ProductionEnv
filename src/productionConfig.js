import { initializeApp } from "firebase/app";

const firebaseConfig = {
 apiKey: "AIzaSyDuGP9j_51M32Z0_D0qFuSESHKNYZysp2Q",
  authDomain: "testing-a7872.firebaseapp.com",
  projectId: "testing-a7872",
  storageBucket: "testing-a7872.firebasestorage.app",
  messagingSenderId: "303661331014",
  appId: "1:303661331014:web:4e94dd6c70ddbfa2fc5047",
  measurementId: "G-7ZB2SW4S1T"
};
// Initialize Firebase with a different name to avoid conflicts
export const productionApp = initializeApp(firebaseConfig, 'production-app');