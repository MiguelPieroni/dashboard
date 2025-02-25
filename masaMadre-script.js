const usernameDisplay = document.getElementById('username-display');

function checkSession() {
    const loggedUser = localStorage.getItem('loggedUser');
    if (!loggedUser) {
        window.location.href = 'index.html';
        return;
    }
    if (usernameDisplay) {
        usernameDisplay.textContent = loggedUser;
    }
}

// Llamar a checkSession al inicio
checkSession();


    const usuarios = {
        'Migue': 'migue2000',
        'Factory': '9dejulio974'
    };



// Variables globales y constantes (mantener al inicio)
let archivoProductos = null;
let sucursalesSeleccionadas = new Set();
let worker = null;

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const SUCURSALES_PREDEFINIDAS = {
    CHELSEA: [
        'CHELSE10', 'CHELSE11', 'CHELSE12', 'CHELSE13', 'CHELSE14', 
        'CHELSE15', 'CHELSE23', 'CHELSEA6', 'CHELSEA8', 'CHELSEA9', 
        'CHONLINE'
    ],
    SEVEN: [
        'SEVEN04', 'SEVEN07', 'SEVEN08', 'SEVEN10', 'SEVEN15', 
        'SEVEN17', 'SEVEN19', 'SEVEN23', 'SEVEN25', 'SEVEN26', 
        'SEVEN30', 'SEVEN33', 'SEVEN34', 'SEVEN35', 'SEVEN38', 
        'SEVEN39', 'SEVEN40', 'SEVEN44', 'SEVEN45', 'SEVEN46', 
        'SEVEN49', 'SEVEN50', 'SEVEN68', 'SEVEN69', 'SEVEN71', 
        'SEVEN72', 'SVONLINE'
    ],
    EXIT: [
        'EXIT1', 'EXIT16', 'EXIT17', 'EXIT18', 'EXIT2', 'EXIT3', 
        'EXIT4', 'EXIT5', 'EXIT7'
    ],
    TOP: [
        'TOP03', 'TOP06', 'TOP12', 'TOP16', 'TOP18', 'TOP21', 
        'TOP36', 'TOP41', 'TOP42'
    ],
    CROCS: [
        'CROCS19', 'CROCS20', 'CROCS21', 'CROCS22'
    ],
    OTROS: [
        'DEPOFORT', 'DEPOSEVN', 'FALLAS', 'FALLASVN',
        'LUXURY', 'REEBOK', 'REEBOK24', 'RESERVA', 'RESERSVN'
    ]
};

// Función para inicializar sucursales
function inicializarSucursales() {
    sucursalesSeleccionadas = new Set();
    console.log('Sucursales inicializadas');
}

// Función para inicializar el worker
function inicializarWorker() {
    try {
        if (worker) {
            worker.terminate();
            worker = null;
        }
        
        // Verificar si Worker está soportado
        if (typeof Worker === 'undefined') {
            throw new Error('Web Workers no están soportados en este navegador');
        }

        // Crear el worker con manejo de errores
        worker = new Worker('./excel-worker.js');
        
        if (!worker) {
            throw new Error('No se pudo crear el Web Worker');
        }

        console.log('Worker creado:', worker);

        worker.onmessage = function(e) {
            console.log('Mensaje recibido del worker:', e.data);
            const { tipo, data } = e.data;
            const processingStatus = document.getElementById('processingStatus');
            const procesarBtn = document.getElementById('procesarBtn');
            const progressContainer = document.querySelector('.progress-container');
            const progressFill = document.querySelector('.progress-fill');

            switch (tipo) {
                case 'INICIO_PROCESO':
                    progressContainer.style.display = 'block';
                    actualizarBarraProgreso(0, data.totalChunks);
                    break;

                case 'PROGRESO':
                    const porcentaje = (data.chunk / data.totalChunks) * 100;
                    progressFill.style.width = `${porcentaje}%`;
                    actualizarBarraProgreso(porcentaje, data.totalChunks, data.chunk, data.filasProcesadas);
                    break;

                case 'COMPLETADO':
                    processingStatus.textContent = 'Exportando resultados...';
                    exportarAExcel(data);
                    processingStatus.textContent = 'Proceso completado exitosamente';
                    procesarBtn.disabled = false;
                    progressContainer.style.display = 'none';
                    break;

                case 'ERROR':
                    console.error('Error en el worker:', data);
                    processingStatus.textContent = `Error: ${data}`;
                    procesarBtn.disabled = false;
                    progressContainer.style.display = 'none';
                    break;
            }
        };

        worker.onerror = function(error) {
            console.error('Error en el worker:', error);
            const processingStatus = document.getElementById('processingStatus');
            if (processingStatus) {
                processingStatus.textContent = `Error en el worker: ${error.message}`;
            }
            return false;
        };

        console.log('Worker inicializado correctamente');
        return true;
    } catch (error) {
        console.error('Error al crear el worker:', error);
        const processingStatus = document.getElementById('processingStatus');
        if (processingStatus) {
            processingStatus.textContent = `Error al crear el worker: ${error.message}`;
        }
        return false;
    }
}

