// Inicializar Flatpickr
// Al inicio del documento
document.addEventListener('DOMContentLoaded', function() {
    // Configuración común para el calendario
    const configCalendario = {
        locale: 'es',
        dateFormat: "Y-m-d",
        maxDate: 'today',
        disableMobile: false,
        allowInput: true,
        theme: "airbnb"
    };

    // Inicializar calendario "Desde"
    const calendarioDesde = flatpickr("#dateFrom1", {
        ...configCalendario,
        onChange: function(selectedDates) {
            // Actualizar fecha mínima del calendario "Hasta"
            if (selectedDates[0]) {
                calendarioHasta.set('minDate', selectedDates[0]);
            }
        }
    });

    // Inicializar calendario "Hasta"
    const calendarioHasta = flatpickr("#dateTo1", {
        ...configCalendario,
        onChange: function(selectedDates) {
            // Actualizar fecha máxima del calendario "Desde"
            if (selectedDates[0]) {
                calendarioDesde.set('maxDate', selectedDates[0]);
            }
        }
    });
});

// Variables globales
let filtrosActuales = {
    fechaDesde1: null,
    fechaHasta1: null,
    razonSocial: 'all',
    tiendas: []
};

// Registrar plugin de DataLabels
Chart.register(ChartDataLabels);

// Funciones de formato
const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const formatQuantity = (value) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const formatPercentage = (value) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(value / 100);
};

// Función para agregar toggles (valores y líneas de cuadrícula) a cualquier gráfico
function addValueAndGridToggles(container) {
    if (!container || !container.chart) return;

    // Verificar si ya existe un contenedor de controles para evitar duplicados
    let controlsContainer = container.parentElement.querySelector('.chart-controls');
    if (!controlsContainer) {
        controlsContainer = document.createElement('div');
        controlsContainer.className = 'chart-controls';
        controlsContainer.style.cssText = `
            display: flex;
            gap: 10px;
            margin-top: 10px;
            flex-wrap: wrap;
        `;
        container.parentElement.appendChild(controlsContainer);
    }

    // Botón para Mostrar/Ocultar Valores
    const toggleValuesButton = document.createElement('button');
    const updateValuesButtonText = () => {
        toggleValuesButton.textContent = container.chart.options.plugins.datalabels.display
            ? 'Ocultar Valores'
            : 'Mostrar Valores';
    };
    updateValuesButtonText();
    toggleValuesButton.style.cssText = `
        background-color: #4CAF50;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    `;
    toggleValuesButton.addEventListener('click', () => {
        const display = !container.chart.options.plugins.datalabels.display;
        container.chart.options.plugins.datalabels.display = display;
        updateValuesButtonText();
        container.chart.update();
    });

    // Botón para Alternar Líneas Verticales
    const toggleXGridButton = document.createElement('button');
    const updateXGridButtonText = () => {
        const allHidden = Object.keys(container.chart.options.scales)
            .filter(key => key.startsWith('x'))
            .every(key => !container.chart.options.scales[key].grid.display);
        toggleXGridButton.textContent = allHidden
            ? 'Mostrar Líneas V'
            : 'Ocultar Líneas V';
    };
    updateXGridButtonText();
    toggleXGridButton.style.cssText = `
        background-color: #2196F3;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    `;
    toggleXGridButton.addEventListener('click', () => {
        const allHidden = Object.keys(container.chart.options.scales)
            .filter(key => key.startsWith('x'))
            .every(key => !container.chart.options.scales[key].grid.display);
        Object.keys(container.chart.options.scales)
            .filter(key => key.startsWith('x'))
            .forEach(key => {
                container.chart.options.scales[key].grid.display = allHidden; // Alternar todas las líneas x
            });
        updateXGridButtonText();
        container.chart.update();
    });

    // Botón para Alternar Líneas Horizontales
    const toggleYGridButton = document.createElement('button');
    const updateYGridButtonText = () => {
        const allHidden = Object.keys(container.chart.options.scales)
            .filter(key => key.startsWith('y'))
            .every(key => !container.chart.options.scales[key].grid.display);
        toggleYGridButton.textContent = allHidden
            ? 'Mostrar Líneas H'
            : 'Ocultar Líneas H';
    };
    updateYGridButtonText();
    toggleYGridButton.style.cssText = `
        background-color: #F44336;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    `;
    toggleYGridButton.addEventListener('click', () => {
        const allHidden = Object.keys(container.chart.options.scales)
            .filter(key => key.startsWith('y'))
            .every(key => !container.chart.options.scales[key].grid.display);
        Object.keys(container.chart.options.scales)
            .filter(key => key.startsWith('y'))
            .forEach(key => {
                container.chart.options.scales[key].grid.display = allHidden; // Alternar todas las líneas y
            });
        updateYGridButtonText();
        container.chart.update();
    });

    // Botón para Alternar Ticks (valores de los ejes)
    const toggleTicksButton = document.createElement('button');
    const updateTicksButtonText = () => {
        const allHidden = Object.keys(container.chart.options.scales)
            .every(key => !container.chart.options.scales[key].ticks.display);
        toggleTicksButton.textContent = allHidden
            ? 'Mostrar Ticks'
            : 'Ocultar Ticks';
    };
    updateTicksButtonText();
    toggleTicksButton.style.cssText = `
        background-color: #FF9800;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    `;
    toggleTicksButton.addEventListener('click', () => {
        const allHidden = Object.keys(container.chart.options.scales)
            .every(key => !container.chart.options.scales[key].ticks.display);
        Object.keys(container.chart.options.scales)
            .forEach(key => {
                container.chart.options.scales[key].ticks.display = allHidden; // Alternar todos los ticks
            });
        updateTicksButtonText();
        container.chart.update();
    });

    // Limpiar controles existentes y agregar los nuevos
    controlsContainer.innerHTML = '';
    controlsContainer.appendChild(toggleValuesButton);
    controlsContainer.appendChild(toggleXGridButton);
    controlsContainer.appendChild(toggleYGridButton);
    controlsContainer.appendChild(toggleTicksButton);
}

// Configuración base actualizada
// 1. Primero, modificamos la configuración base para mejorar el espaciado de las etiquetas
const baseChartConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            align: 'end',
            labels: {
                padding: 20,        // Aumentado de 15
                usePointStyle: true,
                font: { size: 12 }  // Aumentado de 11
            }
        },
        datalabels: {
            display: false,
            color: 'black',
            font: { size: 11 },
            formatter: function(value, context) {
                if (context.dataset.isCantidad) {
                    return value.toLocaleString();
                }
                return formatoPeso(value);
            },
            anchor: function(context) {
                // Ajustar el anclaje dependiendo del tipo de gráfico
                if (context.chart.config.type === 'bar') {
                    return context.dataset.yAxisID === 'y1' ? 'end' : 'end';
                }
                return context.dataset.isCantidad ? 'end' : 'start';
            },
            align: function(context) {
                // Ajustar la alineación dependiendo del tipo de gráfico
                if (context.chart.config.type === 'bar') {
                    return context.dataset.yAxisID === 'y1' ? 'top' : 'top';
                }
                return context.dataset.isCantidad ? 'bottom' : 'bottom';
            },
            offset: function(context) {
                // Ajustar el offset para evitar superposiciones
                if (context.chart.config.type === 'bar') {
                    return context.dataset.yAxisID === 'y1' ? 20 : -20;
                }
                return context.dataset.isCantidad ? 20 : -20;
            },
            rotation: function(context) {
                // Rotar las etiquetas si es necesario
                if (context.chart.config.type === 'bar') {
                    return 0;
                }
                return 0;
            },
            
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: window.innerWidth <= 768 ? 'bottom' : 'top',
                    labels: {
                        boxWidth: window.innerWidth <= 768 ? 8 : 12,
                        padding: window.innerWidth <= 768 ? 10 : 20,
                        font: { 
                            size: window.innerWidth <= 768 ? 10 : 12 
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: window.innerWidth <= 768 ? 8 : 10
                        },
                        maxRotation: window.innerWidth <= 768 ? 45 : 0
                    }
                },
                y: {
                    ticks: {
                        font: {
                            size: window.innerWidth <= 768 ? 8 : 10
                        }
                    }
                }
            }
        }
    }
};

// Aplicar configuraciones específicas para cada tipo de gráfico
function getChartSpecificOptions(chartType) {
    const options = { ...baseChartConfig };
    
    if (chartType === 'bar' || chartType === 'line') {
        options.scales = {
            ...baseChartConfig.scales,
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    padding: 5,
                    font: { size: 10 }
                },
                grid: {
                    display: false
                }
            }
        };
    }
    
    return options;
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    setupEventListeners();
    loadInitialData();
});



// Función de utilidad para convertir fechas de Excel
function excelDateToJSDate(excelDate) {
    if (!excelDate) return null;
    
    // Si ya es un objeto Date, devolverlo
    if (excelDate instanceof Date) return excelDate;
    
    // Si es un string, intentar parsearlo
    if (typeof excelDate === 'string') {
        const parsed = new Date(excelDate);
        if (!isNaN(parsed.getTime())) return parsed;
    }
    
    // Si es un número, convertirlo desde fecha de Excel
    if (typeof excelDate === 'number') {
        // Excel usa un sistema donde 1 es el 1 de enero de 1900
        // Javascript usa milisegundos desde el 1 de enero de 1970
        return new Date((excelDate - 25569) * 86400 * 1000);
    }
    
    return null;
}


function setupEventListeners() {
    document.getElementById('dateFrom1').addEventListener('change', actualizarFiltros);
    document.getElementById('dateTo1').addEventListener('change', actualizarFiltros);
    document.getElementById('razonSocial').addEventListener('change', actualizarTiendas);
    document.getElementById('tienda').addEventListener('change', actualizarFiltros);
    document.getElementById('aplicarFiltros').addEventListener('click', aplicarFiltros);
    document.getElementById('generarReporte').addEventListener('click', generarReporte);
}

async function aplicarFiltros() {
    try {
        // Deshabilitar el botón mientras se procesan los filtros
        const aplicarFiltrosBtn = document.getElementById('aplicarFiltros');
        aplicarFiltrosBtn.disabled = true;

        // Actualizar los filtros
        await actualizarFiltros();

        // Obtener los datos filtrados
        const datos = await getDatosFiltrados();

        // Actualizar todas las visualizaciones
        await Promise.all([
            actualizarKPIs(datos),
            crearGraficoTendencias(datos),
            crearGraficoMarcas(datos),
            crearGraficoCategorias(datos),
            crearGraficoEdades(datos),
            crearGraficoHorarios(datos),
            crearGraficoMarketplace(datos),
            crearGraficoLogistica(datos, true), // Pasamos true para usar datos de prueba
            crearGraficoTendenciaCompra(datos)
        ]);

        // Habilitar el botón nuevamente
        aplicarFiltrosBtn.disabled = false;

    } catch (error) {
        console.error('Error al aplicar filtros:', error);
        mostrarError('Error al actualizar el dashboard');
        // Asegurarse de que el botón se habilite incluso si hay un error
        document.getElementById('aplicarFiltros').disabled = false;
    }
}

