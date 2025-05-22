// Archivo: src/pages/Recurring.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { obtenerCategorias } from '../lib/categoriasApi';
import { obtenerCarteras } from '../lib/carterasApi';
import {
    obtenerRecurringTransactions,
    agregarRecurringTransaction,
    editarRecurringTransaction,
    eliminarRecurringTransaction,
    generarTransaccionesVencidas
} from '../lib/recurringTransactionsApi';

// --- Iconos SVG Inline ---
const RepeatIcon = ({ className = "page-title-icon" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>
  </svg>
);
const PlusCircleIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);
const SaveIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
const XCircleIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);
const Edit3Icon = ({ className = "w-5 h-5" }) => ( // Ajustado para tabla
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);
const Trash2Icon = ({ className = "w-5 h-5" }) => ( // Ajustado para tabla
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);
const ZapIcon = ({ className = "w-4 h-4" }) => ( // Para "Generar Vencidas"
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
);
// --- Fin Iconos SVG Inline ---

const frecuencias = ['diario', 'semanal', 'quincenal', 'mensual', 'anual'];
const formatYMD = (date) => { if (!date) return ''; try { if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) { return date; } return new Date(date).toLocaleDateString('sv-SE'); } catch { return ''; } }; // Removed e

function Recurring({ session }) {
    const { currency, loadingSettings } = useSettings();

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
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateMessage, setGenerateMessage] = useState('');

    // Clases de Tailwind reutilizables
    const baseLabelClasses = "block text-sm font-medium text-slate-300 mb-1.5";
    const baseInputClasses = "block w-full px-3.5 py-2.5 bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 text-sm shadow-sm focus:ring-2 focus:ring-brand-accent-primary focus:border-brand-accent-primary disabled:opacity-60";
    const baseSelectClasses = `${baseInputClasses} appearance-none pr-10`;
    const baseButtonClasses = (color = 'indigo', size = 'md') =>
      `inline-flex items-center justify-center px-${size === 'sm' ? 3 : 5} py-${size === 'sm' ? '1.5' : '2.5'} border border-transparent rounded-lg shadow-md text-${size === 'sm' ? 'xs' : 'sm'} font-semibold text-white transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed
      ${color === 'green' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : ''}
      ${color === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400 text-slate-900' : ''}
      ${color === 'slate' ? 'bg-slate-600 hover:bg-slate-500 focus:ring-slate-400' : ''}
      ${color === 'indigo' ? 'bg-brand-accent-primary hover:opacity-90 focus:ring-brand-accent-primary' : ''}
      ${color === 'red' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : ''}
      ${color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : ''} 
      `; // Añadido color 'blue'
    const tableHeaderClasses = "px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider";
    const tableCellClasses = "px-4 py-3.5 whitespace-nowrap text-sm";
    const iconButtonClasses = "p-1.5 text-slate-400 hover:text-white rounded-md transition-colors duration-150 hover:bg-slate-700";

    const cargarDatos = useCallback(async () => {
        if (!session?.user?.id) return; setCargando(true); setError(null);
        try {
            const [resRecurrentes, resCategorias, resCarteras] = await Promise.all([ obtenerRecurringTransactions(), obtenerCategorias(), obtenerCarteras() ]);
            if (resRecurrentes.error) throw new Error(`Rec: ${resRecurrentes.error.message}`);
            if (resCategorias.error) throw new Error(`Cat: ${resCategorias.error.message}`);
            if (resCarteras.error) throw new Error(`Cart: ${resCarteras.error.message}`);
            setRecurringList(resRecurrentes.data || []); setCategorias(resCategorias.data || []); setCarteras(resCarteras.data || []);
        } catch (err) { setError(`Error: ${err.message}`); setRecurringList([]); setCategorias([]); setCarteras([]); }
        finally { setCargando(false); }
    }, [session]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    const categoriasFiltradas = useMemo(() => categorias.filter(cat => cat.tipo === tipo), [categorias, tipo]);
    const resetForm = () => { setEditandoRecurrente(null); setMonto(''); setDescripcion(''); setTipo('Egreso'); setCategoriaId(''); setCarteraId(''); setFrecuencia('mensual'); setIntervalo('1'); setFechaInicio(formatYMD(new Date())); setFechaFin(''); setProximaFecha(''); };
    const handleEditarClick = (recurrente) => { setEditandoRecurrente(recurrente); setMonto(String(recurrente.monto)); setDescripcion(recurrente.descripcion || ''); setTipo(recurrente.tipo); setCategoriaId(String(recurrente.categoria_id || '')); setCarteraId(String(recurrente.cartera_id || '')); setFrecuencia(recurrente.frecuencia); setIntervalo(String(recurrente.intervalo)); setFechaInicio(formatYMD(recurrente.fecha_inicio)); setFechaFin(formatYMD(recurrente.fecha_fin)); setProximaFecha(formatYMD(recurrente.proxima_fecha)); document.getElementById('form-recurrente-section')?.scrollIntoView({ behavior: 'smooth' }); };
    const handleCancelarEdicion = () => { resetForm(); };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!session?.user?.id) { setError("Sin ID."); return; }
        if (!monto || isNaN(parseFloat(monto))) { alert("Monto inválido."); return; }
        if (!categoriaId) { alert("Selecciona categoría."); return; }
        if (!carteraId) { alert("Selecciona cartera."); return; }
        if (!fechaInicio) { alert("Selecciona fecha inicio."); return; }
        const proxFecha = proximaFecha || fechaInicio;
        if (new Date(proxFecha) < new Date(fechaInicio)) { alert("Próxima fecha no puede ser anterior a la fecha de inicio."); return; }
        if (fechaFin && new Date(fechaFin) < new Date(fechaInicio)) { alert("Fecha fin no puede ser anterior a la fecha de inicio."); return; }
        setError(null); setIsSubmitting(true); const userId = session.user.id;
        const datos = { monto: parseFloat(monto), descripcion: descripcion.trim() || null, tipo, categoria_id: parseInt(categoriaId, 10), cartera_id: parseInt(carteraId, 10), frecuencia, intervalo: parseInt(intervalo, 10) || 1, fecha_inicio: fechaInicio, fecha_fin: fechaFin || null, proxima_fecha: proxFecha };
        try {
            if (editandoRecurrente) { await editarRecurringTransaction(editandoRecurrente.id, datos); }
            else { await agregarRecurringTransaction(datos, userId); }
            resetForm(); cargarDatos();
        } catch (err) { setError(`Error: ${err.message || 'Desconocido'}`); }
        finally { setIsSubmitting(false); }
    };

    const handleEliminarClick = async (id) => {
        if (!window.confirm(`¿Eliminar esta recurrencia?`)) return; setError(null); setIsSubmitting(true);
        try { await eliminarRecurringTransaction(id); if (editandoRecurrente?.id === id) { resetForm(); } cargarDatos(); }
        catch (err) { setError(`Error al eliminar: ${err.message}`); }
        finally { setIsSubmitting(false); }
     };

    const handleGenerarClick = async () => {
        setIsGenerating(true); setGenerateMessage(''); setError(null);
        try {
            const { count, error: genError } = await generarTransaccionesVencidas();
            if (genError) throw genError;
            const message = `Se generaron ${count} transacciones.`;
            setGenerateMessage(message); cargarDatos();
            setTimeout(() => setGenerateMessage(''), 5000);
        } catch (err) { setError(`Error al generar: ${err.message || 'Desconocido'}`); setGenerateMessage(''); }
        finally { setIsGenerating(false); }
    };

    const formatearFechaCorta = (fechaIso) => { if (!fechaIso) return 'N/A'; try { return new Date(fechaIso + 'T00:00:00Z').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return 'Inv.'; } }; // Removed e
    const formatearMonedaLocal = useCallback((monto) => { if (loadingSettings || (typeof monto !== 'number' && typeof monto !== 'string')) return '---'; const num = parseFloat(monto); if (isNaN(num)) return '---'; return num.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }); }, [currency, loadingSettings]);

    return (
        <div className="space-y-8">
            <h1 className="page-title"> <RepeatIcon /> Transacciones Recurrentes </h1>

            <section id="form-recurrente-section" className="card-base">
                <h2 className="text-xl font-semibold mb-6 text-slate-100"> {editandoRecurrente ? `Editando: ${editandoRecurrente.descripcion || 'ID ' + editandoRecurrente.id}` : 'Definir Nueva Recurrencia'} </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div><label htmlFor="descripcionRec" className={baseLabelClasses}>Descripción</label><input type="text" id="descripcionRec" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Salario, Netflix..." className={baseInputClasses} /></div>
                        <div><label htmlFor="montoRec" className={baseLabelClasses}>Monto ({currency}) <span className="text-red-500">*</span></label><input type="number" id="montoRec" value={monto} onChange={(e) => setMonto(e.target.value)} required min="0.01" step="0.01" className={baseInputClasses} disabled={loadingSettings || isSubmitting} /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                        <div><label htmlFor="tipoRec" className={baseLabelClasses}>Tipo <span className="text-red-500">*</span></label><select id="tipoRec" value={tipo} onChange={(e) => { setTipo(e.target.value); setCategoriaId(''); }} required className={baseSelectClasses}><option value="Ingreso">Ingreso</option><option value="Egreso">Egreso</option></select></div>
                        <div><label htmlFor="categoriaRec" className={baseLabelClasses}>Categoría <span className="text-red-500">*</span></label><select id="categoriaRec" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required className={baseSelectClasses} disabled={cargando || categoriasFiltradas.length === 0}><option value="" disabled>-- Seleccionar --</option>{cargando ? <option>Cargando...</option> : categoriasFiltradas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
                        <div><label htmlFor="carteraRec" className={baseLabelClasses}>Cartera <span className="text-red-500">*</span></label><select id="carteraRec" value={carteraId} onChange={(e) => setCarteraId(e.target.value)} required className={baseSelectClasses} disabled={cargando || carteras.length === 0}><option value="" disabled>-- Seleccionar --</option>{cargando ? <option>Cargando...</option> : carteras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                        <div><label htmlFor="frecuenciaRec" className={baseLabelClasses}>Frecuencia <span className="text-red-500">*</span></label><select id="frecuenciaRec" value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)} required className={baseSelectClasses}>{frecuencias.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}</select></div>
                        <div><label htmlFor="intervaloRec" className={baseLabelClasses}>Intervalo (Cada) <span className="text-red-500">*</span></label><input type="number" id="intervaloRec" value={intervalo} onChange={(e) => setIntervalo(e.target.value)} required min="1" step="1" className={baseInputClasses} /></div>
                        <div><label htmlFor="fechaInicioRec" className={baseLabelClasses}>Fecha Inicio <span className="text-red-500">*</span></label><input type="date" id="fechaInicioRec" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required className={baseInputClasses} /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                        <div><label htmlFor="proximaFechaRec" className={baseLabelClasses}>Próxima Fecha <span className="text-red-500">*</span></label><input type="date" id="proximaFechaRec" value={proximaFecha} onChange={(e) => setProximaFecha(e.target.value)} required min={fechaInicio || undefined} className={baseInputClasses} /></div>
                        <div><label htmlFor="fechaFinRec" className={baseLabelClasses}>Fecha Fin (Opcional)</label><input type="date" id="fechaFinRec" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} min={fechaInicio || undefined} className={baseInputClasses} /></div>
                    </div>
                    <div className="flex items-center space-x-3 pt-3">
                        <button type="submit" className={baseButtonClasses(editandoRecurrente ? 'yellow' : 'green')} disabled={isSubmitting || loadingSettings || cargando}> {isSubmitting ? 'Guardando...' : (editandoRecurrente ? <><SaveIcon className="mr-2"/> Guardar</> : <><PlusCircleIcon className="mr-2"/> Agregar</>)} </button>
                        {editandoRecurrente && (<button type="button" onClick={handleCancelarEdicion} className={baseButtonClasses('slate')} disabled={isSubmitting}><XCircleIcon className="mr-2"/> Cancelar</button>)}
                    </div>
                </form>
                {error && !cargando && <p className="text-red-400 mt-4 text-sm">{error}</p>}
            </section>

            <section className="card-base">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-xl font-semibold text-slate-100">Recurrencias Definidas</h2>
                    <div className='flex flex-col sm:flex-row items-center gap-3'>
                        {generateMessage && <span className='text-sm text-green-400 italic order-last sm:order-first'>{generateMessage}</span>}
                        <button onClick={handleGenerarClick} className={`${baseButtonClasses('blue')} w-full sm:w-auto`} disabled={isGenerating || cargando}>
                            <ZapIcon className="mr-2"/> {isGenerating ? 'Generando...' : 'Generar Vencidas'}
                        </button>
                    </div>
                </div>
                {cargando && <p className="text-slate-400">Cargando recurrencias...</p>}
                {error && cargando && <p className="text-red-400">{error}</p>}
                {!cargando && recurringList.length === 0 && !error && (<p className="text-slate-500">No hay recurrencias definidas.</p>)}
                {!cargando && recurringList.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-max text-sm text-left">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th scope="col" className={tableHeaderClasses}>Descripción</th>
                                    <th scope="col" className={`${tableHeaderClasses} text-right`}>Monto</th>
                                    <th scope="col" className={`${tableHeaderClasses} hidden md:table-cell`}>Categoría</th>
                                    <th scope="col" className={`${tableHeaderClasses} hidden lg:table-cell`}>Cartera</th>
                                    <th scope="col" className={`${tableHeaderClasses} hidden sm:table-cell`}>Frecuencia</th>
                                    <th scope="col" className={tableHeaderClasses}>Próxima Fecha</th>
                                    <th scope="col" className={`${tableHeaderClasses} text-center`}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {recurringList.map((rec) => (
                                    <tr key={rec.id} className="hover:bg-slate-700/40 transition-colors duration-100">
                                        <td className={`${tableCellClasses} text-slate-100 font-medium`}>{rec.descripcion || '-'}</td>
                                        <td className={`${tableCellClasses} text-right font-medium ${rec.tipo === 'Ingreso' ? 'text-green-400' : 'text-red-400'}`}>{formatearMonedaLocal(rec.monto)}</td>
                                        <td className={`${tableCellClasses} hidden md:table-cell text-slate-400`}>{rec.categoria?.nombre || 'N/A'}</td>
                                        <td className={`${tableCellClasses} hidden lg:table-cell text-slate-400`}>{rec.cartera?.nombre || 'N/A'}</td>
                                        <td className={`${tableCellClasses} hidden sm:table-cell text-slate-400`}>{rec.intervalo > 1 ? `Cada ${rec.intervalo} ` : ''}{rec.frecuencia.charAt(0).toUpperCase() + rec.frecuencia.slice(1)}</td>
                                        <td className={`${tableCellClasses} text-slate-300`}>{formatearFechaCorta(rec.proxima_fecha)}</td>
                                        <td className={`${tableCellClasses} text-center`}>
                                            <div className="flex justify-center items-center space-x-1">
                                                <button onClick={() => handleEditarClick(rec)} className={`${iconButtonClasses} hover:text-yellow-400`} title="Editar"><Edit3Icon /></button>
                                                <button onClick={() => handleEliminarClick(rec.id)} className={`${iconButtonClasses} hover:text-red-400`} title="Eliminar" disabled={isSubmitting}><Trash2Icon /></button>
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
