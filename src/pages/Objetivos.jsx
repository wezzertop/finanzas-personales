// Archivo: src/pages/Objetivos.jsx
import React, { useState, useEffect, useCallback } from 'react'; // Removed useMemo
import { useSettings } from '../context/SettingsContext';
import { obtenerCarteras } from '../lib/carterasApi';
import {
    obtenerObjetivos,
    agregarObjetivo,
    editarObjetivo,
    eliminarObjetivo,
    actualizarCarterasVinculadasObjetivo
} from '../lib/objetivosApi';
import { useGamificacion } from '../context/GamificacionContext';

// --- Iconos SVG Inline ---
const TrophyIcon = ({ className = "page-title-icon" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
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
const Edit3Icon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);
const Trash2Icon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);
// --- Fin Iconos SVG Inline ---

// Clases de Tailwind reutilizables
const baseLabelClasses = "block text-sm font-medium text-slate-300 mb-1.5";
const baseInputClasses = "block w-full px-3.5 py-2.5 bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 text-sm shadow-sm focus:ring-2 focus:ring-brand-accent-primary focus:border-brand-accent-primary disabled:opacity-60";
// Removed baseSelectClasses
const baseButtonClasses = (color = 'indigo', size = 'md') =>
  `inline-flex items-center justify-center px-${size === 'sm' ? 3 : 5} py-${size === 'sm' ? '1.5' : '2.5'} border border-transparent rounded-lg shadow-md text-${size === 'sm' ? 'xs' : 'sm'} font-semibold text-white transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed
  ${color === 'green' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : ''}
  ${color === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400 text-slate-900' : ''}
  ${color === 'slate' ? 'bg-slate-600 hover:bg-slate-500 focus:ring-slate-400' : ''}
  ${color === 'indigo' ? 'bg-brand-accent-primary hover:opacity-90 focus:ring-brand-accent-primary' : ''}
  ${color === 'red' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : ''}
  `;
const iconButtonClasses = "p-1.5 text-slate-400 hover:text-white rounded-md transition-colors duration-150 hover:bg-slate-700";


// Componente CarterasSelector con estilos actualizados
function CarterasSelector({ allCarteras, linkedCarteraIds, onChange, disabled }) {
  const handleCheckboxChange = (event) => {
    const { value, checked } = event.target;
    const carteraId = parseInt(value, 10);
    let updatedIds;
    if (checked) {
      updatedIds = [...linkedCarteraIds, carteraId];
    } else {
      updatedIds = linkedCarteraIds.filter(id => id !== carteraId);
    }
    onChange(updatedIds);
  };

  if (!allCarteras || allCarteras.length === 0) {
    return <p className="text-sm text-slate-500 italic py-2">No hay carteras disponibles para vincular.</p>;
  }
  return (
    // Contenedor con estilos base
    <div className={`max-h-48 overflow-y-auto space-y-2.5 rounded-lg border border-slate-600 p-3.5 bg-slate-700 ${disabled ? 'opacity-70' : ''}`}>
      {allCarteras.map(cartera => (
        <div key={cartera.id} className="flex items-center">
          <input
            type="checkbox"
            id={`cartera-link-${cartera.id}`}
            value={cartera.id}
            checked={linkedCarteraIds.includes(cartera.id)}
            onChange={handleCheckboxChange}
            disabled={disabled}
            // Estilos de checkbox consistentes con el tema
            className="h-4 w-4 rounded border-slate-500 text-brand-accent-primary focus:ring-brand-accent-primary bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label
            htmlFor={`cartera-link-${cartera.id}`}
            className={`ml-2.5 block text-sm ${disabled ? 'text-slate-500 cursor-not-allowed' : 'text-slate-200'}`}
          >
            {cartera.nombre}
          </label>
        </div>
      ))}
    </div>
  );
}

const formatYMD = (date) => { if (!date) return ''; try { if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) { return date; } return new Date(date).toLocaleDateString('sv-SE'); } catch { return ''; } }; // _e removed