// Función para inicializar la interfaz
function inicializarInterfaz() {
    console.log('Inicializando interfaz...');

    // Inicializar worker primero
    if (!inicializarWorker()) {
        console.error('Error al inicializar el worker');
        const processingStatus = document.getElementById('processingStatus');
        if (processingStatus) {
            processingStatus.textContent = 'Error al inicializar el sistema de procesamiento';
        }
        return;
    }

    // Sidebar
    const sidebar = document.getElementById('sidebar');
    const toggleSidebar = document.getElementById('toggle-sidebar');
    const mainContent = document.getElementById('main-content');
    const footer = document.querySelector('.footer');

    if (toggleSidebar) {
        toggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
            footer.classList.toggle('expanded');
        });
    }

    // File input
    const productoFileInput = document.getElementById('productoFile');
    console.log('File input encontrado:', !!productoFileInput);

    if (productoFileInput) {
        productoFileInput.addEventListener('change', manejarSeleccionArchivo);
        console.log('Event listener agregado al input file');
    }

    // Sucursales buttons
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', seleccionarTodasSucursales);
    }
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', deseleccionarTodasSucursales);
    }

    // Procesar button
    const procesarBtn = document.getElementById('procesarBtn');
    if (procesarBtn) {
        procesarBtn.addEventListener('click', procesarArchivo);
        procesarBtn.disabled = true; // Deshabilitar inicialmente
    }

    // Ocultar sección de sucursales
    const sucursalesSection = document.querySelector('.sucursales-section');
    if (sucursalesSection) {
        sucursalesSection.style.display = 'none';
    }

    // Inicializar sucursales
    inicializarSucursales();
}

// Actualizar barra de progreso
function actualizarBarraProgreso(porcentaje, totalChunks, chunkActual, filasProcesadas) {
    const progressText = document.querySelector('.progress-text');
    if (progressText) {
        progressText.textContent = `Procesando chunk ${chunkActual} de ${totalChunks} (${filasProcesadas} filas procesadas)`;
    }
}

// Event Listener principal
document.addEventListener('DOMContentLoaded', () => {
    inicializarInterfaz();
});

// Función para manejar la selección de archivo
async function manejarSeleccionArchivo(event) {
    console.log('Evento de selección de archivo activado:', event.target.files[0]);

    const file = event.target.files[0];
    if (!file) {
        console.log('No se seleccionó ningún archivo');
        return;
    }

    console.log('Archivo seleccionado:', file.name);

    try {
        archivoProductos = file;
        const productoStatus = document.getElementById('productoStatus');
        const processingStatus = document.getElementById('processingStatus');

        console.log('Elementos del DOM:', {
            productoStatus: !!productoStatus,
            processingStatus: !!processingStatus
        });

        // Limpiar estado anterior
        if (processingStatus) {
            processingStatus.innerHTML = '';
        }

        // Mostrar nombre del archivo
        if (productoStatus) {
            const fileNameSpan = productoStatus.querySelector('.file-name');
            console.log('FileNameSpan encontrado:', !!fileNameSpan);

            if (fileNameSpan) {
                fileNameSpan.textContent = file.name;
                productoStatus.classList.add('active');
            }
        }

        // Verificar tamaño del archivo
        if (file.size > MAX_FILE_SIZE) {
            console.log('Archivo grande detectado:', file.size);
            const warningContainer = document.createElement('div');
            warningContainer.innerHTML = mostrarAdvertenciaArchivo(file.size);
            if (processingStatus) {
                processingStatus.appendChild(warningContainer);
            }
        }

        // Leer sucursales del archivo
        const sucursalesArchivo = await leerSucursalesArchivo(file);
        console.log('Sucursales encontradas en archivo:', sucursalesArchivo);
        activarSucursalesEncontradas(sucursalesArchivo);
    } catch (error) {
        console.error('Error en manejarSeleccionArchivo:', error);
    }
}

