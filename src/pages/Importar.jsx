// Archivo: src/pages/Importar.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import { useSettings } from '../context/SettingsContext';
import { obtenerCategorias } from '../lib/categoriasApi';
import { obtenerCarteras } from '../lib/carterasApi';
import { agregarTransaccion } from '../lib/transaccionesApi';
import { parse as parseDate, isValid as isValidDate, format as formatDateFns } from 'date-fns';

// --- Iconos SVG Inline ---
const UploadCloudIcon = ({ className = "page-title-icon" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
);
// CORRECCIÓN: Asegurar que la clase por defecto en la definición del componente SVG sea solo para el tamaño base,
// y luego aplicar clases adicionales (como mr-2) al usarlo.
const FileScanIcon = ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 12h5"/><path d="M8 16h5"/><path d="M10 12v.01"/></svg>
);
const RocketIcon = ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.87 12.87 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
);
// --- Fin Iconos SVG Inline ---

const APP_FIELDS = [
    { id: 'fecha', label: 'Fecha', required: true, example: '2024-07-15 o 15/07/2024' },
    { id: 'descripcion', label: 'Descripción', required: true, example: 'Compra supermercado' },
    { id: 'monto', label: 'Monto', required: true, example: '150.75 o -50.00' },
    { id: 'tipo', label: 'Tipo (Ingreso/Egreso)', required: false, example: 'Ingreso o Egreso (Opcional)' },
    { id: 'categoria', label: 'Categoría (Nombre exacto)', required: true, example: 'Comida' },
    { id: 'cartera', label: 'Cartera (Nombre exacto)', required: true, example: 'Banco Principal' },
    { id: 'tags', label: 'Etiquetas (separadas por coma)', required: false, example: 'viaje, urgente' },
];
const REQUIRED_APP_FIELDS_IDS = APP_FIELDS.filter(f => f.required).map(f => f.id);
const formatYMD = (date) => { if (!date) return ''; try { return new Date(date).toLocaleDateString('sv-SE'); } catch (e) { return ''; } };

