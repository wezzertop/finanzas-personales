import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { obtenerCarteras } from '../lib/carterasApi';
// API de objetivos ahora devuelve el estado completo
import {
    obtenerObjetivos,
    agregarObjetivo,
    editarObjetivo,
    eliminarObjetivo,
    actualizarCarterasVinculadasObjetivo
} from '../lib/objetivosApi';

// --- Componente CarterasSelector ---
function CarterasSelector({ allCarteras, linkedCarteraIds, onChange, disabled }) {
    const handleCheckboxChange = (event) => { const { value, checked } = event.target; const carteraId = parseInt(value, 10); let updatedIds; if (checked) { updatedIds = [...linkedCarteraIds, carteraId]; } else { updatedIds = linkedCarteraIds.filter(id => id !== carteraId); } onChange(updatedIds); };
    if (!allCarteras || allCarteras.length === 0) { return <p className="text-sm text-gray-500 italic">No hay carteras disponibles.</p>; }
    return ( <div className="max-h-40 overflow-y-auto space-y-2 rounded border border-gray-600 p-3 bg-gray-800"> {allCarteras.map(cartera => ( <div key={cartera.id} className="flex items-center"> <input type="checkbox" id={`cartera-link-${cartera.id}`} value={cartera.id} checked={linkedCarteraIds.includes(cartera.id)} onChange={handleCheckboxChange} disabled={disabled} className="h-4 w-4 rounded border-gray-500 text-indigo-600 focus:ring-indigo-500 bg-gray-700 disabled:opacity-50"/> <label htmlFor={`cartera-link-${cartera.id}`} className={`ml-2 block text-sm ${disabled ? 'text-gray-500' : 'text-gray-300'}`}> {cartera.nombre} </label> </div> ))} </div> );
}
// --- Fin Componente CarterasSelector ---

// Función auxiliar para formatear fecha YYYY-MM-DD
const formatYMD = (date) => { if (!date) return ''; try { if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) { return date; } return new Date(date).toLocaleDateString('sv-SE'); } catch (e) { return ''; } };


