// Importar XLSX
importScripts('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.5/xlsx.full.min.js');

// Tamaño del chunk (número de filas por proceso)
const CHUNK_SIZE = 5000; // Reducido para manejar mejor la memoria

// Función para procesar un chunk de datos
function procesarChunk(chunk, headers) {
    return chunk.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            if (row[index] !== undefined) {
                obj[header] = row[index];
            }
        });
        return obj;
    });
}

// Escuchar mensajes del hilo principal
self.onmessage = async function(e) {
    const { tipo, data } = e.data;

    try {
        switch (tipo) {
            case 'PROCESAR_ARCHIVO':
                const { buffer, sucursales } = data;
                
                // Leer el archivo con opciones específicas para archivos grandes
                const workbook = XLSX.read(new Uint8Array(buffer), {
                    type: 'array',
                    cellDates: true,
                    cellNF: true,
                    cellText: false,
                    cellStyles: false,
                    bookVBA: false,
                    bookDeps: false,
                    bookFiles: false,
                    bookProps: false,
                    bookSheets: false,
                    WTF: false,
                    sheetStubs: true,
                    sheetRows: 0,
                    compression: true
                });

                if (!workbook.SheetNames.length) {
                    throw new Error('El archivo Excel está vacío');
                }

                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                
                // Convertir a JSON con opciones optimizadas
                const rawData = XLSX.utils.sheet_to_json(firstSheet, {
                    raw: true,
                    defval: null,
                    header: 1,
                    blankrows: false,
                    rawNumbers: true
                });

                if (!rawData || rawData.length <= 1) {
                    throw new Error('No se encontraron datos en el archivo');
                }

                // Obtener headers y datos
                const headers = rawData[0];
                const dataRows = rawData.slice(1);
                const totalChunks = Math.ceil(dataRows.length / CHUNK_SIZE);

                // Notificar inicio del proceso
                self.postMessage({ 
                    tipo: 'INICIO_PROCESO', 
                    data: { 
                        totalChunks,
                        totalRows: dataRows.length 
                    } 
                });

                let datosFinales = [];
                let chunkProcesado = 0;
                
                // Procesar por chunks
                for (let i = 0; i < dataRows.length; i += CHUNK_SIZE) {
                    chunkProcesado++;
                    const chunk = dataRows.slice(i, Math.min(i + CHUNK_SIZE, dataRows.length));
                    
                    try {
                        // Procesar chunk actual
                        const chunkObjetos = procesarChunk(chunk, headers);
                        const datosValidados = validarDatos(chunkObjetos);
                        const datosConTiempo = analizarTiempoInventario(datosValidados);
                        const datosConDesempeno = analizarDesempenoReciente(datosConTiempo);
                        const chunkFinal = clasificarRentabilidad(datosConDesempeno);

                        // Filtrar por sucursales
                        const datosFiltrados = chunkFinal.filter(row => 
                            sucursales.includes(row.Sucursal)
                        );

                        if (datosFiltrados.length > 0) {
                            datosFinales = datosFinales.concat(datosFiltrados);
                        }

                        // Notificar progreso
                        self.postMessage({ 
                            tipo: 'PROGRESO', 
                            data: { 
                                chunk: chunkProcesado,
                                totalChunks,
                                filasProcesadas: i + chunk.length
                            } 
                        });

                        // Liberar memoria
                        if (chunkProcesado % 10 === 0) {
                            await new Promise(resolve => setTimeout(resolve, 0));
                        }
                    } catch (chunkError) {
                        console.error(`Error procesando chunk ${chunkProcesado}:`, chunkError);
                        continue; // Continuar con el siguiente chunk si hay error
                    }
                }

                if (datosFinales.length === 0) {
                    throw new Error('No se encontraron datos para las sucursales seleccionadas');
                }

                // Enviar resultados finales
                self.postMessage({ 
                    tipo: 'COMPLETADO', 
                    data: datosFinales 
                });
                break;
        }
    } catch (error) {
        self.postMessage({ 
            tipo: 'ERROR', 
            data: error.message 
        });
    }
};

// Función para validar datos
function validarDatos(data) {
    if (!Array.isArray(data) || !data.length) {
        throw new Error('No hay datos para procesar');
    }

    return data.map(row => {
        try {
            return {
                Sucursal: String(row.Sucursal || '').trim(),
                ArtCod: String(row.ArtCod || ''),
                ArtDesc: String(row.ArtDesc || ''),
                Stock: Number(row.Stock) || 0,
                TotVenta: Number(row.TotVenta) || 0,
                StockValorizado: Number(row.StockValorizado) || 0,
                VentaValorizada: Number(row.VentaValorizada) || 0,
                Markup: Number(row.Markup) || 0,
                Rotacion: Number(row.Rotacion) || 0,
                UltRemCompra: new Date(row.UltRemCompra || Date.now())
            };
        } catch (error) {
            console.error('Error en fila:', row);
            return null;
        }
    }).filter(row => row !== null);
}

// Función para analizar tiempo de inventario
function analizarTiempoInventario(data) {
    const ahora = new Date();
    return data.map(row => ({
        ...row,
        DiasSinCompra: Math.floor((ahora - row.UltRemCompra) / (1000 * 60 * 60 * 24))
    }));
}

// Función para analizar desempeño reciente
function analizarDesempenoReciente(data) {
    return data.map(row => {
        const porcentajeVendido = row.Stock > 0 ? 
            (row.TotVenta / (row.TotVenta + row.Stock)) * 100 : 0;

        let etiqueta = 'Sin Clasificar';
        
        if (row.DiasSinCompra <= 60 && row.TotVenta > 0 && porcentajeVendido >= 50) {
            etiqueta = 'Éxito Reciente';
        } else if (row.DiasSinCompra > 60 && row.Stock > 0 && row.TotVenta <= 5) {
            etiqueta = 'Bajo Movimiento';
        } else if (row.DiasSinCompra > 120 && row.Stock > 0 && row.TotVenta === 0) {
            etiqueta = 'Obsoleto';
        }
        
        if (row.Rotacion > 80) {
            etiqueta = 'Alto Desempeño';
        }

        return {
            ...row,
            PorcentajeVendido: porcentajeVendido,
            Etiqueta: etiqueta
        };
    });
}

// Función para clasificar rentabilidad
function clasificarRentabilidad(data) {
    return data.map(row => ({
        ...row,
        Rentabilidad: row.Markup > 50 ? 'Alta Rentabilidad' :
                     row.Markup >= 20 ? 'Media Rentabilidad' :
                     row.Markup < 20 ? 'Baja Rentabilidad' : 'Sin Clasificar'
    }));
}