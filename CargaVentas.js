document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const factoryFileInput = document.getElementById('factoryFile');
    const fortalezaFileInput = document.getElementById('fortalezaFile');
    const procesarBtn = document.getElementById('procesarBtn');
    const processingStatus = document.getElementById('processingStatus');
    const progressContainer = document.querySelector('.progress-container');
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    const uploadHistory = document.getElementById('uploadHistory');
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const usernameDisplay = document.getElementById('username-display');
    const limpiarDatosBtn = document.getElementById('limpiarDatosBtn');
    
    // File Data Storage
    let factoryData = null;
    let fortalezaData = null;
    let db;

    // Configuración
    const dbName = 'ventasDB';
    const dbVersion = 1;

    const usuarios = {
        'Migue': 'migue2000',
        'Factory': '9dejulio974'
    };

    function checkSession() {
        const loggedUser = localStorage.getItem('loggedUser');
        if (!loggedUser) {
            window.location.href = 'index.html';
            return;
        }
        if (usernameDisplay) {
            usernameDisplay.textContent = loggedUser;
        }
        
        // Mostrar botón de limpieza solo para Migue
        if (loggedUser === 'Migue' && limpiarDatosBtn) {
            limpiarDatosBtn.style.display = 'inline-flex';
        }
    }

    function createStores(event) {
        const db = event.target.result;
        console.log('Creando/actualizando schema de la base de datos');
        
        // Crear store de ventas si no existe
        if (!db.objectStoreNames.contains('ventas')) {
            const ventasStore = db.createObjectStore('ventas', { 
                keyPath: 'id',
                autoIncrement: true 
            });
            
            // Crear índices necesarios
            ventasStore.createIndex('fecha', 'fecha');
            ventasStore.createIndex('tienda', 'tienda');
            ventasStore.createIndex('razonSocial', 'razonSocial');
            ventasStore.createIndex('Comprobante', 'Comprobante');
            
            console.log('Store de ventas creado');
        }
        
        // Crear store de historial si no existe
        if (!db.objectStoreNames.contains('uploadHistory')) {
            const historyStore = db.createObjectStore('uploadHistory', { 
                keyPath: 'id',
                autoIncrement: true 
            });
            
            historyStore.createIndex('fecha', 'fecha');
            historyStore.createIndex('razonSocial', 'razonSocial');
            historyStore.createIndex('registrosNuevos', 'registrosNuevos');
            historyStore.createIndex('registrosExistentes', 'registrosExistentes');
            historyStore.createIndex('totalRegistros', 'totalRegistros');
            historyStore.createIndex('pedidosUnicos', 'pedidosUnicos');
            
            console.log('Store de historial creado');
        }
    }

    // REEMPLAZAR ESTA FUNCIÓN
    // Initialize IndexedDB con manejo de versiones
    const initDB = () => {
        return new Promise((resolve, reject) => {
            // Primero, intentamos abrir la base de datos sin especificar versión
            const checkRequest = indexedDB.open('ventasDB');
            
            checkRequest.onsuccess = (event) => {
                const currentVersion = event.target.result.version;
                // Cerramos esta conexión
                event.target.result.close();
                console.log('Versión actual de la base de datos:', currentVersion);
                
                // Abrir con la versión actual o incrementada si necesitamos crear stores
                const openRequest = indexedDB.open('ventasDB', currentVersion);
                
                openRequest.onerror = (event) => {
                    console.error('Error opening database:', event.target.error);
                    reject(event.target.error);
                };
                
                openRequest.onsuccess = (event) => {
                    db = event.target.result;
                    console.log('Base de datos abierta correctamente');
                    
                    // Verificar si los stores existen
                    if (!db.objectStoreNames.contains('ventas') || 
                        !db.objectStoreNames.contains('uploadHistory')) {
                        
                        // Cerrar la conexión actual
                        db.close();
                        
                        // Reabrir con versión incrementada para crear stores
                        const upgradeRequest = indexedDB.open('ventasDB', currentVersion + 1);
                        
                        upgradeRequest.onupgradeneeded = createStores;
                        
                        upgradeRequest.onsuccess = (event) => {
                            db = event.target.result;
                            console.log('Base de datos actualizada con stores necesarios');
                            loadUploadHistory();
                            resolve(db);
                        };
                        
                        upgradeRequest.onerror = (event) => {
                            console.error('Error al actualizar la base de datos:', event.target.error);
                            reject(event.target.error);
                        };
                    } else {
                        // Los stores ya existen
                        loadUploadHistory();
                        resolve(db);
                    }
                };
                
                openRequest.onupgradeneeded = createStores;
            };
            
            checkRequest.onerror = (event) => {
                console.error('Error checking database version:', event.target.error);
                reject(event.target.error);
            };
            
            // En caso de que sea la primera vez
            checkRequest.onupgradeneeded = createStores;
        });
    };



    // File Upload Handlers
    const updateFileStatus = (input, statusId) => {
        const statusElement = document.getElementById(statusId);
        const fileNameElement = statusElement.querySelector('.file-name');
        
        if (input.files && input.files[0]) {
            const fileName = input.files[0].name;
            fileNameElement.textContent = fileName;
            statusElement.classList.add('active');
        } else {
            statusElement.classList.remove('active');
        }
    };

    const readFileAsync = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e.target.error);
            reader.readAsArrayBuffer(file);
        });
    };

    const handleFileUpload = async (file, isFactory) => {
        try {
            const data = await readFileAsync(file);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    
            console.log(`Archivo cargado: ${file.name}, tipo seleccionado: ${isFactory ? 'Factory' : 'Fortaleza'}`);
            
            // Obtener nombres de columnas para depuración
            const headers = jsonData[0] || [];
            console.log('Encabezados detectados:', headers);
    
            // IMPORTANTE: Respetar la selección del usuario y no intentar validar
            if (isFactory) {
                factoryData = jsonData;
                console.log('Archivo asignado como Factory');
            } else {
                fortalezaData = jsonData;
                console.log('Archivo asignado como Fortaleza');
            }
    
            checkFilesReady();
        } catch (error) {
            console.error('Error processing file:', error);
            processingStatus.textContent = `Error: ${error.message}`;
            procesarBtn.disabled = false;
            progressContainer.style.display = 'none';
        }
    };


    const limpiarDatos = async () => {
        const confirmar = confirm('¿Estás seguro que deseas eliminar todos los datos? Esta acción no se puede deshacer.');
        if (!confirmar) return;
    
        try {
            const transaction = db.transaction(['ventas', 'uploadHistory'], 'readwrite');
            const ventasStore = transaction.objectStore('ventas');
            const historyStore = transaction.objectStore('uploadHistory');
    
            await Promise.all([
                ventasStore.clear(),
                historyStore.clear()
            ]);
    
            processingStatus.textContent = 'Todos los datos han sido eliminados';
            uploadHistory.innerHTML = '<div class="history-item"><div class="history-details"><span>No hay registros de carga</span></div></div>';
            
            // Mostrar mensaje de éxito
            alert('Los datos han sido eliminados exitosamente');
    
        } catch (error) {
            console.error('Error al limpiar datos:', error);
            processingStatus.textContent = 'Error al limpiar los datos';
            alert('Error al limpiar los datos: ' + error.message);
        }
    };


    // Data Validation
    const validateFactoryData = (data) => {
        if (!data || data.length < 2) {
            throw new Error('El archivo no contiene datos válidos');
        }
    
        const headers = data[0].map(h => h ? String(h).trim().toLowerCase() : '');
        
        // Verificar columnas mínimas necesarias
        const requiredColumns = ['comprobante', 'tienda'];
        for (const column of requiredColumns) {
            if (headers.indexOf(column) === -1) {
                throw new Error(`Falta la columna requerida: ${column}`);
            }
        }
    
        return data;
    };
    
    const validateFortalezaData = (data) => {
        if (!data || data.length < 2) {
            throw new Error('El archivo no contiene datos válidos');
        }
    
        const headers = data[0].map(h => h ? String(h).trim().toLowerCase() : '');
        
        // Verificar columnas mínimas necesarias
        const requiredColumns = ['comprobante', 'tienda'];
        for (const column of requiredColumns) {
            if (headers.indexOf(column) === -1) {
                throw new Error(`Falta la columna requerida: ${column}`);
            }
        }
    
        return data;
    };

    // Processing Functions
