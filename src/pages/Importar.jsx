import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Papa from 'papaparse'; // Para leer CSV
import { useSettings } from '../context/SettingsContext';
import { obtenerCategorias } from '../lib/categoriasApi'; // Para buscar IDs
import { obtenerCarteras } from '../lib/carterasApi';   // Para buscar IDs
import { agregarTransaccion } from '../lib/transaccionesApi'; // Para guardar
import { parse as parseDate, isValid as isValidDate, format as formatDate } from 'date-fns'; // Para manejo de fechas

// Campos requeridos por nuestra aplicación para una transacción
const REQUIRED_APP_FIELDS = ['fecha', 'descripcion', 'monto', 'tipo', 'categoria', 'cartera'];
// Campos opcionales que podríamos mapear
// const OPTIONAL_APP_FIELDS = ['notas'];

function Importar({ session }) {
    const { currency } = useSettings();

    // Estados del archivo y parseo
    const [csvFile, setCsvFile] = useState(null);
    const [csvData, setCsvData] = useState([]);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [parseComplete, setParseComplete] = useState(false);

    // Estados para mapeo y previsualización
    const [columnMapping, setColumnMapping] = useState({}); // { appField: csvHeader, ... }
    const [previewData, setPreviewData] = useState([]); // Primeras filas con datos mapeados

    // Estados para el proceso de importación
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importErrors, setImportErrors] = useState([]); // Errores por fila
    const [importSuccessCount, setImportSuccessCount] = useState(0);

    // Estados para listas de referencia (categorías y carteras)
    const [categoriasMap, setCategoriasMap] = useState(new Map()); // { 'nombreLower': id }
    const [carterasMap, setCarterasMap] = useState(new Map());   // { 'nombreLower': id }
    const [loadingRefs, setLoadingRefs] = useState(false);

    // Cargar categorías y carteras para mapeo de nombres a IDs
    const cargarReferencias = useCallback(async () => {
        if (!session?.user?.id) return;
        setLoadingRefs(true);
        try {
            const [resCat, resCart] = await Promise.all([
                obtenerCategorias(), // Obtener todas (Ingreso y Egreso)
                obtenerCarteras()
            ]);
            if (resCat.error || resCart.error) {
                throw new Error(`Error cargando refs: ${resCat.error?.message || resCart.error?.message}`);
            }
            // Crear mapas para búsqueda rápida (nombre en minúsculas -> ID)
            const catMap = new Map();
            (resCat.data || []).forEach(c => catMap.set(c.nombre.toLowerCase(), { id: c.id, tipo: c.tipo }));
            setCategoriasMap(catMap);

            const cartMap = new Map();
            (resCart.data || []).forEach(c => cartMap.set(c.nombre.toLowerCase(), c.id));
            setCarterasMap(cartMap);
            console.log("Referencias cargadas: ", catMap, cartMap);

        } catch (err) {
            setError(`Error cargando referencias: ${err.message}`);
        } finally {
            setLoadingRefs(false);
        }
    }, [session]);

    // Cargar referencias al montar
    useEffect(() => {
        cargarReferencias();
    }, [cargarReferencias]);

    // Resetear estado completo
    const resetState = () => {
        setCsvFile(null); setCsvData([]); setCsvHeaders([]); setError('');
        setParseComplete(false); setIsLoading(false); setColumnMapping({});
        setPreviewData([]); setIsImporting(false); setImportProgress(0);
        setImportErrors([]); setImportSuccessCount(0);
        // Limpiar input de archivo
        const fileInput = document.getElementById('csv-upload');
        if (fileInput) fileInput.value = '';
    };

    const handleFileChange = (event) => {
        resetState(); // Resetea todo al cambiar archivo
        const file = event.target.files[0];
        if (file && file.type === 'text/csv') { setCsvFile(file); }
        else { setError('Selecciona un archivo CSV.'); }
    };

    // Parsear CSV
    const handleParseCSV = useCallback(() => {
        if (!csvFile) { setError('Selecciona un archivo CSV.'); return; }
        setIsLoading(true); setError(''); setParseComplete(false); setColumnMapping({}); setPreviewData([]);
        Papa.parse(csvFile, {
            header: true, skipEmptyLines: true, dynamicTyping: false, // Importante: dynamicTyping=false para manejar fechas/números manualmente
            complete: (results) => {
                if (results.errors?.length) { setError(`Error parseo: ${results.errors[0].message}`); setCsvData([]); setCsvHeaders([]); }
                else if (!results.data?.length) { setError("CSV vacío o sin datos."); setCsvData([]); setCsvHeaders([]); }
                else if (!results.meta?.fields?.length) { setError("No se detectaron cabeceras."); setCsvData([]); setCsvHeaders([]); }
                else {
                    setCsvHeaders(results.meta.fields);
                    setCsvData(results.data);
                    setParseComplete(true); // Activa sección de mapeo
                    setError('');
                    // Inicializar mapeo automático (intento básico)
                    const initialMapping = {};
                    REQUIRED_APP_FIELDS.forEach(appField => {
                        // Busca cabecera CSV que coincida (ignorando mayúsculas/espacios)
                        const foundHeader = results.meta.fields.find(h =>
                            h.toLowerCase().replace(/\s+/g, '') === appField.toLowerCase().replace(/\s+/g, '') ||
                            (appField === 'monto' && h.toLowerCase().includes('amount')) || // Casos comunes
                            (appField === 'fecha' && h.toLowerCase().includes('date')) ||
                            (appField === 'descripcion' && h.toLowerCase().includes('description'))
                        );
                        initialMapping[appField] = foundHeader || ''; // Asigna si encuentra, si no, vacío
                    });
                    setColumnMapping(initialMapping);
                    // Generar vista previa inicial
                    generatePreview(results.data, initialMapping);
                } setIsLoading(false);
            }, error: (err) => { setError(`Error Papaparse: ${err.message}`); setIsLoading(false); setCsvData([]); setCsvHeaders([]); }
        });
    }, [csvFile]);

    // Actualizar mapeo seleccionado por el usuario
    const handleMappingChange = (appField, csvHeader) => {
        const newMapping = { ...columnMapping, [appField]: csvHeader };
        setColumnMapping(newMapping);
        generatePreview(csvData, newMapping); // Actualizar vista previa al cambiar mapeo
    };

    // Generar datos de vista previa (primeras 5 filas)
    const generatePreview = (data, mapping) => {
        const preview = data.slice(0, 5).map((row, index) => {
            const mappedRow = { _originalRow: index + 1 }; // Guardar número de fila original
            REQUIRED_APP_FIELDS.forEach(appField => {
                mappedRow[appField] = mapping[appField] ? row[mapping[appField]] : undefined;
            });
            return mappedRow;
        });
        setPreviewData(preview);
    };

    // --- Lógica de Importación ---
    const handleImportData = async () => {
        if (!parseComplete || csvData.length === 0 || loadingRefs) return;

        // Validar que todos los campos requeridos estén mapeados
        const missingMappings = REQUIRED_APP_FIELDS.filter(f => !columnMapping[f]);
        if (missingMappings.length > 0) {
            setError(`Falta mapear las columnas para: ${missingMappings.join(', ')}`);
            return;
        }

        setIsImporting(true);
        setImportErrors([]);
        setImportSuccessCount(0);
        setImportProgress(0);
        setError('');

        const transactionsToInsert = [];
        const errorsFound = [];

        // 1. Procesar y Validar cada fila
        for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i];
            const rowNum = i + 1; // Número de fila para errores
            let isValid = true;
            const transaction = {};

            // Mapear y validar campos
            transaction.fecha = parseAndValidateDate(row[columnMapping.fecha]);
            transaction.descripcion = String(row[columnMapping.descripcion] || '').trim() || null; // Descripción opcional
            transaction.monto = parseAndValidateAmount(row[columnMapping.monto]);
            transaction.tipo = parseAndValidateType(row[columnMapping.tipo]);

            if (!transaction.fecha) { errorsFound.push(`Fila ${rowNum}: Fecha inválida.`); isValid = false; }
            if (transaction.monto === null || transaction.monto <= 0) { errorsFound.push(`Fila ${rowNum}: Monto inválido (debe ser > 0).`); isValid = false; }
            if (!transaction.tipo) { errorsFound.push(`Fila ${rowNum}: Tipo inválido (debe ser 'Ingreso' o 'Egreso').`); isValid = false; }

            // Buscar IDs de Categoría y Cartera (case-insensitive)
            const categoriaNombre = String(row[columnMapping.categoria] || '').toLowerCase().trim();
            const carteraNombre = String(row[columnMapping.cartera] || '').toLowerCase().trim();

            const categoriaMatch = categoriasMap.get(categoriaNombre);
            const carteraMatchId = carterasMap.get(carteraNombre);

            if (!categoriaMatch) { errorsFound.push(`Fila ${rowNum}: Categoría '${row[columnMapping.categoria]}' no encontrada.`); isValid = false; }
            // Validar que el tipo de la categoría coincida con el tipo de la transacción
            else if (categoriaMatch.tipo !== transaction.tipo) { errorsFound.push(`Fila ${rowNum}: Tipo (${transaction.tipo}) no coincide con tipo de categoría '${row[columnMapping.categoria]}' (${categoriaMatch.tipo}).`); isValid = false; }
            else { transaction.categoria_id = categoriaMatch.id; }

            if (!carteraMatchId) { errorsFound.push(`Fila ${rowNum}: Cartera '${row[columnMapping.cartera]}' no encontrada.`); isValid = false; }
            else { transaction.cartera_id = carteraMatchId; }

            if (isValid) {
                transactionsToInsert.push(transaction);
            }

            // Actualizar progreso (opcional, puede ralentizar un poco)
            // setImportProgress(((i + 1) / csvData.length) * 100);
        }

        setImportErrors(errorsFound);

        // 2. Si hay transacciones válidas, intentar insertarlas
        if (transactionsToInsert.length > 0) {
            console.log(`Intentando importar ${transactionsToInsert.length} transacciones válidas...`);
            let successCount = 0;
            // Insertar una por una (más simple, pero más lento)
            // Idealmente, usar una función RPC para inserción masiva
            for (let i = 0; i < transactionsToInsert.length; i++) {
                const tx = transactionsToInsert[i];
                try {
                    // agregarTransaccion ya añade user_id
                    const { error: insertError } = await agregarTransaccion(tx);
                    if (insertError) {
                        // Registrar error específico de esta fila
                        errorsFound.push(`Fila ${i + 1} (Datos: ${JSON.stringify(tx)}): Error Supabase - ${insertError.message}`);
                    } else {
                        successCount++;
                    }
                } catch (err) {
                    errorsFound.push(`Fila ${i + 1}: Error inesperado - ${err.message}`);
                }
                 setImportProgress(((i + 1) / transactionsToInsert.length) * 100); // Progreso de inserción
            }
            setImportSuccessCount(successCount);
            setImportErrors(errorsFound); // Actualizar errores con los de la inserción
            alert(`Importación completada. ${successCount} transacciones importadas. ${errorsFound.length > 0 ? errorsFound.length + ' errores encontrados (ver detalles abajo).' : ''}`);

        } else if (errorsFound.length > 0) {
            alert(`No se importaron transacciones debido a ${errorsFound.length} errores. Revisa los detalles.`);
        } else {
             alert("No se encontraron transacciones válidas para importar en el archivo.");
        }

        setIsImporting(false);
        setImportProgress(100); // Marcar como completado
    };

    // --- Funciones de Validación Auxiliares ---
    const parseAndValidateDate = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return null;
        // Intentar varios formatos comunes (añadir más si es necesario)
        const formats = ['yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'dd-MM-yyyy', 'MM-dd-yyyy'];
        for (const fmt of formats) {
            try {
                 // date-fns necesita una fecha base para parsear, usamos hoy
                const parsed = parseDate(dateString, fmt, new Date());
                if (isValidDate(parsed)) {
                    return formatYMD(parsed); // Devuelve en formato YYYY-MM-DD
                }
            } catch (e) { /* Ignorar error de formato y probar siguiente */ }
        }
        return null; // No se pudo parsear
    };

    const parseAndValidateAmount = (amount) => {
        if (amount === null || amount === undefined) return null;
        let numStr = String(amount).replace(/[^0-9.,-]/g, ''); // Quitar símbolos excepto ',', '.', '-'
        numStr = numStr.replace(',', '.'); // Reemplazar coma decimal por punto
        const num = parseFloat(numStr);
        return (!isNaN(num)) ? Math.abs(num) : null; // Devuelve siempre positivo, el tipo define si suma/resta
    };

     const parseAndValidateType = (typeString) => {
         if (!typeString || typeof typeString !== 'string') return null;
         const lowerType = typeString.toLowerCase().trim();
         if (lowerType.includes('ingreso') || lowerType.includes('entrada') || lowerType.includes('income') || lowerType.includes('credit')) return 'Ingreso';
         if (lowerType.includes('egreso') || lowerType.includes('salida') || lowerType.includes('gasto') || lowerType.includes('expense') || lowerType.includes('debit')) return 'Egreso';
         return null; // No reconocido
     };

    // --- Clases CSS ---
    const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
    const inputClasses = `block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer`;
    const selectClasses = `${inputClasses} bg-gray-700`;
    const buttonClasses = (color = 'indigo') => `px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${color}-600 hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-${color}-500 transition duration-150 disabled:opacity-50`;

    return (
        <div className="space-y-8">
            <div className="flex items-center text-white"> <span className="mr-3 text-2xl">📥</span> <h1 className="text-2xl font-semibold">Importar Transacciones (CSV)</h1> </div>

            {/* Sección Carga */}
            <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-white">Paso 1: Seleccionar Archivo</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2"> <label htmlFor="csv-upload" className={labelClasses}>Archivo CSV</label> <input type="file" id="csv-upload" accept=".csv, text/csv" onChange={handleFileChange} className={inputClasses} /> {csvFile && <p className="text-xs text-gray-400 mt-1">Seleccionado: {csvFile.name}</p>} </div>
                    <div> <button onClick={handleParseCSV} className={`${buttonClasses('blue')} w-full`} disabled={!csvFile || isLoading}> {isLoading ? 'Leyendo...' : 'Leer Archivo'} </button> </div>
                </div>
                {error && !parseComplete && <p className="text-red-400 mt-4 text-sm">{error}</p>}
            </section>

            {/* Sección Mapeo y Vista Previa */}
            {parseComplete && (
                <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-white">Paso 2: Mapear Columnas</h2>
                    <p className="text-sm text-gray-400 mb-4">Indica qué columna de tu archivo CSV corresponde a cada campo requerido por la aplicación.</p>
                    {loadingRefs && <p className="text-blue-400">Cargando referencias...</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {REQUIRED_APP_FIELDS.map(appField => (
                            <div key={appField}>
                                <label htmlFor={`map-${appField}`} className={labelClasses}>
                                    {/* Nombre legible del campo */}
                                    {appField.charAt(0).toUpperCase() + appField.slice(1)} (App) <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id={`map-${appField}`}
                                    value={columnMapping[appField] || ''}
                                    onChange={(e) => handleMappingChange(appField, e.target.value)}
                                    className={selectClasses}
                                    disabled={loadingRefs}
                                >
                                    <option value="" disabled>-- Selecciona Columna CSV --</option>
                                    {csvHeaders.map(header => (
                                        <option key={header} value={header}>{header}</option>
                                    ))}
                                    {/* Opción para ignorar si no es estrictamente necesario? */}
                                </select>
                            </div>
                        ))}
                    </div>

                    <h3 className="text-lg font-semibold mb-2 text-white">Vista Previa (Primeras 5 filas)</h3>
                    <div className="overflow-x-auto border border-gray-700 rounded-md max-h-60">
                        <table className="w-full text-xs text-left text-gray-400">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                                <tr>
                                    {REQUIRED_APP_FIELDS.map(appField => (
                                        <th key={appField} scope="col" className="px-3 py-2">
                                            {appField.charAt(0).toUpperCase() + appField.slice(1)}
                                            <span className="block text-gray-500 normal-case truncate">({columnMapping[appField] || 'No mapeado'})</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {previewData.map((row, index) => (
                                    <tr key={index}>
                                        {REQUIRED_APP_FIELDS.map(appField => (
                                            <td key={appField} className="px-3 py-2 whitespace-nowrap truncate max-w-[150px]" title={String(row[appField] ?? '')}>
                                                {String(row[appField] ?? '') || <span className='italic text-gray-500'>Vacío</span>}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Botón de Importación */}
                    <div className="mt-6 text-right">
                         <button
                            onClick={handleImportData}
                            className={`${buttonClasses('green')} disabled:bg-green-800`}
                            disabled={isImporting || loadingRefs || REQUIRED_APP_FIELDS.some(f => !columnMapping[f])} // Deshabilitado si falta mapeo
                         >
                             {isImporting ? `Importando (${importProgress.toFixed(0)}%)...` : '🚀 Importar Datos'}
                         </button>
                    </div>

                    {/* Progreso y Errores de Importación */}
                    {isImporting && (
                        <div className="mt-4">
                            <div className="w-full bg-gray-600 rounded-full h-2.5">
                                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${importProgress}%` }}></div>
                            </div>
                        </div>
                    )}
                    {importErrors.length > 0 && (
                        <div className="mt-4 p-3 bg-red-900 border border-red-700 rounded-md max-h-40 overflow-y-auto">
                            <h4 className="text-sm font-semibold text-red-300 mb-2">Errores durante la importación ({importErrors.length}):</h4>
                            <ul className="list-disc list-inside text-xs text-red-300 space-y-1">
                                {importErrors.slice(0, 50).map((err, i) => <li key={i}>{err}</li>)} {/* Mostrar max 50 errores */}
                                {importErrors.length > 50 && <li>... y {importErrors.length - 50} más.</li>}
                            </ul>
                        </div>
                    )}
                    {importSuccessCount > 0 && !isImporting && (
                         <p className="text-green-400 mt-4 text-sm">Se importaron {importSuccessCount} transacciones con éxito.</p>
                    )}

                </section>
            )}

        </div>
    );
}

export default Importar;