function hayFiltrosActivos() {
    const tieneFiltrosFecha = Boolean(filtrosActuales.fechaDesde1 || filtrosActuales.fechaHasta1);
    const tieneRazonSocial = filtrosActuales.razonSocial !== 'all';
    const tieneTiendas = filtrosActuales.tiendas.length > 0 && !filtrosActuales.tiendas.includes('Todo');

    console.log('Estado de filtros:', {
        fechas: tieneFiltrosFecha,
        razonSocial: tieneRazonSocial,
        tiendas: tieneTiendas,
        filtrosActuales
    });

    return tieneFiltrosFecha || tieneRazonSocial || tieneTiendas;
}

// Inicializar IndexedDB
async function initDB() {
    return new Promise((resolve, reject) => {
        console.log('Inicializando base de datos...');
        const request = indexedDB.open('ventasDB', 2); // Actualizamos a versión 2
        
        request.onerror = (event) => {
            console.error('Error al abrir la base de datos:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            console.log('Base de datos inicializada correctamente');
            db = event.target.result;
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
}

// Función para crear el gráfico de tendencias
async function crearGraficoTendencias(datos) {
    const container = document.getElementById('graficoTendencias');
    if (!container) return;

    container.style.height = '1000px';
    
    setupLargeChartContainer(container);

    // Asegurarse de que todos los datos tengan fechas válidas
    const datosValidos = datos.filter(venta => venta.Fecha != null);
    
    const ventasPorFecha = datosValidos.reduce((acc, venta) => {
        try {
            const fechaJS = excelDateToJSDate(venta.Fecha);
            if (!fechaJS) return acc;
            
            const fecha = fechaJS.toISOString().split('T')[0];
            acc[fecha] = acc[fecha] || { total: 0, cantidad: 0 };
            acc[fecha].total += parseFloat(venta.Total || 0);
            acc[fecha].cantidad += parseFloat(venta.Cantidad || 1);
            return acc;
        } catch (error) {
            console.warn('Error procesando fecha:', error);
            return acc;
        }
    }, {});

    const datosOrdenados = Object.entries(ventasPorFecha)
        .map(([fecha, datos]) => ({
            fecha,
            total: datos.total,
            cantidad: datos.cantidad
        }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha));

    if (container.chart) {
        container.chart.destroy();
    }

    // Limpiar controles existentes antes de agregar nuevos
    const controlsContainer = container.parentElement?.querySelector('.chart-controls');
    if (controlsContainer) {
        controlsContainer.remove();
    }

    const options = {
        ...baseChartConfig,
        plugins: {
            ...baseChartConfig.plugins,
            title: {
                display: false,
                text: 'Tendencia de Ventas',
                font: { size: 16, weight: 'bold' }
            },
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    usePointStyle: true,
                    padding: 20
                }
            }
        },
        scales: {
            y: {
                type: 'linear',
                position: 'left',
                title: {
                    display: false,
                    text: 'Ventas ($)'
                },
                ticks: {
                    callback: value => formatoPeso(value)
                }
            },
            y1: {
                type: 'linear',
                position: 'right',
                title: {
                    display: false,
                    text: 'Cantidad'
                },
                grid: {
                    drawOnChartArea: false
                },
                ticks: {
                    callback: value => value.toLocaleString()
                }
            }
        }
    };

    container.chart = new Chart(container, {
        type: 'line',
        data: {
            labels: datosOrdenados.map(d => formatearFecha(d.fecha)),
            datasets: [
                {
                    label: 'Ventas ($)',
                    data: datosOrdenados.map(d => Math.round(d.total)),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    yAxisID: 'y',
                    fill: true
                },
                {
                    label: 'Cantidad',
                    data: datosOrdenados.map(d => d.cantidad),
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    yAxisID: 'y1',
                    fill: true,
                    isCantidad: true
                }
            ]
        },
        options: options
    });

    addValueAndGridToggles(container);
}

// Función para actualizar KPIs
async function actualizarKPIs(datos) {
    const container = document.getElementById('resumenNumerico');
    if (!container) return;

    // Calcular todos los KPIs
    const kpis = {
        totalVentas: datos.reduce((sum, venta) => sum + parseFloat(venta.Total || 0), 0),
        cantidadTransacciones: new Set(datos.map(venta => venta.Comprobante)).size,
        cantidadProductos: datos.reduce((sum, venta) => sum + parseFloat(venta.Cantidad || 1), 0),
        ticketPromedio: 0
    };

    // VTEX (NUEVO) - Suma datos de Factory (Seven) y Fortaleza (Chelsea/Exit)
    const vtexVentas = datos.filter(venta => 
        // De Factory: Seven (excluir Seven Meli y Seven Bapro)
        (venta.razonSocial === 'Factory' && venta.tienda === 'Seven') || 
        // De Fortaleza: Chelsea y Exit (excluir Chelsea Meli y Chelsea Bapro)
        (venta.razonSocial === 'Fortaleza' && (venta.tienda === 'Chelsea' || venta.tienda === 'Exit'))
    ).reduce((sum, venta) => sum + parseFloat(venta.Total || 0), 0);

    const vtexTransacciones = new Set(datos.filter(venta => 
        (venta.razonSocial === 'Factory' && venta.tienda === 'Seven') || 
        (venta.razonSocial === 'Fortaleza' && (venta.tienda === 'Chelsea' || venta.tienda === 'Exit'))
    ).map(venta => venta.Comprobante)).size;

    const vtexProductos = datos.filter(venta => 
        (venta.razonSocial === 'Factory' && venta.tienda === 'Seven') || 
        (venta.razonSocial === 'Fortaleza' && (venta.tienda === 'Chelsea' || venta.tienda === 'Exit'))
    ).reduce((sum, venta) => sum + parseFloat(venta.Cantidad || 1), 0);

    const vtexTicket = vtexTransacciones > 0 ? vtexVentas / vtexTransacciones : 0;

    // Mercado Libre
    const meliVentas = datos.filter(venta => 
        venta.tienda && venta.tienda.includes('Meli')
    ).reduce((sum, venta) => sum + parseFloat(venta.Total || 0), 0);

    const meliTransacciones = new Set(datos.filter(venta => 
        venta.tienda && venta.tienda.includes('Meli')
    ).map(venta => venta.Comprobante)).size;

    const meliProductos = datos.filter(venta => 
        venta.tienda && venta.tienda.includes('Meli')
    ).reduce((sum, venta) => sum + parseFloat(venta.Cantidad || 1), 0);

    const meliTicket = meliTransacciones > 0 ? meliVentas / meliTransacciones : 0;

    // Banco Provincia
    const baproVentas = datos.filter(venta => 
        venta.tienda && venta.tienda.includes('Bapro')
    ).reduce((sum, venta) => sum + parseFloat(venta.Total || 0), 0);

    const baproTransacciones = new Set(datos.filter(venta => 
        venta.tienda && venta.tienda.includes('Bapro')
    ).map(venta => venta.Comprobante)).size;

    const baproProductos = datos.filter(venta => 
        venta.tienda && venta.tienda.includes('Bapro')
    ).reduce((sum, venta) => sum + parseFloat(venta.Cantidad || 1), 0);

    const baproTicket = baproTransacciones > 0 ? baproVentas / baproTransacciones : 0;

    // Calcular ticket promedio general
    kpis.ticketPromedio = kpis.cantidadTransacciones > 0 ? 
        kpis.totalVentas / kpis.cantidadTransacciones : 0;

    container.innerHTML = `
        <div class="resumen-container">
            <!-- KPIs Generales -->
            <div class="kpi-section generales">
                <h2>Métricas Generales</h2>
                <div class="kpi-grid">
                    <div class="resumen-card">
                        <h3>Total Ventas</h3>
                        <p>$${kpis.totalVentas.toLocaleString('es-AR', {maximumFractionDigits: 2})}</p>
                    </div>
                    <div class="resumen-card">
                        <h3>Transacciones</h3>
                        <p>${kpis.cantidadTransacciones.toLocaleString('es-AR')}</p>
                    </div>
                    <div class="resumen-card">
                        <h3>Productos Vendidos</h3>
                        <p>${kpis.cantidadProductos.toLocaleString('es-AR')}</p>
                    </div>
                    <div class="resumen-card">
                        <h3>Ticket Promedio</h3>
                        <p>$${kpis.ticketPromedio.toLocaleString('es-AR', {maximumFractionDigits: 2})}</p>
                    </div>
                </div>
            </div>

            <!-- KPIs VTEX (NUEVO) -->
            <div class="kpi-section vtex">
                <h2>VTEX</h2>
                <div class="kpi-grid">
                    <div class="resumen-card">
                        <h3>Ventas VTEX</h3>
                        <p>$${vtexVentas.toLocaleString('es-AR', {maximumFractionDigits: 2})}</p>
                    </div>
                    <div class="resumen-card">
                        <h3>Transacciones</h3>
                        <p>${vtexTransacciones.toLocaleString('es-AR')}</p>
                    </div>
                    <div class="resumen-card">
                        <h3>Productos Vendidos</h3>
                        <p>${vtexProductos.toLocaleString('es-AR')}</p>
                    </div>
                    <div class="resumen-card">
                        <h3>Ticket Promedio</h3>
                        <p>$${vtexTicket.toLocaleString('es-AR', {maximumFractionDigits: 2})}</p>
                    </div>
                </div>
            </div>

            <!-- KPIs Mercado Libre -->
            <div class="kpi-section meli">
                <h2>Mercado Libre</h2>
                <div class="kpi-grid">
                    <div class="resumen-card">
                        <h3>Ventas Meli</h3>
                        <p>$${meliVentas.toLocaleString('es-AR', {maximumFractionDigits: 2})}</p>
                    </div>
                    <div class="resumen-card">
                        <h3>Transacciones</h3>
                        <p>${meliTransacciones.toLocaleString('es-AR')}</p>
                    </div>
                    <div class="resumen-card">
                        <h3>Productos Vendidos</h3>
                        <p>${meliProductos.toLocaleString('es-AR')}</p>
                    </div>
                    <div class="resumen-card">
                        <h3>Ticket Promedio</h3>
                        <p>$${meliTicket.toLocaleString('es-AR', {maximumFractionDigits: 2})}</p>
                    </div>
                </div>
            </div>

            <!-- KPIs Banco Provincia -->
            <div class="kpi-section bapro">
                <h2>Banco Provincia</h2>
                <div class="kpi-grid">
                    <div class="resumen-card">
                        <h3>Ventas Bapro</h3>
                        <p>$${baproVentas.toLocaleString('es-AR', {maximumFractionDigits: 2})}</p>
                    </div>
                    <div class="resumen-card">
                        <h3>Transacciones</h3>
                        <p>${baproTransacciones.toLocaleString('es-AR')}</p>
                    </div>
                    <div class="resumen-card">
                        <h3>Productos Vendidos</h3>
                        <p>${baproProductos.toLocaleString('es-AR')}</p>
                    </div>
                    <div class="resumen-card">
                        <h3>Ticket Promedio</h3>
                        <p>$${baproTicket.toLocaleString('es-AR', {maximumFractionDigits: 2})}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function validarDatosVenta(venta) {
    return venta && 
           typeof venta === 'object' && 
           venta.tienda && 
           typeof venta.tienda === 'string';
}

// Diccionario de nombres de marcas
const marcasNombres = {
    'ADIDAS ARGENTINA SA': 'adidas svn',
    'UNISOL SA': 'Puma svn',
    'GRIMOLDI S.A.(VANS)': 'Vans',
    'KAPPA  (DISTRINANDO)': 'Kappa',
    'NIKE ARGENTINA S.R.L.': 'Nike svn',
    'ASICS ARGENTINA SA (DASS)': 'Asics',
    'SPORT ICON S.A NEW BALANCE': 'New Balance',
    'PAMPERO ALPARGATAS CALZADOS SA': 'Alpargatas',
    'LE COQ SPORTIF': 'Le Coq Sportif',
    'FILA (DASS ARGENTINA SRL)': 'Fila',
    'UMBRO (DASS ARGENTINA SRL)': 'Umbro',
    // chelsea abajo
    'ADIDAS ARGENTINA S.A (GROUP)': 'adidas csh',
    'NIKE ARGENTINA S.R.L': 'Nike csh',
    'PUMA(UNISOL S.A)': 'Puma csh',
    'VANS(GRIMOLDI S.A)': 'Vans csh',
    'REEBOK (Distrinando S A)': 'Reebok csh',
    'PAMPERO ALPARGATAS CALZADOS SA': 'Alpargatas',
    'LE COQ SPORTIF': 'Le Coq Sportif',
    'TOPPER ALPARGATAS CALZADOS SA': 'Topper'
    // Agregar más mapeos según sea necesario
};

async function crearGraficoMarcas(datos) {
    const container = document.getElementById('graficoMarcas');
    if (!container) return;

    setupChartContainer(container);
    
    // Aumentar altura significativamente
    container.style.height = '700px';
    container.style.maxWidth = '100%';
    container.style.width = '100%';
    container.style.padding = '0'; // Añadir esto
    
    const ventasPorMarca = datos.reduce((acc, venta) => {
        // Usar el diccionario de nombres o el nombre original si no existe en el diccionario
        const marca = marcasNombres[venta.Proveedor] || venta.Proveedor || 'Sin Marca';
        if (!acc[marca]) {
            acc[marca] = { ventas: 0, cantidad: 0 };
        }
        acc[marca].ventas += parseFloat(venta.Total || 0);
        acc[marca].cantidad += parseFloat(venta.Cantidad || 1);
        return acc;
    }, {});

    const topMarcas = Object.entries(ventasPorMarca)
        .sort(([,a], [,b]) => b.ventas - a.ventas)
        .slice(0, 10);

    if (container.chart) {
        container.chart.destroy();
    }

    const chartConfig = {
        ...baseChartConfig,
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    padding: 10,
                    font: { size: 10 }
                }
            },
            y: {
                type: 'linear',
                position: 'left',
                ticks: {
                    callback: value => formatoPeso(value)
                }
            },
            y1: {
                type: 'linear',
                position: 'right',
                grid: {
                    drawOnChartArea: false
                },
                ticks: {
                    callback: value => value.toLocaleString()
                }
            }
        }
    };

    container.chart = new Chart(container, {
        type: 'bar',
        data: {
            labels: topMarcas.map(([marca]) => marca),
            datasets: [
                {
                    label: 'Ventas',
                    data: topMarcas.map(([,data]) => Math.round(data.ventas)),
                    backgroundColor: '#4CAF50',
                    order: 1,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                },
                {
                    label: 'Cantidad',
                    data: topMarcas.map(([,data]) => data.cantidad),
                    type: 'line',
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    yAxisID: 'y1',
                    order: 0,
                    isCantidad: true,
                    tension: 0.4
                }
            ]
        },
        options: chartConfig
    });

    addValueAndGridToggles(container);
}

// Función para formatear moneda
function formatoPeso(valor) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(valor);
}

// Configuración base mejorada para las dimensiones de los gráficos
Chart.defaults.plugins.datalabels.offset = 15; // Aumentar el offset global
Chart.defaults.plugins.datalabels.align = 'top';

// Función base para configurar contenedores de gráficos
function setupChartContainer(container) {
    if (!container) {
        console.warn('Container no encontrado');
        return;
    }
    
    container.style.cssText = `
        height: 400px;
        width: 100%;
        max-width: 100%;
        position: relative;
        margin: 10px 0;
        padding: 0;
    `;
}

function setupLargeChartContainer(container) {
    if (!container) return;
    
    container.style.cssText = `
        height: 500px;      // Aumentado de 450px
        width: 100%;
        max-width: 100%;
        position: relative;
        margin: 15px 0;     // Aumentado el margen
        padding: 20px;      // Aumentado el padding
    `;
}

// Ajustes específicos por tipo de gráfico
async function crearGraficoCategorias(datos) {
    const container = document.getElementById('graficoCategorias');
    if (!container) {
        console.warn('Contenedor para el gráfico de categorías no encontrado');
        return;
    }

    // Guardamos una referencia a los datos originales para poder cambiar la vista sin recargar
    // Solo actualizamos los datos si se proporciona un nuevo conjunto de datos
    if (datos) {
        container.originalData = datos;
    } else if (container.originalData) {
        // Si no hay nuevos datos pero tenemos los originales, usamos esos
        datos = container.originalData;
    } else {
        // No hay datos nuevos ni originales
        container.innerHTML = '<div class="no-data">No hay datos disponibles</div>';
        return;
    }
    
    // Ajustar el contenedor si es necesario
    setupChartContainer(container);
    container.style.height = '400px';

    // Procesar datos para incluir tanto ventas como cantidad
    const categoriaData = datos.reduce((acc, venta) => {
        const categoria = venta['Descrip. familia'] || 'Sin Categoría';
        if (!acc[categoria]) {
            acc[categoria] = { ventas: 0, cantidad: 0 };
        }
        acc[categoria].ventas += parseFloat(venta.Total || 0);
        acc[categoria].cantidad += parseFloat(venta.Cantidad || 1);
        return acc;
    }, {});

    // Convertir y ordenar por ventas
    const categorias = Object.entries(categoriaData)
        .sort(([,a], [,b]) => b.ventas - a.ventas);

    // Asignar colores fijos a cada categoría para mantener consistencia
    const coloresCategoria = {
        'CALZADOS': '#4CAF50',      // Verde
        'INDUMENTARIA': '#2196F3',  // Azul
        'ACCESORIOS': '#FFC107',    // Amarillo
        'MEDIAS': '#F44336',        // Rojo
        'ENVIOS': '#9C27B0',        // Púrpura
        'Sin Categoría': '#607D8B'  // Gris azulado
    };

    // Asegurar que todas las categorías tengan un color asignado
    categorias.forEach(([cat]) => {
        if (!coloresCategoria[cat]) {
            // Generar colores para categorías no previstas
            const coloresDisponibles = [
                '#00BCD4', '#FF9800', '#795548', '#E91E63', '#009688',
                '#3F51B5', '#CDDC39', '#673AB7', '#FF5722', '#8BC34A'
            ];
            const colorIndex = Object.keys(coloresCategoria).length % coloresDisponibles.length;
            coloresCategoria[cat] = coloresDisponibles[colorIndex];
        }
    });

    // Crear controles solo si no existen
    let controlDiv = container.parentElement.querySelector('.chart-controls');
    if (!controlDiv) {
        controlDiv = document.createElement('div');
        controlDiv.className = 'chart-controls';
        controlDiv.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-bottom: 15px;
            width: 100%;
        `;
        container.parentElement.insertBefore(controlDiv, container);
        
        // Creamos los botones
        const views = [
            { id: 'porcentaje', label: 'Porcentajes', icon: 'fa-percent' },
            { id: 'ventas', label: 'Ventas ($)', icon: 'fa-dollar-sign' },
            { id: 'cantidad', label: 'Cantidades', icon: 'fa-box' }
        ];

        views.forEach(view => {
            const button = document.createElement('button');
            button.dataset.view = view.id;
            button.innerHTML = `<i class="fas ${view.icon}"></i> ${view.label}`;
            button.style.cssText = `
                padding: 8px 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 5px;
                background-color: ${view.id === 'porcentaje' ? '#4CAF50' : '#f1f1f1'};
                color: ${view.id === 'porcentaje' ? 'white' : '#333'};
                transition: all 0.2s;
            `;
            button.addEventListener('click', () => updateChart(view.id));
            controlDiv.appendChild(button);
        });
    }

    // Tipo de visualización actual
    let currentView = container.currentView || 'porcentaje';

    // Función para actualizar el gráfico
    const updateChart = (viewType) => {
        // Guardar la vista actual para futuras actualizaciones
        container.currentView = viewType;
        currentView = viewType;
        
        // Actualizar datos según el tipo de visualización
        let chartData, labels;
        
        if (viewType === 'porcentaje') {
            labels = categorias.map(([cat]) => cat);
            chartData = categorias.map(([, data]) => data.ventas);
        } else if (viewType === 'ventas') {
            labels = categorias.map(([cat]) => cat);
            chartData = categorias.map(([, data]) => data.ventas);
        } else if (viewType === 'cantidad') {
            labels = categorias.map(([cat]) => cat);
            chartData = categorias.map(([, data]) => data.cantidad);
        }
        
        // Crear un array de colores que coincida con las categorías
        const colors = labels.map(cat => coloresCategoria[cat]);

        // Configurar opciones según la visualización
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    align: 'center',
                    labels: {
                        boxWidth: 15,
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const dataIndex = context.dataIndex;
                            const categoriaLabel = categorias[dataIndex][0];
                            const data = categorias[dataIndex][1];
                            const total = categorias.reduce((sum, [, cat]) => sum + cat.ventas, 0);
                            const percentage = ((data.ventas / total) * 100).toFixed(1);
                            
                            return [
                                `${categoriaLabel}:`,
                                `Ventas: ${formatoPeso(data.ventas)}`,
                                `Cantidad: ${data.cantidad.toLocaleString()}`,
                                `Porcentaje: ${percentage}%`
                            ];
                        }
                    }
                },
                datalabels: {
                    display: true,
                    color: 'white',
                    font: { size: 11, weight: 'bold' },
                    formatter: function(value, context) {
                        const dataIndex = context.dataIndex;
                        if (viewType === 'porcentaje') {
                            const total = chartData.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${percentage}%`;
                        } else if (viewType === 'ventas') {
                            return `${formatoPeso(value)}`;
                        } else if (viewType === 'cantidad') {
                            return `${value.toLocaleString()}`;
                        }
                    },
                    anchor: 'center',
                    align: 'center',
                }
            },
            layout: {
                padding: {
                    top: 20,
                    right: 120,
                    bottom: 20,
                    left: 20
                }
            }
        };

        // Crear o actualizar el gráfico
        if (container.chart) {
            container.chart.data.labels = labels;
            container.chart.data.datasets[0].data = chartData;
            container.chart.data.datasets[0].backgroundColor = colors;
            container.chart.options = options;
            container.chart.update();
        } else {
            container.chart = new Chart(container, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: chartData,
                        backgroundColor: colors
                    }]
                },
                options: options
            });
        }

        // Actualizar estado visual de los botones
        Array.from(controlDiv.querySelectorAll('button')).forEach(btn => {
            if (btn.dataset.view === viewType) {
                btn.style.backgroundColor = '#4CAF50';
                btn.style.color = 'white';
            } else {
                btn.style.backgroundColor = '#f1f1f1';
                btn.style.color = '#333';
            }
        });
    };

    // Inicializar o actualizar con la vista guardada
    updateChart(currentView);
}

// Función de utilidad para formatear montos
function formatearMonto(valor) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(valor);
}

// Actualizar las opciones de formato para todos los gráficos
Chart.defaults.plugins.tooltip.callbacks.label = function(context) {
    if (typeof context.raw === 'number') {
        return `${context.dataset.label || ''}: ${formatearMonto(context.raw)}`;
    }
    return context.label;
};

// Función para calcular edad aproximada basada en DNI
function calcularEdadPorDNI(dni) {
    if (!dni || dni === '11111111' || dni === 'ML') return null;
    
    // Convertir el DNI a número y obtener los millones
    const dniNum = parseInt(dni);
    if (isNaN(dniNum)) return null;
    
    const millones = Math.floor(dniNum / 1000000);
    
    // Calcular edad aproximada basada en los millones del DNI
    let edad;
    if (millones >= 45) { // 45-47 millones: ~18-20 años
        edad = 20;
    } else if (millones >= 40) { // 40-44 millones: ~20-25 años
        edad = 25;
    } else if (millones >= 35) { // 35-39 millones: ~25-30 años
        edad = 30;
    } else if (millones >= 30) { // 30-34 millones: ~30-35 años
        edad = 35;
    } else if (millones >= 25) { // 25-29 millones: ~35-40 años
        edad = 40;
    } else if (millones >= 20) { // 20-24 millones: ~40-45 años
        edad = 45;
    } else if (millones >= 15) { // 15-19 millones: ~45-50 años
        edad = 50;
    } else if (millones >= 10) { // 10-14 millones: ~50-55 años
        edad = 55;
    } else if (millones > 0) { // 1-9 millones: ~55+ años
        edad = 60;
    } else {
        return null;
    }
    
    return edad;
}

// Función mejorada para el gráfico de edades
async function crearGraficoEdades(datos) {
    const container = document.getElementById('graficoEdades');
    if (!container) return;

    setupChartContainer(container);

    const rangos = [
        { min: 18, max: 25, label: '18-25 años' },
        { min: 26, max: 35, label: '26-35 años' },
        { min: 36, max: 45, label: '36-45 años' },
        { min: 46, max: 55, label: '46-55 años' },
        { min: 56, max: 100, label: '55+ años' }
    ];

    const ventasPorRango = rangos.reduce((acc, rango) => {
        acc[rango.label] = {
            ventas: 0,
            cantidad: 0
        };
        return acc;
    }, {});

    datos.forEach(venta => {
        const edad = calcularEdadPorDNI(venta.Cliente);
        if (edad !== null) {
            const rango = rangos.find(r => edad >= r.min && edad <= r.max);
            if (rango) {
                ventasPorRango[rango.label].ventas += parseFloat(venta.Total || 0);
                ventasPorRango[rango.label].cantidad += 1;
            }
        }
    });

    const datosGrafico = Object.entries(ventasPorRango).map(([label, datos]) => ({
        rango: label,
        ventas: datos.ventas,
        cantidad: datos.cantidad
    }));

    if (container.chart) {
        container.chart.destroy();
    }

    const chartConfig = {
        ...baseChartConfig,
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    padding: 5,
                    font: { size: 12 }
                }
            },
            y: {
                type: 'linear',
                position: 'left',
                ticks: {
                    callback: value => formatoPeso(value)
                }
            },
            y1: {
                type: 'linear',
                position: 'right',
                grid: {
                    drawOnChartArea: false
                },
                ticks: {
                    callback: value => value.toLocaleString()
                }
            }
        }
    };

    container.chart = new Chart(container, {
        type: 'bar',
        data: {
            labels: datosGrafico.map(d => d.rango),
            datasets: [
                {
                    label: 'Ventas ($)',
                    data: datosGrafico.map(d => d.ventas),
                    backgroundColor: '#4CAF50',
                    yAxisID: 'y',
                    order: 2
                },
                {
                    label: 'Cantidad',
                    data: datosGrafico.map(d => d.cantidad),
                    type: 'line',
                    borderColor: '#2196F3',
                    yAxisID: 'y1',
                    isCantidad: true,
                    order: 1
                }
            ]
        },
        options: chartConfig
    });

    addValueAndGridToggles(container);
}

// Horarios de Compra
async function crearGraficoHorarios(datos) {
    const container = document.getElementById('graficoHorarios');
    if (!container) return;

    setupChartContainer(container);

    const ventasPorHora = Array(24).fill(0).map(() => ({ ventas: 0, cantidad: 0 }));
    
    datos.forEach(venta => {
        if (venta['Hora alta']) {
            const hora = parseInt(venta['Hora alta'].split(':')[0]);
            if (!isNaN(hora) && hora >= 0 && hora < 24) {
                ventasPorHora[hora].ventas += parseFloat(venta.Total || 0);
                ventasPorHora[hora].cantidad += parseFloat(venta.Cantidad || 1);
            }
        }
    });

    if (container.chart) {
        container.chart.destroy();
    }

    
    const chartConfig = {
        ...baseChartConfig,
        scales: {
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    padding: 10
                },
                grid: { display: false }
            },
            y: {
                type: 'linear',
                position: 'left',
                ticks: {
                    callback: value => formatoPeso(value)
                }
            },
            y1: {
                type: 'linear',
                position: 'right',
                grid: {
                    drawOnChartArea: false
                },
                ticks: {
                    callback: value => value.toLocaleString()
                }
            }
        }
    };

    container.chart = new Chart(container, {
        type: 'line',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`),
            datasets: [
                {
                    label: 'Ventas',
                    data: ventasPorHora.map(h => h.ventas),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Cantidad',
                    data: ventasPorHora.map(h => h.cantidad),
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y1',
                    isCantidad: true
                }
            ]
        },
        options: chartConfig  // Aquí estaba el error, estabas usando options en lugar de chartConfig
    });

    addValueAndGridToggles(container);
}

