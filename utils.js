// utils.js - Corrected version

// Verificación de sesión
function checkSession() {
    const loggedUser = localStorage.getItem('loggedUser');
    if (!loggedUser) {
        window.location.href = 'index.html';
        return false;
    }
    
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) {
        usernameDisplay.textContent = loggedUser;
    }
    return true;
}

// Toggle sidebar
function setupSidebar() {
    console.log("Configurando sidebar desde utils.js");
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    const mainContent = document.getElementById('main-content');
    const footer = document.querySelector('.footer');
    
    if (!sidebar || !toggleBtn) {
        console.warn("No se encontraron los elementos necesarios para el sidebar");
        return;
    }
    
    // Función para manejar el toggle
    function toggleSidebarHandler() {
        console.log("Toggle sidebar clicked");
        sidebar.classList.toggle('collapsed');
        
        if (mainContent) {
            mainContent.classList.toggle('expanded');
        }
        
        if (footer) {
            footer.classList.toggle('expanded');
        }
        
        // Guardar el estado en localStorage
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed ? 'true' : 'false');
    }
    
    // Asegurar que el evento click se añada solo una vez
    toggleBtn.removeEventListener('click', toggleSidebarHandler);
    toggleBtn.addEventListener('click', toggleSidebarHandler);
    
    // Responsive behavior
    function handleResize() {
        if (window.innerWidth <= 768) {
            sidebar.classList.add('collapsed');
            if (mainContent) mainContent.classList.add('expanded');
            if (footer) footer.classList.add('expanded');
        } else {
            // Restaurar estado guardado
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState === 'true') {
                sidebar.classList.add('collapsed');
                if (mainContent) mainContent.classList.add('expanded');
                if (footer) footer.classList.add('expanded');
            } else if (savedState === 'false') {
                sidebar.classList.remove('collapsed');
                if (mainContent) mainContent.classList.remove('expanded');
                if (footer) footer.classList.remove('expanded');
            }
        }
    }
    
    // Observar cambios de tamaño
    window.removeEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);
    
    // Restaurar estado guardado al cargar
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
        sidebar.classList.add('collapsed');
        if (mainContent) mainContent.classList.add('expanded');
        if (footer) footer.classList.add('expanded');
    } else if (window.innerWidth <= 768) {
        sidebar.classList.add('collapsed');
        if (mainContent) mainContent.classList.add('expanded');
        if (footer) footer.classList.add('expanded');
    }
}

// Asegurar que el sidebar funcione
function ensureSidebarWorks() {
    setTimeout(() => {
        setupSidebar();
    }, 200);
}

// Mostrar mensajes
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert-${type}`;
    messageDiv.innerHTML = `
        <i class="fas ${type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
        <div>
            <p>${message}</p>
        </div>
    `;
    
    const processingStatus = document.getElementById('processingStatus');
    if (processingStatus) {
        processingStatus.innerHTML = '';
        processingStatus.appendChild(messageDiv);
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => messageDiv.remove(), 500);
    }, 5000);
}

// Primera instancia (mantener)
function formatCurrency(value) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Formatear fecha
function formatDate(date) {
    if (!date) return '';
    
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Función para abrir IndexedDB con la versión correcta
function openDatabaseWithCorrectVersion(dbName) {
    return new Promise((resolve, reject) => {
        // Primero detectar la versión actual
        const checkRequest = indexedDB.open(dbName);
        
        checkRequest.onsuccess = (event) => {
            const currentVersion = event.target.result.version;
            event.target.result.close();
            console.log(`Versión actual de ${dbName}: ${currentVersion}`);
            
            // Ahora abrir con la versión correcta
            const openRequest = indexedDB.open(dbName, currentVersion);
            
            openRequest.onsuccess = (evt) => {
                console.log(`Base de datos ${dbName} abierta correctamente`);
                resolve(evt.target.result);
            };
            
            openRequest.onerror = (evt) => {
                console.error(`Error al abrir ${dbName}:`, evt.target.error);
                reject(evt.target.error);
            };
        };
        
        checkRequest.onerror = (event) => {
            console.error(`Error al verificar versión de ${dbName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

// Exportar funciones - SOLO UNA VEZ AL FINAL
window.utils = {
    checkSession,
    setupSidebar,
    ensureSidebarWorks,
    showMessage,
    formatDate,
    openDatabaseWithCorrectVersion
};