function Importar({ session }) {
    const { currency } = useSettings();
    const [csvFile, setCsvFile] = useState(null);
    const [csvData, setCsvData] = useState([]);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [parseComplete, setParseComplete] = useState(false);
    const initialMapping = useMemo(() => APP_FIELDS.reduce((acc, field) => { acc[field.id] = ''; return acc; }, {}), []);
    const [columnMapping, setColumnMapping] = useState(initialMapping);
    const [previewData, setPreviewData] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importErrors, setImportErrors] = useState([]);
    const [importSuccessCount, setImportSuccessCount] = useState(0);
    const [categoriasMap, setCategoriasMap] = useState(new Map());
    const [carterasMap, setCarterasMap] = useState(new Map());
    const [loadingRefs, setLoadingRefs] = useState(false);

    const baseLabelClasses = "block text-sm font-medium text-slate-300 mb-1.5";
    const baseInputClasses = "block w-full px-3.5 py-2.5 bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 text-sm shadow-sm focus:ring-2 focus:ring-brand-accent-primary focus:border-brand-accent-primary disabled:opacity-60 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-600 file:text-slate-200 hover:file:bg-slate-500 cursor-pointer";
    const baseSelectClasses = `${baseInputClasses} appearance-none pr-10`;
    const baseButtonClasses = (color = 'indigo', size = 'md') => `inline-flex items-center justify-center px-${size === 'sm' ? 3 : 5} py-${size === 'sm' ? '1.5' : '2.5'} border border-transparent rounded-lg shadow-md text-${size === 'sm' ? 'xs' : 'sm'} font-semibold text-white transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed ${color === 'green' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : ''} ${color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : ''}`;
    const tableHeaderClasses = "px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider";
    const tableCellClasses = "px-3 py-2 whitespace-nowrap text-xs";

    const cargarReferencias = useCallback(async () => { if (!session?.user?.id) return; if (categoriasMap.size > 0 && carterasMap.size > 0 && !loadingRefs) return; setLoadingRefs(true); try { const [resCat, resCart] = await Promise.all([ obtenerCategorias(), obtenerCarteras() ]); if (resCat.error || resCart.error) throw new Error(`${resCat.error?.message || resCart.error?.message}`); const catMap = new Map(); (resCat.data || []).forEach(c => catMap.set(c.nombre.toLowerCase().trim(), { id: c.id, tipo: c.tipo })); setCategoriasMap(catMap); const cartMap = new Map(); (resCart.data || []).forEach(c => cartMap.set(c.nombre.toLowerCase().trim(), c.id)); setCarterasMap(cartMap); } catch (err) { setError(`Error refs: ${err.message}`); } finally { setLoadingRefs(false); } }, [session, categoriasMap, carterasMap, loadingRefs]);
    useEffect(() => { if (session) { cargarReferencias(); } }, [session, cargarReferencias]);
    const resetState = () => { setCsvFile(null); setCsvData([]); setCsvHeaders([]); setError(''); setParseComplete(false); setIsLoading(false); setColumnMapping(initialMapping); setPreviewData([]); setIsImporting(false); setImportProgress(0); setImportErrors([]); setImportSuccessCount(0); const fileInput = document.getElementById('csv-upload'); if (fileInput) fileInput.value = ''; };
    const handleFileChange = (event) => { resetState(); const file = event.target.files[0]; if (file && (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv'))) { setCsvFile(file); } else { setError('Selecciona un archivo CSV válido.'); } };
    const generatePreview = useCallback((data, mapping) => { const preview = data.slice(0, 5).map((row, index) => { const mappedRow = { _originalRow: index + 2 }; APP_FIELDS.forEach(appField => { mappedRow[appField.id] = mapping[appField.id] ? row[mapping[appField.id]] : undefined; }); return mappedRow; }); setPreviewData(preview); }, []);
    const handleParseCSV = useCallback(() => { if (!csvFile) { setError('Selecciona CSV.'); return; } setIsLoading(true); setError(''); setParseComplete(false); setColumnMapping(initialMapping); setPreviewData([]); Papa.parse(csvFile, { header: true, skipEmptyLines: true, dynamicTyping: false, complete: (results) => { if (results.errors?.length) { setError(`Error parseo: ${results.errors[0].message}`); } else if (!results.data?.length) { setError("CSV vacío."); } else if (!results.meta?.fields?.length) { setError("No cabeceras."); } else { setCsvHeaders(results.meta.fields); setCsvData(results.data); setParseComplete(true); setError(''); const autoMapping = {}; APP_FIELDS.forEach(appField => { const foundHeader = results.meta.fields.find(h => { const cH = h?.toLowerCase().replace(/\s+/g, '') || ''; const cA = appField.id.toLowerCase().replace(/\s+/g, ''); return cH === cA || (appField.id === 'monto' && (cH.includes('monto')||cH.includes('amount')||cH.includes('importe')||cH.includes('valor'))) || (appField.id === 'fecha' && (cH.includes('fecha')||cH.includes('date'))) || (appField.id === 'descripcion' && (cH.includes('descrip')||cH.includes('concept')||cH.includes('memo'))) || (appField.id === 'categoria' && cH.includes('categor')) || (appField.id === 'cartera' && (cH.includes('cartera')||cH.includes('cuenta')||cH.includes('account'))) || (appField.id === 'tipo' && cH.includes('tipo')||cH.includes('type')); }); autoMapping[appField.id] = foundHeader || ''; }); setColumnMapping(autoMapping); generatePreview(results.data, autoMapping); } setIsLoading(false); }, error: (err) => { setError(`Error Papaparse: ${err.message}`); setIsLoading(false); } }); }, [csvFile, initialMapping, generatePreview]);
    const handleMappingChange = (appField, csvHeader) => { const newMapping = { ...columnMapping, [appField]: csvHeader }; setColumnMapping(newMapping); generatePreview(csvData, newMapping); };
    const parseAndValidateDate = (dateString) => { if (!dateString || typeof dateString !== 'string') return null; const fmts = ['yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'dd-MM-yyyy', 'MM-dd-yyyy', 'yyyy/MM/dd']; for (const fmt of fmts) { try { const p = parseDate(dateString, fmt, new Date()); if (isValidDate(p)) return formatYMD(p); } catch (e) {} } return null; };
    const parseAndValidateAmount = (amount) => { if (amount === null || amount === undefined) return null; let nS = String(amount).replace(/[^0-9.,-]/g, '').replace(',', '.'); const n = parseFloat(nS); if (isNaN(n)) return null; return { monto: Math.abs(n), signo: n < 0 ? '-' : (n > 0 ? '+' : '=') }; };
    const parseAndValidateType = (typeString) => { if (!typeString || typeof typeString !== 'string') return null; const lT = typeString.toLowerCase().trim(); if (lT.includes('ingreso') || lT.includes('entrada') || lT.includes('income') || lT.includes('credit')) return 'Ingreso'; if (lT.includes('egreso') || lT.includes('salida') || lT.includes('gasto') || lT.includes('expense') || lT.includes('debit')) return 'Egreso'; return null; };
    const handleImportData = async () => { if (!parseComplete || csvData.length === 0 || loadingRefs || isImporting) return; const missingMappings = REQUIRED_APP_FIELDS_IDS.filter(f => !columnMapping[f]); if (missingMappings.length > 0) { setError(`Falta mapear: ${missingMappings.join(', ')}`); return; } setIsImporting(true); setImportErrors([]); setImportSuccessCount(0); setImportProgress(0); setError(''); const transactionsToInsert = []; const errorsFound = []; const totalRows = csvData.length; for (let i = 0; i < totalRows; i++) { const row = csvData[i]; const rowNum = i + 2; let isValid = true; const transaction = { fecha: null, descripcion: null, monto: null, tipo: null, categoria_id: null, cartera_id: null, tags: [] }; transaction.fecha = parseAndValidateDate(row[columnMapping.fecha]); transaction.descripcion = String(row[columnMapping.descripcion] || '').trim() || `Importado ${formatYMD(new Date())}`; const montoRaw = row[columnMapping.monto]; const tipoRaw = columnMapping.tipo ? row[columnMapping.tipo] : null; const montoResult = parseAndValidateAmount(montoRaw); if (montoResult === null) { errorsFound.push(`Fila ${rowNum}: Monto inválido.`); isValid = false; } else { transaction.monto = montoResult.monto; } if (tipoRaw) { transaction.tipo = parseAndValidateType(tipoRaw); if (!transaction.tipo) { errorsFound.push(`Fila ${rowNum}: Tipo '${tipoRaw}' no reconocido.`); isValid = false; } } else { if (montoResult === null) { /* Ya hay error de monto */ } else if (montoResult.signo === '+') { transaction.tipo = 'Ingreso'; } else if (montoResult.signo === '-') { transaction.tipo = 'Egreso'; } else { errorsFound.push(`Fila ${rowNum}: No se pudo determinar Tipo.`); isValid = false; } } if (!transaction.fecha) { errorsFound.push(`Fila ${rowNum}: Fecha inválida.`); isValid = false; } const categoriaNombre = String(row[columnMapping.categoria] || '').toLowerCase().trim(); const carteraNombre = String(row[columnMapping.cartera] || '').toLowerCase().trim(); if (!categoriaNombre) { errorsFound.push(`Fila ${rowNum}: Nombre categoría vacío.`); isValid = false; } else { const categoriaMatch = categoriasMap.get(categoriaNombre); if (!categoriaMatch) { errorsFound.push(`Fila ${rowNum}: Categoría '${row[columnMapping.categoria]}' no encontrada.`); isValid = false; } else if (transaction.tipo && categoriaMatch.tipo !== transaction.tipo) { errorsFound.push(`Fila ${rowNum}: Tipo (${transaction.tipo}) no coincide con tipo cat. '${row[columnMapping.categoria]}' (${categoriaMatch.tipo}).`); isValid = false; } else { transaction.categoria_id = categoriaMatch.id; } } if (!carteraNombre) { errorsFound.push(`Fila ${rowNum}: Nombre cartera vacío.`); isValid = false; } else { const carteraMatchId = carterasMap.get(carteraNombre); if (!carteraMatchId) { errorsFound.push(`Fila ${rowNum}: Cartera '${row[columnMapping.cartera]}' no encontrada.`); isValid = false; } else { transaction.cartera_id = carteraMatchId; } } if (columnMapping.tags && row[columnMapping.tags]) { transaction.tags = String(row[columnMapping.tags]).split(',').map(t => t.trim()).filter(t => t !== ''); } else { transaction.tags = []; } if (isValid) { transactionsToInsert.push({ ...transaction, _originalRow: rowNum }); } } setImportErrors(errorsFound); if (transactionsToInsert.length > 0) { let currentSuccessCount = 0; const finalErrors = [...errorsFound]; for (let i = 0; i < transactionsToInsert.length; i++) { const { _originalRow, ...tx } = transactionsToInsert[i]; try { const { error: insertError } = await agregarTransaccion(tx); if (insertError) { finalErrors.push(`Fila ${_originalRow}: Error Supabase - ${insertError.message}`); } else { currentSuccessCount++; } } catch (err) { finalErrors.push(`Fila ${_originalRow}: Error Inesperado - ${err.message}`); } setImportProgress(((i + 1) / transactionsToInsert.length) * 100); } setImportSuccessCount(currentSuccessCount); setImportErrors(finalErrors); alert(`Importación finalizada. ${currentSuccessCount} transacciones importadas. ${finalErrors.length > 0 ? finalErrors.length + ' errores.' : ''}`); } else if (errorsFound.length > 0) { alert(`No se importaron transacciones. ${errorsFound.length} errores encontrados.`); } else { alert("No se encontraron transacciones válidas para importar."); } setIsImporting(false); };

    return (
        <div className="space-y-8">
            <h1 className="page-title"> <UploadCloudIcon /> Importar Transacciones (CSV) </h1>

            <section className="card-base">
                <h2 className="text-xl font-semibold mb-1 text-slate-100">Paso 1: Seleccionar Archivo CSV</h2>
                <p className="text-sm text-slate-400 mb-6">Elige un archivo CSV con tus transacciones. Asegúrate de que tenga cabeceras.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 items-end">
                    <div className="md:col-span-2">
                        <label htmlFor="csv-upload" className={baseLabelClasses}>Archivo CSV (.csv)</label>
                        <input type="file" id="csv-upload" accept=".csv, text/csv" onChange={handleFileChange} className={baseInputClasses} />
                        {csvFile && <p className="text-xs text-slate-400 mt-1.5">Seleccionado: <span className="font-medium text-slate-300">{csvFile.name}</span></p>}
                    </div>
                    <div className="md:self-end">
                        <button onClick={handleParseCSV} className={`${baseButtonClasses('blue')} w-full`} disabled={!csvFile || isLoading}>
                            {/* CORRECCIÓN: Aplicar explícitamente w-4 h-4 además de mr-2 */}
                            <FileScanIcon className="mr-2 w-4 h-4"/> 
                            {isLoading ? 'Leyendo...' : 'Leer Archivo'}
                        </button>
                    </div>
                </div>
                {error && !parseComplete && <p className="text-red-400 bg-red-900/20 p-2 rounded-md mt-4 text-sm">{error}</p>}
            </section>

            {parseComplete && (
                <section className="card-base">
                    <h2 className="text-xl font-semibold mb-1 text-slate-100">Paso 2: Mapear Columnas</h2>
                    <p className="text-sm text-slate-400 mb-6">Indica qué columna de tu CSV corresponde a cada campo de la aplicación. Los campos con <span className="text-red-500">*</span> son requeridos.</p>
                    {loadingRefs && <p className="text-slate-400">Cargando referencias (categorías/carteras)...</p>}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 mb-6">
                        {APP_FIELDS.map(appField => (
                            <div key={appField.id}>
                                <label htmlFor={`map-${appField.id}`} className={baseLabelClasses}> {appField.label} {appField.required && <span className="text-red-500">*</span>} </label>
                                <select id={`map-${appField.id}`} value={columnMapping[appField.id] || ''} onChange={(e) => handleMappingChange(appField.id, e.target.value)} className={baseSelectClasses} disabled={loadingRefs || isImporting} >
                                    <option value="">-- {appField.required ? 'Selecciona Columna CSV' : 'Columna CSV (Opcional)'} --</option>
                                    {csvHeaders.map(header => ( <option key={header} value={header}>{header}</option> ))}
                                </select>
                                <p className='text-xs text-slate-500 mt-1 italic'>Ej: {appField.example}</p>
                            </div>
                        ))}
                    </div>

                    <h3 className="text-lg font-semibold mb-3 text-slate-200">Vista Previa (Primeras 5 filas mapeadas)</h3>
                    <div className="overflow-x-auto border border-slate-700 rounded-lg max-h-72 mb-6">
                        <table className="w-full min-w-[800px] text-xs text-left">
                            <thead className="bg-slate-700/50 sticky top-0 z-10">
                                <tr> {APP_FIELDS.map(f => <th key={f.id} scope="col" className={`${tableHeaderClasses} py-2.5`}><div className="flex flex-col"><span>{f.label}</span><span className="text-slate-500 font-normal normal-case truncate">({columnMapping[f.id] || 'No mapeado'})</span></div></th>)} </tr>
                            </thead>
                            <tbody className="bg-slate-800 divide-y divide-slate-700">
                                {previewData.map((row, idx) => ( <tr key={idx} className="hover:bg-slate-700/30"> {APP_FIELDS.map(f => <td key={f.id} className={`${tableCellClasses} py-2 text-slate-300 truncate max-w-[150px]`} title={String(row[f.id] ?? '')}>{String(row[f.id] ?? '') || <span className='italic text-slate-500'>Vacío</span>}</td>)} </tr> ))}
                                {previewData.length === 0 && <tr><td colSpan={APP_FIELDS.length} className="text-center py-4 text-slate-500">No hay datos para previsualizar o el mapeo está incompleto.</td></tr>}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-4 border-t border-slate-700">
                         <div className="flex-grow text-sm text-right space-y-1">
                             {importSuccessCount > 0 && !isImporting && (<p className="text-green-400">Transacciones importadas con éxito: {importSuccessCount}</p>)}
                             {importErrors.length > 0 && !isImporting && (<p className="text-red-400">Errores durante la importación: {importErrors.length}</p>)}
                         </div>
                         <button onClick={handleImportData} className={`${baseButtonClasses('green')} w-full sm:w-auto`} disabled={isImporting || loadingRefs || REQUIRED_APP_FIELDS_IDS.some(f => !columnMapping[f])} >
                             {/* CORRECCIÓN: Aplicar explícitamente w-4 h-4 además de mr-2 */}
                             <RocketIcon className="mr-2 w-4 h-4"/> 
                             {isImporting ? `Importando (${importProgress.toFixed(0)}%)...` : 'Importar Datos'}
                         </button>
                    </div>

                    {isImporting && ( <div className="mt-4"> <div className="w-full bg-slate-600 rounded-full h-2.5"> <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${importProgress}%` }}></div> </div> </div> )}
                    {importErrors.length > 0 && !isImporting && ( <div className="mt-4 p-3 bg-slate-700/50 border border-red-700/50 rounded-lg max-h-40 overflow-y-auto"> <h4 className="text-sm font-semibold text-red-300 mb-2">Detalle de Errores ({importErrors.length}):</h4> <ul className="list-disc list-inside text-xs text-red-300/90 space-y-1"> {importErrors.slice(0, 50).map((err, i) => <li key={i} className="truncate" title={err}>{err}</li>)} {importErrors.length > 50 && <li>... y {importErrors.length - 50} más.</li>} </ul> </div> )}
                </section>
            )}
        </div>
    );
}

export default Importar;
