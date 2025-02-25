document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const toggleBtn = document.getElementById('toggle-sidebar');
    const usernameDisplay = document.getElementById('username-display');

    // Toggle sidebar function
    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    }

    // Event listener para el botón de toggle
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleSidebar);
    }

    // Responsive behavior
    function handleResize() {
        if (window.innerWidth <= 768) {
            sidebar?.classList.add('collapsed');
            mainContent?.classList.add('expanded');
        } else {
            sidebar?.classList.remove('collapsed');
            mainContent?.classList.remove('expanded');
        }
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    // Usuarios y contraseñas predefinidos
    const usuarios = {
        'Migue': 'migue2000',
        'Factory': '9dejulio974'
    };

    // Verificar sesión al cargar
    function checkSession() {
        const loggedUser = localStorage.getItem('loggedUser');
        if (loggedUser && usuarios[loggedUser]) {
            if (usernameDisplay) {
                usernameDisplay.textContent = loggedUser;
            }
            if (loginContainer) {
                loginContainer.style.display = 'none';
            }
            if (appContainer) {
                appContainer.style.display = 'flex';
            }
        } else {
            window.location.href = 'index.html';
        }
    }

    // Manejar el cierre de sesión
    function handleLogout() {
        localStorage.removeItem('loggedUser');
        window.location.href = 'index.html';
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    checkSession();

    // Funcionalidad del Concatenador
    if (document.getElementById('fabricanteFile')) {
        const fabricanteInput = document.getElementById('fabricanteFile');
        const modelosInput = document.getElementById('modelosFile');
        const procesarBtn = document.getElementById('procesarBtn');
        const processingStatus = document.getElementById('processingStatus');

        let fabricanteData = null;
        let modelosData = null;

        // Función para mostrar el nombre del archivo subido
        function updateFileStatus(input, statusId) {
            const statusElement = document.getElementById(statusId);
            const fileNameElement = statusElement.querySelector('.file-name');
            
            if (input.files && input.files[0]) {
                const fileName = input.files[0].name;
                fileNameElement.textContent = fileName;
                statusElement.classList.add('active');
            } else {
                statusElement.classList.remove('active');
            }
        }

        function normalizarGenero(genero) {
            if (!genero) return '';
            const generoNormalizado = genero.trim();
            const mapeoGeneros = {
                'Hombre': 'Hombre',
                'Mujer': 'Mujer',
                'Niño': 'Niño',
                'Niña': 'Niña',
                'Bebe': 'Bebe',
                'Juvenil': 'Juvenil',
                'Unisex': 'Unisex'
            };
            return mapeoGeneros[generoNormalizado] || generoNormalizado;
        }

        function handleFileUpload(input, callback) {
            const file = input.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const data = e.target.result;
                const workbook = XLSX.read(data, {type: 'binary'});
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
                callback(jsonData);
            };
            reader.readAsBinaryString(file);
        }

        fabricanteInput.addEventListener('change', function() {
            handleFileUpload(this, function(data) {
                fabricanteData = data;
                checkFilesReady();
            });
            updateFileStatus(this, 'fabricanteStatus');
        });

        modelosInput.addEventListener('change', function() {
            handleFileUpload(this, function(data) {
                modelosData = data;
                checkFilesReady();
            });
            updateFileStatus(this, 'modelosStatus');
        });

        function checkFilesReady() {
            procesarBtn.disabled = !(fabricanteData && modelosData);
        }

        procesarBtn.addEventListener('click', procesarArchivos);

        function procesarArchivos() {
            const fabricanteMap = new Map();
            
            // Crear mapa de códigos de fabricante a SKUs
            for (let i = 1; i < fabricanteData.length; i++) {
                const codigoFabricante = fabricanteData[i][0];
                const sku = fabricanteData[i][1];

                if (!codigoFabricante || !sku) continue;

                if (!fabricanteMap.has(codigoFabricante)) {
                    fabricanteMap.set(codigoFabricante, []);
                }
                if (!fabricanteMap.get(codigoFabricante).includes(sku)) {
                    fabricanteMap.get(codigoFabricante).push(sku);
                }
            }

            // Reglas de género
            const generoReglas = {
                'Hombre': ['Hombre', 'Unisex'],
                'Mujer': ['Mujer', 'Unisex'],
                'Niño': ['Niño'],
                'Niña': ['Niña'],
                'Bebe': ['Bebe'],
                'Juvenil': ['Juvenil'],
                'Unisex': ['Hombre', 'Mujer', 'Unisex']
            };

            // Procesar modelos
            const resultadoModelos = [
                ['Modelo', 'Código Producto', 'Género', 'SKU Concatenados', 'Modelos SKU Concatenados']
            ];

            for (let i = 1; i < modelosData.length; i++) {
                const modelo = modelosData[i][0] || '';
                const codigoProducto = modelosData[i][1] || '';
                const generoOriginal = modelosData[i][2] || '';
                const genero = normalizarGenero(generoOriginal);

                const skusConcatenados = fabricanteMap.get(codigoProducto) 
                    ? fabricanteMap.get(codigoProducto).join(', ') 
                    : 'No encontrado';

                const modeloSkusConcatenados = modelosData
                    .filter((row, index) => 
                        index > 0 && 
                        row[0] === modelo && 
                        generoReglas[genero] && 
                        generoReglas[genero].includes(normalizarGenero(row[2])) &&
                        row[1] !== codigoProducto
                    )
                    .map(row => {
                        return fabricanteMap.get(row[1]) 
                            ? fabricanteMap.get(row[1]).join(', ') 
                            : '';
                    })
                    .filter(skus => skus && skus !== 'No encontrado')
                    .join(', ');

                resultadoModelos.push([
                    modelo, 
                    codigoProducto, 
                    generoOriginal, 
                    skusConcatenados, 
                    modeloSkusConcatenados
                ]);
            }

            // Crear y descargar archivo
            const workbookModelos = XLSX.utils.book_new();
            const worksheetModelos = XLSX.utils.aoa_to_sheet(resultadoModelos);

            const estiloFuente = {
                font: {
                    name: 'Arial',
                    sz: 11,
                    color: { auto: 1 }
                },
                alignment: {
                    vertical: 'center',
                    horizontal: 'left'
                }
            };

            const range = XLSX.utils.decode_range(worksheetModelos['!ref']);
            for (let rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
                for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
                    const cellRef = XLSX.utils.encode_cell({r: rowNum, c: colNum});
                    const cell = worksheetModelos[cellRef];
                    
                    if (cell) {
                        cell.s = estiloFuente;
                    }
                }
            }

            worksheetModelos['!cols'] = [
                { wch: 16 },  // Modelo
                { wch: 16 },  // Código Producto
                { wch: 16 },  // Género
                { wch: 16 },  // SKU Concatenados
                { wch: 16 }   // Modelos SKU Concatenados
            ];

            XLSX.utils.book_append_sheet(workbookModelos, worksheetModelos, 'Modelos Procesados');
            XLSX.writeFile(workbookModelos, 'colores-procesados.xlsx');
        }
    }
});