import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { obtenerCategorias } from '../lib/categoriasApi';
import { obtenerCarteras } from '../lib/carterasApi';
// Importar todas las funciones de la API recurrente
import {
    obtenerRecurringTransactions,
    agregarRecurringTransaction,
    editarRecurringTransaction,
    eliminarRecurringTransaction,
    generarTransaccionesVencidas // <-- NUEVA IMPORTACIÓN
} from '../lib/recurringTransactionsApi';

const frecuencias = ['diario', 'semanal', 'quincenal', 'mensual', 'anual'];
const formatYMD = (date) => { /* ... (igual que antes) ... */ if (!date) return ''; try { if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) { return date; } return new Date(date).toISOString().split('T')[0]; } catch (e) { return ''; } };

function Recurring({ session }) {
    const { currency, loadingSettings, formatearMoneda } = useSettings();

    const [recurringList, setRecurringList] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [carteras, setCarteras] = useState([]);
    const [editandoRecurrente, setEditandoRecurrente] = useState(null);
    const [monto, setMonto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [tipo, setTipo] = useState('Egreso');
    const [categoriaId, setCategoriaId] = useState('');
    const [carteraId, setCarteraId] = useState('');
    const [frecuencia, setFrecuencia] = useState('mensual');
    const [intervalo, setIntervalo] = useState('1');
    const [fechaInicio, setFechaInicio] = useState(formatYMD(new Date()));
    const [fechaFin, setFechaFin] = useState('');
    const [proximaFecha, setProximaFecha] = useState('');
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Estados para Generación ---
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateMessage, setGenerateMessage] = useState('');
    // --- Fin Estados Generación ---

    const cargarDatos = useCallback(async () => { /* ... (igual que antes) ... */
        if (!session?.user?.id) return; setCargando(true); setError(null); try { const [resRecurrentes, resCategorias, resCarteras] = await Promise.all([ obtenerRecurringTransactions(), obtenerCategorias(), obtenerCarteras() ]); if (resRecurrentes.error) throw new Error(`Rec: ${resRecurrentes.error.message}`); if (resCategorias.error) throw new Error(`Cat: ${resCategorias.error.message}`); if (resCarteras.error) throw new Error(`Cart: ${resCarteras.error.message}`); setRecurringList(resRecurrentes.data || []); setCategorias(resCategorias.data || []); setCarteras(resCarteras.data || []); } catch (err) { setError(`Error: ${err.message}`); setRecurringList([]); setCategorias([]); setCarteras([]); } finally { setCargando(false); }
    }, [session]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    const categoriasFiltradas = useMemo(() => { /* ... (igual que antes) ... */ return categorias.filter(cat => cat.tipo === tipo); }, [categorias, tipo]);
    const resetForm = () => { /* ... (igual que antes) ... */ setEditandoRecurrente(null); setMonto(''); setDescripcion(''); setTipo('Egreso'); setCategoriaId(''); setCarteraId(''); setFrecuencia('mensual'); setIntervalo('1'); setFechaInicio(formatYMD(new Date())); setFechaFin(''); setProximaFecha(''); };
    const handleEditarClick = (recurrente) => { /* ... (igual que antes) ... */ setEditandoRecurrente(recurrente); setMonto(String(recurrente.monto)); setDescripcion(recurrente.descripcion || ''); setTipo(recurrente.tipo); setCategoriaId(String(recurrente.categoria_id || '')); setCarteraId(String(recurrente.cartera_id || '')); setFrecuencia(recurrente.frecuencia); setIntervalo(String(recurrente.intervalo)); setFechaInicio(formatYMD(recurrente.fecha_inicio)); setFechaFin(formatYMD(recurrente.fecha_fin)); setProximaFecha(formatYMD(recurrente.proxima_fecha)); document.getElementById('form-recurrente')?.scrollIntoView({ behavior: 'smooth' }); };
    const handleCancelarEdicion = () => { resetForm(); };

    const handleSubmit = async (event) => { /* ... (igual que antes, llama a cargarDatos al final si tiene éxito) ... */
        event.preventDefault();
        if (!session?.user?.id) { setError("Sin ID."); return; }
        if (!monto || isNaN(parseFloat(monto))) { alert("Monto inválido."); return; }
        if (!categoriaId) { alert("Selecciona categoría."); return; }
        if (!carteraId) { alert("Selecciona cartera."); return; }
        if (!fechaInicio) { alert("Selecciona fecha inicio."); return; }
        const proxFecha = proximaFecha || fechaInicio;
        if (new Date(proxFecha) < new Date(fechaInicio)) { alert("Próxima fecha < Fecha inicio."); return; }
        if (fechaFin && new Date(fechaFin) < new Date(fechaInicio)) { alert("Fecha fin < Fecha inicio."); return; }
        setError(null); setIsSubmitting(true); const userId = session.user.id;
        const datos = { monto: parseFloat(monto), descripcion: descripcion.trim() || null, tipo, categoria_id: parseInt(categoriaId, 10), cartera_id: parseInt(carteraId, 10), frecuencia, intervalo: parseInt(intervalo, 10) || 1, fecha_inicio: fechaInicio, fecha_fin: fechaFin || null, proxima_fecha: proxFecha };
        try {
            if (editandoRecurrente) { const { data, error: e } = await editarRecurringTransaction(editandoRecurrente.id, datos); if (e) throw e; }
            else { const { data, error: e } = await agregarRecurringTransaction(datos, userId); if (e) throw e; }
            resetForm();
            cargarDatos(); // Recargar la lista después de agregar/editar
        } catch (err) { setError(`Error: ${err.message || 'Desconocido'}`); }
        finally { setIsSubmitting(false); }
    };

    const handleEliminarClick = async (id) => { /* ... (igual que antes) ... */
        if (!window.confirm(`¿Eliminar?`)) return; setError(null); try { const { error: e } = await eliminarRecurringTransaction(id); if (e) throw e; setRecurringList(prev => prev.filter(r => r.id !== id)); if (editandoRecurrente?.id === id) { resetForm(); } } catch (err) { setError(`Error: ${err.message}`); }
     };

    // --- NUEVO: Manejador para el botón Generar Vencidas ---
    const handleGenerarClick = async () => {
        setIsGenerating(true);
        setGenerateMessage('');
        setError(null); // Limpiar errores previos
        console.log("Iniciando generación de transacciones vencidas...");
        try {
            const { count, error } = await generarTransaccionesVencidas();
            if (error) throw error;

            const message = `Se generaron ${count} transacciones.`;
            console.log(message);
            setGenerateMessage(message);
            // Recargar la lista de recurrentes para ver las nuevas próximas fechas
            cargarDatos();
            // Opcional: Navegar a Transacciones o mostrar un toast/notificación
            // navigateTo('Transacciones'); // Necesitarías pasar navigateTo como prop si haces esto
            setTimeout(() => setGenerateMessage(''), 5000); // Limpiar mensaje después de 5s

        } catch (err) {
            const errorMsg = `Error al generar transacciones: ${err.message || 'Desconocido'}`;
            console.error(errorMsg);
            setError(errorMsg); // Mostrar error general
            setGenerateMessage(''); // Limpiar mensaje de éxito/progreso
        } finally {
            setIsGenerating(false);
        }
    };
    // --- Fin Generación ---


    const formatearFechaCorta = (fechaIso) => { /* ... (igual que antes) ... */ if (!fechaIso) return 'N/A'; try { return new Date(fechaIso + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (e) { return 'Inválida'; } };
    const formatearMonedaLocal = useCallback((monto) => { /* ... (igual que antes) ... */ if (loadingSettings || (typeof monto !== 'number' && typeof monto !== 'string')) return '---'; const num = parseFloat(monto); if (isNaN(num)) return '---'; return num.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }); }, [currency, loadingSettings]);
    const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
    const inputClasses = `block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50`;
    const selectClasses = `${inputClasses} bg-gray-700`;
    const buttonClasses = (color = 'indigo') => `px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${color}-600 hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-${color}-500 transition duration-150 disabled:opacity-50`;

    return (
        <div className="space-y-8">
            {/* ... (Título sin cambios) ... */}
            <div className="flex items-center text-white"> <span className="mr-3 text-2xl">🔁</span> <h1 className="text-2xl font-semibold">Transacciones Recurrentes</h1> </div>

            {/* ... (Formulario sin cambios visuales) ... */}
            <section id="form-recurrente" className="bg-gray-900 p-6 rounded-lg shadow-lg"> <h2 className="text-xl font-semibold mb-4 text-white"> {editandoRecurrente ? `Editando: ${editandoRecurrente.descripcion || 'ID ' + editandoRecurrente.id}` : 'Definir Nueva Recurrencia'} </h2> <form onSubmit={handleSubmit} className="space-y-4"> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div><label htmlFor="descripcionRec" className={labelClasses}>Descripción</label><input type="text" id="descripcionRec" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Salario, Netflix..." className={inputClasses} /></div> <div><label htmlFor="montoRec" className={labelClasses}>Monto</label><input type="number" id="montoRec" value={monto} onChange={(e) => setMonto(e.target.value)} required min="0.01" step="0.01" className={inputClasses} disabled={loadingSettings} /></div> </div> <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> <div><label htmlFor="tipoRec" className={labelClasses}>Tipo</label><select id="tipoRec" value={tipo} onChange={(e) => { setTipo(e.target.value); setCategoriaId(''); }} required className={selectClasses}><option value="Ingreso">Ingreso</option><option value="Egreso">Egreso</option></select></div> <div><label htmlFor="categoriaRec" className={labelClasses}>Categoría</label><select id="categoriaRec" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required className={selectClasses} disabled={categorias.length === 0}><option value="" disabled>-- Seleccione --</option>{categoriasFiltradas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div> <div><label htmlFor="carteraRec" className={labelClasses}>Cartera</label><select id="carteraRec" value={carteraId} onChange={(e) => setCarteraId(e.target.value)} required className={selectClasses} disabled={carteras.length === 0}><option value="" disabled>-- Seleccione --</option>{carteras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div> </div> <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> <div><label htmlFor="frecuenciaRec" className={labelClasses}>Frecuencia</label><select id="frecuenciaRec" value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)} required className={selectClasses}>{frecuencias.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}</select></div> <div><label htmlFor="intervaloRec" className={labelClasses}>Cada (Intervalo)</label><input type="number" id="intervaloRec" value={intervalo} onChange={(e) => setIntervalo(e.target.value)} required min="1" step="1" className={inputClasses} /></div> <div><label htmlFor="fechaInicioRec" className={labelClasses}>Fecha Inicio</label><input type="date" id="fechaInicioRec" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required className={inputClasses} /></div> </div> <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> <div><label htmlFor="fechaFinRec" className={labelClasses}>Fecha Fin (Opcional)</label><input type="date" id="fechaFinRec" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} min={fechaInicio} className={inputClasses} /></div> <div><label htmlFor="proximaFechaRec" className={labelClasses}>Próxima Fecha</label><input type="date" id="proximaFechaRec" value={proximaFecha} onChange={(e) => setProximaFecha(e.target.value)} required min={fechaInicio} className={inputClasses} /></div> </div> <div className="flex space-x-3 pt-4"> <button type="submit" className={buttonClasses(editandoRecurrente ? 'yellow' : 'green')} disabled={isSubmitting || loadingSettings}> {isSubmitting ? 'Guardando...' : (editandoRecurrente ? '💾 Guardar Cambios' : '➕ Agregar Recurrencia')} </button> {editandoRecurrente && (<button type="button" onClick={handleCancelarEdicion} className={buttonClasses('gray')}> Cancelar </button>)} </div> </form> {error && <p className="text-red-400 mt-4 text-sm">{error}</p>} </section>

            {/* --- Lista de Recurrencias (Botón Generar habilitado) --- */}
            <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-xl font-semibold text-white">Recurrencias Definidas</h2>
                    <div className='flex flex-col sm:flex-row items-center gap-2'>
                        {/* Mensaje de generación */}
                        {generateMessage && <span className='text-sm text-green-400 italic'>{generateMessage}</span>}
                        {/* Botón para generar transacciones */}
                        <button
                            onClick={handleGenerarClick}
                            className={`${buttonClasses('blue')} disabled:opacity-60`}
                            disabled={isGenerating || cargando} // Deshabilitar si está generando o cargando lista
                        >
                            {isGenerating ? 'Generando...' : '⚡ Generar Vencidas'}
                        </button>
                    </div>
                </div>

                {cargando && <p className="text-blue-400">Cargando...</p>}
                {!cargando && recurringList.length === 0 && !error && (<p className="text-gray-500">No hay recurrencias definidas.</p>)}
                {!cargando && recurringList.length > 0 && (
                    <div className="overflow-x-auto relative shadow-md rounded-lg border border-gray-700">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Descripción</th>
                                    <th scope="col" className="px-4 py-3">Monto</th>
                                    <th scope="col" className="px-4 py-3 hidden md:table-cell">Categoría</th>
                                    <th scope="col" className="px-4 py-3 hidden lg:table-cell">Cartera</th>
                                    <th scope="col" className="px-4 py-3 hidden sm:table-cell">Frecuencia</th>
                                    <th scope="col" className="px-4 py-3">Próxima Fecha</th>
                                    <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recurringList.map((rec) => (
                                    <tr key={rec.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                                        <td className="px-4 py-3 font-medium text-gray-300 whitespace-nowrap">{rec.descripcion || '-'}</td>
                                        <td className={`px-4 py-3 whitespace-nowrap font-medium ${rec.tipo === 'Ingreso' ? 'text-green-400' : 'text-red-400'}`}>{formatearMonedaLocal(rec.monto)}</td>
                                        <td className="px-4 py-3 hidden md:table-cell">{rec.categoria?.nombre || 'N/A'}</td>
                                        <td className="px-4 py-3 hidden lg:table-cell">{rec.cartera?.nombre || 'N/A'}</td>
                                        <td className="px-4 py-3 hidden sm:table-cell">{rec.intervalo > 1 ? `Cada ${rec.intervalo} ` : ''}{rec.frecuencia}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{formatearFechaCorta(rec.proxima_fecha)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center items-center flex-wrap gap-2">
                                                <button onClick={() => handleEditarClick(rec)} className="font-medium text-yellow-400 hover:text-yellow-300 whitespace-nowrap">✏️ Editar</button>
                                                <button onClick={() => handleEliminarClick(rec.id)} className="font-medium text-red-500 hover:text-red-400 whitespace-nowrap">🗑️ Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

export default Recurring;
