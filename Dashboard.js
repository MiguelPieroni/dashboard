
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

// Función principal para inicializar el dashboard
function inicializarDashboard() {
    try {
        // Obtener datos guardados
        const dashboardData = localStorage.getItem('dashboardData');
        if (!dashboardData) {
            console.log('No hay datos para mostrar');
            return;
        }

        const { data, timestamp } = JSON.parse(dashboardData);
        
        // Crear los gráficos
        crearGraficoEtiquetas(data);
        crearGraficoRentabilidad(data);
        crearGraficoSucursales(data);
        crearGraficoRotacion(data);
        crearResumenNumerico(data);
        
    } catch (error) {
        console.error('Error al inicializar dashboard:', error);
    }
}

function crearGraficoEtiquetas(data) {
    const container = document.getElementById('graficoEtiquetas');
    if (!container) return;

    const etiquetasData = Object.entries(
        data.reduce((acc, item) => {
            acc[item.Etiqueta] = (acc[item.Etiqueta] || 0) + 1;
            return acc;
        }, {})
    );

    new Chart(container, {
        type: 'pie',
        data: {
            labels: etiquetasData.map(([label]) => label),
            datasets: [{
                data: etiquetasData.map(([, value]) => value),
                backgroundColor: ['#4CAF50', '#FFC107', '#F44336', '#2196F3', '#9C27B0']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución por Etiquetas'
                }
            }
        }
    });
}

function crearGraficoRentabilidad(data) {
    const container = document.getElementById('graficoRentabilidad');
    if (!container) return;

    const rentabilidadData = Object.entries(
        data.reduce((acc, item) => {
            acc[item.Rentabilidad] = (acc[item.Rentabilidad] || 0) + 1;
            return acc;
        }, {})
    );

    new Chart(container, {
        type: 'pie',
        data: {
            labels: rentabilidadData.map(([label]) => label),
            datasets: [{
                data: rentabilidadData.map(([, value]) => value),
                backgroundColor: ['#4CAF50', '#FFC107', '#F44336', '#2196F3']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución por Rentabilidad'
                }
            }
        }
    });
}

function crearGraficoSucursales(data) {
    const container = document.getElementById('graficoSucursales');
    if (!container) return;

    const sucursalesData = Object.entries(
        data.reduce((acc, item) => {
            acc[item.Sucursal] = (acc[item.Sucursal] || 0) + item.Stock;
            return acc;
        }, {})
    ).sort((a, b) => b[1] - a[1]); // Ordenar por stock descendente

    new Chart(container, {
        type: 'bar',
        data: {
            labels: sucursalesData.map(([sucursal]) => sucursal),
            datasets: [{
                label: 'Stock por Sucursal',
                data: sucursalesData.map(([, stock]) => stock),
                backgroundColor: '#2196F3'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function crearGraficoRotacion(data) {
    const container = document.getElementById('graficoRotacion');
    if (!container) return;

    const rotacionData = data.map(item => ({
        x: item.Stock,
        y: item.Rotacion,
        label: item.ArtDesc
    }));

    new Chart(container, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Rotación vs Stock',
                data: rotacionData,
                backgroundColor: '#4CAF50'
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Stock'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Rotación'
                    }
                }
            }
        }
    });
}

function crearResumenNumerico(data) {
    const container = document.getElementById('resumenNumerico');
    if (!container) return;

    const resumen = {
        totalProductos: data.length,
        stockTotal: data.reduce((sum, item) => sum + item.Stock, 0),
        ventasTotal: data.reduce((sum, item) => sum + item.TotVenta, 0),
        stockValorizado: data.reduce((sum, item) => sum + item.StockValorizado, 0),
        ventasValorizadas: data.reduce((sum, item) => sum + item.VentaValorizada, 0)
    };

    container.innerHTML = `
        <div class="resumen-card">
            <h3>Total Productos</h3>
            <p>${resumen.totalProductos.toLocaleString()}</p>
        </div>
        <div class="resumen-card">
            <h3>Stock Total</h3>
            <p>${resumen.stockTotal.toLocaleString()}</p>
        </div>
        <div class="resumen-card">
            <h3>Ventas Totales</h3>
            <p>${resumen.ventasTotal.toLocaleString()}</p>
        </div>
        <div class="resumen-card">
            <h3>Stock Valorizado</h3>
            <p>$${resumen.stockValorizado.toLocaleString()}</p>
        </div>
        <div class="resumen-card">
            <h3>Ventas Valorizadas</h3>
            <p>$${resumen.ventasValorizadas.toLocaleString()}</p>
        </div>
    `;
}

// Inicializar el dashboard cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarDashboard);