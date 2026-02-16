import { auth, provider, signInWithPopup, onAuthStateChanged } from "./firebase-config.js";

const btnLogin = document.getElementById('btnLogin');
const errorMsg = document.getElementById('errorMsg');

// Check if already logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = 'index.html';
    }
});

btnLogin.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, provider);
        // Redirect handled by onAuthStateChanged
    } catch (error) {
        console.error(error);
        errorMsg.textContent = "Error al iniciar sesión: " + error.message;
        errorMsg.classList.remove('hidden');
    }
});
