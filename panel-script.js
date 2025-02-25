document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const loginContainer = document.getElementById('login-container');
    const panelContainer = document.getElementById('panel-container');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const toggleBtn = document.getElementById('toggle-sidebar');
    const logoutButton = document.getElementById('logout-button');
    const usernameDisplay = document.getElementById('username-display');

    // Usuarios y contraseñas predefinidos
    const usuarios = {
        'Migue': 'migue2000',
        'Factory': '9dejulio974'
    };

    // Verificar sesión al cargar
    function checkSession() {
        const loggedUser = localStorage.getItem('loggedUser');
        if (loggedUser && usuarios[loggedUser]) {
            // Sesión activa
            loginContainer.style.display = 'none';
            panelContainer.style.display = 'block';
            usernameDisplay.textContent = loggedUser;
        } else {
            // No hay sesión
            loginContainer.style.display = 'flex';
            panelContainer.style.display = 'none';
        }
    }

    // Manejar el inicio de sesión
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (usuarios[username] && usuarios[username] === password) {
            // Inicio de sesión exitoso
            localStorage.setItem('loggedUser', username);
            loginContainer.style.display = 'none';
            panelContainer.style.display = 'block';
            usernameDisplay.textContent = username;
            loginError.textContent = '';
        } else {
            // Credenciales incorrectas
            loginError.textContent = 'Usuario o contraseña incorrectos';
        }
    });

    // Toggle sidebar
    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    }

    // Manejar cierre de sesión
    function handleLogout() {
        localStorage.removeItem('loggedUser');
        panelContainer.style.display = 'none';
        loginContainer.style.display = 'flex';
        
        // Limpiar campos de login
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        loginError.textContent = '';
        
        // Resetear estado del sidebar
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('expanded');
    }

    // Event Listeners
    toggleBtn.addEventListener('click', toggleSidebar);
    logoutButton.addEventListener('click', handleLogout);

    // Responsive sidebar behavior
    function handleResize() {
        if (window.innerWidth <= 768) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
        }
    }

    // Manejar navegación activa
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Inicialización
    checkSession();
    handleResize();
    window.addEventListener('resize', handleResize);
});