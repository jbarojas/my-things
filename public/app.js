import { auth, db, signOut, onAuthStateChanged, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, updateDoc, doc, where } from "./firebase-config.js";

console.log("App v9 Loaded - Multi-Screen");

// UI Config
const catInput = document.getElementById('catInput');
const btnAddCat = document.getElementById('btnAddCat');
const catSelect = document.getElementById('catSelect');
const titleInput = document.getElementById('titleInput');
const noteInput = document.getElementById('noteInput');
const btnSave = document.getElementById('btnSave');
const logList = document.getElementById('logList');
const filterCat = document.getElementById('filterCat');
const btnInstall = document.getElementById('btnInstall');
const btnLogout = document.getElementById('btnLogout');

let editingId = null;
let deferredPrompt;
let currentUser = null;
let unsubLogs = null;
let unsubCats = null;

// Auth Logic
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("User logged in:", user.email);
        initApp();
    } else {
        console.log("User not logged in, redirecting...");
        window.location.href = 'login.html';
    }
});

// Logout
btnLogout.addEventListener('click', async () => {
    await signOut(auth);
});

// PWA Install
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    btnInstall.classList.remove('hidden');
});

btnInstall.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    deferredPrompt = null;
    btnInstall.classList.add('hidden');
});

// --- App Logic ---

function initApp() {
    // 1. Categories
    // For now global categories to keep it simple, or user specific?
    // Let's make them user specific too for privacy.
    const qCats = query(collection(db, "categories"), where("uid", "==", currentUser.uid), orderBy("name"));

    unsubCats = onSnapshot(qCats, (snapshot) => {
        catSelect.innerHTML = '<option value="" disabled selected>Selecciona una...</option>';
        filterCat.innerHTML = '<option value="all">Todas las categorías</option>';

        snapshot.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = data.name;
            option.textContent = data.name;
            catSelect.appendChild(option);

            const filterOption = option.cloneNode(true);
            filterCat.appendChild(filterOption);
        });
    }, (error) => {
        // Index required handling
        console.error("Error cats:", error);
    });

    // 2. Add Category
    btnAddCat.addEventListener('click', async () => {
        const name = catInput.value.trim();
        if (!name) return;

        try {
            await addDoc(collection(db, "categories"), {
                name: name,
                uid: currentUser.uid,
                createdAt: serverTimestamp()
            });
            catInput.value = '';
            alert('Categoría creada');
        } catch (e) {
            console.error("Error al crear categoría: ", e);
        }
    });

    // 3. Logs
    const qLogs = query(collection(db, "logs"), where("uid", "==", currentUser.uid), orderBy("date", "desc"));

    unsubLogs = onSnapshot(qLogs, (snapshot) => {
        currentSnapshot = snapshot;
        renderLogs();
    }, (error) => {
        console.error("Error logs:", error);
        logList.innerHTML = `<p class="text-red-500 text-center">Error cargando datos. Puede que falte un índice compuesto. Abre la consola.</p>`;
    });
}

// 4. Render Logs
let currentSnapshot = [];

const renderLogs = () => {
    logList.innerHTML = '';
    const selectedFilter = filterCat.value;

    if (currentSnapshot.empty) {
        logList.innerHTML = '<p class="text-center text-gray-500">No hay registros aún.</p>';
        return;
    }

    currentSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const id = docSnap.id;

        if (selectedFilter !== 'all' && data.category !== selectedFilter) return;

        const card = document.createElement('div');
        card.className = "bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 flex flex-col gap-2";

        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const titleHtml = data.title ? `<h3 class="font-bold text-gray-900 text-lg leading-tight mb-1">${data.title}</h3>` : '';
        let contentHtml = `<p class="text-gray-800 whitespace-pre-wrap">${data.content}</p>`;

        let linkBtn = '';
        const match = data.content.match(urlRegex);
        if (match) {
            if (data.content.trim() === match[0] || data.content.length < match[0].length + 5) {
                contentHtml = '';
            }
            linkBtn = `<a href="${match[0]}" target="_blank" class="block mt-2 text-center bg-blue-50 text-blue-600 border border-blue-200 py-1 rounded text-sm hover:bg-blue-100">
                🔗 Abrir Enlace
             </a>`;
        }

        const actions = `
            <div class="flex justify-end gap-2 mt-2 border-t pt-2">
                <button class="btn-edit text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200" data-id="${id}">Editar</button>
                <button class="btn-delete text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200" data-id="${id}">Eliminar</button>
            </div>
        `;

        card.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">${data.category}</span>
                <span class="text-xs text-gray-400">${data.date ? data.date.toDate().toLocaleString() : 'Reciente'}</span>
            </div>
            ${titleHtml}
            ${contentHtml}
            ${linkBtn}
            ${actions}
        `;
        logList.appendChild(card);
    });

    // Event Listeners (Edit/Delete)
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const docObj = currentSnapshot.docs.find(d => d.id === id);
            if (docObj) {
                const data = docObj.data();
                editingId = id;
                catSelect.value = data.category;
                titleInput.value = data.title || '';
                noteInput.value = data.content;
                btnSave.textContent = "Actualizar Registro";
                btnSave.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                btnSave.classList.add('bg-green-600', 'hover:bg-green-700');
                titleInput.focus();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!confirm('¿Seguro que quieres eliminar este registro?')) return;
            const id = e.target.getAttribute('data-id');
            try {
                await deleteDoc(doc(db, "logs", id));
            } catch (err) {
                console.error('Error eliminando:', err);
                alert('No se pudo eliminar');
            }
        });
    });
};

filterCat.addEventListener('change', renderLogs);

// 5. Save/Update Log
btnSave.addEventListener('click', async () => {
    const category = catSelect.value;
    const title = titleInput.value.trim();
    const content = noteInput.value.trim();

    if (!category || !content) {
        alert("Por favor selecciona una categoría y escribe algo.");
        return;
    }

    try {
        if (editingId) {
            await updateDoc(doc(db, "logs", editingId), {
                category: category,
                title: title,
                content: content,
                updatedAt: serverTimestamp()
            });
            editingId = null;
            btnSave.textContent = "Guardar Entrada";
            btnSave.classList.remove('bg-green-600', 'hover:bg-green-700');
            btnSave.classList.add('bg-blue-600', 'hover:bg-blue-700');
            alert('Registro actualizado');
        } else {
            await addDoc(collection(db, "logs"), {
                uid: currentUser.uid,
                category: category,
                title: title,
                content: content,
                date: serverTimestamp(),
                dateStr: new Date().toLocaleDateString()
            });
            alert('Registro guardado');
        }
        titleInput.value = '';
        noteInput.value = '';
    } catch (e) {
        console.error("Error al guardar/actualizar: ", e);
        alert("Error al guardar: " + e.message);
    }
});