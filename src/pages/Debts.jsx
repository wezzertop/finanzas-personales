import React, { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { obtenerCarteras } from '../lib/carterasApi';
import { obtenerDebts, agregarDebt, editarDebt, eliminarDebt, registrarPagoDeuda } from '../lib/debtsApi';
import { obtenerOCrearCategoriaAjuste } from '../lib/categoriasApi';

// Función auxiliar para formatear fecha YYYY-MM-DD
const formatYMD = (date) => { if (!date) return ''; try { if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) { return date; } return new Date(date).toLocaleDateString('sv-SE'); } catch (e) { return ''; } };

function Debts({ session }) {
    const { currency, loadingSettings } = useSettings(); // Usar formateador del contexto si es necesario

    // Estados de datos
    const [debts, setDebts] = useState([]); // Contendrá saldo_actual
    const [carteras, setCarteras] = useState([]);

    // Estados del formulario principal
    const [editandoDebt, setEditandoDebt] = useState(null);
    const [nombre, setNombre] = useState('');
    const [montoInicial, setMontoInicial] = useState('');
    const [tasaInteres, setTasaInteres] = useState('');
    const [pagoMinimo, setPagoMinimo] = useState('');
    const [carteraPagoIdForm, setCarteraPagoIdForm] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [notas, setNotas] = useState('');

    // Estados de carga y error generales
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados para Modal de Pago
    const [showModalPago, setShowModalPago] = useState(false);
    const [deudaParaPago, setDeudaParaPago] = useState(null);
    const [montoPago, setMontoPago] = useState('');
    const [fechaPago, setFechaPago] = useState(formatYMD(new Date()));
    const [carteraPagoIdModal, setCarteraPagoIdModal] = useState('');
    const [descripcionPago, setDescripcionPago] = useState('');
    const [isPaying, setIsPaying] = useState(false);
    const [pagoError, setPagoError] = useState('');

    // Cargar datos iniciales (deudas y carteras)
    const cargarDatos = useCallback(async () => {
        if (!session?.user?.id) return;
        setCargando(true); setError(null);
        try {
            // obtenerDebts ya trae saldo_actual
            const [resDebts, resCarteras] = await Promise.all([ obtenerDebts(), obtenerCarteras() ]);
            if (resDebts.error) throw new Error(`Deudas: ${resDebts.error.message}`);
            if (resCarteras.error) throw new Error(`Carteras: ${resCarteras.error.message}`);
            setDebts(resDebts.data || []);
            setCarteras(resCarteras.data || []);
            console.log("Deudas cargadas:", resDebts.data); // Verificar si saldo_actual viene
        } catch (err) { setError(`Error al cargar datos: ${err.message || 'Desconocido'}`); setDebts([]); setCarteras([]); }
        finally { setCargando(false); }
    }, [session]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    // Resetear formulario principal
    const resetForm = () => { setEditandoDebt(null); setNombre(''); setMontoInicial(''); setTasaInteres(''); setPagoMinimo(''); setCarteraPagoIdForm(''); setFechaInicio(''); setNotas(''); };

    // Rellenar formulario para editar deuda
    const handleEditarClick = (debt) => { setEditandoDebt(debt); setNombre(debt.nombre); setMontoInicial(String(debt.monto_inicial || '')); setTasaInteres(String(debt.tasa_interes_anual || '')); setPagoMinimo(String(debt.pago_minimo_mensual || '')); setCarteraPagoIdForm(String(debt.cartera_pago_id || '')); setFechaInicio(formatYMD(debt.fecha_inicio)); setNotas(debt.notas || ''); document.getElementById('form-debt')?.scrollIntoView({ behavior: 'smooth' }); };
    const handleCancelarEdicion = () => { resetForm(); };

    // Submit del formulario principal (Agregar o Editar Deuda)
    const handleSubmit = async (event) => {
        event.preventDefault(); if (!session?.user?.id) { setError("Sin ID usuario."); return; } if (!nombre.trim()) { alert("Nombre requerido."); return; } if (!montoInicial || isNaN(parseFloat(montoInicial)) || parseFloat(montoInicial) <= 0) { alert("Monto inicial inválido."); return; } setError(null); setIsSubmitting(true); const userId = session.user.id;
        // Al agregar/editar, el saldo_actual se inicializa/mantiene en la API/DB
        const datosDeuda = { nombre: nombre.trim(), monto_inicial: parseFloat(montoInicial), tasa_interes_anual: parseFloat(tasaInteres) || 0, pago_minimo_mensual: parseFloat(pagoMinimo) || 0, cartera_pago_id: carteraPagoIdForm || null, fecha_inicio: fechaInicio || null, notas: notas.trim() || null, };
        // Si se edita y se quiere resetear saldo_actual (opcional, no implementado por defecto)
        // if (editandoDebt) datosDeuda.saldo_actual = parseFloat(montoInicial); // OJO: Esto resetea el progreso

        try {
            if (editandoDebt) { const { error: e } = await editarDebt(editandoDebt.id, datosDeuda); if (e) throw e; }
            else { const { error: e } = await agregarDebt(datosDeuda, userId); if (e) throw e; }
            resetForm();
            cargarDatos(); // Recargar para ver el saldo actualizado
        } catch (err) { setError(`Error al guardar: ${err.message}`); }
        finally { setIsSubmitting(false); }
    };

    // Eliminar Deuda
    const handleEliminarClick = async (id) => { if (!window.confirm(`¿Eliminar deuda?`)) return; setError(null); try { const { error: e } = await eliminarDebt(id); if (e) throw e; setDebts(prev => prev.filter(d => d.id !== id)); if (editandoDebt?.id === id) { resetForm(); } } catch (err) { setError(`Error al eliminar: ${err.message}`); } };

    // --- Lógica para Registrar Pago ---
    const openModalPago = (debt) => { setDeudaParaPago(debt); setMontoPago(''); setFechaPago(formatYMD(new Date())); setCarteraPagoIdModal(debt.cartera_pago_id || ''); setDescripcionPago(`Pago ${debt.nombre}`); setShowModalPago(true); setPagoError(''); };
    const closeModalPago = () => { setShowModalPago(false); setDeudaParaPago(null); setMontoPago(''); setFechaPago(formatYMD(new Date())); setCarteraPagoIdModal(''); setDescripcionPago(''); setPagoError(''); setIsPaying(false); };

    const handlePagoSubmit = async (event) => {
        event.preventDefault();
        if (!deudaParaPago || !montoPago || isNaN(parseFloat(montoPago)) || parseFloat(montoPago) <= 0 || !fechaPago || !carteraPagoIdModal) { setPagoError("Completa campos requeridos."); return; }
        if (!session?.user?.id) { setPagoError("Error sesión."); return; }

        setIsPaying(true); setPagoError('');
        const userId = session.user.id;
        const montoNum = parseFloat(montoPago);

        try {
            const categoriaPago = await obtenerOCrearCategoriaAjuste('Egreso', userId);
            if (!categoriaPago || !categoriaPago.id) throw new Error("No se pudo obtener/crear categoría pago.");
            const pagoData = { debtId: deudaParaPago.id, monto: montoNum, fecha: fechaPago, carteraId: parseInt(carteraPagoIdModal, 10), categoriaId: categoriaPago.id, descripcion: descripcionPago.trim() || `Pago ${deudaParaPago.nombre}` };
            const { data: resultadoRpc, error: rpcError } = await registrarPagoDeuda(pagoData);
            if (rpcError) throw rpcError;

            console.log("Pago registrado:", resultadoRpc);
            closeModalPago();
            cargarDatos(); // Recargar lista de deudas para ver saldo actualizado
            alert("¡Pago registrado!");

        } catch (err) { console.error("Error registrando pago:", err); setPagoError(`Error: ${err.message || 'Desconocido'}`); }
        finally { setIsPaying(false); }
    };
    // --- Fin Lógica Pago ---

    // Formateadores y Clases CSS
    const formatearMonedaLocal = useCallback((m) => { if (loadingSettings || typeof m !== 'number') return '---'; return m.toLocaleString('es-MX', { style: 'currency', currency: currency }); }, [currency, loadingSettings]);
    const formatearPorcentaje = (p) => { if (typeof p !== 'number' || isNaN(p)) return '-'; return `${p.toFixed(2)}%`; };
    const formatearFechaCorta = (f) => { if (!f) return 'N/A'; try { return new Date(f + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); } catch (e) { return 'Inv.'; } };
    const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
    const inputClasses = `block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50`;
    const selectClasses = `${inputClasses} bg-gray-700`;
    const buttonClasses = (color = 'indigo') => `px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${color}-600 hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-${color}-500 transition duration-150 disabled:opacity-50`;
    const actionButtonClasses = "font-medium px-2 py-1 rounded hover:opacity-80 whitespace-nowrap text-xs";

    return (
        <div className="space-y-8">
            {/* Título */}
            <div className="flex items-center text-white"> <span className="mr-3 text-2xl">💳</span> <h1 className="text-2xl font-semibold">Gestión de Deudas</h1> </div>

            {/* Formulario */}
            <section id="form-debt" className="bg-gray-900 p-6 rounded-lg shadow-lg"> <h2 className="text-xl font-semibold mb-4 text-white">{editandoDebt ? `Editando: ${editandoDebt.nombre}` : 'Registrar Nueva Deuda'}</h2> <form onSubmit={handleSubmit} className="space-y-4"> <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> <div><label htmlFor="nombreDeuda" className={labelClasses}>Nombre <span className="text-red-500">*</span></label><input type="text" id="nombreDeuda" value={nombre} onChange={(e) => setNombre(e.target.value)} required className={inputClasses}/></div> <div><label htmlFor="montoInicial" className={labelClasses}>Monto Inicial <span className="text-red-500">*</span></label><input type="number" id="montoInicial" value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)} required min="0.01" step="0.01" className={inputClasses} disabled={loadingSettings}/></div> <div><label htmlFor="tasaInteres" className={labelClasses}>Interés Anual (%)</label><input type="number" id="tasaInteres" value={tasaInteres} onChange={(e) => setTasaInteres(e.target.value)} min="0" step="0.01" className={inputClasses}/></div> </div> <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> <div><label htmlFor="pagoMinimo" className={labelClasses}>Pago Mínimo</label><input type="number" id="pagoMinimo" value={pagoMinimo} onChange={(e) => setPagoMinimo(e.target.value)} min="0" step="0.01" className={inputClasses} disabled={loadingSettings}/></div> <div><label htmlFor="carteraPagoIdForm" className={labelClasses}>Cartera Pago (Opc)</label><select id="carteraPagoIdForm" value={carteraPagoIdForm} onChange={(e) => setCarteraPagoIdForm(e.target.value)} className={selectClasses} disabled={cargando}><option value="">-- Ninguna --</option>{cargando ? <option>...</option> : carteras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div> <div><label htmlFor="fechaInicioDeuda" className={labelClasses}>Fecha Inicio (Opc)</label><input type="date" id="fechaInicioDeuda" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className={inputClasses} /></div> </div> <div><label htmlFor="notasDeuda" className={labelClasses}>Notas (Opc)</label><input type="text" id="notasDeuda" value={notas} onChange={(e) => setNotas(e.target.value)} className={inputClasses} /></div> <div className="flex space-x-3 pt-2"> <button type="submit" className={buttonClasses(editandoDebt ? 'yellow' : 'green')} disabled={isSubmitting || loadingSettings || cargando}> {isSubmitting ? 'Guardando...' : (editandoDebt ? '💾 Guardar' : '➕ Agregar')} </button> {editandoDebt && (<button type="button" onClick={handleCancelarEdicion} className={buttonClasses('gray')}> Cancelar </button>)} </div> </form> {error && <p className="text-red-400 mt-4 text-sm">{error}</p>} </section>

            {/* Lista de Deudas */}
            <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-white">Mis Deudas</h2>
                {cargando && <p className="text-blue-400">Cargando...</p>}
                {!cargando && debts.length === 0 && !error && (<p className="text-gray-500">No has registrado deudas.</p>)}
                {!cargando && debts.length > 0 && (
                    <div className="overflow-x-auto relative shadow-md rounded-lg border border-gray-700">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Nombre</th>
                                    <th scope="col" className="px-4 py-3 text-right">Monto Inicial</th>
                                    <th scope="col" className="px-4 py-3 text-right font-semibold">Saldo Actual</th>
                                    <th scope="col" className="px-4 py-3 text-right hidden sm:table-cell">Interés</th>
                                    <th scope="col" className="px-4 py-3 text-right hidden md:table-cell">Pago Mín.</th>
                                    <th scope="col" className="px-4 py-3 hidden lg:table-cell">Cartera Pago</th>
                                    <th scope="col" className="px-4 py-3">Progreso</th>
                                    <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {debts.map((debt) => {
                                    // Usa saldo_actual si existe, si no, monto_inicial
                                    const saldoActual = debt.saldo_actual ?? debt.monto_inicial;
                                    // Calcula progreso basado en cuánto se ha pagado
                                    const pagado = debt.monto_inicial - saldoActual;
                                    const progreso = debt.monto_inicial > 0 ? Math.max(0, Math.min(100, (pagado / debt.monto_inicial) * 100)) : (saldoActual <= 0 ? 100 : 0);
                                    const progresoColor = progreso < 25 ? 'bg-red-500' : progreso < 75 ? 'bg-yellow-500' : 'bg-green-500'; // Verde al final

                                    return (
                                        <tr key={debt.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                                            <td className="px-4 py-3 font-medium text-gray-300 whitespace-nowrap">{debt.nombre}</td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">{formatearMonedaLocal(debt.monto_inicial)}</td>
                                            {/* Mostrar Saldo Actual REAL */}
                                            <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-orange-400">{formatearMonedaLocal(saldoActual)}</td>
                                            <td className="px-4 py-3 text-right hidden sm:table-cell">{formatearPorcentaje(debt.tasa_interes_anual)}</td>
                                            <td className="px-4 py-3 text-right hidden md:table-cell">{formatearMonedaLocal(debt.pago_minimo_mensual)}</td>
                                            <td className="px-4 py-3 hidden lg:table-cell">{debt.cartera?.nombre || '-'}</td>
                                            {/* Barra de Progreso REAL */}
                                            <td className="px-4 py-3">
                                                <div className="w-full bg-gray-600 rounded-full h-2.5" title={`${progreso.toFixed(0)}% pagado`}>
                                                    <div className={`h-2.5 rounded-full ${progresoColor}`} style={{ width: `${progreso}%` }}></div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex flex-col space-y-1 sm:space-y-0 sm:flex-row justify-center items-center sm:space-x-2">
                                                    <button onClick={() => openModalPago(debt)} className={`${actionButtonClasses} text-cyan-400 w-full sm:w-auto`} aria-label={`Pagar ${debt.nombre}`}>💸 Pagar</button>
                                                    <button onClick={() => handleEditarClick(debt)} className={`${actionButtonClasses} text-yellow-400 w-full sm:w-auto`} aria-label={`Editar ${debt.nombre}`}>✏️ Editar</button>
                                                    <button onClick={() => handleEliminarClick(debt.id)} className={`${actionButtonClasses} text-red-500 w-full sm:w-auto`} aria-label={`Eliminar ${debt.nombre}`}>🗑️ Eliminar</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Modal para Registrar Pago */}
            {showModalPago && deudaParaPago && (
                <div className="fixed inset-0 z-40 bg-black bg-opacity-75 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
                  <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-700 transform transition-all duration-300 ease-in-out scale-100">
                    <h3 className="text-lg font-semibold text-white mb-4">Registrar Pago para: <span className="text-cyan-400">{deudaParaPago.nombre}</span></h3>
                    <form onSubmit={handlePagoSubmit} className="space-y-4">
                       <div><label className={labelClasses}>Saldo Actual:</label><p className="text-orange-400 font-medium">{formatearMonedaLocal(deudaParaPago.saldo_actual ?? deudaParaPago.monto_inicial)}</p></div>
                       <div><label htmlFor="montoPago" className={labelClasses}>Monto Pagado <span className="text-red-500">*</span></label><input type="number" id="montoPago" value={montoPago} onChange={(e) => setMontoPago(e.target.value)} required min="0.01" step="0.01" className={inputClasses} disabled={loadingSettings || isPaying}/></div>
                       <div><label htmlFor="fechaPago" className={labelClasses}>Fecha Pago <span className="text-red-500">*</span></label><input type="date" id="fechaPago" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} required className={inputClasses} disabled={isPaying}/></div>
                       <div><label htmlFor="carteraPagoModal" className={labelClasses}>Pagar Desde Cartera <span className="text-red-500">*</span></label><select id="carteraPagoModal" value={carteraPagoIdModal} onChange={(e) => setCarteraPagoIdModal(e.target.value)} required className={selectClasses} disabled={carteras.length === 0 || cargando || isPaying}><option value="" disabled>-- Selecciona --</option>{cargando ? <option>...</option> : carteras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
                       <div><label htmlFor="descripcionPago" className={labelClasses}>Descripción (Opcional)</label><input type="text" id="descripcionPago" value={descripcionPago} onChange={(e) => setDescripcionPago(e.target.value)} className={inputClasses} disabled={isPaying}/></div>
                       {pagoError && <p className="text-red-400 text-sm">{pagoError}</p>}
                       <div className="flex justify-end space-x-3 pt-3">
                         <button type="button" onClick={closeModalPago} className={`${buttonClasses('gray')} disabled:opacity-70`} disabled={isPaying}>Cancelar</button>
                         <button type="submit" className={`${buttonClasses('cyan')} disabled:opacity-70`} disabled={isPaying || loadingSettings}> {isPaying ? 'Registrando...' : '💾 Registrar Pago'} </button>
                       </div>
                    </form>
                  </div>
                </div>
            )}
        </div>
    );
}

export default Debts;