// Asegurar que processFactoryData asigna la razón social correctamente
// Asegurar que processFactoryData asigna la razón social correctamente
const processFactoryData = async (data) => {
    const headers = data[0];
    const rows = data.slice(1);
    const processedData = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const progress = (i / rows.length) * 100;
        updateProgress(progress, 'Factory');

        if (!row || !row.some(cell => cell)) continue;

        const rowData = {};
        headers.forEach((header, index) => {
            const headerText = header ? header.trim() : '';
            if (headerText) {
                rowData[headerText] = row[index];
            }
        });

        // Verificar Tienda para confirmar que es realmente Factory
        if (rowData.Tienda) {
            const tiendaStr = String(rowData.Tienda).toUpperCase();
            if (!tiendaStr.includes('SVONLINE') && !tiendaStr.includes('SEVEN')) {
                console.warn(`Tienda no reconocida como Factory: ${tiendaStr}`);
                // Opcional: saltar este registro si no es Factory
                // continue;
            }
        }

        let tienda;
        const observacion = String(rowData.Observaciones || '');
        
        if (observacion.startsWith('BPR')) {
            tienda = 'Seven Bapro';
        } else if (observacion.startsWith('20000')) {
            tienda = 'Seven Meli';
        } else {
            tienda = 'Seven';
        }

        processedData.push({
            ...rowData,
            tienda,
            razonSocial: 'Factory',  // Siempre asignar la razón social correcta
            fechaProcesamiento: new Date()
        });
    }

    console.log(`Datos Factory procesados: ${processedData.length} registros`);
    return await saveToIndexedDB(processedData);
};

