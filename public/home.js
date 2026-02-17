import { auth, db, signOut, onAuthStateChanged, collection, query, orderBy, onSnapshot, where } from "./firebase-config.js?v=17";

console.log("Home v1 Loaded");

// UI Config
const logList = document.getElementById('logList');
const filterCat = document.getElementById('filterCat');
const btnInstall = document.getElementById('btnInstall');
const btnLogout = document.getElementById('btnLogout');

let currentUser = null;
let currentSnapshot = [];
let deferredPrompt;
// PWA & Logout

// Check if iOS
const isIos = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
}

// 1. Handle Standard Install (Android/Desktop)
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    btnInstall.classList.remove('hidden');
});

// 2. Handle iOS or Manual Trigger
btnInstall.addEventListener('click', async () => {
    if (deferredPrompt) {
        // Android/Desktop
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);
        deferredPrompt = null;
        btnInstall.classList.add('hidden');
    } else if (isIos()) {
        // iOS Instructions
        alert("Para instalar en iOS:\n1. Toca el botón 'Compartir' (cuadrado con flecha).\n2. Selecciona 'Agregar a Inicio'.");
    } else {
        // Fallback
        alert("Para instalar, busca la opción 'Agregar a Inicio' o 'Instalar aplicación' en el menú de tu navegador.");
    }
});

// Always show install button on iOS (since event doesn't fire)
if (isIos()) {
    btnInstall.classList.remove('hidden');
}
btnLogout.addEventListener('click', async () => await signOut(auth));

// Auth & Init
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        initHome();
    } else {
        window.location.href = 'login.html';
    }
});

function initHome() {
    // Categories for filter
    const qCats = query(collection(db, "categories"), where("uid", "==", currentUser.uid), orderBy("name"));
    onSnapshot(qCats, (snapshot) => {
        filterCat.innerHTML = '<option value="all">Todas las categorías</option>';
        snapshot.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = data.name;
            option.textContent = data.name;
            filterCat.appendChild(option);
        });
    });

    // Logs
    const qLogs = query(collection(db, "logs"), where("uid", "==", currentUser.uid), orderBy("date", "desc"));
    onSnapshot(qLogs, (snapshot) => {
        currentSnapshot = snapshot;
        renderLogs();
    }, (error) => {
        console.error("Error logs:", error);
        logList.innerHTML = `<p class="text-red-500 text-center">Error cargando datos.</p>`;
    });
}

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
        card.className = "bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 flex flex-col gap-2 cursor-pointer hover:bg-gray-50 transition";

        // Click on card to Edit
        card.addEventListener('click', (e) => {
            // Prevent if clicking a link or button (if any)
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
            window.location.href = `editor.html?id=${id}`;
        });

        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const titleHtml = data.title ? `<h3 class="font-bold text-gray-900 text-lg leading-tight mb-1">${data.title}</h3>` : '';
        let contentHtml = `<p class="text-gray-800 whitespace-pre-wrap">${data.content}</p>`;

        let linkBtn = '';
        const match = data.content.match(urlRegex);
        if (match) {
            if (data.content.trim() === match[0] || data.content.length < match[0].length + 5) {
                contentHtml = '';
            }
            linkBtn = `<a href="${match[0]}" target="_blank" class="block mt-2 text-center bg-blue-50 text-blue-600 border border-blue-200 py-1 rounded text-sm hover:bg-blue-100 z-10 relative">
                🔗 Abrir Enlace
             </a>`;
        }

        card.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">${data.category}</span>
                <span class="text-xs text-gray-400">${data.date ? data.date.toDate().toLocaleString() : 'Reciente'}</span>
            </div>
            ${titleHtml}
            ${contentHtml}
            ${linkBtn}
        `;
        logList.appendChild(card);
    });
};

filterCat.addEventListener('change', renderLogs);
