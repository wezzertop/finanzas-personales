// Archivo: src/pages/Debts.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { obtenerCarteras } from '../lib/carterasApi';
import {
  obtenerDebts,
  agregarDebt,
  editarDebt,
  eliminarDebt,
  registrarPagoDeuda,
  obtenerTablaAmortizacion
} from '../lib/debtsApi';
import { obtenerOCrearCategoriaAjuste } from '../lib/categoriasApi';
import { useGamificacion } from '../context/GamificacionContext'; // <--- NUEVA IMPORTACIÓN

// Función auxiliar para formatear fecha YYYY-MM-DD
const formatYMD = (date) => {
  if (!date) return '';
  try {
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch (e) {
    console.error("Error formateando fecha:", date, e);
    return '';
  }
};

const tiposDeudaOpciones = [
  'Personal', 'Tarjeta de Crédito', 'Hipotecario', 'Vehicular', 'Estudiantil', 'Otro'
];
const frecuenciasPagoOpciones = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'anual', label: 'Anual' },
];

function Debts({ session }) {
  const { currency, loadingSettings } = useSettings();
  const { verificarYOtorgarLogro, fetchEstadoGamificacion, otorgarXP } = useGamificacion(); // <--- OBTENER FUNCIONES DEL CONTEXTO

  const [debts, setDebts] = useState([]);
  const [carteras, setCarteras] = useState([]);
  const [editandoDebt, setEditandoDebt] = useState(null);
  const [nombre, setNombre] = useState('');
  const [montoInicial, setMontoInicial] = useState('');
  const [tasaInteres, setTasaInteres] = useState('');
  const [pagoMinimo, setPagoMinimo] = useState('');
  const [carteraPagoIdForm, setCarteraPagoIdForm] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [notas, setNotas] = useState('');
  const [tipoDeuda, setTipoDeuda] = useState('Personal');
  const [frecuenciaPago, setFrecuenciaPago] = useState('mensual');
  const [plazoMeses, setPlazoMeses] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModalPago, setShowModalPago] = useState(false);
  const [deudaParaPago, setDeudaParaPago] = useState(null);
  const [montoPago, setMontoPago] = useState('');
  const [fechaPago, setFechaPago] = useState(formatYMD(new Date()));
  const [carteraPagoIdModal, setCarteraPagoIdModal] = useState('');
  const [descripcionPago, setDescripcionPago] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [pagoError, setPagoError] = useState('');
  const [showModalAmortizacion, setShowModalAmortizacion] = useState(false);
  const [deudaParaAmortizacion, setDeudaParaAmortizacion] = useState(null);
  const [tablaAmortizacion, setTablaAmortizacion] = useState([]);
  const [cargandoAmortizacion, setCargandoAmortizacion] = useState(false);
  const [amortizacionError, setAmortizacionError] = useState('');
  const [pagoSimuladoAmortizacion, setPagoSimuladoAmortizacion] = useState('');

  const cargarDatos = useCallback(async () => {
    if (!session?.user?.id) return;
    setCargando(true); setError(null);
    try {
      const [resDebts, resCarteras] = await Promise.all([obtenerDebts(), obtenerCarteras()]);
      if (resDebts.error) throw new Error(`Deudas: ${resDebts.error.message}`);
      if (resCarteras.error) throw new Error(`Carteras: ${resCarteras.error.message}`);
      setDebts(resDebts.data || []);
      setCarteras(resCarteras.data || []);
    } catch (err) { setError(`Error al cargar datos: ${err.message || 'Desconocido'}`); setDebts([]); setCarteras([]); }
    finally { setCargando(false); }
  }, [session]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const resetForm = () => {
    setEditandoDebt(null); setNombre(''); setMontoInicial(''); setTasaInteres('');
    setPagoMinimo(''); setCarteraPagoIdForm(''); setFechaInicio(''); setNotas('');
    setTipoDeuda('Personal'); setFrecuenciaPago('mensual'); setPlazoMeses('');
  };

  const handleEditarClick = (debt) => {
    setEditandoDebt(debt); setNombre(debt.nombre);
    setMontoInicial(String(debt.monto_inicial || ''));
    setTasaInteres(String(debt.tasa_interes_anual || ''));
    setPagoMinimo(String(debt.pago_minimo_mensual || ''));
    setCarteraPagoIdForm(String(debt.cartera_pago_id || ''));
    setFechaInicio(formatYMD(debt.fecha_inicio)); setNotas(debt.notas || '');
    setTipoDeuda(debt.tipo_deuda || 'Personal');
    setFrecuenciaPago(debt.frecuencia_pago || 'mensual');
    setPlazoMeses('');
    document.getElementById('form-debt')?.scrollIntoView({ behavior: 'smooth' });
  };
  const handleCancelarEdicion = () => { resetForm(); };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!session?.user?.id) { setError("Sin ID usuario."); return; }
    if (!nombre.trim()) { alert("Nombre requerido."); return; }
    if (!montoInicial || isNaN(parseFloat(montoInicial)) || parseFloat(montoInicial) <= 0) {
      alert("Monto inicial inválido."); return;
    }
    setError(null); setIsSubmitting(true);
    const userId = session.user.id;
    const datosDeuda = {
      nombre: nombre.trim(),
      monto_inicial: parseFloat(montoInicial),
      tasa_interes_anual: parseFloat(tasaInteres) || 0,
      pago_minimo_mensual: parseFloat(pagoMinimo) || 0,
      cartera_pago_id: carteraPagoIdForm || null,
      fecha_inicio: fechaInicio || null,
      notas: notas.trim() || null,
      tipo_deuda: tipoDeuda,
      frecuencia_pago: frecuenciaPago,
    };

    try {
      if (editandoDebt) {
        await editarDebt(editandoDebt.id, datosDeuda);
      } else {
        await agregarDebt(datosDeuda, userId);
      }
      resetForm();
      cargarDatos();
    } catch (err) { setError(`Error al guardar: ${err.message}`); }
    finally { setIsSubmitting(false); }
  };

  const handleEliminarClick = async (id) => {
    if (!window.confirm(`¿Eliminar deuda y todos sus pagos asociados (si los hubiera)?`)) return;
    setError(null); setIsSubmitting(true);
    try {
      await eliminarDebt(id);
      // setDebts(prev => prev.filter(d => d.id !== id)); // Se actualiza con cargarDatos
      if (editandoDebt?.id === id) resetForm();
      if (deudaParaAmortizacion?.id === id) closeModalAmortizacion();
      if (deudaParaPago?.id === id) closeModalPago();
      await cargarDatos();
    } catch (err) { setError(`Error al eliminar: ${err.message}`); }
    finally { setIsSubmitting(false); }
  };

  const openModalPago = (debt) => { setDeudaParaPago(debt); setMontoPago(String(debt.pago_minimo_mensual > 0 ? debt.pago_minimo_mensual : (debt.saldo_actual > 0 ? debt.saldo_actual : ''))); setFechaPago(formatYMD(new Date())); setCarteraPagoIdModal(String(debt.cartera_pago_id || '')); setDescripcionPago(`Pago ${debt.nombre}`); setShowModalPago(true); setPagoError(''); };
  const closeModalPago = () => { setShowModalPago(false); setDeudaParaPago(null); setMontoPago(''); setFechaPago(formatYMD(new Date())); setCarteraPagoIdModal(''); setDescripcionPago(''); setPagoError(''); setIsPaying(false); };
  
  const handlePagoSubmit = async (event) => {
    event.preventDefault();
    if (!deudaParaPago || !montoPago || isNaN(parseFloat(montoPago)) || parseFloat(montoPago) <= 0 || !fechaPago || !carteraPagoIdModal) { setPagoError("Completa campos requeridos (monto, fecha, cartera)."); return; }
    if (!session?.user?.id) { setPagoError("Error de sesión de usuario."); return; }
    
    setIsPaying(true); setPagoError('');
    const userId = session.user.id;
    const montoNum = parseFloat(montoPago);

    try {
      const categoriaPago = await obtenerOCrearCategoriaAjuste('Egreso', userId);
      if (!categoriaPago || !categoriaPago.id) throw new Error("No se pudo obtener/crear categoría para el pago de deuda.");
      
      const pagoData = { 
        debtId: deudaParaPago.id, 
        monto: montoNum, 
        fecha: fechaPago, 
        carteraId: parseInt(carteraPagoIdModal, 10), 
        categoriaId: categoriaPago.id, 
        descripcion: descripcionPago.trim() || `Pago ${deudaParaPago.nombre}` 
      };
      
      await registrarPagoDeuda(pagoData);
      
      // --- LÓGICA DE GAMIFICACIÓN AL REGISTRAR PAGO ---
      const saldoActualPrevio = deudaParaPago.saldo_actual ?? deudaParaPago.monto_inicial;
      const esPagoLiquidacion = (saldoActualPrevio - montoNum) <= 0.01; // Considerar un pequeño margen por decimales

      if (esPagoLiquidacion) {
        console.log(`[Debts.jsx] Deuda ${deudaParaPago.nombre} (ID: ${deudaParaPago.id}) liquidada con este pago.`);
        try {
          // Otorgar XP por liquidar una deuda. Podrías variar el XP según el monto de la deuda.
          await otorgarXP(100, `DEUDA_LIQUIDADA:${deudaParaPago.id}`); 
          console.log("[Debts.jsx] 100 XP otorgados por liquidar deuda.");

          // Verificar logro "Libertad Inicial" (se otorga solo la primera vez que se liquida *cualquier* deuda)
          await verificarYOtorgarLogro('LIBRE_DE_DEUDA_1X', { deuda_id: deudaParaPago.id, nombre_deuda: deudaParaPago.nombre });
          console.log("[Debts.jsx] Verificación de logro 'LIBRE_DE_DEUDA_1X' completada.");
          
          await fetchEstadoGamificacion(); // Actualizar estado global de gamificación
          console.log("[Debts.jsx] Estado de gamificación recargado.");
        } catch (gamificacionError) {
          console.error("[Debts.jsx] Error en lógica de gamificación tras pago:", gamificacionError);
        }
      }
      // --- FIN LÓGICA DE GAMIFICACIÓN ---

      closeModalPago();
      await cargarDatos(); // Recargar lista de deudas para ver saldo actualizado
      alert("¡Pago registrado exitosamente!");

    } catch (err) { 
      console.error("Error registrando pago:", err); 
      setPagoError(`Error al registrar pago: ${err.message || 'Desconocido'}`); 
    }
    finally { setIsPaying(false); }
  };

  const openModalAmortizacion = (debt) => { setDeudaParaAmortizacion(debt); setPlazoMeses(''); setPagoSimuladoAmortizacion(debt.pago_minimo_mensual > 0 ? String(debt.pago_minimo_mensual) : ''); setTablaAmortizacion([]); setAmortizacionError(''); setShowModalAmortizacion(true); };
  const closeModalAmortizacion = () => { setShowModalAmortizacion(false); setDeudaParaAmortizacion(null); setTablaAmortizacion([]); setAmortizacionError(''); setPagoSimuladoAmortizacion(''); };
  const handleCalcularAmortizacion = async () => {
    if (!deudaParaAmortizacion || !plazoMeses || parseInt(plazoMeses, 10) <= 0) { setAmortizacionError("Ingresa un plazo en meses válido."); return; }
    setCargandoAmortizacion(true); setAmortizacionError('');
    const monto = parseFloat(deudaParaAmortizacion.saldo_actual ?? deudaParaAmortizacion.monto_inicial);
    const tasaAnual = parseFloat(deudaParaAmortizacion.tasa_interes_anual) / 100;
    const numMeses = parseInt(plazoMeses, 10);
    const pagoFijo = pagoSimuladoAmortizacion ? parseFloat(pagoSimuladoAmortizacion) : null;
    try {
      const { data, error: rpcError } = await obtenerTablaAmortizacion(monto, tasaAnual, numMeses, pagoFijo);
      if (rpcError) throw rpcError;
      setTablaAmortizacion(data || []);
    } catch (err) { setAmortizacionError(`Error al calcular: ${err.message}`); setTablaAmortizacion([]); }
    finally { setCargandoAmortizacion(false); }
  };

  const formatearMonedaLocal = useCallback((m) => { if (loadingSettings || typeof m !== 'number' || isNaN(m)) return '---'; return m.toLocaleString('es-MX', { style: 'currency', currency: currency }); }, [currency, loadingSettings]);
  const formatearPorcentaje = (p) => { if (typeof p !== 'number' || isNaN(p)) return '-'; return `${p.toFixed(2)}%`; };
  const formatearFechaCorta = (f) => { if (!f) return 'N/A'; try { return new Date(f + 'T00:00:00Z').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); } catch (e) { return 'Inv.'; } };
  const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
  const inputClasses = `block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50`;
  const selectClasses = `${inputClasses} bg-gray-700`;
  const buttonClasses = (color = 'indigo', size = 'md') => `px-${size === 'sm' ? 2 : 4} py-${size === 'sm' ? 1 : 2} border border-transparent rounded-md shadow-sm text-${size === 'sm' ? 'xs' : 'sm'} font-medium text-white bg-${color}-600 hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-${color}-500 transition duration-150 disabled:opacity-50`;
  const actionButtonClasses = "font-medium px-2 py-1 rounded hover:opacity-80 whitespace-nowrap text-xs";
  const tableHeaderClasses = "px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider";
  const tableCellClasses = "px-3 py-2 whitespace-nowrap text-sm text-gray-300";

  return (
    <div className="space-y-8">
      <div className="flex items-center text-white"> <span className="mr-3 text-2xl">💳</span> <h1 className="text-2xl font-semibold">Gestión de Deudas</h1> </div>

      <section id="form-debt" className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">{editandoDebt ? `Editando: ${editandoDebt.nombre}` : 'Registrar Nueva Deuda'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label htmlFor="nombreDeuda" className={labelClasses}>Nombre <span className="text-red-500">*</span></label><input type="text" id="nombreDeuda" value={nombre} onChange={(e) => setNombre(e.target.value)} required className={inputClasses}/></div>
            <div><label htmlFor="montoInicial" className={labelClasses}>Monto Inicial <span className="text-red-500">*</span></label><input type="number" id="montoInicial" value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)} required min="0.01" step="0.01" className={inputClasses} disabled={loadingSettings || isSubmitting}/></div>
            <div><label htmlFor="tasaInteres" className={labelClasses}>Interés Anual (%)</label><input type="number" id="tasaInteres" value={tasaInteres} onChange={(e) => setTasaInteres(e.target.value)} min="0" step="0.01" placeholder="Ej: 15 para 15%" className={inputClasses} disabled={isSubmitting}/></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label htmlFor="pagoMinimo" className={labelClasses}>Pago Mínimo Mensual</label><input type="number" id="pagoMinimo" value={pagoMinimo} onChange={(e) => setPagoMinimo(e.target.value)} min="0" step="0.01" className={inputClasses} disabled={loadingSettings || isSubmitting}/></div>
            <div><label htmlFor="tipoDeuda" className={labelClasses}>Tipo de Deuda</label><select id="tipoDeuda" value={tipoDeuda} onChange={(e) => setTipoDeuda(e.target.value)} className={selectClasses} disabled={isSubmitting}>{tiposDeudaOpciones.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
            <div><label htmlFor="frecuenciaPago" className={labelClasses}>Frecuencia de Pago</label><select id="frecuenciaPago" value={frecuenciaPago} onChange={(e) => setFrecuenciaPago(e.target.value)} className={selectClasses} disabled={isSubmitting}>{frecuenciasPagoOpciones.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="carteraPagoIdForm" className={labelClasses}>Cartera Predeterminada (Opc)</label><select id="carteraPagoIdForm" value={carteraPagoIdForm} onChange={(e) => setCarteraPagoIdForm(e.target.value)} className={selectClasses} disabled={cargando || isSubmitting}><option value="">-- Ninguna --</option>{cargando ? <option>Cargando...</option> : carteras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
            <div><label htmlFor="fechaInicioDeuda" className={labelClasses}>Fecha Inicio (Opc)</label><input type="date" id="fechaInicioDeuda" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className={inputClasses} disabled={isSubmitting}/></div>
          </div>
          <div><label htmlFor="notasDeuda" className={labelClasses}>Notas (Opc)</label><input type="text" id="notasDeuda" value={notas} onChange={(e) => setNotas(e.target.value)} className={inputClasses} disabled={isSubmitting}/></div>
          <div className="flex space-x-3 pt-2"> <button type="submit" className={buttonClasses(editandoDebt ? 'yellow' : 'green')} disabled={isSubmitting || loadingSettings || cargando}> {isSubmitting ? 'Guardando...' : (editandoDebt ? '💾 Guardar' : '➕ Agregar')} </button> {editandoDebt && (<button type="button" onClick={handleCancelarEdicion} className={buttonClasses('gray')} disabled={isSubmitting}> Cancelar </button>)} </div>
        </form>
        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </section>

      <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">Mis Deudas</h2>
        {cargando && <p className="text-blue-400">Cargando...</p>}
        {!cargando && debts.length === 0 && !error && (<p className="text-gray-500">No has registrado deudas.</p>)}
        {!cargando && debts.length > 0 && (
          <div className="overflow-x-auto relative shadow-md rounded-lg border border-gray-700">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                  <th scope="col" className={tableHeaderClasses}>Nombre</th>
                  <th scope="col" className={`${tableHeaderClasses} hidden md:table-cell`}>Tipo</th>
                  <th scope="col" className={`${tableHeaderClasses} text-right`}>Monto Inicial</th>
                  <th scope="col" className={`${tableHeaderClasses} text-right font-semibold`}>Saldo Actual</th>
                  <th scope="col" className={`${tableHeaderClasses} text-right hidden sm:table-cell`}>Interés Anual</th>
                  <th scope="col" className={`${tableHeaderClasses} text-right hidden md:table-cell`}>Pago Mín.</th>
                  <th scope="col" className={tableHeaderClasses}>Progreso</th>
                  <th scope="col" className={`${tableHeaderClasses} text-center`}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {debts.map((debt) => {
                  const saldoActual = debt.saldo_actual ?? debt.monto_inicial;
                  const pagado = debt.monto_inicial - saldoActual;
                  const progreso = debt.monto_inicial > 0 ? Math.max(0, Math.min(100, (pagado / debt.monto_inicial) * 100)) : (saldoActual <= 0 ? 100 : 0);
                  const progresoColor = progreso < 25 ? 'bg-red-500' : progreso < 75 ? 'bg-yellow-500' : 'bg-green-500';
                  return (
                    <tr key={debt.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                      <td className={tableCellClasses}><div className="font-medium text-gray-200">{debt.nombre}</div><div className="text-xs text-gray-500 lg:hidden">{debt.tipo_deuda}</div></td>
                      <td className={`${tableCellClasses} hidden md:table-cell`}>{debt.tipo_deuda}</td>
                      <td className={`${tableCellClasses} text-right`}>{formatearMonedaLocal(debt.monto_inicial)}</td>
                      <td className={`${tableCellClasses} text-right font-semibold text-orange-400`}>{formatearMonedaLocal(saldoActual)}</td>
                      <td className={`${tableCellClasses} text-right hidden sm:table-cell`}>{formatearPorcentaje(debt.tasa_interes_anual)}</td>
                      <td className={`${tableCellClasses} text-right hidden md:table-cell`}>{formatearMonedaLocal(debt.pago_minimo_mensual)}</td>
                      <td className={tableCellClasses}>
                        <div className="w-full bg-gray-600 rounded-full h-2.5" title={`${progreso.toFixed(0)}% pagado`}>
                          <div className={`h-2.5 rounded-full ${progresoColor}`} style={{ width: `${progreso}%` }}></div>
                        </div>
                      </td>
                      <td className={`${tableCellClasses} text-center`}>
                        <div className="flex flex-col space-y-1 sm:space-y-0 sm:flex-row justify-center items-center sm:space-x-1">
                          <button onClick={() => openModalPago(debt)} className={`${actionButtonClasses} text-cyan-400 w-full sm:w-auto`} title="Registrar Pago">💸 Pagar</button>
                          <button onClick={() => openModalAmortizacion(debt)} className={`${actionButtonClasses} text-teal-400 w-full sm:w-auto`} title="Ver Plan de Pagos">🗓️ Plan</button>
                          <button onClick={() => handleEditarClick(debt)} className={`${actionButtonClasses} text-yellow-400 w-full sm:w-auto`} title="Editar Deuda">✏️ Edit</button>
                          <button onClick={() => handleEliminarClick(debt.id)} className={`${actionButtonClasses} text-red-500 w-full sm:w-auto`} title="Eliminar Deuda" disabled={isSubmitting}>🗑️ Del</button>
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

      {showModalPago && deudaParaPago && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-75 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-700 transform transition-all duration-300 ease-in-out scale-100">
            <h3 className="text-lg font-semibold text-white mb-4">Registrar Pago para: <span className="text-cyan-400">{deudaParaPago.nombre}</span></h3>
            <form onSubmit={handlePagoSubmit} className="space-y-4">
              <div><label className={labelClasses}>Saldo Actual:</label><p className="text-orange-400 font-medium">{formatearMonedaLocal(deudaParaPago.saldo_actual ?? deudaParaPago.monto_inicial)}</p></div>
              <div><label htmlFor="montoPago" className={labelClasses}>Monto Pagado <span className="text-red-500">*</span></label><input type="number" id="montoPago" value={montoPago} onChange={(e) => setMontoPago(e.target.value)} required min="0.01" step="0.01" className={inputClasses} disabled={loadingSettings || isPaying}/></div>
              <div><label htmlFor="fechaPago" className={labelClasses}>Fecha Pago <span className="text-red-500">*</span></label><input type="date" id="fechaPago" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} required className={inputClasses} disabled={isPaying}/></div>
              <div><label htmlFor="carteraPagoModal" className={labelClasses}>Pagar Desde Cartera <span className="text-red-500">*</span></label><select id="carteraPagoModal" value={carteraPagoIdModal} onChange={(e) => setCarteraPagoIdModal(e.target.value)} required className={selectClasses} disabled={carteras.length === 0 || cargando || isPaying}><option value="" disabled>-- Selecciona --</option>{cargando ? <option>Cargando...</option> : carteras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
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

      {showModalAmortizacion && deudaParaAmortizacion && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl border border-gray-700 transform transition-all duration-300 ease-in-out scale-100 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Plan de Pagos Simulado: <span className="text-teal-400">{deudaParaAmortizacion.nombre}</span></h3>
                <button type="button" onClick={closeModalAmortizacion} className={`${buttonClasses('gray', 'sm')}`}>✖️ Cerrar</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 items-end">
                <div><label htmlFor="plazoSimulacion" className={labelClasses}>Plazo (meses) <span className="text-red-500">*</span></label><input type="number" id="plazoSimulacion" value={plazoMeses} onChange={(e) => setPlazoMeses(e.target.value)} min="1" step="1" placeholder="Ej: 24" className={inputClasses} /></div>
                <div><label htmlFor="pagoSimulado" className={labelClasses}>Pago Mensual (Opc.)</label><input type="number" id="pagoSimulado" value={pagoSimuladoAmortizacion} onChange={(e) => setPagoSimuladoAmortizacion(e.target.value)} min="0" step="0.01" placeholder="Dejar vacío para calcular" className={inputClasses} disabled={loadingSettings}/></div>
                <button onClick={handleCalcularAmortizacion} className={`${buttonClasses('teal')} sm:self-end`} disabled={cargandoAmortizacion || !plazoMeses}> {cargandoAmortizacion ? 'Calculando...' : '📊 Calcular Plan'} </button>
            </div>
            {amortizacionError && <p className="text-red-400 text-sm mb-2">{amortizacionError}</p>}
            {cargandoAmortizacion && <p className="text-blue-400 text-center my-4">Calculando tabla...</p>}
            {!cargandoAmortizacion && tablaAmortizacion.length > 0 && (
              <div className="overflow-y-auto flex-grow">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-700 sticky top-0 z-10">
                    <tr>
                      <th className={tableHeaderClasses}># Pago</th>
                      <th className={`${tableHeaderClasses} text-right`}>Pago</th>
                      <th className={`${tableHeaderClasses} text-right`}>Interés</th>
                      <th className={`${tableHeaderClasses} text-right`}>Capital</th>
                      <th className={`${tableHeaderClasses} text-right`}>Saldo Pendiente</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {tablaAmortizacion.map((pago) => (
                      <tr key={pago.numero_pago}>
                        <td className={tableCellClasses}>{pago.numero_pago}</td>
                        <td className={`${tableCellClasses} text-right`}>{formatearMonedaLocal(pago.pago_programado)}</td>
                        <td className={`${tableCellClasses} text-right text-red-400`}>{formatearMonedaLocal(pago.interes_del_periodo)}</td>
                        <td className={`${tableCellClasses} text-right text-green-400`}>{formatearMonedaLocal(pago.capital_amortizado)}</td>
                        <td className={`${tableCellClasses} text-right font-medium text-orange-300`}>{formatearMonedaLocal(pago.saldo_pendiente)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!cargandoAmortizacion && tablaAmortizacion.length === 0 && !amortizacionError && <p className="text-gray-500 text-center my-4">Ingresa el plazo y haz clic en "Calcular Plan".</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default Debts;