// Asegurar que processFortalezaData asigna la razón social correctamente
const processFortalezaData = async (data) => {
    const headers = data[0];
    const rows = data.slice(1);
    const processedData = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const progress = (i / rows.length) * 100;
        updateProgress(progress, 'Fortaleza');

        if (!row || !row.some(cell => cell)) continue;

        const rowData = {};
        headers.forEach((header, index) => {
            const headerText = header ? header.trim() : '';
            if (headerText) {
                rowData[headerText] = row[index];
            }
        });

        // Verificar Tienda para confirmar que es realmente Fortaleza
        if (rowData.Tienda) {
            const tiendaStr = String(rowData.Tienda).toUpperCase();
            if (!tiendaStr.includes('CHONLINE') && !tiendaStr.includes('CHELSEA') && !tiendaStr.includes('EXIT')) {
                console.warn(`Tienda no reconocida como Fortaleza: ${tiendaStr}`);
                // Opcional: saltar este registro si no es Fortaleza
                // continue;
            }
        }

        let tienda;
        const vendedor = String(rowData.Vendedor || '').trim();
        const observacion = String(rowData.Observaciones || '');

        if (vendedor === 'EXVTEX') {
            tienda = 'Exit';
        } else if (vendedor === 'CHVTEX') {
            tienda = 'Chelsea';
        } else if (!vendedor) {
            if (observacion.startsWith('BPR')) {
                tienda = 'Chelsea Bapro';
            } else if (observacion.startsWith('20000')) {
                tienda = 'Chelsea Meli';
            } else {
                tienda = 'Chelsea';
            }
        } else {
            tienda = 'Chelsea';
        }

        processedData.push({
            ...rowData,
            tienda,
            razonSocial: 'Fortaleza',  // Siempre asignar la razón social correcta
            fechaProcesamiento: new Date()
        });
    }

    console.log(`Datos Fortaleza procesados: ${processedData.length} registros`);
    return await saveToIndexedDB(processedData);
};