// Configuración global para Chart.js
Chart.defaults.plugins.datalabels.display = false; // Ocultar labels por defecto
Chart.defaults.plugins.tooltip.callbacks.label = function(context) {
    if (typeof context.raw === 'number') {
        return `${context.dataset.label || ''}: ${formatearMonto(context.raw)}`;
    }
    return context.label;
};
// Rendimiento por Marketplace
async function crearGraficoMarketplace(datos) {
    const container = document.getElementById('graficoMarketplace');
    if (!container) return;
    
    setupLargeChartContainer(container);

    const ventasPorMarketplace = {
        'Mercado Libre': {
            ventas: 0,
            cantidadProductos: 0
        },
        'Banco Provincia': {
            ventas: 0,
            cantidadProductos: 0
        }
    };

    datos.forEach(venta => {
        if (validarDatosVenta(venta)) {
            if (venta.tienda.includes('Meli')) {
                ventasPorMarketplace['Mercado Libre'].ventas += parseFloat(venta.Total || 0);
                ventasPorMarketplace['Mercado Libre'].cantidadProductos += 1;
            } else if (venta.tienda.includes('Bapro')) {
                ventasPorMarketplace['Banco Provincia'].ventas += parseFloat(venta.Total || 0);
                ventasPorMarketplace['Banco Provincia'].cantidadProductos += 1;
            }
        }
    });

    if (container.chart) {
        container.chart.destroy();
    }

    container.chart = new Chart(container, {
        type: 'bar',
        data: {
            labels: ['Mercado Libre', 'Banco Provincia'],
            datasets: [
                {
                    label: 'Ventas',
                    data: [
                        ventasPorMarketplace['Mercado Libre'].ventas,
                        ventasPorMarketplace['Banco Provincia'].ventas
                    ],
                    backgroundColor: '#4CAF50',
                    yAxisID: 'y',
                    order: 1
                },
                {
                    label: 'Cantidad',
                    data: [
                        ventasPorMarketplace['Mercado Libre'].cantidadProductos,
                        ventasPorMarketplace['Banco Provincia'].cantidadProductos
                    ],
                    type: 'line',
                    borderColor: '#2196F3',
                    yAxisID: 'y1',
                    order: 0,
                    isCantidad: true
                }
            ]
        },
         options: {
    ...baseChartConfig,
    scales: {
        x: {
            grid: {
                display: false
            },
            ticks: {
                maxRotation: 0,
                minRotation: 0
            }
        },
        y: {
            type: 'linear',
            position: 'left',
            beginAtZero: true,
            ticks: {
                callback: value => formatoPeso(value)
            },
            grid: {
                display: false
            }
        },
        y1: {
            type: 'linear',
            position: 'right',
            beginAtZero: true,
            ticks: {
                callback: value => value.toLocaleString()
            },
            grid: {
                display: false
            }
        }
    }
}
    });

    addValueAndGridToggles(container);
}

