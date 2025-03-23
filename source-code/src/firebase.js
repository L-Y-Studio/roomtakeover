import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCVpgBDja7I5dqb513RP4NFSEGp6DWChxk",
  authDomain: "roomtakeover-9e23b.firebaseapp.com",
  projectId: "roomtakeover-9e23b",
  storageBucket: "roomtakeover-9e23b.appspot.com",
  messagingSenderId: "709390949285",
  appId: "1:709390949285:web:c1b9916944da1ab699264c",
  measurementId: "G-BPT445G7BF",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Google Sign-In function
const signInWithGoogle = () => {
  signInWithPopup(auth, provider)
    .then((result) => console.log("User signed in:", result.user))
    .catch((error) => console.error("Sign-in error:", error));
};

export { db, auth, signInWithGoogle };