const procesarArchivos = async () => {
    try {
        procesarBtn.disabled = true;
        processingStatus.textContent = 'Iniciando procesamiento...';
        progressContainer.style.display = 'block';
        progressFill.style.width = '0%';

        let estadisticasFactory = null;
        let estadisticasFortaleza = null;
        
        // Procesar Factory si hay datos
        if (factoryData) {
            console.log('Procesando datos de Factory...');
            estadisticasFactory = await processFactoryData(factoryData);
            if (estadisticasFactory) {
                await updateUploadHistory({
                    ...estadisticasFactory,
                    razonSocial: 'Factory'
                });
            }
        }

        // Procesar Fortaleza si hay datos
        if (fortalezaData) {
            console.log('Procesando datos de Fortaleza...');
            estadisticasFortaleza = await processFortalezaData(fortalezaData);
            if (estadisticasFortaleza) {
                await updateUploadHistory({
                    ...estadisticasFortaleza,
                    razonSocial: 'Fortaleza'
                });
            }
        }

        processingStatus.textContent = 'Procesamiento completado exitosamente';
        progressContainer.style.display = 'none';
        
        // Limpiar los inputs y resetear el estado
        factoryFileInput.value = '';
        fortalezaFileInput.value = '';
        document.getElementById('factoryStatus').classList.remove('active');
        document.getElementById('fortalezaStatus').classList.remove('active');
        factoryData = null;
        fortalezaData = null;
        
        checkFilesReady();

    } catch (error) {
        console.error('Error en el procesamiento:', error);
        processingStatus.textContent = `Error: ${error.message}`;
        procesarBtn.disabled = false;
        progressContainer.style.display = 'none';
    }
};

    const saveToIndexedDB = async (data) => {
        return new Promise((resolve, reject) => {
            if (!db) {
                console.error('La base de datos no está inicializada');
                reject(new Error('Database not initialized'));
                return;
            }
            
            try {
                const transaction = db.transaction(['ventas'], 'readwrite');
                const ventasStore = transaction.objectStore('ventas');
                
                const estadisticas = {
                    registrosNuevos: 0,
                    registrosExistentes: 0,
                    totalRegistros: data.length,
                    pedidosUnicos: new Set()
                };
                
                // Determinar la razón social de este conjunto de datos
                const currentRazonSocial = data[0]?.razonSocial || 
                    (data[0]?.Tienda && String(data[0].Tienda).includes('SVONLINE') ? 'Factory' : 'Fortaleza');
                
                console.log(`Procesando datos de: ${currentRazonSocial}`);
                
                // Obtener todos los registros existentes
                const getAllRequest = ventasStore.getAll();
                
                getAllRequest.onsuccess = () => {
                    const existingRecords = getAllRequest.result;
                    console.log(`Total de registros existentes: ${existingRecords.length}`);
                    
                    // IMPORTANTE: Filtrar solo registros de la MISMA razón social
                    const recordsOfSameType = existingRecords.filter(record => 
                        record && record.razonSocial === currentRazonSocial
                    );
                    
                    console.log(`Registros con la misma razón social (${currentRazonSocial}): ${recordsOfSameType.length}`);
                    
                    // Crear conjunto de claves únicas para búsqueda rápida
                    const existingKeys = new Set();
                    recordsOfSameType.forEach(record => {
                        if (record && record.Comprobante && record.tienda) {
                            // La clave debe incluir la razón social
                            const key = `${record.Comprobante}-${record.tienda}-${record.razonSocial}`;
                            existingKeys.add(key);
                        }
                    });
                    
                    console.log(`Claves únicas existentes: ${existingKeys.size}`);
                    
                    let processedCount = 0;
                    
                    // Procesar cada registro de datos
                    data.forEach(item => {
                        // Asegurarse de que este ítem tiene la razón social correcta
                        if (item.Tienda && typeof item.Tienda === 'string') {
                            if (item.Tienda.includes('SVONLINE') || item.Tienda.includes('SEVEN')) {
                                item.razonSocial = 'Factory';
                            } else if (item.Tienda.includes('CHONLINE') || item.Tienda.includes('CHELSEA') || item.Tienda.includes('EXIT')) {
                                item.razonSocial = 'Fortaleza';
                            }
                        }
                        
                        if (!item || !item.Comprobante || !item.tienda) {
                            console.warn('Registro inválido:', item);
                            processedCount++;
                            checkComplete();
                            return;
                        }
                        
                        // Verificar si ya existe un registro con la misma clave
                        // IMPORTANTE: Incluir razón social en la clave de verificación
                        const key = `${item.Comprobante}-${item.tienda}-${item.razonSocial}`;
                        const isDuplicate = existingKeys.has(key);
                        
                        console.log(`Verificando ${key}: Duplicado=${isDuplicate}`);
                        
                        if (!isDuplicate) {
                            // No es duplicado, añadir
                            const addRequest = ventasStore.add(item);
                            
                            addRequest.onsuccess = () => {
                                estadisticas.registrosNuevos++;
                                existingKeys.add(key); // Actualizar conjunto para detección futura
                                if (item.Observaciones) {
                                    estadisticas.pedidosUnicos.add(item.Observaciones);
                                }
                                processedCount++;
                                checkComplete();
                            };
                            
                            addRequest.onerror = (event) => {
                                console.error('Error al añadir registro:', event.target.error);
                                estadisticas.registrosExistentes++;
                                processedCount++;
                                checkComplete();
                            };
                        } else {
                            // Es duplicado, contar
                            estadisticas.registrosExistentes++;
                            processedCount++;
                            checkComplete();
                        }
                    });
                    
                    function checkComplete() {
                        if (processedCount >= data.length) {
                            console.log('Procesamiento completado:', estadisticas);
                            resolve(estadisticas);
                        }
                    }
                };
                
                getAllRequest.onerror = (event) => {
                    console.error('Error al obtener registros existentes:', event.target.error);
                    reject(event.target.error);
                };
                
                transaction.onerror = (event) => {
                    console.error('Error en la transacción:', event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error('Error general en saveToIndexedDB:', error);
                reject(error);
            }
        });
    };

    const updateUploadHistory = async (estadisticas) => {
        const transaction = db.transaction(['uploadHistory'], 'readwrite');
        const store = transaction.objectStore('uploadHistory');
    
        const historyEntry = {
            fecha: new Date(),
            razonSocial: estadisticas.razonSocial, // Usar la razón social proporcionada
            totalRegistros: estadisticas.totalRegistros,
            registrosNuevos: estadisticas.registrosNuevos,
            registrosExistentes: estadisticas.registrosExistentes,
            pedidosUnicos: estadisticas.pedidosUnicos.size
        };
    
        try {
            await store.add(historyEntry);
            await loadUploadHistory();
        } catch (error) {
            console.error('Error al actualizar el historial:', error);
        }
    };

    const loadUploadHistory = () => {
        if (!db) {
            console.error('Base de datos no inicializada');
            return;
        }
        
        try {
            // Verificar si el object store existe
            if (!db.objectStoreNames.contains('uploadHistory')) {
                console.warn('El store uploadHistory no existe todavía');
                updateHistoryUI([]);
                return;
            }
            
            const transaction = db.transaction(['uploadHistory'], 'readonly');
            const store = transaction.objectStore('uploadHistory');
            const request = store.getAll();
    
            request.onsuccess = () => {
                const history = request.result;
                updateHistoryUI(history);
            };
    
            request.onerror = (error) => {
                console.error('Error al cargar el historial:', error);
                updateHistoryUI([]);
            };
        } catch (error) {
            console.error('Error al acceder al historial:', error);
            updateHistoryUI([]);
        }
    };
    
    // UI Updates
    const updateProgress = (percentage, type) => {
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `Procesando ${type}: ${Math.round(percentage)}%`;
    };

    const updateHistoryUI = (history) => {
        if (!uploadHistory) return;

        const historyHTML = history.length > 0 
            ? history
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                .slice(0, 10)
                .map(entry => `
                    <div class="history-item">
                        <div class="history-icon">
                            <i class="fas fa-file-upload"></i>
                        </div>
                        <div class="history-details">
                            <span class="history-date">${new Date(entry.fecha).toLocaleString('es-AR')}</span>
                            <span class="history-type">${entry.razonSocial}</span>
                            <span class="history-count">
                                ${entry.registrosNuevos} nuevos pedidos, 
                                ${entry.registrosExistentes} ya existentes
                                (Total: ${entry.totalRegistros} registros)
                            </span>
                        </div>
                    </div>
                `)
                .join('')
            : '<div class="history-item"><div class="history-details"><span>No hay registros de carga</span></div></div>';

        uploadHistory.innerHTML = historyHTML;
    };

    const checkFilesReady = () => {
        procesarBtn.disabled = !(factoryData || fortalezaData);
    };

    // Event Listeners
    factoryFileInput.addEventListener('change', function() {
        if (this.files[0]) {
            handleFileUpload(this.files[0], true);
            updateFileStatus(this, 'factoryStatus');
        }
    });

    fortalezaFileInput.addEventListener('change', function() {
        if (this.files[0]) {
            handleFileUpload(this.files[0], false);
            updateFileStatus(this, 'fortalezaStatus');
        }
    });

    procesarBtn.addEventListener('click', procesarArchivos);
    limpiarDatosBtn?.addEventListener('click', limpiarDatos);

    // Setup sidebar toggle if utils.js is loaded
    if (window.utils && typeof window.utils.setupSidebar === 'function') {
        window.utils.setupSidebar();
    } else {
        // Configurar sidebar manualmente si es necesario
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('toggle-sidebar');
        const mainContent = document.getElementById('main-content');
        const footer = document.querySelector('.footer');
        
        if (sidebar && toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                if (mainContent) mainContent.classList.toggle('expanded');
                if (footer) footer.classList.toggle('expanded');
            });
        }
    }

    checkSession();
    initDB().catch(error => {
        console.error('Error al inicializar la base de datos:', error);
        if (processingStatus) {
            processingStatus.textContent = `Error al inicializar la base de datos. Por favor, recarga la página.`;
        }
    });
});