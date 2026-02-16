import { db, addDoc, collection, serverTimestamp } from "./firebase-config.js?v=12";
import { auth, onAuthStateChanged } from "./firebase-config.js?v=12";
import "./auth-guard.js"; // Protect route

const catInput = document.getElementById('catInput');
const btnAddCat = document.getElementById('btnAddCat');

// Get current user (already guarded, but need uid)
let currentUser = null;
onAuthStateChanged(auth, (user) => {
    if (user) currentUser = user;
});

btnAddCat.addEventListener('click', async () => {
    const name = catInput.value.trim();
    if (!name) return;

    if (!currentUser) return; // Should not happen due to guard

    try {
        await addDoc(collection(db, "categories"), {
            name: name,
            uid: currentUser.uid,
            createdAt: serverTimestamp()
        });
        alert('Categoría creada');
        window.location.href = 'index.html'; // Return to home
    } catch (e) {
        console.error("Error al crear categoría: ", e);
        alert("Error: " + e.message);
    }
});