// Función para leer sucursales del archivo
async function leerSucursalesArchivo(file) {
    try {
        const buffer = await file.arrayBuffer();
        console.log('Buffer leído correctamente');

        const workbook = XLSX.read(new Uint8Array(buffer), {
            type: 'array',
            cellDates: false,
            cellNF: false,
            cellText: true,
        });
        console.log('Workbook cargado');

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        console.log('Primera hoja seleccionada:', workbook.SheetNames[0]);

        // Convertir a JSON
        const data = XLSX.utils.sheet_to_json(firstSheet, {
            header: 1, // Leer con encabezados como primera fila
            raw: true,
            defval: '',
        });

        if (!data || data.length <= 1) {
            throw new Error('No se encontraron datos en el archivo');
        }

        // Buscar índice de la columna Sucursal
        const headers = data[0];
        console.log('Encabezados detectados:', headers);
        const sucursalIndex = headers.findIndex(header =>
            header && header.toString().trim().toLowerCase() === 'sucursal'
        );

        if (sucursalIndex === -1) {
            throw new Error('No se encontró la columna "Sucursal" en el archivo');
        }

        // Obtener sucursales únicas
        const sucursales = new Set();
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row && row[sucursalIndex]) {
                const sucursal = row[sucursalIndex].toString().trim();
                console.log('Sucursal detectada:', sucursal);
                sucursales.add(sucursal); // Agregar sucursal única al conjunto
            }
        }

        return Array.from(sucursales).sort(); // Retornar sucursales únicas ordenadas
    } catch (error) {
        console.error('Error al leer sucursales:', error);
        throw new Error(`Error al leer sucursales: ${error.message}`);
    }
}


// Función para actualizar estado del botón procesar
function actualizarEstadoBotonProcesar() {
    const procesarBtn = document.getElementById('procesarBtn');
    if (procesarBtn) {
        procesarBtn.disabled = !archivoProductos || sucursalesSeleccionadas.size === 0;
        console.log('Estado del botón procesar:', procesarBtn.disabled);
    }
}

// Funciones para manejar selección de sucursales
function seleccionarTodasSucursales() {
    document.querySelectorAll('.sucursal-checkbox input[type="checkbox"]:not([style*="display: none"])')
        .forEach(checkbox => {
            console.log('Seleccionando sucursal:', checkbox.value);
            checkbox.checked = true;
            sucursalesSeleccionadas.add(checkbox.value);
        });
    actualizarEstadoBotonProcesar();
}

function deseleccionarTodasSucursales() {
    document.querySelectorAll('.sucursal-checkbox input[type="checkbox"]')
        .forEach(checkbox => {
            console.log('Deseleccionando sucursal:', checkbox.value);
            checkbox.checked = false;
            sucursalesSeleccionadas.delete(checkbox.value);
        });
    actualizarEstadoBotonProcesar();
}

function actualizarSucursalesSeleccionadas(event) {
    const checkbox = event.target;
    console.log('Actualizando sucursal:', checkbox.value, 'Estado:', checkbox.checked);
    if (checkbox.checked) {
        sucursalesSeleccionadas.add(checkbox.value);
    } else {
        sucursalesSeleccionadas.delete(checkbox.value);
    }
    actualizarEstadoBotonProcesar();
}

// Función para procesar archivo
async function procesarArchivo() {
    const procesarBtn = document.getElementById('procesarBtn');
    const processingStatus = document.getElementById('processingStatus');

    try {
        if (!archivoProductos) {
            throw new Error('No se ha seleccionado ningún archivo');
        }

        procesarBtn.disabled = true;
        processingStatus.textContent = 'Iniciando procesamiento...';

        const buffer = await archivoProductos.arrayBuffer();
        worker.postMessage({
            tipo: 'PROCESAR_ARCHIVO',
            data: {
                buffer: buffer,
                sucursales: Array.from(sucursalesSeleccionadas)
            }
        }, [buffer]);

    } catch (error) {
        console.error('Error al procesar archivo:', error);
        processingStatus.textContent = `Error: ${error.message}`;
        procesarBtn.disabled = false;
    }
}

