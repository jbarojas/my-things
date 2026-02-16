// Importar funciones de Firebase (versión Web Modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
    });
});

// 3. Función: Guardar Entrada (Log)
btnSave.addEventListener('click', async () => {
    const category = catSelect.value;
    const content = noteInput.value.trim();

    if (!category || !content) {
        alert("Por favor selecciona una categoría y escribe algo.");
        return;
    }

    try {
        await addDoc(collection(db, "logs"), {
            category: category,
            content: content,
            date: serverTimestamp(), // Fecha del servidor
            dateStr: new Date().toLocaleDateString() // Fecha local legible
        });
        noteInput.value = '';
    } catch (e) {
        console.error("Error al guardar: ", e);
    }
});

// 4. Función: Mostrar Registros (Feed en tiempo real)
const q = query(collection(db, "logs"), orderBy("date", "desc"));
onSnapshot(q, (snapshot) => {
    logList.innerHTML = '';
    
    if (snapshot.empty) {
        logList.innerHTML = '<p class="text-center text-gray-500">No hay registros aún.</p>';
        return;
    }

    snapshot.forEach(doc => {
        const data = doc.data();
        
        // Crear tarjeta con Tailwind
        const card = document.createElement('div');
        card.className = "bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 flex flex-col gap-1";
        
        // Detectar si es un enlace
        let contentHtml = `<p class="text-gray-800 whitespace-pre-wrap">${data.content}</p>`;
        if (data.content.startsWith('http')) {
            contentHtml = `<a href="${data.content}" target="_blank" class="text-blue-600 underline truncate">${data.content}</a>`;
        }

        card.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">${data.category}</span>
                <span class="text-xs text-gray-400">${data.date ? data.date.toDate().toLocaleString() : 'Reciente'}</span>
            </div>
            ${contentHtml}
        `;
        logList.appendChild(card);
    });
});