// 3. Nuevo gráfico de mejores compradores
// Función para cargar datos de logística desde un archivo Excel
async function cargarDatosLogistica(file) {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    
                    console.log('Datos de logística cargados:', jsonData.length);
                    resolve(jsonData);
                } catch (error) {
                    console.error('Error al procesar archivo de logística:', error);
                    reject(error);
                }
            };
            reader.onerror = function(error) {
                console.error('Error al leer archivo de logística:', error);
                reject(error);
            };
            reader.readAsBinaryString(file);
        } catch (error) {
            console.error('Error al cargar archivo de logística:', error);
            reject(error);
        }
    });
}

// Actualización de la función crearGraficoLogistica
async function crearGraficoLogistica(datos, usarDatosPrueba = true) {
    const container = document.getElementById('graficoMejoresCompradores');
    if (!container) {
        console.warn('Contenedor para el gráfico de logística no encontrado');
        return;
    }
    
    try {
        // Renombrar el título de la sección
        const chartCard = container.closest('.chart-card');
        const headerElement = chartCard ? chartCard.querySelector('h3') : null;
        if (headerElement) {
            headerElement.textContent = 'Análisis de Logística';
        }
        
        // Limpiar cualquier contenido existente
        container.innerHTML = '';
        
        // Ajustar dimensiones del contenedor
        setupChartContainer(container);
        container.style.height = '360px'; // Aumentamos la altura para dar más espacio
        container.style.maxHeight = '360px';
        container.style.overflow = 'hidden';
        
        // Contenedor para botones de tipo de gráfico
        const chartTypeSelector = document.createElement('div');
        chartTypeSelector.style.cssText = `
            display: flex;
            gap: 8px;
            margin-bottom: 15px;
            flex-wrap: wrap;
            justify-content: center;
        `;
        
        // Contenedor para métricas
        const metricsContainer = document.createElement('div');
        metricsContainer.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 15px;
            justify-content: center;
        `;
        
        // Estado para el tipo de gráfico
        let chartType = 'deliveryTime';
        
        const chartTypes = [
            { id: 'deliveryTime', label: 'Tiempos de Entrega', icon: 'fa-clock' },
            { id: 'shippingCost', label: 'Costos de Envío', icon: 'fa-dollar-sign' },
            { id: 'carrierPerformance', label: 'Rendimiento por Transportista', icon: 'fa-truck' },
            { id: 'carrierDistribution', label: 'Distribución de Envíos', icon: 'fa-chart-pie' }
        ];
        
        // Crear botones de tipo con mejor tamaño de fuente
        chartTypes.forEach(type => {
            const button = document.createElement('button');
            button.dataset.type = type.id;
            button.innerHTML = `<i class="fas ${type.icon}"></i> ${type.label}`;
            button.style.cssText = `
                padding: 8px 10px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 5px;
                background-color: ${type.id === 'deliveryTime' ? '#4CAF50' : '#f1f1f1'};
                color: ${type.id === 'deliveryTime' ? 'white' : '#333'};
                white-space: nowrap;
                transition: all 0.2s ease;
            `;
            button.addEventListener('click', () => {
                chartType = type.id;
                
                // Actualizar estado visual de los botones
                Array.from(chartTypeSelector.querySelectorAll('button')).forEach(btn => {
                    if (btn.dataset.type === type.id) {
                        btn.style.backgroundColor = '#4CAF50';
                        btn.style.color = 'white';
                    } else {
                        btn.style.backgroundColor = '#f1f1f1';
                        btn.style.color = '#333';
                    }
                });
                
                // Actualizar gráfico con los datos de prueba o mensaje
                if (usarDatosPrueba) {
                    const datosLogistica = generarDatosPrueba();
                    mostrarGraficoSegunTipo(chartType, datosLogistica);
                } else {
                    container.innerHTML = `
                        <div class="no-data" style="padding: 20px; text-align: center;">
                            <p style="margin-bottom: 15px;">Este panel mostrará análisis de logística basado en datos de VTEX.</p>
                            <p>Para visualizar datos, se integrarán con el módulo de Carga de Ventas próximamente.</p>
                        </div>
                    `;
                }
            });
            chartTypeSelector.appendChild(button);
        });
        
        // Añadir selectores y contenedor de métricas antes del gráfico
        container.parentElement.insertBefore(chartTypeSelector, container);
        container.parentElement.insertBefore(metricsContainer, container);
        
        // Función para generar datos de ejemplo
        function generarDatosPrueba() {
            const carriers = ['Andreani', 'Mercado Envíos', 'OCA', 'Moova', 'Correo Argentino'];
            const regions = ['CABA', 'Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán'];
            
            // Generar 100 pedidos de muestra
            return Array.from({ length: 100 }, (_, i) => {
                const carrierIdx = Math.floor(Math.random() * carriers.length);
                const regionIdx = Math.floor(Math.random() * regions.length);
                
                // Tiempo de entrega varía según el transportista (para crear patrones)
                let baseDeliveryTime;
                switch (carriers[carrierIdx]) {
                    case 'Andreani': baseDeliveryTime = 2; break;
                    case 'Correo Argentino': baseDeliveryTime = 4; break;
                    case 'Mercado Envíos': baseDeliveryTime = 3; break;
                    case 'OCA': baseDeliveryTime = 2.5; break;
                    case 'Moova': baseDeliveryTime = 1.5; break;
                    default: baseDeliveryTime = 3;
                }
                
                // Variación por región
                const regionMultiplier = regionIdx === 0 ? 0.8 : (1 + regionIdx * 0.15);
                const deliveryTime = baseDeliveryTime * regionMultiplier * (0.9 + Math.random() * 0.4);
                
                // Costo de envío según distancia y peso
                const baseShippingCost = 1500 + Math.random() * 1000;
                const regionCostMultiplier = 1 + (regionIdx * 0.2);
                const shippingCost = baseShippingCost * regionCostMultiplier;
                
                // Si el envío llegó a tiempo (probabilidad varía por transportista)
                let onTimeProb;
                switch (carriers[carrierIdx]) {
                    case 'Andreani': onTimeProb = 0.85; break;
                    case 'Correo Argentino': onTimeProb = 0.7; break;
                    case 'Mercado Envíos': onTimeProb = 0.9; break;
                    case 'OCA': onTimeProb = 0.8; break;
                    case 'Moova': onTimeProb = 0.95; break;
                    default: onTimeProb = 0.8;
                }
                const onTime = Math.random() < onTimeProb;
                
                return {
                    id: `order-${i+1}`,
                    carrier: carriers[carrierIdx],
                    region: regions[regionIdx],
                    deliveryTime: deliveryTime,
                    shippingCost: shippingCost,
                    onTime: onTime,
                    weight: 0.5 + Math.random() * 9.5, // peso en kg
                    date: new Date(2024, 0, 1 + Math.floor(Math.random() * 120)) // fechas de los últimos 4 meses
                };
            });
        }
        
        // Función para mostrar el gráfico según el tipo seleccionado
        function mostrarGraficoSegunTipo(chartType, data) {
            // Limpiar contenedor de métricas
            metricsContainer.innerHTML = '';
            
            if (chartType === 'deliveryTime') {
                mostrarGraficoTiemposEntrega(data);
            } else if (chartType === 'shippingCost') {
                mostrarGraficoCostosEnvio(data);
            } else if (chartType === 'carrierPerformance') {
                mostrarGraficoRendimientoTransportistas(data);
            } else if (chartType === 'carrierDistribution') {
                mostrarGraficoDistribucionTransportistas(data);
            }
        }
        
        // Nueva función para mostrar la distribución de envíos por transportista
        function mostrarGraficoDistribucionTransportistas(data) {
            // Contar envíos por transportista
            const enviosPorTransportista = data.reduce((acc, item) => {
                const carrier = item.carrier || 'Sin Transportista';
                acc[carrier] = (acc[carrier] || 0) + 1;
                return acc;
            }, {});
            
            // Preparar datos para el gráfico circular
            const labels = Object.keys(enviosPorTransportista);
            const values = Object.values(enviosPorTransportista);
            
            // Colores para cada transportista
            const colors = [
                '#4CAF50', // Verde
                '#2196F3', // Azul
                '#FFC107', // Amarillo
                '#F44336', // Rojo
                '#9C27B0'  // Púrpura
            ];
            
            // Crear o actualizar el gráfico
            if (container.chart) {
                container.chart.destroy();
            }
            
            // Mostrar métrica de total de envíos
            const totalEnvios = values.reduce((sum, val) => sum + val, 0);
            
            const metricTotalEnvios = document.createElement('div');
            metricTotalEnvios.style.cssText = `
                background-color: white;
                padding: 10px 15px;
                border-radius: 4px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                text-align: center;
                flex: 1;
                min-width: 150px;
            `;
            metricTotalEnvios.innerHTML = `
                <div style="font-size: 0.8rem; color: #666;">Total de envíos</div>
                <div style="font-size: 1.2rem; font-weight: bold; color: #4CAF50;">${totalEnvios}</div>
            `;
            metricsContainer.appendChild(metricTotalEnvios);
            
            // Crear gráfico circular
            container.chart = new Chart(container, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors.slice(0, labels.length),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                font: {
                                    size: 12
                                },
                                padding: 15
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw;
                                    const percentage = (value / totalEnvios * 100).toFixed(1);
                                    return `${context.label}: ${value} envíos (${percentage}%)`;
                                }
                            }
                        },
                        datalabels: {
                            display: true,
                            color: 'white',
                            font: {
                                weight: 'bold',
                                size: 12
                            },
                            formatter: function(value, context) {
                                const percentage = (value / totalEnvios * 100).toFixed(1);
                                return `${percentage}%`;
                            }
                        }
                    }
                }
            });
        }
        
        // Función para mostrar gráfico de tiempos de entrega
        function mostrarGraficoTiemposEntrega(data) {
            // Calcular tiempos de entrega promedio
            const tiempoPromedioEntrega = data.reduce((sum, item) => sum + (parseFloat(item.deliveryTime) || 0), 0) / data.length;
            
            // Agrupar por rango de días
            const tiemposPorRango = data.reduce((acc, item) => {
                const dias = Math.floor(parseFloat(item.deliveryTime) || 0);
                const rango = dias <= 1 ? '0-1 día' : 
                            dias <= 2 ? '1-2 días' :
                            dias <= 3 ? '2-3 días' :
                            dias <= 5 ? '3-5 días' :
                            dias <= 7 ? '5-7 días' : 
                            'Más de 7 días';
                
                acc[rango] = (acc[rango] || 0) + 1;
                return acc;
            }, {});
            
            // Mostrar métrica clave
            const metricTiempoPromedio = document.createElement('div');
            metricTiempoPromedio.style.cssText = `
                background-color: white;
                padding: 10px 15px;
                border-radius: 4px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                text-align: center;
                flex: 1;
                min-width: 150px;
            `;
            metricTiempoPromedio.innerHTML = `
                <div style="font-size: 0.8rem; color: #666;">Tiempo promedio de entrega</div>
                <div style="font-size: 1.2rem; font-weight: bold; color: #4CAF50;">${tiempoPromedioEntrega.toFixed(1)} días</div>
            `;
            metricsContainer.appendChild(metricTiempoPromedio);
            
            // Ordenar por rangos de tiempo para visualización
            const ordenRangos = [
                '0-1 día', '1-2 días', '2-3 días', '3-5 días', '5-7 días', 'Más de 7 días'
            ];
            
            const datosOrdenados = ordenRangos
                .filter(rango => tiemposPorRango[rango] !== undefined)
                .map(rango => ({
                    rango,
                    cantidad: tiemposPorRango[rango],
                    porcentaje: (tiemposPorRango[rango] / data.length) * 100
                }));
            
            // Crear o actualizar el gráfico
            if (container.chart) {
                container.chart.destroy();
            }
            
            container.chart = new Chart(container, {
                type: 'bar',
                data: {
                    labels: datosOrdenados.map(d => d.rango),
                    datasets: [{
                        label: 'Cantidad de Pedidos',
                        data: datosOrdenados.map(d => d.cantidad),
                        backgroundColor: '#4CAF50',
                        borderColor: '#4CAF50',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw;
                                    const percentage = (value / data.length * 100).toFixed(1);
                                    return `${value} pedidos (${percentage}%)`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Cantidad de Pedidos',
                                font: { size: 12 }
                            },
                            ticks: {
                                font: { size: 11 } // Aumentado el tamaño
                            }
                        },
                        x: {
                            title: {
                                display: false,
                                text: 'Tiempo de Entrega',
                                font: { size: 12 }
                            },
                            ticks: {
                                font: { size: 11 }, // Aumentado el tamaño
                                maxRotation: 30,
                                minRotation: 30
                            }
                        }
                    },
                    layout: {
                        padding: {
                            top: 10,
                            right: 20,
                            bottom: 30, // Aumentado para dar más espacio a las etiquetas
                            left: 20
                        }
                    }
                }
            });
        }
        
        // Función para mostrar gráfico de costos de envío
        function mostrarGraficoCostosEnvio(data) {
            // Calcular costo promedio de envío
            const costoPromedioEnvio = data.reduce((sum, item) => sum + (parseFloat(item.shippingCost) || 0), 0) / data.length;
            
            // Calcular costo promedio por región
            const costoPorRegion = data.reduce((acc, item) => {
                const region = item.region || 'Sin Región';
                if (!acc[region]) {
                    acc[region] = { total: 0, count: 0 };
                }
                acc[region].total += parseFloat(item.shippingCost) || 0;
                acc[region].count += 1;
                return acc;
            }, {});
            
            Object.keys(costoPorRegion).forEach(region => {
                costoPorRegion[region].promedio = costoPorRegion[region].total / costoPorRegion[region].count;
            });
            
            // Mostrar métricas clave
            const metricCostoPromedio = document.createElement('div');
            metricCostoPromedio.style.cssText = `
                background-color: white;
                padding: 10px 15px;
                border-radius: 4px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                text-align: center;
                flex: 1;
                min-width: 150px;
            `;
            metricCostoPromedio.innerHTML = `
                <div style="font-size: 0.8rem; color: #666;">Costo promedio de envío</div>
                <div style="font-size: 1.2rem; font-weight: bold; color: #4CAF50;">${formatoPeso(costoPromedioEnvio)}</div>
            `;
            metricsContainer.appendChild(metricCostoPromedio);
            
            // Ordenar regiones por costo promedio
            const regionesOrdenadas = Object.entries(costoPorRegion)
                .sort(([,a], [,b]) => b.promedio - a.promedio)
                .map(([region, data]) => ({
                    region,
                    costo: data.promedio,
                    cantidad: data.count
                }));
            
            // Crear o actualizar el gráfico
            if (container.chart) {
                container.chart.destroy();
            }
            
            container.chart = new Chart(container, {
                type: 'bar',
                data: {
                    labels: regionesOrdenadas.map(d => d.region),
                    datasets: [{
                        label: 'Costo Promedio de Envío',
                        data: regionesOrdenadas.map(d => d.costo),
                        backgroundColor: '#2196F3',
                        borderColor: '#2196F3',
                        borderWidth: 1,
                        yAxisID: 'y'
                    }, {
                        label: 'Cantidad de Envíos',
                        data: regionesOrdenadas.map(d => d.cantidad),
                        type: 'line',
                        borderColor: '#FF9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.2)',
                        fill: true,
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                boxWidth: 12,
                                padding: 10,
                                font: { size: 12 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    if (context.dataset.label === 'Costo Promedio de Envío') {
                                        return `${context.dataset.label}: ${formatoPeso(context.raw)}`;
                                    }
                                    return `${context.dataset.label}: ${context.raw}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Costo Promedio ($)',
                                font: { size: 12 }
                            },
                            ticks: {
                                callback: value => formatoPeso(value),
                                font: { size: 11 }
                            }
                        },
                        y1: {
                            beginAtZero: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Cantidad de Envíos',
                                font: { size: 12 }
                            },
                            grid: {
                                drawOnChartArea: false
                            },
                            ticks: {
                                font: { size: 11 }
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Región',
                                font: { size: 12 }
                            },
                            ticks: {
                                font: { size: 11 },
                                maxRotation: 30,
                                minRotation: 30
                            }
                        }
                    },
                    layout: {
                        padding: {
                            top: 10,
                            right: 20,
                            bottom: 30,
                            left: 20
                        }
                    }
                }
            });
        }
        
        // Función para mostrar gráfico de rendimiento por transportista
        function mostrarGraficoRendimientoTransportistas(data) {
            // Calcular rendimiento por transportista
            const rendimientoPorTransportista = data.reduce((acc, item) => {
                const carrier = item.carrier || 'Sin Transportista';
                if (!acc[carrier]) {
                    acc[carrier] = { 
                        totalPedidos: 0, 
                        tiempoPromedio: 0,
                        costoPromedio: 0,
                        pedidosATiempo: 0
                    };
                }
                
                const deliveryTime = parseFloat(item.deliveryTime) || 0;
                const shippingCost = parseFloat(item.shippingCost) || 0;
                const onTime = item.onTime === 'true' || item.onTime === true || item.onTime === 1;
                
                acc[carrier].totalPedidos += 1;
                acc[carrier].tiempoPromedio += deliveryTime;
                acc[carrier].costoPromedio += shippingCost;
                if (onTime) acc[carrier].pedidosATiempo += 1;
                
                return acc;
            }, {});
            
            // Calcular promedios finales
            Object.keys(rendimientoPorTransportista).forEach(carrier => {
                const stats = rendimientoPorTransportista[carrier];
                stats.tiempoPromedio = stats.tiempoPromedio / stats.totalPedidos;
                stats.costoPromedio = stats.costoPromedio / stats.totalPedidos;
                stats.porcentajeATiempo = (stats.pedidosATiempo / stats.totalPedidos) * 100;
            });
            
            // Transportistas ordenados por porcentaje a tiempo
            const transportistasOrdenados = Object.entries(rendimientoPorTransportista)
                .filter(([,data]) => data.totalPedidos >= 5) // Filtrar transportistas con pocos pedidos
                .sort(([,a], [,b]) => b.porcentajeATiempo - a.porcentajeATiempo)
                .map(([carrier, data]) => ({
                    carrier,
                    tiempoPromedio: data.tiempoPromedio,
                    costoPromedio: data.costoPromedio,
                    porcentajeATiempo: data.porcentajeATiempo,
                    totalPedidos: data.totalPedidos
                }));
            
            // Mostrar métricas clave - Transportista con mejor rendimiento
            if (transportistasOrdenados.length > 0) {
                const mejorTransportista = transportistasOrdenados[0];
                
                const metricMejorTransportista = document.createElement('div');
                metricMejorTransportista.style.cssText = `
                    background-color: white;
                    padding: 10px 15px;
                    border-radius: 4px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    text-align: center;
                    flex: 1;
                    min-width: 150px;
                `;
                metricMejorTransportista.innerHTML = `
                    <div style="font-size: 0.8rem; color: #666;">Mejor transportista</div>
                    <div style="font-size: 1.1rem; font-weight: bold; color: #4CAF50;">${mejorTransportista.carrier}</div>
                    <div style="font-size: 0.8rem; color: #666;">${mejorTransportista.porcentajeATiempo.toFixed(1)}% a tiempo</div>
                `;
                metricsContainer.appendChild(metricMejorTransportista);
            }
            
            // Crear o actualizar el gráfico
            if (container.chart) {
                container.chart.destroy();
            }
            
            container.chart = new Chart(container, {
                type: 'bar',
                data: {
                    labels: transportistasOrdenados.map(d => d.carrier),
                    datasets: [{
                        label: 'Porcentaje a tiempo',
                        data: transportistasOrdenados.map(d => d.porcentajeATiempo),
                        backgroundColor: '#4CAF50',
                        borderColor: '#4CAF50',
                        borderWidth: 1,
                        order: 1
                    }, {
                        label: 'Tiempo promedio (días)',
                        data: transportistasOrdenados.map(d => d.tiempoPromedio),
                        type: 'line',
                        borderColor: '#FFC107',
                        backgroundColor: 'rgba(255, 193, 7, 0.2)',
                        borderWidth: 2,
                        fill: false,
                        yAxisID: 'y1',
                        order: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                boxWidth: 12,
                                padding: 8,
                                font: { size: 12 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    if (context.dataset.label.includes('Porcentaje')) {
                                        return `${context.dataset.label}: ${context.raw.toFixed(1)}%`;
                                    } else if (context.dataset.label.includes('Tiempo')) {
                                        return `${context.dataset.label}: ${context.raw.toFixed(1)} días`;
                                    }
                                    return `${context.dataset.label}: ${context.raw}`;
                                },
                                afterBody: function(tooltipItems) {
                                    const idx = tooltipItems[0].dataIndex;
                                    const carrier = transportistasOrdenados[idx];
                                    return [
                                        `Costo promedio: ${formatoPeso(carrier.costoPromedio)}`,
                                        `Total de pedidos: ${carrier.totalPedidos}`
                                    ];
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Porcentaje (%)',
                                font: { size: 12 }
                            },
                            ticks: {
                                font: { size: 11 }
                            }
                        },
                        y1: {
                            beginAtZero: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Tiempo (días)',
                                font: { size: 12 }
                            },
                            grid: {
                                drawOnChartArea: false
                            },
                            ticks: {
                                font: { size: 11 }
                            }
                        },
                        x: {
                            title: {
                                display: false,
                                text: 'Transportista',
                                font: { size: 12 }
                            },
                            ticks: {
                                font: { size: 11 },
                                maxRotation: 25, // Disminuido para evitar que se corten
                                minRotation: 25
                            }
                        }
                    },
                    layout: {
                        padding: {
                            top: 10,
                            right: 25, // Aumentado para más espacio con las etiquetas del eje Y derecho
                            bottom: 30, // Aumentado para más espacio con las etiquetas rotadas
                            left: 15
                        }
                    }
                }
            });
        }
        
        // Inicializar con datos de prueba o mensaje
        if (usarDatosPrueba) {
            const datosLogistica = generarDatosPrueba();
            mostrarGraficoSegunTipo('deliveryTime', datosLogistica);
        } else {
            container.innerHTML = `
                <div class="no-data" style="padding: 20px; text-align: center;">
                    <p style="margin-bottom: 15px;">Este panel mostrará análisis de logística basado en datos de VTEX.</p>
                    <p>Para visualizar datos, se integrarán con el módulo de Carga de Ventas próximamente.</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error en el gráfico de logística:', error);
        container.innerHTML = `<div class="no-data">Error al cargar el gráfico: ${error.message}</div>`;
    }
}

async function crearGraficoTendenciaCompra(datos) {
    const container = document.getElementById('graficoTendenciaCompra');
    if (!container) return;

    setupChartContainer(container);

    // Agrupar compras por cantidad de productos
    const comprasPorCantidad = datos.reduce((acc, venta) => {
        const cantidad = parseInt(venta.Cantidad) || 1;
        acc[cantidad] = (acc[cantidad] || 0) + 1;
        return acc;
    }, {});

    // Convertir a array y ordenar por cantidad
    const datosOrdenados = Object.entries(comprasPorCantidad)
        .map(([cantidad, frecuencia]) => ({
            cantidad: parseInt(cantidad),
            frecuencia: frecuencia
        }))
        .sort((a, b) => a.cantidad - b.cantidad);

    // Preparar datos para el gráfico
    const labels = datosOrdenados.map(d => `${d.cantidad} ${d.cantidad >= 1 ? 'producto' : 'ignorar'}`);
    const valores = datosOrdenados.map(d => d.frecuencia);
    const porcentajes = valores.map(v => ((v / datos.length) * 100).toFixed(1));

    if (container.chart) {
        container.chart.destroy();
    }
    const chartConfig = {
        ...baseChartConfig,
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    padding: 10
                }
            },
            y: {
                type: 'linear',
                position: 'left',
                beginAtZero: true,
                title: {
                    display: false,
                    text: 'Cantidad de Compras'
                },
                ticks: {
                    callback: value => value.toLocaleString()
                }
            },
            y1: {
                type: 'linear',
                position: 'right',
                beginAtZero: true,
                title: {
                    display: false,
                    text: 'Porcentaje'
                },
                grid: {
                    drawOnChartArea: false
                },
                ticks: {
                    callback: value => value.toFixed(1) + '%'
                }
            }
        }
    };

    container.chart = new Chart(container, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Cantidad de Compras',
                    data: valores,
                    backgroundColor: '#4CAF50',
                    yAxisID: 'y',
                    barPercentage: 0.7,
                    categoryPercentage: 0.8,
                    order: 2
                },
                {
                    label: 'Porcentaje',
                    data: porcentajes.map(p => parseFloat(p)),
                    type: 'line',
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    yAxisID: 'y1',
                    tension: 0.4,
                    fill: true,
                    order: 1
                }
            ]
        },
        options: chartConfig
    });

    addValueAndGridToggles(container);
}

// Funciones de utilidad
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatearFecha(fecha) {
    const opciones = { day: '2-digit', month: '2-digit' };
    return new Date(fecha).toLocaleDateString('es-AR', opciones);
}

function mostrarError(mensaje) {
    console.error(mensaje);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert-warning';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <div>
            <h4>Error</h4>
            <p>${mensaje}</p>
        </div>
    `;

    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.insertBefore(errorDiv, mainContent.firstChild);
    }
}

