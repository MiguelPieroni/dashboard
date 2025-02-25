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
    // Initialize IndexedDB
    const initDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('ventasDB', 2); // Incrementamos la versión
    
            request.onerror = (event) => {
                console.error('Error opening database:', event.target.error);
                reject(event.target.error);
            };
    
            request.onsuccess = (event) => {
                db = event.target.result;
                loadUploadHistory();
                resolve(db);
            };
    
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Crear object store para ventas si no existe
                if (!db.objectStoreNames.contains('ventas')) {
                    const ventasStore = db.createObjectStore('ventas', { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    ventasStore.createIndex('fecha', 'fecha');
                    ventasStore.createIndex('tienda', 'tienda');
                    ventasStore.createIndex('razonSocial', 'razonSocial');
                }
    
                // Crear object store para historial si no existe
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
                }
            };
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

            if (isFactory) {
                factoryData = validateFactoryData(jsonData);
            } else {
                fortalezaData = validateFortalezaData(jsonData);
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

        const requiredHeaders = ['Comprobante', 'Fecha', 'Artículo', 'Total', 'Cliente', 'Observaciones', 'Tienda'];
        const headers = data[0].map(h => h?.trim());
        
        for (const header of requiredHeaders) {
            if (!headers.includes(header)) {
                throw new Error(`Falta la columna requerida: ${header}`);
            }
        }

        const tiendaIndex = headers.indexOf('Tienda');
        const firstTienda = data[1]?.[tiendaIndex]?.trim();
        
        if (firstTienda !== 'SVONLINE') {
            throw new Error('Este archivo no corresponde a Factory (SVONLINE).');
        }

        return data;
    };

    const validateFortalezaData = (data) => {
        if (!data || data.length < 2) {
            throw new Error('El archivo no contiene datos válidos');
        }

        const requiredHeaders = ['Comprobante', 'Fecha', 'Vendedor', 'Artículo', 'Total', 'Cliente', 'Observaciones', 'Tienda'];
        const headers = data[0].map(h => h?.trim());
        
        for (const header of requiredHeaders) {
            if (!headers.includes(header)) {
                throw new Error(`Falta la columna requerida: ${header}`);
            }
        }

        const tiendaIndex = headers.indexOf('Tienda');
        const firstTienda = data[1]?.[tiendaIndex]?.trim();
        
        if (firstTienda !== 'CHONLINE') {
            throw new Error('Este archivo no corresponde a Fortaleza (CHONLINE).');
        }

        return data;
    };

    // Processing Functions
    const processFactoryData = async (data) => {
        const headers = data[0];
        const rows = data.slice(1);
        const processedData = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const progress = (i / rows.length) * 100;
            updateProgress(progress, 'Factory');

            if (!row.some(cell => cell)) continue;

            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header.trim()] = row[index];
            });

            let tienda;
            const observacion = String(rowData.Observaciones || '');
            
            if (observacion.startsWith('BPR')) {
                tienda = 'Seven Bapro';
            } else if (observacion.startsWith('20000')) {
                tienda = 'Seven Meli';
            } else {
                tienda = 'Seven';
            }

            if (!rowData['Descrip. familia']) continue;

            processedData.push({
                ...rowData,
                tienda,
                razonSocial: 'Factory',
                fechaProcesamiento: new Date()
            });
        }

        return await saveToIndexedDB(processedData);
    };

    const processFortalezaData = async (data) => {
        const headers = data[0];
        const rows = data.slice(1);
        const processedData = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const progress = (i / rows.length) * 100;
            updateProgress(progress, 'Fortaleza');

            if (!row.some(cell => cell)) continue;

            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header.trim()] = row[index];
            });

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
                }
            }

            if (!rowData['Descrip. familia']) continue;

            processedData.push({
                ...rowData,
                tienda,
                razonSocial: 'Fortaleza',
                fechaProcesamiento: new Date()
            });
        }

        return await saveToIndexedDB(processedData);
    };

    const procesarArchivos = async () => {
        try {
            procesarBtn.disabled = true;
            processingStatus.textContent = 'Iniciando procesamiento...';
            progressContainer.style.display = 'block';
            progressFill.style.width = '0%';

            let estadisticas;
            
            if (factoryData) {
                estadisticas = await processFactoryData(factoryData);
            }

            if (fortalezaData) {
                estadisticas = await processFortalezaData(fortalezaData);
            }

            await updateUploadHistory(estadisticas);
            
            processingStatus.textContent = 'Procesamiento completado exitosamente';
            progressContainer.style.display = 'none';
            
            factoryFileInput.value = '';
            fortalezaFileInput.value = '';
            document.getElementById('factoryStatus').classList.remove('active');
            document.getElementById('fortalezaStatus').classList.remove('active');
            
            checkFilesReady();

        } catch (error) {
            console.error('Error en el procesamiento:', error);
            processingStatus.textContent = `Error: ${error.message}`;
            procesarBtn.disabled = false;
            progressContainer.style.display = 'none';
        }
    };

    // IndexedDB Operations
    const saveToIndexedDB = async (data) => {
        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction(['ventas', 'uploadHistory'], 'readwrite');
                const ventasStore = transaction.objectStore('ventas');
                
                const estadisticas = {
                    registrosNuevos: 0,
                    registrosExistentes: 0,
                    totalRegistros: data.length,
                    pedidosUnicos: new Set()
                };
    
                data.forEach(item => {
                    const addRequest = ventasStore.add(item);
                    addRequest.onsuccess = () => {
                        estadisticas.registrosNuevos++;
                        estadisticas.pedidosUnicos.add(item.Observaciones);
                    };
                });
    
                transaction.oncomplete = () => {
                    resolve(estadisticas);
                };
    
                transaction.onerror = (error) => {
                    reject(error);
                };
            } catch (error) {
                reject(error);
            }
        });
    };

    const updateUploadHistory = async (estadisticas) => {
        const transaction = db.transaction(['uploadHistory'], 'readwrite');
        const store = transaction.objectStore('uploadHistory');

        const historyEntry = {
            fecha: new Date(),
            razonSocial: factoryData ? 'Factory' : 'Fortaleza',
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

    // Inicialización
    checkSession();
    initDB();
});

