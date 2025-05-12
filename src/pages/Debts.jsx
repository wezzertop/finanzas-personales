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
import { useGamificacion } from '../context/GamificacionContext';

// --- Iconos SVG Inline ---
const CreditCardIcon = ({ className = "page-title-icon" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
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
const Edit3Icon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);
const Trash2Icon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);
const DollarSignIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const CalendarDaysIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>
  </svg>
);
const BarChart2Icon = ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);
// --- Fin Iconos SVG Inline ---

const formatYMD = (date) => { if (!date) return ''; try { if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) { return date; } const d = new Date(date); if (isNaN(d.getTime())) return ''; return d.toISOString().split('T')[0]; } catch (e) { console.error("Error formateando fecha:", date, e); return ''; } };
const tiposDeudaOpciones = ['Personal', 'Tarjeta de Crédito', 'Hipotecario', 'Vehicular', 'Estudiantil', 'Otro'];
const frecuenciasPagoOpciones = [{ value: 'semanal', label: 'Semanal' }, { value: 'quincenal', label: 'Quincenal' }, { value: 'mensual', label: 'Mensual' }, { value: 'anual', label: 'Anual' }];

function Debts({ session }) {
  const { currency, loadingSettings } = useSettings();
  const { verificarYOtorgarLogro, fetchEstadoGamificacion, otorgarXP } = useGamificacion();

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
  const [plazoMeses, setPlazoMeses] = useState(''); // Para modal de amortización
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

  // Clases de Tailwind reutilizables
  const baseLabelClasses = "block text-sm font-medium text-slate-300 mb-1.5";
  const baseInputClasses = "block w-full px-3.5 py-2.5 bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 text-sm shadow-sm focus:ring-2 focus:ring-brand-accent-primary focus:border-brand-accent-primary disabled:opacity-60";
  const baseSelectClasses = `${baseInputClasses} appearance-none pr-10`;
  const baseButtonClasses = (color = 'indigo', size = 'md') => `inline-flex items-center justify-center px-${size === 'sm' ? 3 : 5} py-${size === 'sm' ? '1.5' : '2.5'} border border-transparent rounded-lg shadow-md text-${size === 'sm' ? 'xs' : 'sm'} font-semibold text-white transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed ${color === 'green' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : ''} ${color === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400 text-slate-900' : ''} ${color === 'slate' ? 'bg-slate-600 hover:bg-slate-500 focus:ring-slate-400' : ''} ${color === 'indigo' ? 'bg-brand-accent-primary hover:opacity-90 focus:ring-brand-accent-primary' : ''} ${color === 'red' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : ''} ${color === 'teal' ? 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500' : ''} ${color === 'cyan' ? 'bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500' : ''}`;
  const tableHeaderClasses = "px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider";
  const tableCellClasses = "px-3 py-3.5 whitespace-nowrap text-sm";
  const iconButtonClasses = "p-1.5 text-slate-400 hover:text-white rounded-md transition-colors duration-150 hover:bg-slate-700";

  const cargarDatos = useCallback(async () => {
    if (!session?.user?.id) return;
    setCargando(true); setError(null);
    try {
      const [resDebts, resCarteras] = await Promise.all([obtenerDebts(), obtenerCarteras()]);
      if (resDebts.error) throw new Error(`Deudas: ${resDebts.error.message}`);
      if (resCarteras.error) throw new Error(`Carteras: ${resCarteras.error.message}`);
      setDebts(resDebts.data || []); setCarteras(resCarteras.data || []);
    } catch (err) { setError(`Error al cargar datos: ${err.message || 'Desconocido'}`); setDebts([]); setCarteras([]); }
    finally { setCargando(false); }
  }, [session]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const resetForm = () => { setEditandoDebt(null); setNombre(''); setMontoInicial(''); setTasaInteres(''); setPagoMinimo(''); setCarteraPagoIdForm(''); setFechaInicio(''); setNotas(''); setTipoDeuda('Personal'); setFrecuenciaPago('mensual'); setPlazoMeses(''); };
  const handleEditarClick = (debt) => { setEditandoDebt(debt); setNombre(debt.nombre); setMontoInicial(String(debt.monto_inicial || '')); setTasaInteres(String(debt.tasa_interes_anual || '')); setPagoMinimo(String(debt.pago_minimo_mensual || '')); setCarteraPagoIdForm(String(debt.cartera_pago_id || '')); setFechaInicio(formatYMD(debt.fecha_inicio)); setNotas(debt.notas || ''); setTipoDeuda(debt.tipo_deuda || 'Personal'); setFrecuenciaPago(debt.frecuencia_pago || 'mensual'); setPlazoMeses(''); document.getElementById('form-debt-section')?.scrollIntoView({ behavior: 'smooth' }); };
  const handleCancelarEdicion = () => { resetForm(); };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!session?.user?.id) { setError("Sin ID usuario."); return; }
    if (!nombre.trim()) { alert("Nombre requerido."); return; }
    if (!montoInicial || isNaN(parseFloat(montoInicial)) || parseFloat(montoInicial) <= 0) { alert("Monto inicial inválido."); return; }
    setError(null); setIsSubmitting(true); const userId = session.user.id;
    const datosDeuda = { nombre: nombre.trim(), monto_inicial: parseFloat(montoInicial), tasa_interes_anual: parseFloat(tasaInteres) || 0, pago_minimo_mensual: parseFloat(pagoMinimo) || 0, cartera_pago_id: carteraPagoIdForm || null, fecha_inicio: fechaInicio || null, notas: notas.trim() || null, tipo_deuda: tipoDeuda, frecuencia_pago: frecuenciaPago, };
    try {
      if (editandoDebt) { await editarDebt(editandoDebt.id, datosDeuda); } else { await agregarDebt(datosDeuda, userId); }
      resetForm(); cargarDatos();
    } catch (err) { setError(`Error al guardar: ${err.message}`); }
    finally { setIsSubmitting(false); }
  };

  const handleEliminarClick = async (id) => {
    if (!window.confirm(`¿Eliminar deuda y todos sus pagos asociados (si los hubiera)?`)) return;
    setError(null); setIsSubmitting(true);
    try { await eliminarDebt(id); if (editandoDebt?.id === id) resetForm(); if (deudaParaAmortizacion?.id === id) closeModalAmortizacion(); if (deudaParaPago?.id === id) closeModalPago(); await cargarDatos(); }
    catch (err) { setError(`Error al eliminar: ${err.message}`); }
    finally { setIsSubmitting(false); }
  };

  const openModalPago = (debt) => { setDeudaParaPago(debt); setMontoPago(String(debt.pago_minimo_mensual > 0 ? debt.pago_minimo_mensual : (debt.saldo_actual > 0 ? debt.saldo_actual : ''))); setFechaPago(formatYMD(new Date())); setCarteraPagoIdModal(String(debt.cartera_pago_id || '')); setDescripcionPago(`Pago ${debt.nombre}`); setShowModalPago(true); setPagoError(''); };
  const closeModalPago = () => { setShowModalPago(false); setDeudaParaPago(null); setMontoPago(''); setFechaPago(formatYMD(new Date())); setCarteraPagoIdModal(''); setDescripcionPago(''); setPagoError(''); setIsPaying(false); };
  
  const handlePagoSubmit = async (event) => {
    event.preventDefault();
    if (!deudaParaPago || !montoPago || isNaN(parseFloat(montoPago)) || parseFloat(montoPago) <= 0 || !fechaPago || !carteraPagoIdModal) { setPagoError("Completa campos requeridos (monto, fecha, cartera)."); return; }
    if (!session?.user?.id) { setPagoError("Error de sesión de usuario."); return; }
    setIsPaying(true); setPagoError(''); const userId = session.user.id; const montoNum = parseFloat(montoPago);
    try {
      const categoriaPago = await obtenerOCrearCategoriaAjuste('Egreso', userId);
      if (!categoriaPago || !categoriaPago.id) throw new Error("No se pudo obtener/crear categoría para el pago de deuda.");
      const pagoData = { debtId: deudaParaPago.id, monto: montoNum, fecha: fechaPago, carteraId: parseInt(carteraPagoIdModal, 10), categoriaId: categoriaPago.id, descripcion: descripcionPago.trim() || `Pago ${deudaParaPago.nombre}` };
      await registrarPagoDeuda(pagoData);
      const saldoActualPrevio = deudaParaPago.saldo_actual ?? deudaParaPago.monto_inicial;
      const esPagoLiquidacion = (saldoActualPrevio - montoNum) <= 0.01;
      if (esPagoLiquidacion) {
        await otorgarXP(100, `DEUDA_LIQUIDADA:${deudaParaPago.id}`); 
        await verificarYOtorgarLogro('LIBRE_DE_DEUDA_1X', { deuda_id: deudaParaPago.id, nombre_deuda: deudaParaPago.nombre });
        await fetchEstadoGamificacion();
      }
      closeModalPago(); await cargarDatos(); alert("¡Pago registrado exitosamente!");
    } catch (err) { console.error("Error registrando pago:", err); setPagoError(`Error al registrar pago: ${err.message || 'Desconocido'}`); }
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

  return (
    <div className="space-y-8">
      <h1 className="page-title"> <CreditCardIcon /> Gestión de Deudas </h1>

      <section id="form-debt-section" className="card-base">
        <h2 className="text-xl font-semibold mb-6 text-slate-100">{editandoDebt ? `Editando Deuda: ${editandoDebt.nombre}` : 'Registrar Nueva Deuda'}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ... (resto del formulario con clases baseLabelClasses, baseInputClasses, baseSelectClasses, baseButtonClasses e iconos) ... */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div><label htmlFor="nombreDeuda" className={baseLabelClasses}>Nombre <span className="text-red-500">*</span></label><input type="text" id="nombreDeuda" value={nombre} onChange={(e) => setNombre(e.target.value)} required className={baseInputClasses} placeholder="Ej: Préstamo Auto"/></div>
            <div><label htmlFor="montoInicial" className={baseLabelClasses}>Monto Inicial ({currency}) <span className="text-red-500">*</span></label><input type="number" id="montoInicial" value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)} required min="0.01" step="0.01" className={baseInputClasses} disabled={loadingSettings || isSubmitting}/></div>
            <div><label htmlFor="tasaInteres" className={baseLabelClasses}>Interés Anual (%)</label><input type="number" id="tasaInteres" value={tasaInteres} onChange={(e) => setTasaInteres(e.target.value)} min="0" step="0.01" placeholder="Ej: 15" className={baseInputClasses} disabled={isSubmitting}/></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div><label htmlFor="pagoMinimo" className={baseLabelClasses}>Pago Mínimo Mensual ({currency})</label><input type="number" id="pagoMinimo" value={pagoMinimo} onChange={(e) => setPagoMinimo(e.target.value)} min="0" step="0.01" className={baseInputClasses} disabled={loadingSettings || isSubmitting}/></div>
            <div><label htmlFor="tipoDeuda" className={baseLabelClasses}>Tipo de Deuda</label><select id="tipoDeuda" value={tipoDeuda} onChange={(e) => setTipoDeuda(e.target.value)} className={baseSelectClasses} disabled={isSubmitting}>{tiposDeudaOpciones.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
            <div><label htmlFor="frecuenciaPago" className={baseLabelClasses}>Frecuencia de Pago</label><select id="frecuenciaPago" value={frecuenciaPago} onChange={(e) => setFrecuenciaPago(e.target.value)} className={baseSelectClasses} disabled={isSubmitting}>{frecuenciasPagoOpciones.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div><label htmlFor="carteraPagoIdForm" className={baseLabelClasses}>Cartera Predeterminada (Opcional)</label><select id="carteraPagoIdForm" value={carteraPagoIdForm} onChange={(e) => setCarteraPagoIdForm(e.target.value)} className={baseSelectClasses} disabled={cargando || isSubmitting}><option value="">-- Ninguna --</option>{cargando ? <option>Cargando...</option> : carteras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
            <div><label htmlFor="fechaInicioDeuda" className={baseLabelClasses}>Fecha Inicio (Opcional)</label><input type="date" id="fechaInicioDeuda" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className={baseInputClasses} disabled={isSubmitting}/></div>
          </div>
          <div><label htmlFor="notasDeuda" className={baseLabelClasses}>Notas (Opcional)</label><textarea id="notasDeuda" value={notas} onChange={(e) => setNotas(e.target.value)} rows="2" className={baseInputClasses} disabled={isSubmitting} placeholder="Detalles adicionales sobre la deuda..."></textarea></div>
          <div className="flex items-center space-x-3 pt-3">
            <button type="submit" className={baseButtonClasses(editandoDebt ? 'yellow' : 'green')} disabled={isSubmitting || loadingSettings || cargando}> {isSubmitting ? 'Guardando...' : (editandoDebt ? <><SaveIcon className="mr-2"/> Guardar</> : <><PlusCircleIcon className="mr-2"/> Agregar</>)} </button>
            {editandoDebt && (<button type="button" onClick={handleCancelarEdicion} className={baseButtonClasses('slate')} disabled={isSubmitting}><XCircleIcon className="mr-2"/> Cancelar</button>)}
          </div>
        </form>
        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </section>

      <section className="card-base">
        <h2 className="text-xl font-semibold mb-6 text-slate-100">Mis Deudas</h2>
        {cargando && <p className="text-slate-400">Cargando deudas...</p>}
        {!cargando && debts.length === 0 && !error && (<p className="text-slate-500">No has registrado deudas. ¡Felicidades si estás libre de ellas!</p>)}
        {!cargando && debts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm text-left">
              <thead className="bg-slate-700/50">
                <tr>
                  <th scope="col" className={tableHeaderClasses}>Nombre</th>
                  <th scope="col" className={`${tableHeaderClasses} hidden md:table-cell`}>Tipo</th>
                  <th scope="col" className={`${tableHeaderClasses} text-right`}>Monto Inicial</th>
                  <th scope="col" className={`${tableHeaderClasses} text-right font-bold`}>Saldo Actual</th>
                  <th scope="col" className={`${tableHeaderClasses} text-right hidden sm:table-cell`}>Interés</th>
                  <th scope="col" className={`${tableHeaderClasses} text-right hidden md:table-cell`}>Pago Mín.</th>
                  <th scope="col" className={`${tableHeaderClasses} w-1/5 sm:w-1/6`}>Progreso</th>
                  <th scope="col" className={`${tableHeaderClasses} text-center`}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {debts.map((debt) => {
                  const saldoActual = debt.saldo_actual ?? debt.monto_inicial;
                  const pagado = debt.monto_inicial - saldoActual;
                  const progreso = debt.monto_inicial > 0 ? Math.max(0, Math.min(100, (pagado / debt.monto_inicial) * 100)) : (saldoActual <= 0 ? 100 : 0);
                  const progresoBarColor = progreso < 25 ? 'bg-red-500' : progreso < 75 ? 'bg-yellow-500' : 'bg-green-500';
                  return (
                    <tr key={debt.id} className="hover:bg-slate-700/40 transition-colors duration-100">
                      <td className={`${tableCellClasses} text-slate-100 font-medium`}><div className="truncate max-w-xs" title={debt.nombre}>{debt.nombre}</div><div className="text-xs text-slate-500 md:hidden">{debt.tipo_deuda}</div></td>
                      <td className={`${tableCellClasses} hidden md:table-cell text-slate-400`}>{debt.tipo_deuda}</td>
                      <td className={`${tableCellClasses} text-slate-300 text-right`}>{formatearMonedaLocal(debt.monto_inicial)}</td>
                      <td className={`${tableCellClasses} text-right font-semibold text-orange-400`}>{formatearMonedaLocal(saldoActual)}</td>
                      <td className={`${tableCellClasses} text-slate-400 text-right hidden sm:table-cell`}>{formatearPorcentaje(debt.tasa_interes_anual)}</td>
                      <td className={`${tableCellClasses} text-slate-400 text-right hidden md:table-cell`}>{formatearMonedaLocal(debt.pago_minimo_mensual)}</td>
                      <td className={tableCellClasses}>
                        <div className="flex items-center">
                          <div className="w-full bg-slate-600 rounded-full h-2.5 mr-2" title={`${progreso.toFixed(0)}% pagado`}>
                            <div className={`h-2.5 rounded-full ${progresoBarColor}`} style={{ width: `${progreso}%` }}></div>
                          </div>
                          <span className="text-xs text-slate-400 w-8 text-right">{progreso.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className={`${tableCellClasses} text-center`}>
                        <div className="flex justify-center items-center space-x-1">
                          <button onClick={() => openModalPago(debt)} className={`${iconButtonClasses} hover:text-cyan-400`} title="Registrar Pago"><DollarSignIcon /></button>
                          <button onClick={() => openModalAmortizacion(debt)} className={`${iconButtonClasses} hover:text-teal-400`} title="Ver Plan de Pagos"><CalendarDaysIcon /></button>
                          <button onClick={() => handleEditarClick(debt)} className={`${iconButtonClasses} hover:text-yellow-400`} title="Editar Deuda"><Edit3Icon /></button>
                          <button onClick={() => handleEliminarClick(debt.id)} className={`${iconButtonClasses} hover:text-red-400`} title="Eliminar Deuda" disabled={isSubmitting}><Trash2Icon /></button>
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

      {/* Modal Registrar Pago */}
      {showModalPago && deudaParaPago && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out" onClick={closeModalPago}>
          <div className="bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700 transform transition-all duration-300 ease-in-out scale-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold text-slate-100">Registrar Pago para: <span className="text-cyan-400">{deudaParaPago.nombre}</span></h3>
                <button onClick={closeModalPago} className={iconButtonClasses} title="Cerrar"><XCircleIcon className="w-6 h-6"/></button>
            </div>
            <form onSubmit={handlePagoSubmit} className="space-y-4">
              <div><p className={baseLabelClasses}>Saldo Actual:</p><p className="text-orange-400 font-medium text-lg">{formatearMonedaLocal(deudaParaPago.saldo_actual ?? deudaParaPago.monto_inicial)}</p></div>
              <div><label htmlFor="montoPago" className={baseLabelClasses}>Monto Pagado ({currency}) <span className="text-red-500">*</span></label><input type="number" id="montoPago" value={montoPago} onChange={(e) => setMontoPago(e.target.value)} required min="0.01" step="0.01" className={baseInputClasses} disabled={loadingSettings || isPaying}/></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label htmlFor="fechaPago" className={baseLabelClasses}>Fecha Pago <span className="text-red-500">*</span></label><input type="date" id="fechaPago" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} required className={baseInputClasses} disabled={isPaying}/></div>
                <div><label htmlFor="carteraPagoModal" className={baseLabelClasses}>Pagar Desde Cartera <span className="text-red-500">*</span></label><select id="carteraPagoModal" value={carteraPagoIdModal} onChange={(e) => setCarteraPagoIdModal(e.target.value)} required className={baseSelectClasses} disabled={carteras.length === 0 || cargando || isPaying}><option value="" disabled>-- Selecciona --</option>{cargando ? <option>Cargando...</option> : carteras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
              </div>
              <div><label htmlFor="descripcionPago" className={baseLabelClasses}>Descripción (Opcional)</label><input type="text" id="descripcionPago" value={descripcionPago} onChange={(e) => setDescripcionPago(e.target.value)} className={baseInputClasses} disabled={isPaying} placeholder="Ej: Cuota mensual"/></div>
              {pagoError && <p className="text-red-400 text-sm bg-red-900/30 p-2 rounded-md">{pagoError}</p>}
              <div className="flex justify-end space-x-3 pt-3">
                <button type="button" onClick={closeModalPago} className={`${baseButtonClasses('slate')} disabled:opacity-70`} disabled={isPaying}>Cancelar</button>
                <button type="submit" className={`${baseButtonClasses('cyan')} disabled:opacity-70`} disabled={isPaying || loadingSettings}> {isPaying ? 'Registrando...' : <><SaveIcon className="mr-2"/> Registrar Pago</>} </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tabla Amortización */}
      {showModalAmortizacion && deudaParaAmortizacion && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out" onClick={closeModalAmortizacion}>
          <div className="bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-3xl border border-slate-700 transform transition-all duration-300 ease-in-out scale-100 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 flex-shrink-0">
                <h3 className="text-lg font-semibold text-slate-100">Plan de Pagos Simulado: <span className="text-teal-400">{deudaParaAmortizacion.nombre}</span></h3>
                <button type="button" onClick={closeModalAmortizacion} className={iconButtonClasses} title="Cerrar"><XCircleIcon className="w-6 h-6"/></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 items-end flex-shrink-0">
                <div><label htmlFor="plazoSimulacion" className={baseLabelClasses}>Plazo (meses) <span className="text-red-500">*</span></label><input type="number" id="plazoSimulacion" value={plazoMeses} onChange={(e) => setPlazoMeses(e.target.value)} min="1" step="1" placeholder="Ej: 24" className={baseInputClasses} /></div>
                <div><label htmlFor="pagoSimulado" className={baseLabelClasses}>Pago Mensual ({currency}) (Opc.)</label><input type="number" id="pagoSimulado" value={pagoSimuladoAmortizacion} onChange={(e) => setPagoSimuladoAmortizacion(e.target.value)} min="0" step="0.01" placeholder="Dejar vacío para calcular" className={baseInputClasses} disabled={loadingSettings}/></div>
                <button onClick={handleCalcularAmortizacion} className={`${baseButtonClasses('teal')} sm:self-end`} disabled={cargandoAmortizacion || !plazoMeses}> {cargandoAmortizacion ? 'Calculando...' : <><BarChart2Icon className="mr-2"/> Calcular Plan</>} </button>
            </div>
            {amortizacionError && <p className="text-red-400 text-sm mb-2 bg-red-900/30 p-2 rounded-md flex-shrink-0">{amortizacionError}</p>}
            {cargandoAmortizacion && <p className="text-slate-400 text-center my-4 flex-shrink-0">Calculando tabla...</p>}
            
            {!cargandoAmortizacion && tablaAmortizacion.length > 0 && (
              <div className="overflow-y-auto flex-grow mt-2 rounded-lg border border-slate-700">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-700/50 sticky top-0 z-10">
                    <tr>
                      <th className={tableHeaderClasses}># Pago</th>
                      <th className={`${tableHeaderClasses} text-right`}>Pago</th>
                      <th className={`${tableHeaderClasses} text-right`}>Interés</th>
                      <th className={`${tableHeaderClasses} text-right`}>Capital</th>
                      <th className={`${tableHeaderClasses} text-right`}>Saldo Pendiente</th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-800 divide-y divide-slate-700">
                    {tablaAmortizacion.map((pago) => (
                      <tr key={pago.numero_pago} className="hover:bg-slate-700/30">
                        <td className={tableCellClasses}>{pago.numero_pago}</td>
                        <td className={`${tableCellClasses} text-right text-slate-200`}>{formatearMonedaLocal(pago.pago_programado)}</td>
                        <td className={`${tableCellClasses} text-right text-red-300`}>{formatearMonedaLocal(pago.interes_del_periodo)}</td>
                        <td className={`${tableCellClasses} text-right text-green-300`}>{formatearMonedaLocal(pago.capital_amortizado)}</td>
                        <td className={`${tableCellClasses} text-right font-medium text-orange-300`}>{formatearMonedaLocal(pago.saldo_pendiente)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!cargandoAmortizacion && tablaAmortizacion.length === 0 && !amortizacionError && <p className="text-slate-500 text-center my-4 flex-shrink-0">Ingresa el plazo (y opcionalmente un pago mensual) y haz clic en "Calcular Plan".</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default Debts;