// Función para actualizar los filtros
function actualizarFiltros() {
    const nuevosFiltros = {
        fechaDesde1: document.getElementById('dateFrom1').value,
        fechaHasta1: document.getElementById('dateTo1').value,
        razonSocial: document.getElementById('razonSocial').value,
        tiendas: Array.from(document.getElementById('tienda').selectedOptions).map(opt => opt.value)
    };

    console.log('Actualizando filtros:', {
        anteriores: filtrosActuales,
        nuevos: nuevosFiltros
    });

    filtrosActuales = nuevosFiltros;
}

// También ajustar cuando se aplican filtros
// Modificar la función loadInitialData para incluir nuestros nuevos gráficos:
async function loadInitialData() {
    try {
        console.log('Iniciando carga de datos...');
        // Inicializar los selectores
        const razonSocialSelect = document.getElementById('razonSocial');
        if (razonSocialSelect) {
            razonSocialSelect.value = 'all';
        }

        const tiendaSelect = document.getElementById('tienda');
        if (tiendaSelect) {
            // Limpiar opciones existentes
            tiendaSelect.innerHTML = '';
            // Agregar opción "Todo"
            const todoOption = document.createElement('option');
            todoOption.value = 'Todo';
            todoOption.textContent = 'Todo';
            tiendaSelect.appendChild(todoOption);
            // Seleccionar "Todo" por defecto
            tiendaSelect.value = 'Todo';
        }

        // Obtener los datos
        const datos = await getDatosFiltrados();
        console.log('Datos obtenidos:', datos);
        
        if (!datos || datos.length === 0) {
            console.log('No hay datos disponibles');
            mostrarMensajeNoData();
            return;
        }

        // Procesar las fechas
        const datosConFechas = datos.map(venta => ({
            ...venta,
            Fecha: excelDateToJSDate(venta.Fecha)
        }));

        // Actualizar gráficos
        await Promise.all([
            actualizarKPIs(datosConFechas),
            crearGraficoTendencias(datosConFechas),
            crearGraficoMarcas(datosConFechas),
            crearGraficoCategorias(datosConFechas), // Nuestro gráfico circular mejorado
            crearGraficoEdades(datosConFechas),
            crearGraficoHorarios(datosConFechas),
            crearGraficoMarketplace(datosConFechas),
            crearGraficoLogistica(datosConFechas), // Reemplazando el gráfico de mejores compradores
            crearGraficoTendenciaCompra(datosConFechas)
        ]);

        // Ajustar dimensiones
        ajustarDimensionesGraficos();
        
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        mostrarError('Error al cargar los datos iniciales');
    }
}

function mostrarMensajeNoData() {
    const contenedores = [
        'resumenNumerico',
        'graficoTendencias',
        'graficoMarcas',
        'graficoCategorias',
        'graficoEdades',
        'graficoHorarios',
        'graficoMarketplace',
        'graficoMejoresCompradores'
    ];

    contenedores.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = '<div class="no-data">No hay datos disponibles</div>';
        }
    });
}

// Modificar la función getDatosFiltrados
async function getDatosFiltrados() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Base de datos no inicializada'));
            return;
        }

        try {
            const transaction = db.transaction(['ventas'], 'readonly');
            const store = transaction.objectStore('ventas');
            const request = store.getAll();

            request.onsuccess = () => {
                let data = request.result;
                console.log('Datos sin filtrar:', data.length);

                // Si hay filtros activos
                if (hayFiltrosActivos()) {
                    data = data.filter(venta => {
                        try {
                            // Convertir la fecha de la venta a un objeto Date
                            let fechaVenta = excelDateToJSDate(venta.Fecha);
                            // Resetear la hora a medianoche para comparar solo fechas
                            fechaVenta = new Date(fechaVenta.toDateString());

                            // Convertir las fechas del filtro a objetos Date
                            let fechaDesde1 = filtrosActuales.fechaDesde1 ? 
                                new Date(filtrosActuales.fechaDesde1) : null;
                            let fechaHasta1 = filtrosActuales.fechaHasta1 ? 
                                new Date(filtrosActuales.fechaHasta1) : null;

                            // Asegurarse que fechaHasta1 sea al final del día
                            if (fechaHasta1) {
                                fechaHasta1.setHours(23, 59, 59, 999);
                            }

                            // Verificar si la fecha está en el rango
                            const cumpleFecha = (!fechaDesde1 || fechaVenta >= fechaDesde1) && 
                                              (!fechaHasta1 || fechaVenta <= fechaHasta1);

                            const cumpleRazonSocial = filtrosActuales.razonSocial === 'all' || 
                                venta.razonSocial === filtrosActuales.razonSocial;

                            const cumpleTienda = !filtrosActuales.tiendas.length || 
                                filtrosActuales.tiendas.includes('Todo') ||
                                filtrosActuales.tiendas.includes(venta.tienda);

                            // Debugging
                            if (cumpleFecha) {
                                console.log('Venta cumple fecha:', {
                                    fecha: fechaVenta,
                                    desde: fechaDesde1,
                                    hasta: fechaHasta1,
                                    venta: venta
                                });
                            }

                            return cumpleFecha && cumpleRazonSocial && cumpleTienda;
                        } catch (error) {
                            console.error('Error procesando venta:', error, venta);
                            return false;
                        }
                    });
                }

                console.log('Datos filtrados:', data.length);
                resolve(data);
            };

            request.onerror = (error) => {
                reject(error);
            };
        } catch (error) {
            reject(error);
        }
    });
}