// Función para mostrar advertencia de archivo grande
function mostrarAdvertenciaArchivo(fileSize) {
    const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    return `
        <div class="alert-warning">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <h4>Advertencia: Archivo Grande (${sizeMB} MB)</h4>
                <p>El archivo seleccionado es grande y podría causar problemas de rendimiento.</p>
                <p>Recomendaciones para procesar el archivo:</p>
                <ul>
                    <li>Divida el archivo en partes más pequeñas (máximo 50MB)</li>
                    <li>Procese por grupos de sucursales separados</li>
                    <li>Para dividir el archivo:
                        <ol>
                            <li>Abra el archivo en Excel</li>
                            <li>Divida los datos en múltiples hojas</li>
                            <li>Guarde cada hoja como un archivo separado</li>
                            <li>Procese cada archivo por separado</li>
                        </ol>
                    </li>
                </ul>
            </div>
        </div>
    `;
}

function activarSucursalesEncontradas(sucursalesArchivo) {
    console.log('Activando sucursales encontradas:', sucursalesArchivo);

    const sucursalesSection = document.querySelector('.sucursales-section');
    if (!sucursalesSection) {
        console.error('No se encontró la sección de sucursales en el DOM');
        return;
    }

    // Limpiar cualquier sucursal previa en la interfaz
    sucursalesSection.querySelectorAll('.sucursal-group').forEach(group => {
        const sucursalesList = group.querySelector('.sucursales-list');
        if (sucursalesList) {
            sucursalesList.innerHTML = ''; // Limpiar elementos previos
        }
    });

    const sucursalesSet = new Set(sucursalesArchivo);
    let hayCoincidencias = false;

    // Activar grupos y crear checkboxes para sucursales
    Object.entries(SUCURSALES_PREDEFINIDAS).forEach(([grupo, sucursales]) => {
        const grupoDiv = Array.from(sucursalesSection.querySelectorAll('.sucursal-group'))
            .find(div => div.querySelector('h4')?.textContent === grupo);

        if (!grupoDiv) return;

        const sucursalesCoincidentes = sucursales.filter(s => sucursalesSet.has(s));
        if (sucursalesCoincidentes.length > 0) {
            hayCoincidencias = true;
            grupoDiv.style.display = 'block';

            const sucursalesList = grupoDiv.querySelector('.sucursales-list');
            if (sucursalesList) {
                sucursalesCoincidentes.forEach(sucursal => {
                    // Crear checkbox para la sucursal
                    const checkboxDiv = document.createElement('div');
                    checkboxDiv.classList.add('sucursal-checkbox');

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `sucursal-${sucursal}`;
                    checkbox.value = sucursal;
                    checkbox.addEventListener('change', actualizarSucursalesSeleccionadas);

                    const label = document.createElement('label');
                    label.setAttribute('for', `sucursal-${sucursal}`);
                    label.textContent = sucursal;

                    checkboxDiv.appendChild(checkbox);
                    checkboxDiv.appendChild(label);
                    sucursalesList.appendChild(checkboxDiv);
                });
            }
        }
    });

    // Mostrar sección si hay coincidencias
    sucursalesSection.style.display = hayCoincidencias ? 'block' : 'none';
    if (!hayCoincidencias) {
        console.log('No se encontraron coincidencias en las sucursales');
    }
}

// Función para exportar a Excel
function exportarAExcel(data) {
    try {
        // Crear un nuevo libro de trabajo
        const wb = XLSX.utils.book_new();
        
        // Convertir los datos a una hoja de trabajo
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Agregar la hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, 'Análisis');

        // Generar el archivo y descargarlo
        const fechaActual = new Date().toISOString().slice(0,10);
        const nombreArchivo = `Analisis_MasaMadre_${fechaActual}.xlsx`;
        
        XLSX.writeFile(wb, nombreArchivo);
        
        console.log('Archivo exportado exitosamente:', nombreArchivo);
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        const processingStatus = document.getElementById('processingStatus');
        if (processingStatus) {
            processingStatus.textContent = `Error al exportar archivo: ${error.message}`;
        }
    }
}
