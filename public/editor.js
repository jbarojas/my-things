import { db, addDoc, collection, serverTimestamp, doc, getDoc, updateDoc, deleteDoc } from "./firebase-config.js?v=12";
import { auth, onAuthStateChanged, query, where, orderBy, onSnapshot } from "./firebase-config.js?v=12";
import "./auth-guard.js";

const catSelect = document.getElementById('catSelect');
const titleInput = document.getElementById('titleInput');
const noteInput = document.getElementById('noteInput');
const btnSave = document.getElementById('btnSave');
const btnDelete = document.getElementById('btnDelete');
const pageTitle = document.getElementById('pageTitle');

let currentUser = null;
let editingId = null;

// Parse URL params
const urlParams = new URLSearchParams(window.location.search);
const docId = urlParams.get('id');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        loadCategories();
        if (docId) {
            editingId = docId;
            pageTitle.textContent = "Editar Registro";
            btnDelete.classList.remove('hidden');
            await loadLogData(docId);
        }
    }
});

function loadCategories() {
    const qCats = query(collection(db, "categories"), where("uid", "==", currentUser.uid), orderBy("name"));
    onSnapshot(qCats, (snapshot) => {
        catSelect.innerHTML = '<option value="" disabled selected>Selecciona categoría...</option>';
        snapshot.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = data.name;
            option.textContent = data.name;
            catSelect.appendChild(option);
        });
    });
}

async function loadLogData(id) {
    try {
        const docRef = doc(db, "logs", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            // Security check
            if (data.uid !== currentUser.uid) {
                alert("No tienes permiso.");
                window.location.href = 'index.html';
                return;
            }
            catSelect.value = data.category;
            titleInput.value = data.title || '';
            noteInput.value = data.content;
            btnSave.textContent = "Actualizar";
        } else {
            alert("No encontrado.");
            window.location.href = 'index.html';
        }
    } catch (e) {
        console.error(e);
    }
}

btnSave.addEventListener('click', async () => {
    const category = catSelect.value;
    const title = titleInput.value.trim();
    const content = noteInput.value.trim();

    if (!category || !content) {
        alert("Faltan datos.");
        return;
    }

    try {
        if (editingId) {
            await updateDoc(doc(db, "logs", editingId), {
                category, title, content, updatedAt: serverTimestamp()
            });
        } else {
            await addDoc(collection(db, "logs"), {
                uid: currentUser.uid,
                category, title, content,
                date: serverTimestamp(),
                dateStr: new Date().toLocaleDateString()
            });
        }
        window.location.href = 'index.html';
    } catch (e) {
        console.error(e);
        alert("Error: " + e.message);
    }
});

btnDelete.addEventListener('click', async () => {
    if (!confirm("¿Eliminar para siempre?")) return;
    try {
        await deleteDoc(doc(db, "logs", editingId));
        window.location.href = 'index.html';
    } catch (e) {
        console.error(e);
    }
});