function Objetivos({ session }) {
    const { currency, loadingSettings } = useSettings();
    const { verificarYOtorgarLogro, fetchEstadoGamificacion } = useGamificacion();

    const [objetivos, setObjetivos] = useState([]);
    const [carteras, setCarteras] = useState([]);
    const [editandoObjetivo, setEditandoObjetivo] = useState(null);
    const [nombre, setNombre] = useState('');
    const [montoObjetivo, setMontoObjetivo] = useState('');
    const [fechaObjetivo, setFechaObjetivo] = useState('');
    const [notas, setNotas] = useState('');
    const [linkedCarteraIds, setLinkedCarteraIds] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const cargarDatos = useCallback(async () => {
        if (!session?.user?.id) return;
        setCargando(true); setError(null);
        try {
            const [resObjetivos, resCarteras] = await Promise.all([ obtenerObjetivos(), obtenerCarteras() ]);
            if (resObjetivos.error) throw new Error(`Obj: ${resObjetivos.error.message}`);
            if (resCarteras.error) throw new Error(`Cart: ${resCarteras.error.message}`);
            const objetivosData = resObjetivos.data || [];
            setObjetivos(objetivosData); setCarteras(resCarteras.data || []);
            if (objetivosData.length > 0) {
                let gamificacionAplicada = false;
                for (const obj of objetivosData) {
                    if (obj.progreso >= 100) {
                        const logroAhorradorNovatoOtorgado = await verificarYOtorgarLogro('AHORRADOR_NOVATO');
                        if(logroAhorradorNovatoOtorgado) gamificacionAplicada = true;
                        const logroEspecificoOtorgado = await verificarYOtorgarLogro('OBJETIVO_ESPECIFICO_COMPLETADO', { objetivo_id: obj.id, nombre_objetivo: obj.nombre });
                        if(logroEspecificoOtorgado) gamificacionAplicada = true;
                    }
                }
                if (gamificacionAplicada) { await fetchEstadoGamificacion(); }
            }
        } catch (err) { setError(`Error: ${err.message}`); setObjetivos([]); setCarteras([]); }
        finally { setCargando(false); }
    }, [session, verificarYOtorgarLogro, fetchEstadoGamificacion]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    const resetForm = () => { setEditandoObjetivo(null); setNombre(''); setMontoObjetivo(''); setFechaObjetivo(''); setNotas(''); setLinkedCarteraIds([]); };
    const handleEditarClick = (objetivo) => { setEditandoObjetivo(objetivo); setNombre(objetivo.nombre); setMontoObjetivo(String(objetivo.monto_objetivo)); setFechaObjetivo(formatYMD(objetivo.fecha_objetivo)); setNotas(objetivo.notas || ''); setLinkedCarteraIds(objetivo.carteras_vinculadas?.map(c => c.id) || []); document.getElementById('form-objetivo-section')?.scrollIntoView({ behavior: 'smooth' }); };
    const handleCancelarEdicion = () => { resetForm(); };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!session?.user?.id) { setError("Sin ID."); return; }
        if (!nombre.trim()) { alert("Nombre vacío."); return; }
        if (!montoObjetivo || isNaN(parseFloat(montoObjetivo)) || parseFloat(montoObjetivo) <= 0) { alert("Monto inválido."); return; }
        setError(null); setIsSubmitting(true);
        const userId = session.user.id; const montoNum = parseFloat(montoObjetivo);
        const datosObjetivo = { nombre: nombre.trim(), monto_objetivo: montoNum, fecha_objetivo: fechaObjetivo || null, notas: notas.trim() || null };
        try {
            let objetivoGuardadoId;
            if (editandoObjetivo) { const { error: errorEdit } = await editarObjetivo(editandoObjetivo.id, datosObjetivo); if (errorEdit) throw errorEdit; objetivoGuardadoId = editandoObjetivo.id; } // Removed data from destructuring
            else { const { data: objetivoAgregado, error: errorAdd } = await agregarObjetivo(datosObjetivo, userId); if (errorAdd) throw errorAdd; objetivoGuardadoId = objetivoAgregado.id; } // Kept data as objetivoAgregado
            const idsOriginales = editandoObjetivo?.carteras_vinculadas?.map(c => c.id) || []; const idsNuevos = linkedCarteraIds;
            if (JSON.stringify(idsOriginales.sort()) !== JSON.stringify(idsNuevos.sort())) { const { error: linkError } = await actualizarCarterasVinculadasObjetivo(objetivoGuardadoId, idsNuevos, userId); if (linkError) { setError(`Obj guardado, error vínculos: ${linkError.message}`); } }
            resetForm(); await cargarDatos();
        } catch (err) { setError(`Error: ${err.message || 'Desconocido'}`); if (err.message?.includes('objetivo_nombre_unico_usuario')) { alert("Error: Nombre duplicado."); } }
        finally { setIsSubmitting(false); }
    };

    const handleEliminarClick = async (id) => { if (!window.confirm(`¿Eliminar?`)) return; setError(null); setIsSubmitting(true); try { const { error: e } = await eliminarObjetivo(id); if (e) throw e; setObjetivos(prev => prev.filter(o => o.id !== id)); if (editandoObjetivo?.id === id) { resetForm(); } await cargarDatos(); } catch (err) { setError(`Error: ${err.message}`); } finally { setIsSubmitting(false); }};
    const formatearMonedaLocal = useCallback((monto) => { if (loadingSettings || typeof monto !== 'number' || isNaN(monto)) return '---'; return monto.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }); }, [currency, loadingSettings]);
    const formatearFechaCorta = (fechaIso) => { if (!fechaIso) return 'N/A'; try { return new Date(fechaIso + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return 'Inválida'; } }; // _e removed

    return (
        <div className="space-y-8">
            <h1 className="page-title"> <TrophyIcon /> Objetivos de Ahorro </h1>
            
            <section id="form-objetivo-section" className="card-base">
                <h2 className="text-xl font-semibold mb-6 text-slate-100"> {editandoObjetivo ? `Editando Objetivo: ${editandoObjetivo.nombre}` : 'Crear Nuevo Objetivo'} </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div><label htmlFor="nombreObj" className={baseLabelClasses}>Nombre del Objetivo <span className="text-red-500">*</span></label><input type="text" id="nombreObj" value={nombre} onChange={(e) => setNombre(e.target.value)} required className={baseInputClasses} placeholder="Ej: Viaje a la playa, Nuevo PC"/></div>
                        <div><label htmlFor="montoObj" className={baseLabelClasses}>Monto Objetivo ({currency}) <span className="text-red-500">*</span></label><input type="number" id="montoObj" value={montoObjetivo} onChange={(e) => setMontoObjetivo(e.target.value)} required min="0.01" step="0.01" className={baseInputClasses} placeholder="5000.00" disabled={loadingSettings}/></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div><label htmlFor="fechaObj" className={baseLabelClasses}>Fecha Meta (Opcional)</label><input type="date" id="fechaObj" value={fechaObjetivo} onChange={(e) => setFechaObjetivo(e.target.value)} className={baseInputClasses} /></div>
                        <div><label htmlFor="notasObj" className={baseLabelClasses}>Notas (Opcional)</label><input type="text" id="notasObj" value={notas} onChange={(e) => setNotas(e.target.value)} className={baseInputClasses} placeholder="Detalles adicionales..."/></div>
                    </div>
                    <div>
                        <label className={baseLabelClasses}>Vincular Carteras (Fondos para este objetivo)</label>
                        <CarterasSelector allCarteras={carteras} linkedCarteraIds={linkedCarteraIds} onChange={setLinkedCarteraIds} disabled={isSubmitting || cargando} />
                    </div>
                    <div className="flex items-center space-x-3 pt-2">
                        <button type="submit" className={baseButtonClasses(editandoObjetivo ? 'yellow' : 'green')} disabled={isSubmitting || loadingSettings || cargando}>
                            {isSubmitting ? 'Guardando...' : (editandoObjetivo ? <><SaveIcon className="mr-2" /> Guardar Cambios</> : <><PlusCircleIcon className="mr-2" /> Crear Objetivo</>)}
                        </button>
                        {editandoObjetivo && (<button type="button" onClick={handleCancelarEdicion} className={baseButtonClasses('slate')} disabled={isSubmitting}><XCircleIcon className="mr-2" /> Cancelar</button>)}
                    </div>
                </form>
                {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
            </section>

            <section className="card-base">
                <h2 className="text-xl font-semibold mb-6 text-slate-100">Mis Objetivos</h2>
                {cargando && <p className="text-slate-400">Cargando objetivos...</p>}
                {!cargando && objetivos.length === 0 && !error && (<p className="text-slate-500">Aún no has definido objetivos. ¡Crea uno para empezar a ahorrar!</p>)}
                {!cargando && objetivos.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {objetivos.map((obj) => {
                            const montoActual = obj.monto_actual ?? 0;
                            const restante = obj.restante ?? (obj.monto_objetivo - montoActual);
                            const progresoNum = parseFloat(obj.progreso);
                            const progreso = isNaN(progresoNum) ? (obj.monto_objetivo > 0 ? Math.max(0,(montoActual / obj.monto_objetivo) * 100) : 0) : Math.max(0, progresoNum);
                            const progresoDisplay = Math.min(progreso, 100);
                            const restanteColor = restante <= 0.01 ? 'text-green-400' : 'text-orange-400';
                            const progresoBarColor = progreso >= 100 ? 'bg-green-500' : progreso >= 75 ? 'bg-yellow-500' : 'bg-brand-accent-primary'; // Usar color de acento

                            return (
                                <div key={obj.id} className="bg-slate-800/70 p-5 rounded-lg border border-slate-700 shadow-lg flex flex-col justify-between space-y-3 hover:shadow-brand-accent-primary/20 transition-shadow duration-200">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-semibold text-slate-100 truncate" title={obj.nombre}>{obj.nombre}</h3>
                                            <div className="flex items-center space-x-1 flex-shrink-0">
                                                <button onClick={() => handleEditarClick(obj)} className={`${iconButtonClasses} hover:text-yellow-400`} aria-label={`Editar ${obj.nombre}`} title="Editar"><Edit3Icon className="w-5 h-5"/></button>
                                                <button onClick={() => handleEliminarClick(obj.id)} className={`${iconButtonClasses} hover:text-red-400`} aria-label={`Eliminar ${obj.nombre}`} title="Eliminar" disabled={isSubmitting}><Trash2Icon className="w-5 h-5"/></button>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 text-sm mb-3">
                                            <p><span className="text-slate-400">Meta:</span> <span className="text-slate-200 font-medium">{formatearMonedaLocal(obj.monto_objetivo)}</span></p>
                                            <p><span className="text-slate-400">Ahorrado:</span> <span className="text-brand-accent-primary font-medium">{formatearMonedaLocal(montoActual)}</span></p>
                                            <p><span className="text-slate-400">Restante:</span> <span className={`font-medium ${restanteColor}`}>{formatearMonedaLocal(restante)}</span></p>
                                            <p><span className="text-slate-400">Fecha Límite:</span> <span className="text-slate-300">{formatearFechaCorta(obj.fecha_objetivo)}</span></p>
                                        </div>
                                    </div>
                                    <div className="w-full">
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                            <span>Progreso</span>
                                            <span>{progreso.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                                            <div className={`h-full rounded-full ${progresoBarColor} transition-all duration-500 ease-out`} style={{ width: `${progresoDisplay}%` }}></div>
                                        </div>
                                    </div>
                                    {obj.carteras_vinculadas && obj.carteras_vinculadas.length > 0 && (
                                        <div className="text-xs pt-2 border-t border-slate-700 mt-2">
                                            <span className="text-slate-500">Desde: </span>
                                            <span className="text-slate-400 italic">{obj.carteras_vinculadas.map(c => c?.nombre || 'N/A').join(', ')}</span>
                                        </div>
                                    )}
                                    {obj.notas && <p className="text-xs text-slate-500 mt-2 italic">Nota: {obj.notas}</p>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}

export default Objetivos;
