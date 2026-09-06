import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// These values identify your Firebase project — they are NOT secrets.
// Real access control is enforced by Firestore security rules, not by
// hiding this config. See firestore.rules in the repo root.
const firebaseConfig = {
  apiKey: "AIzaSyBj6sma1uEQLwa_0D2SOwT3DY4mOJU0iz4",
  authDomain: "auren-cf66b.firebaseapp.com",
  projectId: "auren-cf66b",
  storageBucket: "auren-cf66b.firebasestorage.app",
  messagingSenderId: "103266986445",
  appId: "1:103266986445:web:fd0dced5a96ac0acc37c84",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