// Añadir un nuevo elemento en la UI para subir archivos de logística
function agregarUICargaLogistica() {
    // Crear una nueva sección después de la carga de ventas
    const contentWrapper = document.querySelector('.content-wrapper');
    if (!contentWrapper) return;
    
    const logisticaSection = document.createElement('div');
    logisticaSection.className = 'upload-section logistica-section';
    logisticaSection.style.marginTop = '20px';
    
    logisticaSection.innerHTML = `
        <div class="upload-container">
            <div class="file-upload-card">
                <div class="card-icon">
                    <i class="fas fa-truck"></i>
                </div>
                <h2>Datos de Logística (VTEX)</h2>
                <div class="upload-area">
                    <input type="file" id="logisticaFile" accept=".xlsx,.xls,.csv">
                    <p class="upload-text">Arrastra tu archivo aquí o haz clic para seleccionar</p>
                </div>
                <div class="file-status" id="logisticaStatus">
                    <i class="fas fa-check-circle"></i>
                    Archivo cargado: <span class="file-name"></span>
                </div>
            </div>
            
            <div class="info-section">
                <h3><i class="fas fa-info-circle"></i>Datos de Logística</h3>
                <div class="file-requirements">
                    <ul class="requirements-list">
                        <li>Formato: Excel (.xlsx, .xls) o CSV (.csv)</li>
                        <li>Debe contener información de envíos de VTEX</li>
                        <li>Campos requeridos: carrier, region, deliveryTime, shippingCost</li>
                        <li>Sin encabezados vacíos o datos faltantes</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    // Añadir después del contenido existente
    contentWrapper.appendChild(logisticaSection);
    
    // Agregar event listener para el input de archivo
    const logisticaFileInput = document.getElementById('logisticaFile');
    if (logisticaFileInput) {
        logisticaFileInput.addEventListener('change', manejarSeleccionArchivoLogistica);
    }
    
    // Añadir botón para procesar datos de logística
    const actionButtons = document.querySelector('.action-buttons');
    if (actionButtons) {
        const procesarLogisticaBtn = document.createElement('button');
        procesarLogisticaBtn.id = 'procesarLogisticaBtn';
        procesarLogisticaBtn.className = 'process-btn';
        procesarLogisticaBtn.disabled = true;
        procesarLogisticaBtn.innerHTML = `
            <i class="fas fa-truck"></i>
            Procesar Datos de Logística
        `;
        procesarLogisticaBtn.addEventListener('click', procesarDatosLogistica);
        actionButtons.appendChild(procesarLogisticaBtn);
    }
}

// Variables para datos de logística
let logisticaData = null;

// Manejar selección de archivo de logística
function manejarSeleccionArchivoLogistica(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const logisticaStatus = document.getElementById('logisticaStatus');
    const procesarLogisticaBtn = document.getElementById('procesarLogisticaBtn');
    
    // Mostrar nombre del archivo
    if (logisticaStatus) {
        const fileNameSpan = logisticaStatus.querySelector('.file-name');
        if (fileNameSpan) {
            fileNameSpan.textContent = file.name;
            logisticaStatus.classList.add('active');
        }
    }
    
    // Leer archivo
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            
            logisticaData = jsonData;
            
            if (procesarLogisticaBtn) {
                procesarLogisticaBtn.disabled = false;
            }
            
        } catch (error) {
            console.error('Error al procesar archivo de logística:', error);
            if (processingStatus) {
                processingStatus.textContent = `Error: ${error.message}`;
            }
        }
    };
    
    reader.readAsBinaryString(file);
}

// Procesar datos de logística
async function procesarDatosLogistica() {
    if (!logisticaData || logisticaData.length === 0) {
        alert('No hay datos de logística para procesar');
        return;
    }
    
    try {
        const procesarLogisticaBtn = document.getElementById('procesarLogisticaBtn');
        const processingStatus = document.getElementById('processingStatus');
        
        if (procesarLogisticaBtn) {
            procesarLogisticaBtn.disabled = true;
        }
        
        if (processingStatus) {
            processingStatus.textContent = 'Procesando datos de logística...';
        }
        
        // Guardar en IndexedDB
        await guardarDatosLogistica(logisticaData);
        
        if (processingStatus) {
            processingStatus.textContent = 'Datos de logística procesados exitosamente';
        }
        
        // Limpiar
        document.getElementById('logisticaFile').value = '';
        document.getElementById('logisticaStatus').classList.remove('active');
        logisticaData = null;
        
        if (procesarLogisticaBtn) {
            procesarLogisticaBtn.disabled = true;
        }
        
    } catch (error) {
        console.error('Error al procesar datos de logística:', error);
        if (processingStatus) {
            processingStatus.textContent = `Error: ${error.message}`;
        }
        if (procesarLogisticaBtn) {
            procesarLogisticaBtn.disabled = false;
        }
    }
}

// Guardar datos de logística en IndexedDB
async function guardarDatosLogistica(datos) {
    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(['logistica'], 'readwrite');
            const store = transaction.objectStore('logistica');
            
            // Limpiar datos existentes
            store.clear();
            
            // Añadir fecha de procesamiento a cada registro
            const datosConFecha = datos.map(item => ({
                ...item,
                fechaProcesamiento: new Date()
            }));
            
            // Guardar nuevos datos
            datosConFecha.forEach(item => {
                store.add(item);
            });
            
            transaction.oncomplete = () => {
                resolve({
                    totalRegistros: datos.length
                });
            };
            
            transaction.onerror = (error) => {
                reject(error);
            };
            
        } catch (error) {
            reject(error);
        }
    });
}

// Modificar la función initDB para incluir el almacén de logística
const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ventasDB', 3); // Incrementamos a versión 3
        
        request.onerror = (event) => {
            console.error('Error opening database:', event.target.error);
            reject(event.target.error);
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            loadUploadHistory();
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Crear almacenes existentes si no existen
            if (!db.objectStoreNames.contains('ventas')) {
                const ventasStore = db.createObjectStore('ventas', { 
                    keyPath: 'id',
                    autoIncrement: true 
                });
                ventasStore.createIndex('fecha', 'fecha');
                ventasStore.createIndex('tienda', 'tienda');
                ventasStore.createIndex('razonSocial', 'razonSocial');
            }
            
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
            }
            
            // Añadir store para datos de logística
            if (!db.objectStoreNames.contains('logistica')) {
                const logisticaStore = db.createObjectStore('logistica', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                logisticaStore.createIndex('carrier', 'carrier');
                logisticaStore.createIndex('region', 'region');
                logisticaStore.createIndex('deliveryTime', 'deliveryTime');
                logisticaStore.createIndex('fechaProcesamiento', 'fechaProcesamiento');
            }
        };
    });
};

// Llamada para inicializar la UI de logística
document.addEventListener('DOMContentLoaded', () => {
    // Código existente...
    
    // Añadir UI para carga de logística
    setTimeout(agregarUICargaLogistica, 500);
});