// Función auxiliar para verificar si hay filtros activos
function hayFiltrosActivos() {
    return filtrosActuales.fechaDesde1 || 
           filtrosActuales.fechaHasta1 || 
           filtrosActuales.razonSocial !== 'all' || 
           (filtrosActuales.tiendas.length > 0 && !filtrosActuales.tiendas.includes('Todo'));
}


// Función para actualizar lista de tiendas
async function actualizarTiendas() {
    const tiendaSelect = document.getElementById('tienda');
    const razonSocial = document.getElementById('razonSocial').value;
    
    try {
        const transaction = db.transaction(['ventas'], 'readonly');
        const store = transaction.objectStore('ventas');
        const request = store.getAll();

        request.onsuccess = () => {
            const data = request.result;
            const tiendasUnicas = new Set();
            
            // Agregar opción "Todo"
            tiendasUnicas.add('Todo');

            // Debug: Ver todas las tiendas que están llegando
            console.log('Todas las tiendas:', data.map(venta => ({
                razonSocial: venta.razonSocial,
                tienda: venta.tienda
            })));
            
            // Agregar tiendas específicas
            data.forEach(venta => {
                if (razonSocial === 'all' || venta.razonSocial === razonSocial) {
                    if (venta.tienda && venta.tienda.trim() !== '') {
                        // Normalizar el nombre de la tienda
                        let tiendaNormalizada = venta.tienda;
                        // Aquí podemos agregar más normalizaciones si es necesario
                        tiendasUnicas.add(tiendaNormalizada);
                    }
                }
            });

            // Debug: Ver tiendas únicas encontradas
            console.log('Tiendas únicas:', Array.from(tiendasUnicas));

            tiendaSelect.innerHTML = '';
            Array.from(tiendasUnicas)
                .sort()
                .forEach(tienda => {
                    const option = document.createElement('option');
                    option.value = tienda;
                    option.textContent = tienda;
                    tiendaSelect.appendChild(option);
                });

            // Seleccionar "Todo" por defecto
            tiendaSelect.value = 'Todo';
        };
    } catch (error) {
        console.error('Error al actualizar tiendas:', error);
        mostrarError('Error al cargar las tiendas');
    }
}

