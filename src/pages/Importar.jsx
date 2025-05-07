import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Papa from 'papaparse'; // Para leer CSV
import { useSettings } from '../context/SettingsContext';
import { obtenerCategorias } from '../lib/categoriasApi'; // Para buscar IDs
import { obtenerCarteras } from '../lib/carterasApi';   // Para buscar IDs
import { agregarTransaccion } from '../lib/transaccionesApi'; // Para guardar
import { parse as parseDate, isValid as isValidDate, format as formatDate } from 'date-fns'; // Para manejo de fechas
// import { es } from 'date-fns/locale'; // Opcional: para parsear formatos con nombres de mes en español

// Campos requeridos/opcionales por nuestra aplicación para una transacción importada
const APP_FIELDS = [
    { id: 'fecha', label: 'Fecha', required: true, example: '2024-07-15 o 15/07/2024' },
    { id: 'descripcion', label: 'Descripción', required: true, example: 'Compra supermercado' },
    { id: 'monto', label: 'Monto', required: true, example: '150.75 o -50.00 (el signo determina el tipo si no se mapea)' },
    { id: 'tipo', label: 'Tipo (Ingreso/Egreso)', required: false, example: 'Ingreso o Egreso (Opcional)' }, // Opcional si monto tiene signo
    { id: 'categoria', label: 'Categoría (Nombre exacto)', required: true, example: 'Comida' },
    { id: 'cartera', label: 'Cartera (Nombre exacto)', required: true, example: 'Banco Principal' },
    { id: 'tags', label: 'Etiquetas (separadas por coma)', required: false, example: 'viaje, urgente' }, // Añadido campo opcional para tags
];
const REQUIRED_APP_FIELDS_IDS = APP_FIELDS.filter(f => f.required).map(f => f.id);

