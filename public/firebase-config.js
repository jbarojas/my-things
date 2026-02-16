// Import functions from Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, updateDoc, doc, where, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDTgg6115ETHggLyPcrKbfpT7qr1gwhuIA",
    authDomain: "my-things-10a65.firebaseapp.com",
    projectId: "my-things-10a65",
    storageBucket: "my-things-10a65.firebasestorage.app",
    messagingSenderId: "G-0RD1TPRHEL",
    appId: "1:1067529814794:web:19040e252963543151f0f3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Prevent double initialization if module is re-imported
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export { auth, db, provider, signInWithPopup, signOut, onAuthStateChanged, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, updateDoc, doc, where, getDoc };
