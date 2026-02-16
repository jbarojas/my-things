import { auth, onAuthStateChanged } from "./firebase-config.js?v=12";

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'login.html';
    }
});