function Importar({ session }) {
    const { currency } = useSettings(); // Obtener moneda por si se usa en futuro

    // Estados del archivo y parseo
    const [csvFile, setCsvFile] = useState(null);
    const [csvData, setCsvData] = useState([]); // Datos parseados raw
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [parseComplete, setParseComplete] = useState(false);

    // Estados para mapeo y previsualización
    const initialMapping = APP_FIELDS.reduce((acc, field) => { acc[field.id] = ''; return acc; }, {});
    const [columnMapping, setColumnMapping] = useState(initialMapping);
    const [previewData, setPreviewData] = useState([]); // Datos mapeados para vista previa

    // Estados para el proceso de importación
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importErrors, setImportErrors] = useState([]);
    const [importSuccessCount, setImportSuccessCount] = useState(0);

    // Estados para listas de referencia (categorías y carteras)
    const [categoriasMap, setCategoriasMap] = useState(new Map());
    const [carterasMap, setCarterasMap] = useState(new Map());
    const [loadingRefs, setLoadingRefs] = useState(false);

    // Cargar categorías y carteras para mapeo de nombres a IDs
    const cargarReferencias = useCallback(async () => {
        if (!session?.user?.id) return;
        if (categoriasMap.size > 0 && carterasMap.size > 0 && !loadingRefs) return; // Evitar recargas innecesarias
        console.log("Cargando referencias...");
        setLoadingRefs(true);
        try {
            const [resCat, resCart] = await Promise.all([ obtenerCategorias(), obtenerCarteras() ]);
            if (resCat.error || resCart.error) throw new Error(`${resCat.error?.message || resCart.error?.message}`);
            const catMap = new Map(); (resCat.data || []).forEach(c => catMap.set(c.nombre.toLowerCase().trim(), { id: c.id, tipo: c.tipo })); setCategoriasMap(catMap);
            const cartMap = new Map(); (resCart.data || []).forEach(c => cartMap.set(c.nombre.toLowerCase().trim(), c.id)); setCarterasMap(cartMap);
            console.log("Referencias cargadas.");
        } catch (err) { setError(`Error refs: ${err.message}`); }
        finally { setLoadingRefs(false); }
    }, [session, categoriasMap, carterasMap, loadingRefs]); // Incluir loadingRefs para evitar llamadas concurrentes

    useEffect(() => { if (session) { cargarReferencias(); } }, [session, cargarReferencias]);

    // Resetear estado completo
    const resetState = () => { setCsvFile(null); setCsvData([]); setCsvHeaders([]); setError(''); setParseComplete(false); setIsLoading(false); setColumnMapping(initialMapping); setPreviewData([]); setIsImporting(false); setImportProgress(0); setImportErrors([]); setImportSuccessCount(0); const fileInput = document.getElementById('csv-upload'); if (fileInput) fileInput.value = ''; };
    const handleFileChange = (event) => { resetState(); const file = event.target.files[0]; if (file && (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv'))) { setCsvFile(file); } else { setError('Selecciona un archivo CSV.'); } };

    // Parsear CSV
    const handleParseCSV = useCallback(() => { if (!csvFile) { setError('Selecciona CSV.'); return; } setIsLoading(true); setError(''); setParseComplete(false); setColumnMapping(initialMapping); setPreviewData([]); Papa.parse(csvFile, { header: true, skipEmptyLines: true, dynamicTyping: false, complete: (results) => { if (results.errors?.length) { setError(`Error parseo: ${results.errors[0].message}`); } else if (!results.data?.length) { setError("CSV vacío."); } else if (!results.meta?.fields?.length) { setError("No cabeceras."); } else { setCsvHeaders(results.meta.fields); setCsvData(results.data); setParseComplete(true); setError(''); const autoMapping = {}; APP_FIELDS.forEach(appField => { const foundHeader = results.meta.fields.find(h => { const cH = h?.toLowerCase().replace(/\s+/g, '') || ''; const cA = appField.id.toLowerCase().replace(/\s+/g, ''); return cH === cA || (appField.id === 'monto' && (cH.includes('monto')||cH.includes('amount')||cH.includes('importe')||cH.includes('valor'))) || (appField.id === 'fecha' && (cH.includes('fecha')||cH.includes('date'))) || (appField.id === 'descripcion' && (cH.includes('descrip')||cH.includes('concept')||cH.includes('memo'))) || (appField.id === 'categoria' && cH.includes('categor')) || (appField.id === 'cartera' && (cH.includes('cartera')||cH.includes('cuenta')||cH.includes('account'))) || (appField.id === 'tipo' && cH.includes('tipo')||cH.includes('type')); }); autoMapping[appField.id] = foundHeader || ''; }); setColumnMapping(autoMapping); generatePreview(results.data, autoMapping); } setIsLoading(false); }, error: (err) => { setError(`Error Papaparse: ${err.message}`); setIsLoading(false); } }); }, [csvFile, initialMapping]);

    // Actualizar mapeo
    const handleMappingChange = (appField, csvHeader) => { const newMapping = { ...columnMapping, [appField]: csvHeader }; setColumnMapping(newMapping); generatePreview(csvData, newMapping); };

    // Generar vista previa
    const generatePreview = (data, mapping) => { const preview = data.slice(0, 5).map((row, index) => { const mappedRow = { _originalRow: index + 2 }; APP_FIELDS.forEach(appField => { mappedRow[appField.id] = mapping[appField.id] ? row[mapping[appField.id]] : undefined; }); return mappedRow; }); setPreviewData(preview); };

    // --- Lógica de Importación REAL ---
    const handleImportData = async () => {
        if (!parseComplete || csvData.length === 0 || loadingRefs || isImporting) return;

        const missingMappings = REQUIRED_APP_FIELDS_IDS.filter(f => !columnMapping[f]);
        if (missingMappings.length > 0) { setError(`Falta mapear: ${missingMappings.join(', ')}`); return; }

        setIsImporting(true); setImportErrors([]); setImportSuccessCount(0); setImportProgress(0); setError('');

        const transactionsToInsert = [];
        const errorsFound = [];
        const totalRows = csvData.length;

        // 1. Procesar y Validar cada fila
        for (let i = 0; i < totalRows; i++) {
            const row = csvData[i];
            const rowNum = i + 2; // +2 por header y 0-based index
            let isValid = true;
            const transaction = { fecha: null, descripcion: null, monto: null, tipo: null, categoria_id: null, cartera_id: null, tags: [] };

            // Mapear y validar campos básicos
            transaction.fecha = parseAndValidateDate(row[columnMapping.fecha]);
            transaction.descripcion = String(row[columnMapping.descripcion] || '').trim() || `Importado ${formatYMD(new Date())}`;
            const montoRaw = row[columnMapping.monto];
            const tipoRaw = columnMapping.tipo ? row[columnMapping.tipo] : null;

            const montoResult = parseAndValidateAmount(montoRaw);
            if (montoResult === null) { errorsFound.push(`Fila ${rowNum}: Monto inválido.`); isValid = false; }
            else { transaction.monto = montoResult.monto; } // Monto siempre positivo

            if (tipoRaw) {
                transaction.tipo = parseAndValidateType(tipoRaw);
                if (!transaction.tipo) { errorsFound.push(`Fila ${rowNum}: Tipo '${tipoRaw}' no reconocido.`); isValid = false; }
            } else {
                if (montoResult === null) { /* Ya hay error de monto */ }
                else if (montoResult.signo === '+') { transaction.tipo = 'Ingreso'; }
                else if (montoResult.signo === '-') { transaction.tipo = 'Egreso'; }
                else { errorsFound.push(`Fila ${rowNum}: No se pudo determinar Tipo.`); isValid = false; }
            }

            if (!transaction.fecha) { errorsFound.push(`Fila ${rowNum}: Fecha inválida.`); isValid = false; }

            // Buscar IDs de Categoría y Cartera
            const categoriaNombre = String(row[columnMapping.categoria] || '').toLowerCase().trim();
            const carteraNombre = String(row[columnMapping.cartera] || '').toLowerCase().trim();

            if (!categoriaNombre) { errorsFound.push(`Fila ${rowNum}: Nombre categoría vacío.`); isValid = false; }
            else {
                const categoriaMatch = categoriasMap.get(categoriaNombre);
                if (!categoriaMatch) { errorsFound.push(`Fila ${rowNum}: Categoría '${row[columnMapping.categoria]}' no encontrada.`); isValid = false; }
                else if (transaction.tipo && categoriaMatch.tipo !== transaction.tipo) { errorsFound.push(`Fila ${rowNum}: Tipo (${transaction.tipo}) no coincide con tipo cat. '${row[columnMapping.categoria]}' (${categoriaMatch.tipo}).`); isValid = false; }
                else { transaction.categoria_id = categoriaMatch.id; }
            }

            if (!carteraNombre) { errorsFound.push(`Fila ${rowNum}: Nombre cartera vacío.`); isValid = false; }
            else {
                const carteraMatchId = carterasMap.get(carteraNombre);
                if (!carteraMatchId) { errorsFound.push(`Fila ${rowNum}: Cartera '${row[columnMapping.cartera]}' no encontrada.`); isValid = false; }
                else { transaction.cartera_id = carteraMatchId; }
            }

            // Procesar Tags (opcional)
            if (columnMapping.tags && row[columnMapping.tags]) {
                transaction.tags = String(row[columnMapping.tags]).split(',').map(t => t.trim()).filter(t => t !== '');
            } else {
                transaction.tags = []; // Asegurar que sea array vacío si no hay mapeo o dato
            }

            if (isValid) { transactionsToInsert.push({ ...transaction, _originalRow: rowNum }); } // Guardar fila original para errores
        }

        setImportErrors(errorsFound); // Mostrar errores de validación

        // 2. Si hay transacciones válidas, intentar insertarlas
        if (transactionsToInsert.length > 0) {
            console.log(`Insertando ${transactionsToInsert.length} transacciones...`);
            let currentSuccessCount = 0;
            const finalErrors = [...errorsFound]; // Copia errores de validación

            // Usar inserción una por una para mejor manejo de errores individuales
            for (let i = 0; i < transactionsToInsert.length; i++) {
                const { _originalRow, ...tx } = transactionsToInsert[i]; // Quitar fila original
                try {
                    const { error: insertError } = await agregarTransaccion(tx); // API ya añade user_id
                    if (insertError) {
                        finalErrors.push(`Fila ${_originalRow}: Error Supabase - ${insertError.message}`);
                    } else {
                        currentSuccessCount++;
                    }
                } catch (err) {
                    finalErrors.push(`Fila ${_originalRow}: Error Inesperado - ${err.message}`);
                }
                 setImportProgress(((i + 1) / transactionsToInsert.length) * 100);
            }

            setImportSuccessCount(currentSuccessCount);
            setImportErrors(finalErrors);
            alert(`Importación finalizada. ${currentSuccessCount} transacciones importadas. ${finalErrors.length > 0 ? finalErrors.length + ' errores.' : ''}`);

        } else if (errorsFound.length > 0) {
            alert(`No se importaron transacciones. ${errorsFound.length} errores encontrados.`);
        } else {
             alert("No se encontraron transacciones válidas para importar.");
        }

        setIsImporting(false);
    };

    // --- Funciones de Validación Auxiliares ---
    const parseAndValidateDate = (dateString) => { if (!dateString || typeof dateString !== 'string') return null; const fmts = ['yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'dd-MM-yyyy', 'MM-dd-yyyy', 'yyyy/MM/dd']; for (const fmt of fmts) { try { const p = parseDate(dateString, fmt, new Date()); if (isValidDate(p)) return formatYMD(p); } catch (e) {} } return null; };
    const parseAndValidateAmount = (amount) => { if (amount === null || amount === undefined) return null; let nS = String(amount).replace(/[^0-9.,-]/g, '').replace(',', '.'); const n = parseFloat(nS); if (isNaN(n)) return null; return { monto: Math.abs(n), signo: n < 0 ? '-' : (n > 0 ? '+' : '=') }; }; // Devuelve monto y signo
    const parseAndValidateType = (typeString) => { if (!typeString || typeof typeString !== 'string') return null; const lT = typeString.toLowerCase().trim(); if (lT.includes('ingreso') || lT.includes('entrada') || lT.includes('income') || lT.includes('credit')) return 'Ingreso'; if (lT.includes('egreso') || lT.includes('salida') || lT.includes('gasto') || lT.includes('expense') || lT.includes('debit')) return 'Egreso'; return null; };

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"> <div className="md:col-span-2"> <label htmlFor="csv-upload" className={labelClasses}>Archivo CSV</label> <input type="file" id="csv-upload" accept=".csv, text/csv" onChange={handleFileChange} className={inputClasses} /> {csvFile && <p className="text-xs text-gray-400 mt-1">Seleccionado: {csvFile.name}</p>} </div> <div> <button onClick={handleParseCSV} className={`${buttonClasses('blue')} w-full`} disabled={!csvFile || isLoading}> {isLoading ? 'Leyendo...' : 'Leer Archivo'} </button> </div> </div>
                {error && !parseComplete && <p className="text-red-400 mt-4 text-sm">{error}</p>}
            </section>

            {/* Sección Mapeo y Vista Previa */}
            {parseComplete && (
                <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-white">Paso 2: Mapear Columnas</h2>
                    <p className="text-sm text-gray-400 mb-4">Indica qué columna CSV corresponde a cada campo requerido (<span className="text-red-500">*</span>). El tipo se puede inferir del signo +/- del monto si no mapeas 'Tipo'.</p>
                    {loadingRefs && <p className="text-blue-400">Cargando referencias...</p>}
                    {/* Interfaz de Mapeo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mb-6">
                        {APP_FIELDS.map(appField => (
                            <div key={appField.id}>
                                <label htmlFor={`map-${appField.id}`} className={labelClasses}> {appField.label} {appField.required && <span className="text-red-500">*</span>} </label>
                                <select id={`map-${appField.id}`} value={columnMapping[appField.id] || ''} onChange={(e) => handleMappingChange(appField.id, e.target.value)} className={selectClasses} disabled={loadingRefs || isImporting} >
                                    <option value="">-- {appField.required ? 'Selecciona Columna' : 'Opcional'} --</option>
                                    {csvHeaders.map(header => ( <option key={header} value={header}>{header}</option> ))}
                                </select>
                                <p className='text-xs text-gray-500 mt-1 italic'>Ej: {appField.example}</p>
                            </div>
                        ))}
                    </div>

                    {/* Vista Previa */}
                    <h3 className="text-lg font-semibold mb-2 text-white">Vista Previa (Primeras 5 filas mapeadas)</h3>
                    <div className="overflow-x-auto border border-gray-700 rounded-md max-h-60 mb-6">
                        <table className="w-full text-xs text-left text-gray-400">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0 z-10">
                                <tr> {APP_FIELDS.map(f => <th key={f.id} scope="col" className="px-3 py-2">{f.label}<span className="block text-gray-500 normal-case truncate">({columnMapping[f.id] || 'N/A'})</span></th>)} </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {previewData.map((row, idx) => ( <tr key={idx}> {APP_FIELDS.map(f => <td key={f.id} className="px-3 py-2 whitespace-nowrap truncate max-w-[150px]" title={String(row[f.id] ?? '')}>{String(row[f.id] ?? '') || <span className='italic text-gray-500'>V</span>}</td>)} </tr> ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Botón Importar y Resultados */}
                    <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
                         <div className="flex-grow text-sm text-right">
                             {importSuccessCount > 0 && !isImporting && (<p className="text-green-400">Importadas: {importSuccessCount}</p>)}
                             {importErrors.length > 0 && !isImporting && (<p className="text-red-400">Errores: {importErrors.length}</p>)}
                         </div>
                         <button onClick={handleImportData} className={`${buttonClasses('green')} disabled:bg-green-800 w-full sm:w-auto`} disabled={isImporting || loadingRefs || REQUIRED_APP_FIELDS_IDS.some(f => !columnMapping[f])} >
                             {isImporting ? `Importando (${importProgress.toFixed(0)}%)...` : '🚀 Importar Datos'}
                         </button>
                    </div>

                    {/* Progreso y Errores Detallados */}
                    {isImporting && ( <div className="mt-4"> <div className="w-full bg-gray-600 rounded-full h-2.5"> <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${importProgress}%` }}></div> </div> </div> )}
                    {importErrors.length > 0 && !isImporting && ( <div className="mt-4 p-3 bg-gray-800 border border-red-700 rounded-md max-h-40 overflow-y-auto"> <h4 className="text-sm font-semibold text-red-300 mb-2">Detalle de Errores ({importErrors.length}):</h4> <ul className="list-disc list-inside text-xs text-red-300 space-y-1"> {importErrors.slice(0, 50).map((err, i) => <li key={i}>{err}</li>)} {importErrors.length > 50 && <li>... y {importErrors.length - 50} más.</li>} </ul> </div> )}

                </section>
            )}
        </div>
    );
}

export default Importar;