// Función para generar reporte PDF (placeholder)
async function generarReporte() {
    try {
        const procesarBtn = document.getElementById('aplicarFiltros');
        const reportBtn = document.getElementById('generarReporte');
        
        procesarBtn.disabled = true;
        reportBtn.disabled = true;
        
        const datos = await getDatosFiltrados();
        if (!datos || datos.length === 0) {
            alert('No hay datos para generar el reporte');
            return;
        }

        // Crear el documento PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Configurar fuente
        doc.setFont('helvetica');

        // Agregar logo
        const logo = new Image();
        logo.src = './Fotos/favicon.png'; // Asegúrate de que la ruta sea correcta
        doc.addImage(logo, 'PNG', 10, 10, 20, 20); // x, y, width, height
        
        // Agregar título y fecha con más espacio
        doc.setFontSize(24);
        doc.text('Reporte de Ventas', 105, 30, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Generado: ${new Date().toLocaleDateString()}`, 105, 40, { align: 'center' });

        // Agregar filtros aplicados con más espacio
        doc.setFontSize(14);
        doc.text('Filtros Aplicados:', 20, 55);
        doc.setFontSize(10);
        let y = 65;
        
        if (filtrosActuales.fechaDesde1) {
            doc.text(`Desde: ${filtrosActuales.fechaDesde1}`, 25, y);
            y += 7;
        }
        if (filtrosActuales.fechaHasta1) {
            doc.text(`Hasta: ${filtrosActuales.fechaHasta1}`, 25, y);
            y += 7;
        }
        if (filtrosActuales.razonSocial !== 'all') {
            doc.text(`Razón Social: ${filtrosActuales.razonSocial}`, 25, y);
            y += 7;
        }
        if (filtrosActuales.tiendas.length > 0) {
            doc.text(`Tiendas: ${filtrosActuales.tiendas.join(', ')}`, 25, y);
            y += 7;
        }

        y += 10; // Espacio adicional antes del resumen

        // Agregar KPIs con mejor espaciado
        const kpis = {
            totalVentas: datos.reduce((sum, venta) => sum + parseFloat(venta.Total || 0), 0),
            cantidadTransacciones: new Set(datos.map(venta => venta.Comprobante)).size,
            cantidadProductos: datos.reduce((sum, venta) => sum + parseFloat(venta.Cantidad || 1), 0),
            ticketPromedio: 0,
            ventasMarketplace: datos.filter(venta => 
                venta.tienda && 
                (venta.tienda.includes('Meli') || venta.tienda.includes('Bapro'))
            ).reduce((sum, venta) => sum + parseFloat(venta.Total || 0), 0)
        };
        kpis.ticketPromedio = kpis.cantidadTransacciones > 0 ? 
            kpis.totalVentas / kpis.cantidadTransacciones : 0;

        doc.setFontSize(14);
        doc.text('Resumen:', 20, y);
        y += 10;
        doc.setFontSize(10);

        const resumenTexts = [
            `Total Ventas: $${kpis.totalVentas.toLocaleString('es-AR')}`,
            `Cantidad de Transacciones: ${kpis.cantidadTransacciones.toLocaleString('es-AR')}`,
            `Productos Vendidos: ${kpis.cantidadProductos.toLocaleString('es-AR')}`,
            `Ticket Promedio: $${kpis.ticketPromedio.toLocaleString('es-AR')}`,
            `Ventas Marketplace: $${kpis.ventasMarketplace.toLocaleString('es-AR')}`
        ];

        resumenTexts.forEach(text => {
            doc.text(text, 25, y);
            y += 7;
        });

        y += 10; // Espacio adicional antes de los gráficos

        // Agregar gráficos con mejor espaciado
        const graficos = [
            'graficoTendencias',
            'graficoMarcas',
            'graficoCategorias',
            'graficoEdades',
            'graficoHorarios',
            'graficoMarketplace',
            'graficoMejoresCompradores',
            'graficoTendenciaCompra'
        ];

        const titulosGraficos = {
            'graficoTendencias': 'Tendencia de Ventas',
            'graficoMarcas': 'Top 10 Marcas',
            'graficoCategorias': 'Distribución por Categorías',
            'graficoEdades': 'Rango de Edades',
            'graficoHorarios': 'Horarios de Compra',
            'graficoMarketplace': 'Rendimiento por Marketplace',
            'graficoMejoresCompradores': 'Logisticas',
            'graficoTendenciaCompra': 'Tendencia de Compra'
        };

        let currentPage = 1;
        for (const graficoId of graficos) {
            const canvas = document.getElementById(graficoId);
            if (!canvas) continue;

            // Agregar nueva página si es necesario
            if (y > 230) { // Reducido de 250 para evitar cortes
                doc.addPage();
                y = 20;
                currentPage++;
            }

            try {
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 170;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                // Asegurar que el gráfico quepa en la página
                if (y + imgHeight > 270) { // Reducido de 280 para evitar cortes
                    doc.addPage();
                    y = 20;
                    currentPage++;
                }

                doc.setFontSize(12);
                doc.text(titulosGraficos[graficoId], 20, y);
                y += 7;

                doc.addImage(imgData, 'PNG', 20, y, imgWidth, imgHeight);
                y += imgHeight + 15;
            } catch (error) {
                console.error(`Error al procesar gráfico ${graficoId}:`, error);
            }
        }

        // Agregar numeración de páginas
        const totalPages = currentPage;
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(`Página ${i} de ${totalPages}`, 105, 290, { align: 'center' });
        }

        // Guardar el PDF
        const fechaActual = new Date().toISOString().slice(0,10);
        doc.save(`Reporte_Ventas_${fechaActual}.pdf`);

    } catch (error) {
        console.error('Error al generar reporte:', error);
        alert('Error al generar el reporte: ' + error.message);
    } finally {
        // Reactivar botones
        document.getElementById('aplicarFiltros').disabled = false;
        document.getElementById('generarReporte').disabled = false;
    }
}

// Configuración global de Chart.js para formato de moneda argentina
Chart.defaults.plugins.tooltip.callbacks.label = function(context) {
    if (typeof context.raw === 'number') {
        if (context.chart.config.type === 'doughnut') {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            return `${context.label}: ${((context.raw / total) * 100).toFixed(1)}%`;
        }
        return `${context.dataset.label || ''}: ${new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(context.raw)}`;
    }
    return context.label;
};


// Modificar el título de la sección de "Mejores Compradores" a "Análisis de Logística"
function actualizarTitulosGraficos() {
    const mejoresCompradoresHeader = document.querySelector('.chart-card:has(#graficoMejoresCompradores) h3');
    if (mejoresCompradoresHeader) {
        mejoresCompradoresHeader.textContent = 'Análisis de Logística';
    }
}

// Añadir esta función a la inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Código existente...
    
    // Actualizar títulos después de cargar el DOM
    setTimeout(actualizarTitulosGraficos, 500);
});

// Función para añadir botones de control más compactos
// Actualización de la función existente `addChartControls`
// Ahora incluye los botones para alternar líneas de cuadrícula.
function addChartControls(container, title = '') {
    if (!container || !container.parentElement) return;
    
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'chart-controls';
    controlsContainer.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        width: 100%;
        padding: 0 10px;
        box-sizing: border-box;
        position: relative;
        z-index: 1;
    `;
    
    const toggleButton = document.createElement('button');
    toggleButton.className = 'toggle-values-btn';
    toggleButton.textContent = 'Mostrar Valores';
    toggleButton.style.cssText = `
        background-color: #4CAF50;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 0.3s;
        margin: 0;
        white-space: nowrap;
    `;
    
    if (title) {
        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        titleElement.style.cssText = `
            margin: 0;
            font-size: 14px;
            color: #333;
            flex-grow: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
        controlsContainer.appendChild(titleElement);
    }
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 10px;
        align-items: center;
    `;
    
    buttonContainer.appendChild(toggleButton);
    controlsContainer.appendChild(buttonContainer);
    
    // Insertar antes del contenedor del gráfico
    container.parentElement.insertBefore(controlsContainer, container);
}


// Función para ajustar las dimensiones de todos los gráficos
function ajustarDimensionesGraficos() {
    const graficosRegulares = [
        'graficoCategorias',
        'graficoEdades',
        'graficoHorarios',
        'graficoMarketplace',
        'graficoMejoresCompradores'
    ];

    const graficosGrandes = [
        'graficoTendencias',
        'graficoMarcas'
    ];

    // Ajustar gráficos regulares
    graficosRegulares.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            setupChartContainer(container);
        }
    });

    // Ajustar gráficos grandes
    graficosGrandes.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            setupLargeChartContainer(container);
        }
    });
}

// Asegurarse de que los gráficos se ajusten cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    ajustarDimensionesGraficos();
});

function getBarChartOptions(title) {
    return {
        ...baseChartConfig,
        plugins: {
            ...baseChartConfig.plugins,
            title: {
                display: true,
                text: title,
                font: { size: 16, weight: 'bold' },
                padding: { top: 20, bottom: 20 }
            }
        },
        scales: {
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    padding: 10
                },
                grid: {
                    display: false
                }
            },
            y: {
                position: 'left',
                beginAtZero: true,
                ticks: {
                    padding: 10,
                    callback: value => formatoPeso(value)
                },
                grid: {
                    drawBorder: false
                }
            },
            y1: {
                position: 'right',
                beginAtZero: true,
                grid: {
                    drawOnChartArea: false,
                    drawBorder: false
                },
                ticks: {
                    padding: 10,
                    callback: value => value.toLocaleString()
                }
            }
        },
        layout: {
            padding: {
                top: 50,    // Extra padding para las etiquetas superiores
                right: 30,
                bottom: 40, // Extra padding para las etiquetas rotadas
                left: 20
            }
        }
    };
}

// Añadir una función para manejar el redimensionamiento
window.addEventListener('resize', () => {
    const charts = document.querySelectorAll('.chart-container');
    charts.forEach(container => {
        if (container.chart) {
            container.chart.resize();
        }
    });
});

// Agregar al final del archivo o donde corresponda
function inicializarReportesRapidos() {
    const buttons = document.querySelectorAll('.quick-report-btn');
    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            const razonSocial = button.dataset.razon;
            const tienda = button.dataset.tienda;
            
            // Obtener las fechas actuales de los filtros
            const fechaDesde = document.getElementById('dateFrom1').value;
            const fechaHasta = document.getElementById('dateTo1').value;

            // Crear filtros temporales
            const filtrosTemp = {
                fechaDesde1: fechaDesde,
                fechaHasta1: fechaHasta,
                razonSocial: razonSocial,
                tiendas: [tienda]
            };

            // Guardar filtros actuales
            const filtrosOriginales = {...filtrosActuales};
            
            // Aplicar filtros temporales
            filtrosActuales = filtrosTemp;

            // Generar reporte
            await generarReporte();

            // Restaurar filtros originales
            filtrosActuales = filtrosOriginales;
        });
    });
}

// Agregar la inicialización al DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // ... resto del código existente ...
    inicializarReportesRapidos();
});