function Objetivos({ session }) {
    const { currency, loadingSettings } = useSettings(); // Usar contexto

    // Estados de datos (objetivos ahora incluye estado calculado)
    const [objetivos, setObjetivos] = useState([]);
    const [carteras, setCarteras] = useState([]); // Lista completa de carteras

    // Estados del formulario
    const [editandoObjetivo, setEditandoObjetivo] = useState(null);
    const [nombre, setNombre] = useState('');
    const [montoObjetivo, setMontoObjetivo] = useState('');
    const [fechaObjetivo, setFechaObjetivo] = useState('');
    const [notas, setNotas] = useState('');
    const [linkedCarteraIds, setLinkedCarteraIds] = useState([]); // IDs en el form

    // Estados de carga y error
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cargar datos (objetivos con estado y lista de carteras)
    const cargarDatos = useCallback(async () => {
        if (!session?.user?.id) return;
        setCargando(true); setError(null);
        try {
            // obtenerObjetivos ahora llama a la RPC que calcula el estado
            const [resObjetivos, resCarteras] = await Promise.all([
                obtenerObjetivos(),
                obtenerCarteras()
            ]);
            if (resObjetivos.error) throw new Error(`Obj: ${resObjetivos.error.message}`);
            if (resCarteras.error) throw new Error(`Cart: ${resCarteras.error.message}`);
            setObjetivos(resObjetivos.data || []);
            setCarteras(resCarteras.data || []);
            console.log("Objetivos con estado cargados:", resObjetivos.data);
        } catch (err) { setError(`Error: ${err.message}`); setObjetivos([]); setCarteras([]); }
        finally { setCargando(false); }
    }, [session]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    // Resetear formulario
    const resetForm = () => { setEditandoObjetivo(null); setNombre(''); setMontoObjetivo(''); setFechaObjetivo(''); setNotas(''); setLinkedCarteraIds([]); };

    // Rellenar formulario para editar
    const handleEditarClick = (objetivo) => {
        setEditandoObjetivo(objetivo);
        setNombre(objetivo.nombre);
        setMontoObjetivo(String(objetivo.monto_objetivo));
        setFechaObjetivo(formatYMD(objetivo.fecha_objetivo));
        setNotas(objetivo.notas || '');
        // carteras_vinculadas viene como array de {id, nombre} desde la RPC
        setLinkedCarteraIds(objetivo.carteras_vinculadas?.map(c => c.id) || []);
        document.getElementById('form-objetivo')?.scrollIntoView({ behavior: 'smooth' });
    };
    const handleCancelarEdicion = () => { resetForm(); };

    // Submit (Agregar o Editar Objetivo Y Vínculos)
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!session?.user?.id) { setError("Sin ID."); return; }
        if (!nombre.trim()) { alert("Nombre vacío."); return; }
        if (!montoObjetivo || isNaN(parseFloat(montoObjetivo)) || parseFloat(montoObjetivo) <= 0) { alert("Monto inválido."); return; }
        setError(null); setIsSubmitting(true);
        const userId = session.user.id;
        const montoNum = parseFloat(montoObjetivo);
        const datosObjetivo = { nombre: nombre.trim(), monto_objetivo: montoNum, fecha_objetivo: fechaObjetivo || null, notas: notas.trim() || null };

        try {
            let objetivoGuardadoId;
            if (editandoObjetivo) {
                const { data, error: errorEdit } = await editarObjetivo(editandoObjetivo.id, datosObjetivo);
                if (errorEdit) throw errorEdit;
                objetivoGuardadoId = editandoObjetivo.id;
            } else {
                const { data, error: errorAdd } = await agregarObjetivo(datosObjetivo, userId);
                if (errorAdd) throw errorAdd;
                objetivoGuardadoId = data.id;
            }

            // Actualizar carteras vinculadas
            const idsOriginales = editandoObjetivo?.carteras_vinculadas?.map(c => c.id) || [];
            const idsNuevos = linkedCarteraIds;
            if (JSON.stringify(idsOriginales.sort()) !== JSON.stringify(idsNuevos.sort())) {
                const { error: linkError } = await actualizarCarterasVinculadasObjetivo(objetivoGuardadoId, idsNuevos, userId);
                if (linkError) { setError(`Obj guardado, error vínculos: ${linkError.message}`); }
            }

            resetForm();
            cargarDatos(); // Recargar TODO para ver estado actualizado

        } catch (err) {
            setError(`Error: ${err.message || 'Desconocido'}`);
            if (err.message?.includes('objetivo_nombre_unico_usuario')) { alert("Error: Nombre duplicado."); }
        } finally {
            setIsSubmitting(false);
        }
    };


    // Eliminar Objetivo
    const handleEliminarClick = async (id) => { if (!window.confirm(`¿Eliminar?`)) return; setError(null); try { const { error: e } = await eliminarObjetivo(id); if (e) throw e; setObjetivos(prev => prev.filter(o => o.id !== id)); if (editandoObjetivo?.id === id) { resetForm(); } } catch (err) { setError(`Error: ${err.message}`); } };

    // Formateador local usa contexto
    const formatearMonedaLocal = useCallback((monto) => { if (loadingSettings || typeof monto !== 'number') return '---'; return monto.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }); }, [currency, loadingSettings]);
    const formatearFechaCorta = (fechaIso) => { if (!fechaIso) return 'N/A'; try { return new Date(fechaIso + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); } catch (e) { return 'Inválida'; } };

    // --- Clases CSS ---
    const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
    const inputClasses = `block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50`;
    const buttonClasses = (color = 'indigo') => `px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${color}-600 hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-${color}-500 transition duration-150 disabled:opacity-50`;
    const actionButtonClasses = "font-medium px-2 py-1 rounded hover:opacity-80 whitespace-nowrap text-xs";

    return (
        <div className="space-y-8">
            {/* --- Título --- */}
            <div className="flex items-center text-white"> <span className="mr-3 text-2xl">🏆</span> <h1 className="text-2xl font-semibold">Objetivos de Ahorro</h1> </div>

            {/* --- Formulario --- */}
            <section id="form-objetivo" className="bg-gray-900 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-white"> {editandoObjetivo ? `Editando: ${editandoObjetivo.nombre}` : 'Crear Nuevo Objetivo'} </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div><label htmlFor="nombreObj" className={labelClasses}>Nombre</label><input type="text" id="nombreObj" value={nombre} onChange={(e) => setNombre(e.target.value)} required className={inputClasses} placeholder="Ej: Viaje a Japón"/></div> <div><label htmlFor="montoObj" className={labelClasses}>Monto Objetivo</label><input type="number" id="montoObj" value={montoObjetivo} onChange={(e) => setMontoObjetivo(e.target.value)} required min="0.01" step="0.01" className={inputClasses} placeholder="5000.00" disabled={loadingSettings}/></div> </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div><label htmlFor="fechaObj" className={labelClasses}>Fecha Meta (Opc)</label><input type="date" id="fechaObj" value={fechaObjetivo} onChange={(e) => setFechaObjetivo(e.target.value)} className={inputClasses} /></div> <div><label htmlFor="notasObj" className={labelClasses}>Notas (Opc)</label><input type="text" id="notasObj" value={notas} onChange={(e) => setNotas(e.target.value)} className={inputClasses} placeholder="Detalles..."/></div> </div>
                     <div> <label className={labelClasses}>Vincular Carteras (Fondos para este objetivo)</label> <CarterasSelector allCarteras={carteras} linkedCarteraIds={linkedCarteraIds} onChange={setLinkedCarteraIds} disabled={isSubmitting || cargando} /> </div>
                    <div className="flex space-x-3 pt-2"> <button type="submit" className={buttonClasses(editandoObjetivo ? 'yellow' : 'green')} disabled={isSubmitting || loadingSettings || cargando}> {isSubmitting ? 'Guardando...' : (editandoObjetivo ? '💾 Guardar' : '➕ Crear')} </button> {editandoObjetivo && (<button type="button" onClick={handleCancelarEdicion} className={buttonClasses('gray')}> Cancelar </button>)} </div>
                </form>
                {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
            </section>

            {/* --- Lista de Objetivos --- */}
            <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-white">Mis Objetivos</h2>
                {cargando && <p className="text-blue-400">Cargando...</p>}
                {!cargando && objetivos.length === 0 && !error && (<p className="text-gray-500">Aún no has definido objetivos.</p>)}
                {!cargando && objetivos.length > 0 && (
                    <div className="space-y-4">
                        {objetivos.map((obj) => {
                            // Usa los valores calculados directamente de la RPC
                            const montoActual = obj.monto_actual ?? 0;
                            const restante = obj.restante ?? (obj.monto_objetivo - montoActual);
                            const progresoNum = parseFloat(obj.progreso);
                            const progreso = isNaN(progresoNum) ? (obj.monto_objetivo > 0 ? Math.max(0,(montoActual / obj.monto_objetivo) * 100) : 0) : Math.max(0, progresoNum);
                            const progresoDisplay = Math.min(progreso, 100); // Limita barra a 100%

                            const restanteColor = restante >= 0 ? 'text-green-400' : 'text-red-400';
                            const progresoColor = progreso < 75 ? 'bg-green-500' : progreso < 95 ? 'bg-yellow-500' : 'bg-red-500'; // Ajuste de colores

                            return (
                                <div key={obj.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                                        <h3 className="text-lg font-semibold text-white truncate" title={obj.nombre}>{obj.nombre}</h3>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button onClick={() => handleEditarClick(obj)} className={`${actionButtonClasses} text-yellow-400 bg-gray-700`} aria-label={`Editar ${obj.nombre}`}>✏️ Editar</button>
                                            <button onClick={() => handleEliminarClick(obj.id)} className={`${actionButtonClasses} text-red-500 bg-gray-700`} aria-label={`Eliminar ${obj.nombre}`}>🗑️ Eliminar</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm mb-3">
                                        <div><span className="text-gray-400">Objetivo:</span> <span className="text-gray-200 font-medium">{formatearMonedaLocal(obj.monto_objetivo)}</span></div>
                                        <div><span className="text-gray-400">Ahorrado:</span> <span className="text-blue-400 font-medium">{formatearMonedaLocal(montoActual)}</span></div> {/* Muestra monto real */}
                                        <div><span className="text-gray-400">Restante:</span> <span className={`font-medium ${restanteColor}`}>{formatearMonedaLocal(restante)}</span></div> {/* Muestra restante real */}
                                        <div><span className="text-gray-400">Fecha Meta:</span> <span className="text-gray-200">{formatearFechaCorta(obj.fecha_objetivo)}</span></div>
                                    </div>
                                    <div className="mb-3">
                                        <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Progreso</span><span>{progreso.toFixed(0)}%</span></div>
                                        <div className="w-full bg-gray-600 rounded-full h-2.5"><div className={`h-2.5 rounded-full ${progresoColor}`} style={{ width: `${progresoDisplay}%` }}></div></div>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-gray-400">Carteras Vinculadas:</span>
                                        {obj.carteras_vinculadas && obj.carteras_vinculadas.length > 0 ? ( <span className="ml-2 text-gray-300">{obj.carteras_vinculadas.map(c => c?.nombre || 'N/A').join(', ')}</span> ) : ( <span className="ml-2 text-gray-500 italic">Ninguna</span> )}
                                    </div>
                                    {obj.notas && <p className="text-xs text-gray-500 mt-2 border-t border-gray-700 pt-2">Nota: {obj.notas}</p>}
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
