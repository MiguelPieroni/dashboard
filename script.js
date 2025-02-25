document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    // Usuarios y contraseñas predefinidos
    const usuarios = {
        'Migue': 'migue2000',
        'Factory': '9dejulio974'
    };

    // Verificar sesión al cargar la página
    function checkSession() {
        const loggedUser = localStorage.getItem('loggedUser');
        if (loggedUser && usuarios[loggedUser]) {
            // Sesión activa
            loginContainer.style.display = 'none';
            appContainer.style.display = 'flex';
        } else {
            // No hay sesión
            loginContainer.style.display = 'flex';
            appContainer.style.display = 'none';
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
            appContainer.style.display = 'flex';
            loginError.textContent = '';
        } else {
            // Credenciales incorrectas
            loginError.textContent = 'Usuario o contraseña incorrectos';
        }
    });

    // Manejar el cierre de sesión
    logoutBtn.addEventListener('click', function() {
        // Eliminar sesión de localStorage
        localStorage.removeItem('loggedUser');
        
        loginContainer.style.display = 'flex';
        appContainer.style.display = 'none';
        
        // Limpiar campos de login
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        loginError.textContent = '';
        
        // Resetear campos de archivos y botón
        const fabricanteInput = document.getElementById('fabricanteFile');
        const modelosInput = document.getElementById('modelosFile');
        const procesarBtn = document.getElementById('procesarBtn');
        
        fabricanteInput.value = '';
        modelosInput.value = '';
        procesarBtn.disabled = true;
        
        fabricanteData = null;
        modelosData = null;
    });

    // Llamar a checkSession al cargar la página
    checkSession();

    const fabricanteInput = document.getElementById('fabricanteFile');
    const modelosInput = document.getElementById('modelosFile');
    const procesarBtn = document.getElementById('procesarBtn');
    const processingStatus = document.getElementById('processingStatus');

    let fabricanteData = null;
    let modelosData = null;

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
    });

    modelosInput.addEventListener('change', function() {
        handleFileUpload(this, function(data) {
            modelosData = data;
            checkFilesReady();
        });
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

            // Buscar SKUs concatenados para este código de producto
            const skusConcatenados = fabricanteMap.get(codigoProducto) 
                ? fabricanteMap.get(codigoProducto).join(', ') 
                : 'No encontrado';

            // Buscar SKUs concatenados para modelos con mismo nombre y género compatible
            const modeloSkusConcatenados = modelosData
                .filter((row, index) => 
                    index > 0 && 
                    row[0] === modelo && 
                    generoReglas[genero] && 
                    generoReglas[genero].includes(normalizarGenero(row[2])) &&
                    row[1] !== codigoProducto  // Excluir el código de producto actual
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

        // Configuración de estilo para toda la hoja
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

        // Aplicar estilo a todas las celdas
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

        // Ajustar ancho de columnas
        worksheetModelos['!cols'] = [
            { wch: 16 },  // Modelo
            { wch: 16 },  // Código Producto
            { wch: 16 },  // Género
            { wch: 16 },  // SKU Concatenados
            { wch: 16 }   // Modelos SKU Concatenados
        ];

        XLSX.utils.book_append_sheet(workbookModelos, worksheetModelos, 'Modelos Procesados');
        XLSX.writeFile(workbookModelos, 'colores-procesados.xlsx');

        alert('Archivo procesado y descargado By Miguel Pieroni');
    }
});