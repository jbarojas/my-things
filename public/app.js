// Importar funciones de Firebase (versión Web Modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- PEGA AQUÍ TU CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyDTgg6115ETHggLyPcrKbfpT7qr1gwhuIA",
    authDomain: "my-things-10a65.firebaseapp.com",
    projectId: "my-things-10a65",
    storageBucket: "my-things-10a65.firebasestorage.app",
    messagingSenderId: "G-0RD1TPRHEL",
    appId: "1:1067529814794:web:19040e252963543151f0f3"
};

// Inicializar
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencias del DOM
const catInput = document.getElementById('catInput');
const btnAddCat = document.getElementById('btnAddCat');
const catSelect = document.getElementById('catSelect');
const noteInput = document.getElementById('noteInput');
const btnSave = document.getElementById('btnSave');
const logList = document.getElementById('logList');
const filterCat = document.getElementById('filterCat');
const btnInstall = document.getElementById('btnInstall');

// Variables de estado
let editingId = null;
let deferredPrompt;

// --- PWA INSTALL ---
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

// 1. Función: Crear Categoría
btnAddCat.addEventListener('click', async () => {
    const name = catInput.value.trim();
    if (!name) return;

    try {
        await addDoc(collection(db, "categories"), {
            name: name,
            createdAt: serverTimestamp()
        });
        catInput.value = '';
        alert('Categoría creada');
    } catch (e) {
        console.error("Error al crear categoría: ", e);
    }
});

// 2. Función: Cargar Categorías en el Select (Escucha en tiempo real)
onSnapshot(query(collection(db, "categories"), orderBy("name")), (snapshot) => {
    catSelect.innerHTML = '<option value="" disabled selected>Selecciona una...</option>';
    snapshot.forEach(doc => {
        const data = doc.data();
        const option = document.createElement('option');
        option.value = data.name; // Usamos el nombre como ID simple para este ejemplo
        option.textContent = data.name;
        catSelect.appendChild(option);

        // Poblar filtro también
        const filterOption = option.cloneNode(true);
        filterCat.appendChild(filterOption);
    });
});

// Listener para el filtro
filterCat.addEventListener('change', () => {
    // Al cambiar el filtro, re-renderizamos. 
    // Como los datos vienen de onSnapshot, podemos simplemente llamar a una función de render
    // PERO onSnapshot se dispara solo con cambios en DB.
    // Hack simple: Forzar recarga o guardar datos en variable global.
    // Mejor enfoque: Guardar snapshot globalmente y llamar render.
    renderLogs();
});

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

        // Filtro
        if (selectedFilter !== 'all' && data.category !== selectedFilter) return;

        // Crear tarjeta con Tailwind
        const card = document.createElement('div');
        card.className = "bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 flex flex-col gap-2";

        // Detectar URL (simple regex)
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        let contentHtml = `<p class="text-gray-800 whitespace-pre-wrap">${data.content}</p>`;

        // Si hay URL, mostrar botón de ir
        let linkBtn = '';
        const match = data.content.match(urlRegex);
        if (match) {
            linkBtn = `<a href="${match[0]}" target="_blank" class="block mt-2 text-center bg-blue-50 text-blue-600 border border-blue-200 py-1 rounded text-sm hover:bg-blue-100">
                🔗 Abrir Enlace
             </a>`;
        }

        // Botones de Acción
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
            ${contentHtml}
            ${linkBtn}
            ${actions}
        `;
        logList.appendChild(card);
    });

    // Delegación de eventos (copiada para mantener funcionalidad tras re-render)
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const docObj = currentSnapshot.docs.find(d => d.id === id);
            if (docObj) {
                const data = docObj.data();
                editingId = id;
                catSelect.value = data.category;
                noteInput.value = data.content;
                btnSave.textContent = "Actualizar Registro";
                btnSave.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                btnSave.classList.add('bg-green-600', 'hover:bg-green-700');
                noteInput.focus();
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

// 3. Función: Guardar Entrada (Log)
// 3. Función: Guardar o Actualizar Entrada
btnSave.addEventListener('click', async () => {
    const category = catSelect.value;
    const content = noteInput.value.trim();

    if (!category || !content) {
        alert("Por favor selecciona una categoría y escribe algo.");
        return;
    }

    try {
        if (editingId) {
            // Modo Edición
            await updateDoc(doc(db, "logs", editingId), {
                category: category,
                content: content,
                updatedAt: serverTimestamp() // Opcional: trackear edición
            });
            editingId = null;
            btnSave.textContent = "Guardar Entrada";
            btnSave.classList.remove('bg-green-600', 'hover:bg-green-700');
            btnSave.classList.add('bg-blue-600', 'hover:bg-blue-700');
            alert('Registro actualizado');
        } else {
            // Modo Creación
            await addDoc(collection(db, "logs"), {
                category: category,
                content: content,
                date: serverTimestamp(),
                dateStr: new Date().toLocaleDateString()
            });
            alert('Registro guardado');
        }
        noteInput.value = '';
    } catch (e) {
        console.error("Error al guardar/actualizar: ", e);
        alert("Error al guardar: " + e.message);
    }
});

// 4. Función: Mostrar Registros (Feed en tiempo real)
const q = query(collection(db, "logs"), orderBy("date", "desc"));
onSnapshot(q, (snapshot) => {
    currentSnapshot = snapshot;
    renderLogs();
});